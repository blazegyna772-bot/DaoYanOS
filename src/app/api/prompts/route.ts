import { NextResponse } from "next/server"
import { getPromptManager } from "@/lib/promptManager"

// 获取所有提示词模板
export async function GET() {
  try {
    const manager = getPromptManager()
    const templates = manager.getAllTemplates()

    return NextResponse.json({ templates })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load prompts" },
      { status: 500 }
    )
  }
}

// 重新加载提示词（热重载）
export async function POST(request: Request) {
  try {
    const { action } = await request.json()

    if (action === "reload") {
      const manager = getPromptManager()
      manager.reload()

      return NextResponse.json({ success: true, message: "Prompts reloaded" })
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reload prompts" },
      { status: 500 }
    )
  }
}
