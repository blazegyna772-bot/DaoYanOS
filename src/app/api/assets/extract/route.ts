import { NextRequest, NextResponse } from "next/server"
import type { PlatformConfig } from "@/types"

type ExtractedCharacter = {
  name: string
  desc: string
  importance: "lead" | "supporting" | "minor"
}

type ExtractedScene = {
  name: string
  desc: string
  type: "interior" | "exterior" | "mixed"
}

type ExtractedProp = {
  name: string
  desc: string
  category: "key" | "background" | "action"
}

type ExtractedAssets = {
  characters: ExtractedCharacter[]
  scenes: ExtractedScene[]
  props: ExtractedProp[]
}

/**
 * 获取全局平台配置
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
 * 构建 API 请求
 */
function buildAPIRequest(params: {
  endpoint: string
  apiKey: string
  model: string
  mode: string
  messages: Array<{ role: string; content: string }>
}) {
  const { endpoint, apiKey, model, mode, messages } = params

  const headers: Record<string, string> = {}
  let url = endpoint

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
          generationConfig: { maxOutputTokens: 4096 },
        },
      }

    case "qwen":
      headers["Authorization"] = `Bearer ${apiKey}`
      headers["Content-Type"] = "application/json"
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
          },
        },
      }

    default:
      headers["Authorization"] = `Bearer ${apiKey}`
      headers["Content-Type"] = "application/json"
  }

  return {
    url,
    headers,
    body: { model, messages, max_tokens: 4096 },
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

  const openaiData = data as { choices?: Array<{ message?: { content?: string } }> }
  return openaiData.choices?.[0]?.message?.content || ""
}

/**
 * 资产提取系统提示词
 * 来源：soullensV5.1.html 的 Wt() 函数
 */
const ASSET_EXTRACTION_PROMPT = `你是一位顶级影视统筹师，拥有20年专业剧本拆解与视觉资产管理经验。

你的任务：从剧本或故事文字中提取可供 AI 视频生成平台使用的完整视觉资产清单。

【核心要求：视觉脑补】
对每一个识别出的资产，你必须生成一段 50–80 字的专业视觉描述。
- 人物：性别、年龄段、发型发色、服装（材质/颜色/款式/特征）、体型、气质标签、标志性细节
- 场景：地理位置、时间段（昼夜/四季）、光照色温、空间结构、主色调、氛围标签、标志性道具/建筑
- 道具：材质、颜色、形状尺寸、磨损/新旧程度、纹理/铭文/标志、持握方式/使用场景

【输出铁律】
- 只输出纯 JSON，禁止任何前缀、后缀或 markdown 代码块
- JSON 结构：{ "characters": [...], "scenes": [...], "props": [...] }

【提取规模】
- 人物：最多10个（按戏份重要性排序）
- 场景：最多10个（必须有独立戏剧功能）
- 道具：最多10个（必须对剧情有实质推动作用）

【人物对象结构】
{
  "name": "角色名",
  "desc": "50-80字视觉描述",
  "importance": "lead" | "supporting" | "minor"
}

【场景对象结构】
{
  "name": "场景名",
  "desc": "50-80字视觉描述",
  "type": "interior" | "exterior" | "mixed"
}

【道具对象结构】
{
  "name": "道具名",
  "desc": "50-80字视觉描述",
  "category": "key" | "background" | "action"
}`

const FALLBACK_PROP_KEYWORDS = [
  "枪",
  "手枪",
  "银针",
  "解药",
  "药箱",
  "匕首",
  "长刀",
  "钥匙",
  "火把",
  "手电",
  "信物",
  "玉佩",
  "黑衣",
  "绳索",
  "面具",
] as const

function cleanResponseContent(content: string): string {
  let cleanContent = content.trim()
  if (cleanContent.startsWith("```json")) {
    cleanContent = cleanContent.slice(7)
  }
  if (cleanContent.startsWith("```")) {
    cleanContent = cleanContent.slice(3)
  }
  if (cleanContent.endsWith("```")) {
    cleanContent = cleanContent.slice(0, -3)
  }
  return cleanContent.trim()
}

function normalizeExtractedAssets(raw: unknown): ExtractedAssets {
  const payload = (raw || {}) as {
    characters?: Array<Partial<ExtractedCharacter>>
    scenes?: Array<Partial<ExtractedScene>>
    props?: Array<Partial<ExtractedProp>>
  }

  return {
    characters: (payload.characters || [])
      .filter((item) => item?.name)
      .slice(0, 10)
      .map((item, index) => ({
        name: String(item.name).trim(),
        desc: String(item.desc || "").trim(),
        importance: item.importance === "lead" || item.importance === "supporting" || item.importance === "minor"
          ? item.importance
          : index === 0 ? "lead" : index < 3 ? "supporting" : "minor",
      })),
    scenes: (payload.scenes || [])
      .filter((item) => item?.name)
      .slice(0, 10)
      .map((item) => ({
        name: String(item.name).trim(),
        desc: String(item.desc || "").trim(),
        type: item.type === "interior" || item.type === "exterior" || item.type === "mixed"
          ? item.type
          : "mixed",
      })),
    props: (payload.props || [])
      .filter((item) => item?.name)
      .slice(0, 10)
      .map((item) => ({
        name: String(item.name).trim(),
        desc: String(item.desc || "").trim(),
        category: item.category === "key" || item.category === "background" || item.category === "action"
          ? item.category
          : "key",
      })),
  }
}

