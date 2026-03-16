import { NextResponse } from "next/server"
import { getLocalStoragePath, ensureDirectoryExists } from "@/lib/storage"
import fs from "fs/promises"
import path from "path"

// 获取所有项目列表
export async function GET() {
  try {
    const storagePath = getLocalStoragePath()
    await ensureDirectoryExists(storagePath)

    const entries = await fs.readdir(storagePath, { withFileTypes: true })
    const projects = []

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const metaPath = path.join(storagePath, entry.name, "meta.json")
        try {
          const metaContent = await fs.readFile(metaPath, "utf-8")
          const meta = JSON.parse(metaContent)
          projects.push({
            id: entry.name,
            name: meta.name || entry.name,
            createdAt: meta.createdAt,
            updatedAt: meta.updatedAt,
          })
        } catch {
          // 没有meta.json的项目也列出
          projects.push({
            id: entry.name,
            name: entry.name,
            createdAt: null,
            updatedAt: null,
          })
        }
      }
    }

    return NextResponse.json({ projects })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to list projects" },
      { status: 500 }
    )
  }
}

// 创建新项目
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, script = "" } = body

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      )
    }

    const storagePath = getLocalStoragePath()
    const projectId = `${Date.now()}_${name.replace(/\s+/g, "_")}`
    const projectPath = path.join(storagePath, projectId)

    // 创建项目目录结构
    await fs.mkdir(projectPath, { recursive: true })
    await fs.mkdir(path.join(projectPath, "assets", "characters"), { recursive: true })
    await fs.mkdir(path.join(projectPath, "assets", "scenes"), { recursive: true })
    await fs.mkdir(path.join(projectPath, "assets", "props"), { recursive: true })
    await fs.mkdir(path.join(projectPath, "outputs", "images"), { recursive: true })
    await fs.mkdir(path.join(projectPath, "outputs", "videos"), { recursive: true })

    // 创建meta.json
    const meta = {
      id: projectId,
      name,
      script,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {},
      storyboards: [],
    }
    await fs.writeFile(
      path.join(projectPath, "meta.json"),
      JSON.stringify(meta, null, 2)
    )

    return NextResponse.json({ project: meta })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    )
  }
}
