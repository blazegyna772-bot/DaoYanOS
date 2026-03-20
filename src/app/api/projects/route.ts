import { NextRequest, NextResponse } from "next/server"
import { listProjects, writeProject, createEmptyProject } from "@/lib/storage"

/**
 * GET /api/projects
 * 列出所有项目
 */
export async function GET() {
  try {
    const projects = await listProjects()
    return NextResponse.json({ projects })
  } catch (error) {
    console.error("GET /api/projects error:", error)
    return NextResponse.json(
      { error: "Failed to list projects" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects
 * 创建新项目
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const project = body.project || createEmptyProject()

    const success = await writeProject(project)

    if (success) {
      return NextResponse.json({ project }, { status: 201 })
    } else {
      return NextResponse.json(
        { error: "Failed to create project" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("POST /api/projects error:", error)
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    )
  }
}
