import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import os from "os"
import type { PlatformConfig } from "@/types"

const CONFIG_DIR = path.join(os.homedir(), "Documents", "DaoYanOSProjects")
const CONFIG_FILE = path.join(CONFIG_DIR, "global_config.json")

interface GlobalConfig {
  platforms: Record<string, PlatformConfig>
  currentPlatform: string
}

interface TestConnectionRequest {
  config: PlatformConfig
  type: "text" | "vision"
}

/**
 * 确保配置目录存在
 */
async function ensureConfigDir() {
  await fs.mkdir(CONFIG_DIR, { recursive: true })
}

function getTestTarget(config: PlatformConfig, type: "text" | "vision") {
  return {
    endpoint: type === "text" ? config.textEndpoint : config.visionEndpoint,
    model: type === "text" ? config.textModel : config.visionModel,
    apiKey: type === "text" ? config.textApiKey : config.visionApiKey,
  }
}

function buildTestRequest(
  config: PlatformConfig,
  type: "text" | "vision"
): { url: string; headers: Record<string, string>; body: object } {
  const { endpoint, model, apiKey } = getTestTarget(config, type)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  switch (config.mode) {
    case "claude":
      headers["x-api-key"] = apiKey
      headers["anthropic-version"] = "2023-06-01"
      return {
        url: endpoint,
        headers,
        body: {
          model,
          max_tokens: 8,
          messages: [
            {
              role: "user",
              content: "Reply with OK only.",
            },
          ],
        },
      }

    case "gemini":
      return {
        url: `${endpoint}${endpoint.includes("?") ? "&" : "?"}key=${apiKey}`,
        headers,
        body: {
          contents: [
            {
              role: "user",
              parts: [{ text: "Reply with OK only." }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 8,
          },
        },
      }

    case "qwen":
      headers["Authorization"] = `Bearer ${apiKey}`
      return {
        url: endpoint,
        headers,
        body: {
          model,
          input: {
            messages: [
              { role: "system", content: "You are a connectivity test endpoint." },
              { role: "user", content: "Reply with OK only." },
            ],
          },
          parameters: {
            result_format: "message",
          },
        },
      }

    default:
      headers["Authorization"] = `Bearer ${apiKey}`
      return {
        url: endpoint,
        headers,
        body: {
          model,
          messages: [
            { role: "system", content: "You are a connectivity test endpoint." },
            { role: "user", content: "Reply with OK only." },
          ],
          max_tokens: 8,
        },
      }
  }
}

async function readErrorText(response: Response) {
  try {
    return (await response.text()).slice(0, 300)
  } catch {
    return ""
  }
}

/**
 * GET /api/config
 * 获取全局配置
 */
export async function GET() {
  try {
    await ensureConfigDir()
    const content = await fs.readFile(CONFIG_FILE, "utf-8")
    const config = JSON.parse(content) as GlobalConfig
    return NextResponse.json(config)
  } catch {
    // 返回默认配置
    return NextResponse.json({
      platforms: {},
      currentPlatform: "",
    })
  }
}

/**
 * PUT /api/config
 * 保存全局配置
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { platforms, currentPlatform } = body as GlobalConfig

    await ensureConfigDir()

    const config: GlobalConfig = {
      platforms: platforms || {},
      currentPlatform: currentPlatform || "",
    }

    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save config:", error)
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 })
  }
}

/**
 * POST /api/config
 * 测试平台连接
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TestConnectionRequest
    const { config, type } = body

    if (!config || !type) {
      return NextResponse.json({ error: "Missing config or type" }, { status: 400 })
    }

    const { endpoint, model, apiKey } = getTestTarget(config, type)

    if (!endpoint || !model || !apiKey) {
      return NextResponse.json({
        error: "缺少必要配置",
        detail: "请先填写 API Key、模型和端点",
      }, { status: 400 })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    try {
      const { url, headers, body: requestBody } = buildTestRequest(config, type)
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      if (!response.ok) {
        const detail = await readErrorText(response)
        return NextResponse.json({
          success: false,
          error: `连接失败 (${response.status})`,
          detail: detail || "远端未返回可用响应",
        }, { status: 200 })
      }

      return NextResponse.json({
        success: true,
        message: `${config.name} ${type === "text" ? "文字" : "视觉"}接口可用`,
      })
    } catch (error) {
      const detail = error instanceof Error ? error.message : "未知错误"
      return NextResponse.json({
        success: false,
        error: "请求异常",
        detail,
      }, { status: 200 })
    } finally {
      clearTimeout(timeout)
    }
  } catch (error) {
    console.error("Failed to test config:", error)
    return NextResponse.json({ error: "Failed to test config" }, { status: 500 })
  }
}
