import { NextRequest, NextResponse } from "next/server"
import { readProject } from "@/lib/storage"
import type { Project, Shot } from "@/types"

/**
 * GET /api/export
 * 导出项目数据
 *
 * Query params:
 * - projectId: string
 * - format: "json" | "csv" | "markdown"
 * - type: "shots" | "prompts" | "full"
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const format = searchParams.get("format") || "json"
    const type = searchParams.get("type") || "shots"

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 })
    }

    const project = await readProject(projectId)
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    switch (type) {
      case "shots":
        return exportShots(project, format)
      case "prompts":
        return exportPrompts(project, format)
      case "full":
        return exportFullProject(project, format)
      default:
        return NextResponse.json({ error: "Invalid export type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

/**
 * 导出分镜数据
 */
function exportShots(project: Project, format: string): NextResponse {
  const allShots: Shot[] = []

  // 收集所有分镜
  project.episodes.forEach((ep) => {
    ep.shots?.forEach((shot) => {
      allShots.push(shot)
    })
  })

  if (format === "csv") {
    const csv = shotsToCSV(allShots)
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${project.name}_shots.csv"`,
      },
    })
  }

  if (format === "markdown") {
    const md = shotsToMarkdown(allShots, project)
    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${project.name}_shots.md"`,
      },
    })
  }

  // JSON
  return NextResponse.json({
    projectName: project.name,
    exportedAt: new Date().toISOString(),
    totalShots: allShots.length,
    shots: allShots,
  }, {
    headers: {
      "Content-Disposition": `attachment; filename="${project.name}_shots.json"`,
    },
  })
}

/**
 * 导出提示词
 */
function exportPrompts(project: Project, format: string): NextResponse {
  const prompts: Array<{
    episodeId: string
    episodeName: string
    shotId: string
    shotIndex: number
    seedancePrompt: string
  }> = []

  project.episodes.forEach((ep) => {
    ep.shots?.forEach((shot) => {
      prompts.push({
        episodeId: ep.id,
        episodeName: ep.name,
        shotId: shot.id,
        shotIndex: shot.globalIndex,
        seedancePrompt: shot.seedancePrompt,
      })
    })
  })

  if (format === "csv") {
    const csv = [
      "Episode,Shot Index,SEEDANCE Prompt",
      ...prompts.map((p) =>
        `"${p.episodeName}",${p.shotIndex},"${p.seedancePrompt.replace(/"/g, '""')}"`
      ),
    ].join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${project.name}_prompts.csv"`,
      },
    })
  }

  return NextResponse.json({
    projectName: project.name,
    exportedAt: new Date().toISOString(),
    totalPrompts: prompts.length,
    prompts,
  }, {
    headers: {
      "Content-Disposition": `attachment; filename="${project.name}_prompts.json"`,
    },
  })
}

/**
 * 导出完整项目
 */
function exportFullProject(project: Project, format: string): NextResponse {
  // 移除敏感信息
  const sanitizedProject = {
    ...project,
    platforms: project.platforms.map((p) => ({
      ...p,
      textApiKey: "***",
      visionApiKey: "***",
    })),
  }

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    version: "1.0",
    project: sanitizedProject,
  }, {
    headers: {
      "Content-Disposition": `attachment; filename="${project.name}_full.json"`,
    },
  })
}

/**
 * 分镜转CSV
 */
function shotsToCSV(shots: Shot[]): string {
  const headers = [
    "ID",
    "Scene ID",
    "Index",
    "Global Index",
    "Type",
    "Duration",
    "Time Range",
    "Environment",
    "Action",
    "Light",
    "Tension",
    "Camera",
    "Sound",
    "Dialogue",
    "SEEDANCE Prompt",
  ]

  const rows = shots.map((s) => [
    s.id,
    s.sceneId,
    s.index,
    s.globalIndex,
    s.type,
    s.duration,
    s.timeRange,
    `"${(s.env || "").replace(/"/g, '""')}"`,
    `"${(s.action || "").replace(/"/g, '""')}"`,
    `"${(s.light || "").replace(/"/g, '""')}"`,
    `"${(s.tension || "").replace(/"/g, '""')}"`,
    `"${(s.camera || "").replace(/"/g, '""')}"`,
    `"${(s.sound || "").replace(/"/g, '""')}"`,
    `"${(s.dialogue || "").replace(/"/g, '""')}"`,
    `"${(s.seedancePrompt || "").replace(/"/g, '""')}"`,
  ])

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
}

/**
 * 分镜转Markdown
 */
function shotsToMarkdown(shots: Shot[], project: Project): string {
  const lines = [
    `# ${project.name} - 分镜脚本`,
    "",
    `> 导出时间: ${new Date().toLocaleString("zh-CN")}`,
    `> 总镜数: ${shots.length}`,
    `> 总时长: ${project.duration}秒`,
    "",
    "---",
    "",
  ]

  shots.forEach((shot) => {
    lines.push(`## 镜头 ${shot.globalIndex}`)
    lines.push("")
    lines.push(`| 属性 | 值 |`)
    lines.push(`|------|-----|`)
    lines.push(`| 场次 | ${shot.sceneId} |`)
    lines.push(`| 类型 | ${shot.type} |`)
    lines.push(`| 时长 | ${shot.duration}秒 |`)
    lines.push(`| 时间轴 | ${shot.timeRange} |`)
    lines.push("")
    lines.push(`### 环境`)
    lines.push(shot.env || "_无_")
    lines.push("")
    lines.push(`### 角色分动`)
    lines.push(shot.action || "_无_")
    lines.push("")
    lines.push(`### 光影`)
    lines.push(shot.light || "_无_")
    lines.push("")
    lines.push(`### 戏剧张力`)
    lines.push(shot.tension || "_无_")
    lines.push("")
    lines.push(`### SEEDANCE 提示词`)
    lines.push("```")
    lines.push(shot.seedancePrompt || "_无_")
    lines.push("```")
    lines.push("")
    lines.push("---")
    lines.push("")
  })

  return lines.join("\n")
}