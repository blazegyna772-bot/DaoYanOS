import { NextRequest, NextResponse } from "next/server"
import { promptManager } from "@/lib/promptManager"
import fs from "fs/promises"
import path from "path"
import yaml from "yaml"

const PROMPTS_DIR = path.join(process.cwd(), "prompts")

/**
 * GET /api/prompts
 * 获取所有提示词配置
 */
export async function GET() {
  try {
    const files = await fs.readdir(PROMPTS_DIR)
    const prompts: Record<string, string> = {}

    for (const file of files) {
      if (file.endsWith(".yaml")) {
        const content = await fs.readFile(path.join(PROMPTS_DIR, file), "utf-8")
        prompts[file] = content
      }
    }

    return NextResponse.json({ prompts })
  } catch (error) {
    console.error("Failed to read prompts:", error)
    return NextResponse.json({ error: "Failed to read prompts" }, { status: 500 })
  }
}

/**
 * PUT /api/prompts
 * 更新提示词文件
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { filename, content } = body

    if (!filename || !content) {
      return NextResponse.json({ error: "Missing filename or content" }, { status: 400 })
    }

    // 安全检查：只允许修改 prompts 目录下的 .yaml 文件
    if (!filename.endsWith(".yaml") || filename.includes("..") || filename.includes("/")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
    }

    // 验证 YAML 格式
    try {
      yaml.parse(content)
    } catch {
      return NextResponse.json({ error: "Invalid YAML format" }, { status: 400 })
    }

    // 写入文件
    const filePath = path.join(PROMPTS_DIR, filename)
    await fs.writeFile(filePath, content, "utf-8")

    // 重新加载配置
    await promptManager.reload()

    return NextResponse.json({ success: true, message: `Updated ${filename}` })
  } catch (error) {
    console.error("Failed to update prompt:", error)
    return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 })
  }
}

/**
 * POST /api/prompts/reload
 * 强制重新加载提示词
 */
export async function POST(request: NextRequest) {
  try {
    const config = await promptManager.reload()
    return NextResponse.json({ success: true, config })
  } catch (error) {
    return NextResponse.json({ error: "Failed to reload prompts" }, { status: 500 })
  }
}