import { NextRequest, NextResponse } from "next/server"
import { readProject, writeProject } from "@/lib/storage"
import { getDirectorById } from "@/lib/promptLoader"
import { safetyCheck, getRiskReport } from "@/lib/safetyFilter"
import type { Project, Director, PlatformConfig, Shot } from "@/types"

/**
 * 获取全局平台配置（从 global_config.json）
 */
async function getGlobalPlatformConfig(): Promise<PlatformConfig | null> {
  try {
    const fs = await import("fs/promises")
    const path = await import("path")
    const os = await import("os")

    const configPath = path.join(os.homedir(), "Documents", "DaoYanOSProjects", "global_config.json")
    const content = await fs.readFile(configPath, "utf-8")
    const config = JSON.parse(content)
    const currentPlatformId = config.currentPlatform || "openai"
    return config.platforms?.[currentPlatformId] || null
  } catch {
    return null
  }
}

/**
 * POST /api/shots/edit
 * 单镜/批量修改分镜
 *
 * Body:
 * - projectId: string
 * - episodeId: string
 * - shotIds: string[] (要修改的分镜ID列表)
 * - editNote: string (修改意见)
 * - mode: "single" | "batch" | "regenerate"
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, episodeId, shotIds, editNote, mode = "single" } = body

    if (!projectId || !episodeId || !shotIds?.length || !editNote) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 读取项目
    const project = await readProject(projectId)
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // 获取平台配置：优先从全局配置读取
    let platform = await getGlobalPlatformConfig()

    if (!platform || !platform.textApiKey) {
      // 尝试从项目配置读取
      platform = project.platforms.find(
        (p) => p.id === project.currentPlatformId
      ) as PlatformConfig | undefined
    }

    if (!platform || !platform.textApiKey) {
      return NextResponse.json({
        error: "Platform not configured or API key missing",
        hint: "请在设置页配置 AI 平台 API Key"
      }, { status: 400 })
    }

    // 获取导演
    const director = getDirectorById(project.selectedDirector)

    // 找到目标分集和分镜
    const episodeIndex = project.episodes.findIndex((ep) => ep.id === episodeId)
    if (episodeIndex === -1) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 })
    }

    const episode = project.episodes[episodeIndex]

    // 传递完整分镜列表（提供上下文），而非只传目标分镜
    const allShots = episode.shots || []
    const targetShotIds = shotIds  // 要修改的分镜 ID

    if (allShots.length === 0) {
      return NextResponse.json({ error: "No shots found" }, { status: 404 })
    }

    // 安全检测
    const safetyResult = safetyCheck(editNote, project.enableWordFilter)
    if (safetyResult.detectedRedZone.length > 0) {
      return NextResponse.json({
        error: "内容安全检测未通过",
        safetyCheck: {
          riskLevel: safetyResult.riskLevel,
          detectedRedZone: safetyResult.detectedRedZone,
          report: getRiskReport(safetyResult),
        }
      }, { status: 400 })
    }

    // 构建修改请求的系统提示词（传入完整分镜列表）
    const systemPrompt = buildShotEditPrompt(director, project, allShots, targetShotIds, editNote)

    // 调用 AI API
    const response = await callAI(platform, systemPrompt, editNote)

    console.log("[shots/edit] AI 原始响应:", response.slice(0, 500))

    // 解析返回的分镜数据（从全部分镜中提取目标分镜）
    const { shots: updatedShots, error: parseError, debug } = parseShotsFromResponse(response, allShots, targetShotIds)

    console.log("[shots/edit] 解析后的分镜数量:", updatedShots.length)
    console.log("[shots/edit] 解析后的分镜ID:", updatedShots.map(s => s.id))
    console.log("[shots/edit] 调试信息:", JSON.stringify(debug, null, 2))

    if (parseError) {
      return NextResponse.json({
        error: parseError,
        rawResponse: response.slice(0, 500),
        debug,
      }, { status: 200 })
    }

    // 更新项目中的分镜
    const updatedEpisodes = [...project.episodes]
    const updatedShotsList = [...(episode.shots || [])]

    updatedShots.forEach((updatedShot) => {
      const index = updatedShotsList.findIndex((s) => s.id === updatedShot.id)
      if (index !== -1) {
        updatedShotsList[index] = updatedShot
      }
    })

    updatedEpisodes[episodeIndex] = {
      ...episode,
      shots: updatedShotsList,
    }

    // 保存项目
    const updatedProject = {
      ...project,
      episodes: updatedEpisodes,
      updatedAt: new Date().toISOString(),
    }
    await writeProject(updatedProject)

    return NextResponse.json({
      success: true,
      shots: updatedShots,
      message: `已成功修改 ${updatedShots.length} 个分镜`,
      debug,  // 返回调试信息
    })
  } catch (error) {
    console.error("Shot edit API error:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

/**
 * 构建单镜修改提示词（简化版，传递完整分镜列表）
 */
