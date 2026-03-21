import { NextRequest, NextResponse } from "next/server"
import { readProject, writeProject } from "@/lib/storage"
import { buildShotEditPrompt as buildShotEditPromptPair } from "@/lib/promptBuilder"
import { safetyCheck, getRiskReport } from "@/lib/safetyFilter"
import {
  buildStoryboardMarkdown,
  enforceTargetOnlyChanges,
  parseShotsFromResponse,
  recalculateShotTimeRanges,
  resolveShotEditContext,
} from "@/lib/shotEdit"
import type { PlatformConfig } from "@/types"

/**
 * 获取全局平台配置（从 global_config.json）
 */
async function getGlobalPlatformConfig(): Promise<PlatformConfig | null> {
  try {
    const fs = await import("fs/promises")
    const path = await import("path")
    const os = await import("os")

    const configPath = path.join(os.homedir(), "Documents", "DaoYanOSProjects", "global_config.json")
    const content = await fs.readFile(configPath, "utf-8")
    const config = JSON.parse(content)
    const currentPlatformId = config.currentPlatform || "openai"
    return config.platforms?.[currentPlatformId] || null
  } catch {
    return null
  }
}

/**
 * POST /api/shots/edit
 * 单镜/批量修改分镜
 *
 * Body:
 * - projectId: string
 * - episodeId: string
 * - shotIds: string[] (要修改的分镜ID列表)
 * - editNote: string (修改意见)
 * - mode: "single" | "batch" | "regenerate"
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, episodeId, shotIds, editNote } = body

    if (!projectId || !episodeId || !shotIds?.length || !editNote) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 读取项目
    const project = await readProject(projectId)
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // 获取平台配置：优先从全局配置读取
    let platform = await getGlobalPlatformConfig()

    if (!platform || !platform.textApiKey) {
      // 尝试从项目配置读取
      platform = project.platforms.find(
        (p) => p.id === project.currentPlatformId
      ) as PlatformConfig | undefined
    }

    if (!platform || !platform.textApiKey) {
      return NextResponse.json({
        error: "Platform not configured or API key missing",
        hint: "请在设置页配置 AI 平台 API Key"
      }, { status: 400 })
    }

    // 找到目标分集和分镜
    const episodeIndex = project.episodes.findIndex((ep) => ep.id === episodeId)
    if (episodeIndex === -1) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 })
    }

    const episode = project.episodes[episodeIndex]

    // 传递完整分镜列表（提供上下文），而非只传目标分镜
    const allShots = episode.shots || []
    const targetShotIds = shotIds  // 要修改的分镜 ID

    if (allShots.length === 0) {
      return NextResponse.json({ error: "No shots found" }, { status: 404 })
    }

    // 安全检测
    const safetyResult = safetyCheck(editNote, project.enableWordFilter)
    if (safetyResult.detectedRedZone.length > 0) {
      return NextResponse.json({
        error: "内容安全检测未通过",
        safetyCheck: {
          riskLevel: safetyResult.riskLevel,
          detectedRedZone: safetyResult.detectedRedZone,
          report: getRiskReport(safetyResult),
        }
      }, { status: 400 })
    }

    const { contextShots, sceneScoped, sceneId, relativeShotIndices } = resolveShotEditContext(allShots, targetShotIds)
    if (contextShots.length === 0) {
      return NextResponse.json({ error: "Target shots not found" }, { status: 404 })
    }

    // 构建修改请求的系统提示词（优先使用场次局部表格）
    if (relativeShotIndices.length === 0) {
      return NextResponse.json({ error: "Target shots not found" }, { status: 404 })
    }

    const currentStoryboardMarkdown = buildStoryboardMarkdown(contextShots, project.stcEnabled)
    const { systemPrompt, userPrompt } = buildShotEditPromptPair(
      relativeShotIndices.join("、"),
      editNote,
      currentStoryboardMarkdown,
      project.assets,
      sceneScoped ? "场次" : "完整"
    )

    // 调用 AI API
    const response = await callAI(platform, systemPrompt, userPrompt)

    // 解析返回的分镜数据（优先在场次局部上下文内回写）
    const { shots: updatedContextShots, error: parseError, debug } = parseShotsFromResponse(response, contextShots, targetShotIds)

    if (parseError) {
      return NextResponse.json({
        error: parseError,
        rawResponse: response.slice(0, 500),
        debug,
      }, { status: 200 })
    }

    const updatedShots = recalculateShotTimeRanges(enforceTargetOnlyChanges(allShots, allShots.map((shot) => {
      const updated = updatedContextShots.find((candidate) => candidate.id === shot.id)
      return updated || shot
    }), targetShotIds))

    // 更新项目中的分镜
    const updatedEpisodes = [...project.episodes]

    updatedEpisodes[episodeIndex] = {
      ...episode,
      shots: updatedShots,
    }

    // 保存项目
    const updatedProject = {
      ...project,
      episodes: updatedEpisodes,
      updatedAt: new Date().toISOString(),
    }
    await writeProject(updatedProject)

    return NextResponse.json({
      success: true,
      shots: updatedShots,
      message: sceneScoped
        ? `已按场次 ${sceneId} 的局部分镜表回写，目标镜头 ${targetShotIds.length} 个`
        : `已按完整分镜表回写，目标镜头 ${targetShotIds.length} 个`,
      debug: {
        ...((debug && typeof debug === "object") ? debug as Record<string, unknown> : {}),
        sceneScoped,
        sceneId,
        contextShotCount: contextShots.length,
        relativeShotIndices,
      },
    })
  } catch (error) {
    console.error("Shot edit API error:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

/**
 * 调用 AI API
 */
async function callAI(
  platform: PlatformConfig,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const headers: Record<string, string> = {}
  let url = platform.textEndpoint

  // 根据平台模式设置请求头
  switch (platform.mode) {
    case "claude":
      headers["x-api-key"] = platform.textApiKey
      headers["anthropic-version"] = "2023-06-01"
      headers["Content-Type"] = "application/json"
      break
    case "gemini":
      url = `${platform.textEndpoint}?key=${platform.textApiKey}`
      headers["Content-Type"] = "application/json"
      break
    case "qwen":
      headers["Authorization"] = `Bearer ${platform.textApiKey}`
      headers["Content-Type"] = "application/json"
      break
    default:
      headers["Authorization"] = `Bearer ${platform.textApiKey}`
      headers["Content-Type"] = "application/json"
  }

  let body: object
  if (platform.mode === "gemini") {
    body = {
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: userMessage }] },
      ],
      generationConfig: { maxOutputTokens: 4096 },
    }
  } else if (platform.mode === "claude") {
    body = {
      model: platform.textModel,
      max_tokens: 4096,
      messages: [
        { role: "user", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }
  } else if (platform.mode === "qwen") {
    // 通义千问使用特殊的请求格式
    body = {
      model: platform.textModel,
      input: {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      },
      parameters: {
        result_format: "message",
      },
    }
  } else {
    body = {
      model: platform.textModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 4096,
    }
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API Error ${response.status}: ${text.slice(0, 200)}`)
  }

  const data = await response.json()

  // 解析响应
  if (platform.mode === "gemini") {
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
  }
  if (platform.mode === "claude") {
    return data.content?.[0]?.text || ""
  }
  if (platform.mode === "qwen") {
    // 通义千问响应格式
    return data.output?.choices?.[0]?.message?.content || ""
  }
  return data.choices?.[0]?.message?.content || ""
}
