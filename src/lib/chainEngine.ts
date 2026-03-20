/**
 * ChainEngine 链式生成引擎
 * 来源：soullensV5.1.html 的链式生成逻辑
 * 用途：将剧本分场生成分镜，支持视觉桥梁传递
 */

import type { Scene, BridgeState, ChatMessage, Project, PlatformConfig, Director } from "@/types"
import {
  buildFullSystemPrompt,
  buildBurstModePrompt,
  buildStageAPrompt,
  buildStageBPrompt,
  buildBridgeExtractionPrompt,
  determineNarrativeMode,
  PromptBuilderOptions,
} from "./promptBuilder"

// ============================================
// 类型定义
// ============================================

export interface ChainEngineState {
  scenes: Scene[]
  totalDuration: number
  globalOffset: number
  isCancelled: boolean
  isRunning: boolean
  cleanPlot: string
  sceneContents: Record<string, string>
  sceneChatHistory: Record<string, ChatMessage[]>
  previousBridgeState: BridgeState | null
}

export interface ChainEngineCallbacks {
  onSceneStart?: (scene: Scene, index: number) => void
  onSceneProgress?: (sceneId: string, content: string) => void
  onSceneComplete?: (scene: Scene, content: string) => void
  onSceneError?: (scene: Scene, error: Error) => void
  onAllComplete?: (contents: Record<string, string>) => void
  onBridgeExtracted?: (sceneId: string, bridgeState: BridgeState) => void
}

// ============================================
// 服务端日志工具
// ============================================

function engineLog(stage: string, label: string, data: unknown = "") {
  const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  console.log(`[${timestamp}] [${stage}] ${label}`)
  console.log(dataStr.slice(0, 2000) + (dataStr.length > 2000 ? '\n... (截断)' : ''))
}

// ============================================
// API 调用工具
// ============================================

interface APIRequestParams {
  endpoint: string
  apiKey: string
  model: string
  mode: string
  messages: ChatMessage[]
  stream: boolean
}

interface APIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * 构建 API 请求
 */
function buildAPIRequest(params: APIRequestParams): { url: string; headers: Record<string, string>; body: object } {
  const { endpoint, apiKey, model, mode, messages, stream } = params

  const headers: Record<string, string> = {}
  let url = endpoint

  // 根据平台模式设置请求头和格式
  switch (mode) {
    case "claude":
      headers["x-api-key"] = apiKey
      headers["anthropic-version"] = "2023-06-01"
      headers["Content-Type"] = "application/json"
      return {
        url,
        headers,
        body: {
          model,
          max_tokens: 4096,
          messages: messages.map((m) => ({
            role: m.role === "system" ? "user" : m.role,
            content: m.content,
          })),
          stream,
        },
      }

    case "gemini":
      url = `${endpoint}?key=${apiKey}`
      headers["Content-Type"] = "application/json"
      return {
        url,
        headers,
        body: {
          contents: messages.map((m) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
          })),
          generationConfig: {
            maxOutputTokens: 4096,
          },
        },
      }

    case "qwen":
      headers["Authorization"] = `Bearer ${apiKey}`
      headers["Content-Type"] = "application/json"
      // 通义千问流式需要这个请求头
      if (stream) {
        headers["X-DashScope-SSE"] = "enable"
      }
      // 通义千问使用特殊的请求格式
      return {
        url,
        headers,
        body: {
          model,
          input: {
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          },
          parameters: {
            result_format: "message",
            incremental_output: stream,  // 增量输出
          },
        },
      }

    default:
      // OpenAI 兼容格式
      headers["Authorization"] = `Bearer ${apiKey}`
      headers["Content-Type"] = "application/json"
  }

  return {
    url,
    headers,
    body: {
      model,
      messages,
      stream,
      max_tokens: 4096,
    },
  }
}

/**
 * 解析 API 响应
 */
function parseAPIResponse(data: unknown, mode: string): string {
  if (mode === "gemini") {
    const geminiData = data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    return geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ""
  }

  if (mode === "claude") {
    const claudeData = data as { content?: Array<{ text?: string }> }
    return claudeData.content?.[0]?.text || ""
  }

  if (mode === "qwen") {
    // 通义千问响应格式
    const qwenData = data as { output?: { choices?: Array<{ message?: { content?: string } }> } }
    return qwenData.output?.choices?.[0]?.message?.content || ""
  }

  // OpenAI 兼容格式
  const openaiData = data as { choices?: Array<{ message?: { content?: string } }> }
  return openaiData.choices?.[0]?.message?.content || ""
}