function buildShotEditPrompt(
  director: Director | undefined,
  project: Project,
  allShots: Shot[],
  targetShotIds: string[],
  editNote: string
): string {
  // 找到要修改的分镜编号
  const targetIndices = targetShotIds.map(id => {
    const index = allShots.findIndex(s => s.id === id)
    return index >= 0 ? index + 1 : -1
  }).filter(i => i > 0)

  const directorInfo = director
    ? `导演：${director.name}，风格：${director.style}`
    : ""

  // 紧凑的分镜表格格式
  const shotsTable = allShots.map((shot, index) => {
    const isTarget = targetShotIds.includes(shot.id)
    return `${index + 1} | ${shot.type || ""} | ${shot.duration || 3}s | ${shot.env || ""} | ${shot.action || ""} | ${shot.light || ""} | ${shot.seedancePrompt || ""}${isTarget ? " ← 要修改" : ""}`
  }).join("\n")

  // 简化的提示词
  return `你是DaoYanOS分镜师，根据修改意见调整分镜。
${directorInfo}
视觉风格：${project.visualStyle}

【分镜表格】（第${targetIndices.join("、")}镜需要修改）
# | 景别 | 时长 | 环境 | 角色分动 | 光影 | SEEDANCE提示词
${shotsTable}

【修改要求】
${editNote}

【规则】
1. 只修改第${targetIndices.join("、")}镜，其他保持不变
2. 修改后同步更新SEEDANCE提示词
3. 输出JSON数组格式

【输出格式示例】
[{"index":1,"type":"中景","duration":5,"env":"...","action":"...","light":"...","seedancePrompt":"..."}]`
}

/**
 * 调用 AI API
 */
async function callAI(
  platform: PlatformConfig,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const headers: Record<string, string> = {}
  let url = platform.textEndpoint

  // 根据平台模式设置请求头
  switch (platform.mode) {
    case "claude":
      headers["x-api-key"] = platform.textApiKey
      headers["anthropic-version"] = "2023-06-01"
      headers["Content-Type"] = "application/json"
      break
    case "gemini":
      url = `${platform.textEndpoint}?key=${platform.textApiKey}`
      headers["Content-Type"] = "application/json"
      break
    case "qwen":
      headers["Authorization"] = `Bearer ${platform.textApiKey}`
      headers["Content-Type"] = "application/json"
      break
    default:
      headers["Authorization"] = `Bearer ${platform.textApiKey}`
      headers["Content-Type"] = "application/json"
  }

  let body: object
  if (platform.mode === "gemini") {
    body = {
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: userMessage }] },
      ],
      generationConfig: { maxOutputTokens: 4096 },
    }
  } else if (platform.mode === "claude") {
    body = {
      model: platform.textModel,
      max_tokens: 4096,
      messages: [
        { role: "user", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }
  } else if (platform.mode === "qwen") {
    // 通义千问使用特殊的请求格式
    body = {
      model: platform.textModel,
      input: {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      },
      parameters: {
        result_format: "message",
      },
    }
  } else {
    body = {
      model: platform.textModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 4096,
    }
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API Error ${response.status}: ${text.slice(0, 200)}`)
  }

  const data = await response.json()

  // 解析响应
  if (platform.mode === "gemini") {
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
  }
  if (platform.mode === "claude") {
    return data.content?.[0]?.text || ""
  }
  if (platform.mode === "qwen") {
    // 通义千问响应格式
    return data.output?.choices?.[0]?.message?.content || ""
  }
  return data.choices?.[0]?.message?.content || ""
}

/**
 * 解析AI返回的分镜数据
 * 从返回的分镜列表中提取目标分镜（根据 index 匹配）
 */
function parseShotsFromResponse(
  response: string,
  originalShots: Shot[],
  targetShotIds: string[]
): { shots: Shot[], error?: string, debug?: unknown } {
  try {
    // 提取JSON（可能被markdown包裹）
    let content = response.trim()
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

    if (!Array.isArray(parsed)) {
      return {
        shots: originalShots.filter(s => targetShotIds.includes(s.id)),
        error: "AI 返回的不是数组格式，请重试"
      }
    }

    // 根据 index 匹配原始分镜，提取目标分镜
    const updatedShots: Shot[] = []
    const debugInfo: { targetId: string; originalIndex: number; found: boolean; returnedData?: unknown }[] = []

    for (const targetId of targetShotIds) {
      const originalIndex = originalShots.findIndex(s => s.id === targetId)
      if (originalIndex === -1) continue

      const original = originalShots[originalIndex]
      // AI 返回的分镜是 1-indexed
      const returnedShot = parsed.find((item: { index?: number }) => item.index === originalIndex + 1)

      const debugItem = { targetId, originalIndex: originalIndex + 1, found: !!returnedShot, returnedData: returnedShot }
      debugInfo.push(debugItem)

      if (returnedShot) {
        updatedShots.push({
          id: original.id,  // 强制使用原始 ID
          sceneId: original.sceneId,
          index: original.index,
          globalIndex: original.globalIndex,
          type: returnedShot.type !== undefined ? returnedShot.type : original.type,
          duration: returnedShot.duration !== undefined ? returnedShot.duration : original.duration,
          timeRange: returnedShot.timeRange !== undefined ? returnedShot.timeRange : original.timeRange,
          env: returnedShot.env !== undefined ? returnedShot.env : original.env,
          action: returnedShot.action !== undefined ? returnedShot.action : original.action,
          light: returnedShot.light !== undefined ? returnedShot.light : original.light,
          tension: returnedShot.tension !== undefined ? returnedShot.tension : original.tension,
          seedancePrompt: returnedShot.seedancePrompt !== undefined ? returnedShot.seedancePrompt : original.seedancePrompt,
          camera: returnedShot.camera !== undefined ? returnedShot.camera : original.camera,
          sound: returnedShot.sound !== undefined ? returnedShot.sound : original.sound,
          dialogue: returnedShot.dialogue !== undefined ? returnedShot.dialogue : original.dialogue,
        })
      }
    }

    return { shots: updatedShots, debug: { parsed, debugInfo } }
      }
    }

    return { shots: updatedShots }
  } catch (error) {
    console.error("Failed to parse shots from response:", error)
    console.error("原始响应:", response.slice(0, 1000))
    return {
      shots: originalShots.filter(s => targetShotIds.includes(s.id)),
      error: `解析 AI 响应失败: ${(error as Error).message}`
    }
  }
}