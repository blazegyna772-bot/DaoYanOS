import { NextRequest, NextResponse } from "next/server"
import { readProject, writeProject, deleteProject } from "@/lib/storage"

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/projects/[id]
 * 读取单个项目
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const project = await readProject(id)

    if (project) {
      return NextResponse.json({ project })
    } else {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error(`GET /api/projects/[id] error:`, error)
    return NextResponse.json(
      { error: "Failed to read project" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/projects/[id]
 * 更新项目
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const project = body.project

    if (!project || project.id !== id) {
      return NextResponse.json(
        { error: "Invalid project data" },
        { status: 400 }
      )
    }

    const success = await writeProject(project)

    if (success) {
      return NextResponse.json({ project })
    } else {
      return NextResponse.json(
        { error: "Failed to update project" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error(`PUT /api/projects/[id] error:`, error)
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/projects/[id]
 * 删除项目
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const success = await deleteProject(id)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: "Failed to delete project" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error(`DELETE /api/projects/[id] error:`, error)
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    )
  }
}
