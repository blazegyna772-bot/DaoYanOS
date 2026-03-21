import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import yaml from "yaml"
import { promptManager } from "@/lib/promptManager"
import { reloadPromptConfig } from "@/lib/promptLoader"
import {
  deletePromptVersion,
  listPromptVersions,
  readPromptVersion,
  writePromptVersion,
} from "@/lib/promptVersions"

const PROMPTS_DIR = path.join(process.cwd(), "prompts")
const SAFE_FILENAME_RE = /^[A-Za-z0-9._-]+\.yaml$/
const SAFE_VERSION_RE = /^[\p{L}\p{N}._-]+$/u

function isSafeFilename(filename: string) {
  return SAFE_FILENAME_RE.test(filename)
}

function isSafeVersionName(versionName: string) {
  return SAFE_VERSION_RE.test(versionName)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get("filename")
    const versionName = searchParams.get("versionName")

    if (!filename || !isSafeFilename(filename)) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
    }

    if (versionName) {
      if (!isSafeVersionName(versionName)) {
        return NextResponse.json({ error: "Invalid version name" }, { status: 400 })
      }

      const version = await readPromptVersion(filename, versionName)
      return NextResponse.json(version)
    }

    const versions = await listPromptVersions(filename)
    return NextResponse.json({ versions })
  } catch (error) {
    return NextResponse.json({ error: "Failed to read prompt versions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { filename, versionName, content } = body

    if (!filename || !isSafeFilename(filename)) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
    }

    if (!versionName || !isSafeVersionName(versionName)) {
      return NextResponse.json({ error: "Invalid version name" }, { status: 400 })
    }

    if (typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 })
    }

    try {
      yaml.parse(content)
    } catch {
      return NextResponse.json({ error: "Invalid YAML format" }, { status: 400 })
    }

    const version = await writePromptVersion(filename, versionName, content)
    return NextResponse.json({ success: true, ...version })
  } catch {
    return NextResponse.json({ error: "Failed to create prompt version" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { filename, versionName } = body

    if (!filename || !isSafeFilename(filename)) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
    }

    if (!versionName || !isSafeVersionName(versionName)) {
      return NextResponse.json({ error: "Invalid version name" }, { status: 400 })
    }

    const { content } = await readPromptVersion(filename, versionName)
    await fs.writeFile(path.join(PROMPTS_DIR, filename), content, "utf-8")
    await promptManager.reload()
    reloadPromptConfig()

    return NextResponse.json({
      success: true,
      filename,
      versionName,
      content,
      message: `已将 ${versionName} 应用为当前版本`,
    })
  } catch {
    return NextResponse.json({ error: "Failed to apply prompt version" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { filename, versionName } = body

    if (!filename || !isSafeFilename(filename)) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
    }

    if (!versionName || !isSafeVersionName(versionName)) {
      return NextResponse.json({ error: "Invalid version name" }, { status: 400 })
    }

    await deletePromptVersion(filename, versionName)
    return NextResponse.json({ success: true, message: `Deleted ${versionName}` })
  } catch {
    return NextResponse.json({ error: "Failed to delete prompt version" }, { status: 500 })
  }
}
