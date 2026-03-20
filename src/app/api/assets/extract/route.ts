import { NextRequest, NextResponse } from "next/server"
import type { PlatformConfig } from "@/types"

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

    // 调用 AI API
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json({
        error: `API Error ${response.status}`,
        details: text.slice(0, 200)
      }, { status: 500 })
    }

    const data = await response.json()
    const content = parseAPIResponse(data, platform.mode)

    // 解析 JSON 响应
    let extractedAssets
    try {
      // 清理可能的 markdown 包裹
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

      extractedAssets = JSON.parse(cleanContent.trim())
    } catch {
      // 如果解析失败，返回原始内容让前端处理
      return NextResponse.json({
        rawContent: content,
        error: "Failed to parse AI response as JSON"
      }, { status: 200 })
    }

    return NextResponse.json({
      success: true,
      assets: {
        characters: extractedAssets.characters || [],
        scenes: extractedAssets.scenes || [],
        props: extractedAssets.props || [],
      }
    })

  } catch (error) {
    console.error("Asset extraction error:", error)
    return NextResponse.json({
      error: (error as Error).message
    }, { status: 500 })
  }
}