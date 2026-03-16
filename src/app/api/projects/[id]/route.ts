import { NextResponse } from "next/server"
import { getLocalStoragePath } from "@/lib/storage"
import fs from "fs/promises"
import path from "path"

// 获取单个项目
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storagePath = getLocalStoragePath()
    const metaPath = path.join(storagePath, id, "meta.json")

    const metaContent = await fs.readFile(metaPath, "utf-8")
    const meta = JSON.parse(metaContent)

    return NextResponse.json({ project: meta })
  } catch (error) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    )
  }
}

// 更新项目
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const storagePath = getLocalStoragePath()
    const metaPath = path.join(storagePath, id, "meta.json")

    const metaContent = await fs.readFile(metaPath, "utf-8")
    const meta = JSON.parse(metaContent)

    const updatedMeta = {
      ...meta,
      ...body,
      id, // 不允许修改id
      updatedAt: new Date().toISOString(),
    }

    await fs.writeFile(
      metaPath,
      JSON.stringify(updatedMeta, null, 2)
    )

    return NextResponse.json({ project: updatedMeta })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    )
  }
}

// 删除项目
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storagePath = getLocalStoragePath()
    const projectPath = path.join(storagePath, id)

    await fs.rm(projectPath, { recursive: true, force: true })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    )
  }
}