/**
 * 非流式 API 调用
 */
async function callAPI(params: APIRequestParams): Promise<APIResponse> {
  const startTime = Date.now()
  const { url, headers, body } = buildAPIRequest({ ...params, stream: false })

  engineLog("API", `→ 非流式请求`, {
    endpoint: params.endpoint,
    model: params.model,
    mode: params.mode,
    messageCount: params.messages.length,
    lastMessageLength: params.messages[params.messages.length - 1]?.content?.length || 0,
  })

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    engineLog("API", `✗ 请求失败 ${response.status}`, text.slice(0, 500))
    throw new Error(`API Error ${response.status}: ${text.slice(0, 200)}`)
  }

  const data = await response.json()
  const content = parseAPIResponse(data, params.mode)
  const duration = Date.now() - startTime

  engineLog("API", `← 响应 (${duration}ms, ${content.length}字符)`, content.slice(0, 500))

  return { content }
}

/**
 * 流式 API 调用
 */
async function* callAPIStream(
  params: APIRequestParams
): AsyncGenerator<string, void, unknown> {
  const startTime = Date.now()
  const { url, headers, body } = buildAPIRequest({ ...params, stream: true })

  engineLog("API", `→ 流式请求开始`, {
    endpoint: params.endpoint,
    model: params.model,
    mode: params.mode,
    messageCount: params.messages.length,
    systemPromptLength: params.messages[0]?.content?.length || 0,
    userMessageLength: params.messages[params.messages.length - 1]?.content?.length || 0,
  })

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    engineLog("API", `✗ 流式请求失败 ${response.status}`, text.slice(0, 500))
    throw new Error(`API Error ${response.status}: ${text.slice(0, 200)}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error("No response body")
  }

  const decoder = new TextDecoder("utf-8")
  let buffer = ""
  let done = false
  let totalChunks = 0
  let totalContent = ""

  while (!done) {
    const { done: streamDone, value } = await reader.read()
    done = streamDone

    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // 解析 SSE 数据
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue

      const data = line.slice(6).trim()
      if (data === "[DONE]") {
        const duration = Date.now() - startTime
        engineLog("API", `← 流式结束 (${duration}ms, ${totalChunks}块, ${totalContent.length}字符)`, totalContent.slice(0, 300))
        return
      }

      try {
        const parsed = JSON.parse(data)
        let content = ""

        if (params.mode === "claude") {
          // Claude 流式格式
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            content = parsed.delta.text
          }
        } else if (params.mode === "qwen") {
          // 通义千问流式格式
          // 响应格式: {"output":{"choices":[{"message":{"content":"..."}}]}}
          content = parsed.output?.choices?.[0]?.message?.content || ""
        } else if (params.mode === "gemini") {
          // Gemini 流式格式
          content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || ""
        } else {
          // OpenAI 兼容格式
          content = parsed.choices?.[0]?.delta?.content || ""
        }

        if (content) {
          totalChunks++
          totalContent += content
          yield content
        }
      } catch {
        // 忽略解析错误
      }
    }
  }

  const duration = Date.now() - startTime
  engineLog("API", `← 流式完成 (${duration}ms, ${totalChunks}块, ${totalContent.length}字符)`, totalContent.slice(0, 300))
}

// ============================================
// ChainEngine 核心逻辑
// ============================================

/**
 * 创建 ChainEngine 实例
 */
export function createChainEngine(): ChainEngineState {
  return {
    scenes: [],
    totalDuration: 0,
    globalOffset: 0,
    isCancelled: false,
    isRunning: false,
    cleanPlot: "",
    sceneContents: {},
    sceneChatHistory: {},
    previousBridgeState: null,
  }
}

/**
 * Stage A: 剧本切分场次
 */
export async function stageA_SplitScenes(
  engine: ChainEngineState,
  plot: string,
  duration: number,
  platform: PlatformConfig,
  directorId: string | null,
  isSTCEnabled: boolean,
  directors: Director[]
): Promise<Scene[]> {
  engineLog("StageA", `→ 开始切分剧本`, {
    plotLength: plot.length,
    duration,
    directorId,
    isSTCEnabled,
  })

  const director = directors.find((d) => d.id === directorId) || null

  const systemPrompt = buildStageAPrompt(plot, duration, director, isSTCEnabled)

  engineLog("StageA", `System Prompt`, systemPrompt.slice(0, 1000))

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt, timestamp: new Date().toISOString() },
    { role: "user", content: `请切分以下剧本：\n\n${plot}`, timestamp: new Date().toISOString() },
  ]

  const response = await callAPI({
    endpoint: platform.textEndpoint,
    apiKey: platform.textApiKey,
    model: platform.textModel,
    mode: platform.mode,
    messages,
    stream: false,
  })

  engineLog("StageA", `← 切分响应`, response.content.slice(0, 1000))

  // 解析 JSON 响应
  let scenes: Scene[] = []
  try {
    // 提取 JSON（可能被 markdown 包裹）
    let content = response.content.trim()
    if (content.startsWith("```json")) {
      content = content.slice(7)
    }
    if (content.startsWith("```")) {
      content = content.slice(3)
    }
    if (content.endsWith("```")) {
      content = content.slice(0, -3)
    }

    const parsed = JSON.parse(content.trim())
    scenes = (parsed.scenes || []).map((s: Partial<Scene>, index: number) => ({
      id: s.id || `scene_${String(index + 1).padStart(3, "0")}`,
      name: s.name || `场次 ${index + 1}`,
      beatType: s.beatType || "setup",
      duration: s.duration || Math.floor(duration / 3),
      narrativeMode: s.narrativeMode || determineNarrativeMode(duration),
      contentSummary: s.contentSummary || "",
      bridgeState: s.bridgeState,
    }))

    // 确保时长总和正确
    const totalSceneDuration = scenes.reduce((sum: number, s: Scene) => sum + s.duration, 0)
    if (Math.abs(totalSceneDuration - duration) > 5) {
      // 按比例调整
      const ratio = duration / totalSceneDuration
      scenes = scenes.map((s: Scene) => ({
        ...s,
        duration: Math.round(s.duration * ratio),
      }))
    }

    engineLog("StageA", `✓ 切分成功`, {
      sceneCount: scenes.length,
      scenes: scenes.map(s => ({ id: s.id, name: s.name, duration: s.duration }))
    })
  } catch (error) {
    engineLog("StageA", `✗ 解析失败，使用降级方案`, (error as Error).message)
    // 降级：使用简单切分
    const sceneCount = duration >= 85 ? Math.ceil(duration / 20) : duration >= 25 ? 3 : 1
    const avgDuration = Math.floor(duration / sceneCount)

    scenes = Array.from({ length: sceneCount }, (_, i) => ({
      id: `scene_${String(i + 1).padStart(3, "0")}`,
      name: `场次 ${i + 1}`,
      beatType: "setup" as const,
      duration: avgDuration,
      narrativeMode: determineNarrativeMode(duration),
      contentSummary: "",
    }))

    engineLog("StageA", `✓ 降级切分`, { sceneCount, avgDuration })
  }

  engine.scenes = scenes
  engine.totalDuration = duration
  engine.cleanPlot = plot

  return scenes
}