function parseExtractionJson(content: string): ExtractedAssets {
  return normalizeExtractedAssets(JSON.parse(cleanResponseContent(content)))
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function requestAssetExtraction(
  url: string,
  headers: Record<string, string>,
  requestBody: object,
  mode: string
): Promise<ExtractedAssets> {
  let lastError: string | null = null

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 45000)

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      if (!response.ok) {
        const text = await response.text()
        lastError = `API Error ${response.status}: ${text.slice(0, 200)}`
        if (response.status < 500 && response.status !== 429) {
          break
        }
      } else {
        const data = await response.json()
        const content = parseAPIResponse(data, mode)
        return parseExtractionJson(content)
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown fetch error"
    } finally {
      clearTimeout(timeout)
    }

    if (attempt < 3) {
      await sleep(800 * attempt)
    }
  }

  throw new Error(lastError || "资产提取请求失败")
}

function normalizePlot(plot: string): string {
  return plot.replace(/\r/g, "").trim()
}

function dedupeNames(names: string[]): string[] {
  const uniqueNames: string[] = []
  const seen = new Set<string>()

  for (const name of names) {
    const normalized = name.trim()
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    uniqueNames.push(normalized)
  }

  return uniqueNames
}

function buildCharacterDesc(name: string): string {
  return `${name}是剧本中的核心可视角色，需保持统一年龄层、服装轮廓与情绪气质设定，镜头内强调身份辨识度、动作特征与人物压迫感或情绪状态。`
}

function buildSceneDesc(name: string, timeHint: string, locationHint: string): string {
  const timeText = timeHint || "未明确时段"
  const locationText = locationHint || "空间关系待统一"
  return `${name}是剧情推进场景，空间属性偏${locationText}，时间氛围为${timeText}，画面需统一主色调、光照方向和环境层次，保证跨镜头连续性。`
}

function buildPropDesc(name: string): string {
  return `${name}是剧情里的关键可视道具，需明确材质、颜色、尺寸与使用痕迹，在角色持握和镜头切换时保持同一外观设定与功能指向。`
}

function inferSceneType(locationHint: string): "interior" | "exterior" | "mixed" {
  if (locationHint.includes("外")) return "exterior"
  if (locationHint.includes("内")) return "interior"
  return "mixed"
}

function extractAssetsFallback(plot: string): ExtractedAssets {
  const normalizedPlot = normalizePlot(plot)
  const lines = normalizedPlot.split("\n").map((line) => line.trim()).filter(Boolean)

  const characterNames = dedupeNames([
    ...lines
      .filter((line) => line.startsWith("【人物："))
      .flatMap((line) =>
        line
          .replace(/^【人物：/, "")
          .replace(/】$/, "")
          .split(/[、，,\s/]+/)
      ),
    ...lines
      .map((line) => line.match(/^([A-Za-z\u4E00-\u9FFF][A-Za-z0-9\u4E00-\u9FFF·]{0,15})[：:]/)?.[1] || "")
      .filter(Boolean),
  ]).slice(0, 10)

  const sceneEntries = dedupeNames(
    lines
      .map((line) => {
        const match = line.match(/^\d+-\d+\s+([^，,]+)(?:[，,]([^，,]+))?(?:[，,]([^，,]+))?/)
        if (!match) return ""
        return `${match[1]}|${match[2] || ""}|${match[3] || ""}`
      })
      .filter(Boolean)
  )

  const propNames = dedupeNames(
    FALLBACK_PROP_KEYWORDS.filter((keyword) => normalizedPlot.includes(keyword))
  ).slice(0, 10)

  return {
    characters: characterNames.map((name, index) => ({
      name,
      desc: buildCharacterDesc(name),
      importance: index === 0 ? "lead" : index < 3 ? "supporting" : "minor",
    })),
    scenes: sceneEntries.map((entry) => {
      const [name, locationHint, timeHint] = entry.split("|")
      return {
        name,
        desc: buildSceneDesc(name, timeHint || "", locationHint || ""),
        type: inferSceneType(locationHint || ""),
      }
    }),
    props: propNames.map((name, index) => ({
      name,
      desc: buildPropDesc(name),
      category: index < 3 ? "key" : "background",
    })),
  }
}

/**
 * POST /api/assets/extract
 * 从剧本中提取资产
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { plot } = body

    if (!plot || typeof plot !== "string") {
      return NextResponse.json({ error: "Missing or invalid plot content" }, { status: 400 })
    }

    // 获取平台配置
    const platform = await getGlobalPlatformConfig()

    if (!platform || !platform.textApiKey) {
      return NextResponse.json({
        error: "Platform not configured or API key missing",
        hint: "请在设置页配置 AI 平台 API Key"
      }, { status: 400 })
    }

    // 构建 API 请求
    const messages = [
      { role: "system", content: ASSET_EXTRACTION_PROMPT },
      { role: "user", content: `请从以下剧本中提取视觉资产：\n\n${plot}` },
    ]

    const { url, headers, body: requestBody } = buildAPIRequest({
      endpoint: platform.textEndpoint,
      apiKey: platform.textApiKey,
      model: platform.textModel,
      mode: platform.mode,
      messages,
    })

    try {
      const extractedAssets = await requestAssetExtraction(url, headers, requestBody, platform.mode)
      return NextResponse.json({
        success: true,
        source: "ai",
        assets: extractedAssets,
      })
    } catch (error) {
      const fallbackAssets = extractAssetsFallback(plot)

      if (
        fallbackAssets.characters.length === 0 &&
        fallbackAssets.scenes.length === 0 &&
        fallbackAssets.props.length === 0
      ) {
        throw error
      }

      return NextResponse.json({
        success: true,
        source: "fallback",
        warning: error instanceof Error ? error.message : "AI extraction failed",
        assets: fallbackAssets,
      })
    }
  } catch (error) {
    console.error("Asset extraction error:", error)
    return NextResponse.json({
      error: (error as Error).message
    }, { status: 500 })
  }
}
