import { NextRequest, NextResponse } from "next/server"
import { readOfficialPromptDefault, restoreOfficialPromptDefault } from "@/lib/promptDefaults"

const SAFE_FILENAME_RE = /^[A-Za-z0-9._-]+\.yaml$/

function isSafeFilename(filename: string) {
  return SAFE_FILENAME_RE.test(filename)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get("filename")

    if (!filename || !isSafeFilename(filename)) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
    }

    const promptDefault = await readOfficialPromptDefault(filename)
    return NextResponse.json({ success: true, ...promptDefault })
  } catch {
    return NextResponse.json({ error: "Failed to read official default" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { filename } = body

    if (!filename || !isSafeFilename(filename)) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
    }

    const restored = await restoreOfficialPromptDefault(filename)
    return NextResponse.json({
      success: true,
      ...restored,
      message: restored.backupVersionName
        ? `已恢复官方默认，并自动备份当前内容为 ${restored.backupVersionName}`
        : "当前文件本来就是官方默认版本",
    })
  } catch {
    return NextResponse.json({ error: "Failed to restore official default" }, { status: 500 })
  }
}