/**
 * 提取视觉桥梁
 */
export async function extractBridgeState(
  sceneContent: string,
  platform: PlatformConfig
): Promise<BridgeState> {
  engineLog("Bridge", `→ 提取视觉桥梁`, { contentLength: sceneContent.length })

  const systemPrompt = buildBridgeExtractionPrompt(sceneContent)

  const messages: ChatMessage[] = [
    { role: "user", content: systemPrompt, timestamp: new Date().toISOString() },
  ]

  try {
    const response = await callAPI({
      endpoint: platform.textEndpoint,
      apiKey: platform.textApiKey,
      model: platform.textModel,
      mode: platform.mode,
      messages,
      stream: false,
    })

    // 解析 JSON
    let content = response.content.trim()
    if (content.startsWith("```json")) {
      content = content.slice(7)
    }
    if (content.startsWith("```")) {
      content = content.slice(3)
    }
    if (content.endsWith("```")) {
      content = content.slice(0, -3)
    }

    const bridgeState = JSON.parse(content.trim())
    engineLog("Bridge", `✓ 桥梁提取成功`, bridgeState)
    return bridgeState
  } catch (error) {
    engineLog("Bridge", `✗ 桥梁提取失败`, (error as Error).message)
    return {
      charPosition: "",
      lightPhase: "",
      environment: "",
      keyProp: "",
    }
  }
}

/**
 * Stage B: 单场分镜生成（流式）
 */
export async function stageB_GenerateScene(
  engine: ChainEngineState,
  scene: Scene,
  plot: string,
  options: PromptBuilderOptions,
  callbacks?: ChainEngineCallbacks
): Promise<string> {
  const { platform } = options
  if (!platform) {
    throw new Error("Platform not configured")
  }

  engineLog("StageB", `→ 开始生成场次 [${scene.id}] ${scene.name}`, {
    sceneDuration: scene.duration,
    hasPreviousBridge: !!engine.previousBridgeState,
  })

  // 构建系统提示词
  const systemPrompt = buildFullSystemPrompt(options)

  engineLog("StageB", `System Prompt (${systemPrompt.length}字符)`, systemPrompt.slice(0, 500))

  // 构建用户消息
  let userMessage = `【本场剧本内容】：\n${scene.contentSummary || plot}`

  // 如果有上一场的视觉桥梁，注入到提示词
  if (engine.previousBridgeState) {
    userMessage = `【视觉桥梁（承接上一场）】：
- 角色位置：${engine.previousBridgeState.charPosition}
- 光线状态：${engine.previousBridgeState.lightPhase}
- 环境状态：${engine.previousBridgeState.environment}
- 关键道具：${engine.previousBridgeState.keyProp}

${userMessage}`

    engineLog("StageB", `注入视觉桥梁`, engine.previousBridgeState)
  }

  engineLog("StageB", `User Message (${userMessage.length}字符)`, userMessage.slice(0, 500))

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt, timestamp: new Date().toISOString() },
    { role: "user", content: userMessage, timestamp: new Date().toISOString() },
  ]

  // 流式生成
  let fullContent = ""

  callbacks?.onSceneStart?.(scene, engine.scenes.indexOf(scene))

  try {
    for await (const chunk of callAPIStream({
      endpoint: platform.textEndpoint,
      apiKey: platform.textApiKey,
      model: platform.textModel,
      mode: platform.mode,
      messages,
      stream: true,
    })) {
      if (engine.isCancelled) {
        engineLog("StageB", `⏹ 生成已取消 [${scene.id}]`)
        break
      }

      fullContent += chunk
      callbacks?.onSceneProgress?.(scene.id, fullContent)
    }

    // 保存内容
    engine.sceneContents[scene.id] = fullContent
    engine.sceneChatHistory[scene.id] = [
      ...messages,
      { role: "assistant", content: fullContent, timestamp: new Date().toISOString() },
    ]

    engineLog("StageB", `✓ 场次生成完成 [${scene.id}] (${fullContent.length}字符)`, fullContent.slice(0, 300))

    // 提取视觉桥梁
    engineLog("StageB", `→ 提取桥梁 [${scene.id}]`)
    const bridgeState = await extractBridgeState(fullContent, platform)
    scene.bridgeState = bridgeState
    engine.previousBridgeState = bridgeState

    callbacks?.onBridgeExtracted?.(scene.id, bridgeState)
    callbacks?.onSceneComplete?.(scene, fullContent)

    return fullContent
  } catch (error) {
    engineLog("StageB", `✗ 场次生成失败 [${scene.id}]`, (error as Error).message)
    callbacks?.onSceneError?.(scene, error as Error)
    throw error
  }
}

/**
 * Stage C: 整合输出
 */
export function stageC_MergeOutput(engine: ChainEngineState): string {
  const contents = Object.values(engine.sceneContents)
  return contents.join("\n\n---\n\n")
}

/**
 * 完整链式生成
 */
export async function runChainGeneration(
  plot: string,
  duration: number,
  options: PromptBuilderOptions,
  directors: Director[],
  callbacks?: ChainEngineCallbacks
): Promise<{ engine: ChainEngineState; output: string }> {
  engineLog("Chain", `════════════════════════════════════════`, "")
  engineLog("Chain", `→ 开始链式生成`, {
    plotLength: plot.length,
    duration,
    director: options.director?.name || "通用",
    visualStyle: options.visualStyle,
    platform: options.platform?.id,
    model: options.platform?.textModel,
  })
  engineLog("Chain", `════════════════════════════════════════`, "")

  const engine = createChainEngine()
  engine.isRunning = true

  const { platform, isSTCEnabled, director } = options
  if (!platform) {
    throw new Error("Platform not configured")
  }

  try {
    // 判断叙事模式
    const narrativeMode = determineNarrativeMode(duration)
    engineLog("Chain", `叙事模式: ${narrativeMode}`, { duration })

    if (narrativeMode === "burst") {
      // 极速模式：直接生成，不切分
      engineLog("Chain", `→ BURST模式：单次生成`, {})
      const systemPrompt = buildBurstModePrompt(options)

      engineLog("Chain", `System Prompt (${systemPrompt.length}字符)`, systemPrompt.slice(0, 500))

      const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt, timestamp: new Date().toISOString() },
        { role: "user", content: plot, timestamp: new Date().toISOString() },
      ]

      let fullContent = ""

      for await (const chunk of callAPIStream({
        endpoint: platform.textEndpoint,
        apiKey: platform.textApiKey,
        model: platform.textModel,
        mode: platform.mode,
        messages,
        stream: true,
      })) {
        if (engine.isCancelled) break
        fullContent += chunk
        callbacks?.onSceneProgress?.("burst", fullContent)
      }

      engine.sceneContents["burst"] = fullContent
      callbacks?.onAllComplete?.(engine.sceneContents)

      engineLog("Chain", `════════════════════════════════════════`, "")
      engineLog("Chain", `✓ BURST生成完成 (${fullContent.length}字符)`, "")
      engineLog("Chain", `════════════════════════════════════════`, "")

      return { engine, output: fullContent }
    }

    if (narrativeMode === "mini") {
      // 迷你模式：直接生成，不切分
      engineLog("Chain", `→ MINI模式：单次生成`, {})
      const systemPrompt = buildFullSystemPrompt(options)

      engineLog("Chain", `System Prompt (${systemPrompt.length}字符)`, systemPrompt.slice(0, 500))

      const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt, timestamp: new Date().toISOString() },
        { role: "user", content: plot, timestamp: new Date().toISOString() },
      ]

      let fullContent = ""

      for await (const chunk of callAPIStream({
        endpoint: platform.textEndpoint,
        apiKey: platform.textApiKey,
        model: platform.textModel,
        mode: platform.mode,
        messages,
        stream: true,
      })) {
        if (engine.isCancelled) break
        fullContent += chunk
        callbacks?.onSceneProgress?.("mini", fullContent)
      }

      engine.sceneContents["mini"] = fullContent
      callbacks?.onAllComplete?.(engine.sceneContents)

      engineLog("Chain", `════════════════════════════════════════`, "")
      engineLog("Chain", `✓ MINI生成完成 (${fullContent.length}字符)`, "")
      engineLog("Chain", `════════════════════════════════════════`, "")

      return { engine, output: fullContent }
    }

    // Full 模式：链式生成
    engineLog("Chain", `→ FULL模式：链式生成`, {})

    // Stage A: 切分场次
    engineLog("Chain", `────────────────────────────────────────`, "")
    engineLog("Chain", `STAGE A: 剧本切分`, {})
    engineLog("Chain", `────────────────────────────────────────`, "")

    const scenes = await stageA_SplitScenes(
      engine,
      plot,
      duration,
      platform,
      director?.id || null,
      isSTCEnabled,
      directors
    )

    // Stage B: 逐场生成
    engineLog("Chain", `────────────────────────────────────────`, "")
    engineLog("Chain", `STAGE B: 逐场生成 (${scenes.length}场)`, {})
    engineLog("Chain", `────────────────────────────────────────`, "")

    for (const scene of scenes) {
      if (engine.isCancelled) break

      engineLog("Chain", `→ 生成场次 ${scenes.indexOf(scene) + 1}/${scenes.length}`, { sceneId: scene.id, sceneName: scene.name })
      await stageB_GenerateScene(engine, scene, plot, options, callbacks)
      engine.globalOffset += scene.duration
    }

    // Stage C: 整合输出
    engineLog("Chain", `────────────────────────────────────────`, "")
    engineLog("Chain", `STAGE C: 整合输出`, {})
    engineLog("Chain", `────────────────────────────────────────`, "")

    const output = stageC_MergeOutput(engine)
    callbacks?.onAllComplete?.(engine.sceneContents)

    engineLog("Chain", `════════════════════════════════════════`, "")
    engineLog("Chain", `✓ 链式生成完成`, {
      sceneCount: scenes.length,
      totalContentLength: output.length,
    })
    engineLog("Chain", `════════════════════════════════════════`, "")

    return { engine, output }
  } finally {
    engine.isRunning = false
  }
}

/**
 * 取消生成
 */
export function cancelGeneration(engine: ChainEngineState): void {
  engine.isCancelled = true
}

/**
 * 重置引擎
 */
export function resetEngine(engine: ChainEngineState): void {
  engine.scenes = []
  engine.sceneContents = {}
  engine.sceneChatHistory = {}
  engine.globalOffset = 0
  engine.isCancelled = false
  engine.isRunning = false
  engine.previousBridgeState = null
}