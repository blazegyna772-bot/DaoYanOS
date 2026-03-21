import { NextRequest, NextResponse } from "next/server"
import { readProject } from "@/lib/storage"
import { getDirectorById, getDirectors } from "@/lib/promptLoader"
import { safetyCheck, hasRedZoneContent, getRiskReport } from "@/lib/safetyFilter"
import {
  runChainGeneration,
  createChainEngine,
  cancelGeneration,
  type ChainEngineCallbacks,
} from "@/lib/chainEngine"
import {
  buildEffectivePlotForGenerate,
  buildFullSystemPrompt,
  type PromptBuilderOptions,
} from "@/lib/promptBuilder"
import type { Project, Director, PlatformConfig } from "@/types"

// 服务端日志函数
function serverLog(type: string, label: string, data: unknown) {
  const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  console.log(`[${timestamp}] [${type}] ${label}`, typeof data === 'object' ? JSON.stringify(data, null, 2).slice(0, 500) : data)
}

// 运行中的引擎实例（用于取消）
const runningEngines = new Map<string, ReturnType<typeof createChainEngine>>()

/**
 * 获取全局平台配置（从 localStorage JSON 文件）
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
 * 保存全局平台配置
 */
async function saveGlobalPlatformConfig(configs: Record<string, PlatformConfig>, currentId: string): Promise<void> {
  try {
    const fs = await import("fs/promises")
    const path = await import("path")
    const os = await import("os")

    const configPath = path.join(os.homedir(), "Documents", "DaoYanOSProjects", "global_config.json")
    await fs.writeFile(configPath, JSON.stringify({
      platforms: configs,
      currentPlatform: currentId,
    }, null, 2), "utf-8")
  } catch (error) {
    console.error("Failed to save global config:", error)
  }
}

/**
 * POST /api/generate
 * 生成分镜
 *
 * Body:
 * - projectId: string
 * - episodeId?: string (分集ID，不传则使用第一个有内容的分集)
 * - stage?: "full" | "analyze" | "single"
 * - sceneId?: string (仅 single 模式)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, episodeId, stage = "full", sceneId } = body

    serverLog("API", "→ 收到生成请求", { projectId, episodeId, stage })

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 })
    }

    // 读取项目
    const project = await readProject(projectId)
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // 获取平台配置：优先从全局配置读取，否则从项目读取
    let platform = await getGlobalPlatformConfig()

    serverLog("API", "→ 平台配置", {
      platformId: platform?.id,
      hasApiKey: !!platform?.textApiKey,
      endpoint: platform?.textEndpoint,
      model: platform?.textModel,
      mode: platform?.mode,
    })

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

    // 获取导演
    const director = getDirectorById(project.selectedDirector)

    // 构建选项
    const options: PromptBuilderOptions = {
      director: director || null,
      visualStyle: project.visualStyle,
      duration: project.duration,
      isSTCEnabled: project.stcEnabled,
      isFaithfulMode: project.scriptFaithfulMode,
      isScriptImported: project.isScriptImported,
      assets: project.assets,
      platform,
      shotMode: project.shotMode,
      customShotCount: project.customShotCount,
      enableBGM: project.enableBGM,
      enableSubtitle: project.enableSubtitle,
    }

    // 获取剧本：优先从指定分集，否则从第一个有内容的分集，最后使用项目 plotInput
    let plot = ""
    let plotSource = ""
    if (episodeId && project.episodes) {
      const episode = project.episodes.find((ep) => ep.id === episodeId)
      plot = episode?.plotInput || ""
      plotSource = `分集 ${episodeId} (找到: ${!!episode}, 内容长度: ${plot.length})`
    } else if (project.episodes && project.episodes.length > 0) {
      // 找到第一个有内容的分集
      const episodeWithContent = project.episodes.find((ep) => ep.plotInput?.trim())
      plot = episodeWithContent?.plotInput || ""
      plotSource = `第一个有内容的分集 ${episodeWithContent?.id} (长度: ${plot.length})`
    }
    // 兜底：使用项目级别的 plotInput
    if (!plot.trim()) {
      plot = project.plotInput || ""
      plotSource = `项目级 plotInput (长度: ${plot.length})`
    }

    serverLog("API", "→ 剧本来源", { episodeId, plotSource, plotLength: plot.length })

    if (!plot.trim()) {
      return NextResponse.json({ error: "No plot content" }, { status: 400 })
    }

    // 安全检测
    const safetyResult = safetyCheck(plot, project.enableWordFilter)

    // 如果检测到红区词汇，阻断生成
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

    // 使用清洗后的剧本（如果启用了过滤）
    const cleanPlot = project.enableWordFilter ? safetyResult.text : plot
    const effectivePlotForGenerate = buildEffectivePlotForGenerate(
      cleanPlot,
      project.scriptFaithfulMode,
      project.isScriptImported,
      project.assets
    )

    // 创建引擎
    const engine = createChainEngine()
    runningEngines.set(projectId, engine)

    // 设置流式响应
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        }

        // 发送安全检测结果
        sendEvent("safety_check", {
          riskLevel: safetyResult.riskLevel,
          replaced: safetyResult.replaced.length,
          warnings: [
            ...safetyResult.detectedYellowZone,
            ...safetyResult.detectedCelebrity,
            ...safetyResult.detectedIP,
          ],
        })

        const callbacks: ChainEngineCallbacks = {
          onStageAComplete: (scenes) => {
            sendEvent("stage_a_complete", {
              scenes: scenes.map((scene) => ({
                id: scene.id,
                name: scene.name,
                beatType: scene.beatType,
                beatTask: scene.beatTask,
                duration: scene.duration,
                contentSummary: scene.contentSummary,
              })),
            })
          },
          onSceneStart: (scene, index) => {
            sendEvent("scene_start", {
              sceneId: scene.id,
              sceneName: scene.name,
              index,
              total: engine.scenes.length,
            })
          },
          onSceneProgress: (sceneId, content) => {
            sendEvent("scene_progress", { sceneId, content })
          },
          onSceneComplete: (scene, content) => {
            sendEvent("scene_complete", { sceneId: scene.id, sceneName: scene.name })
          },
          onSceneError: (scene, error) => {
            sendEvent("scene_error", { sceneId: scene.id, error: error.message })
          },
          onBridgeExtracted: (sceneId, bridgeState) => {
            sendEvent("bridge_extracted", { sceneId, bridgeState })
          },
          onAllComplete: (contents) => {
            sendEvent("complete", {
              sceneCount: Object.keys(contents).length,
              totalDuration: project.duration,
            })
          },
        }

        try {
          const { output } = await runChainGeneration(
            effectivePlotForGenerate,
            project.duration,
            options,
            getDirectors(),
            callbacks
          )

          // 返回最终结果
          sendEvent("output", { content: output })
        } catch (error) {
          sendEvent("error", { message: (error as Error).message })
        } finally {
          runningEngines.delete(projectId)
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Generate API error:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

/**
 * DELETE /api/generate
 * 取消生成
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 })
    }

    const engine = runningEngines.get(projectId)
    if (engine) {
      cancelGeneration(engine)
      runningEngines.delete(projectId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

/**
 * GET /api/generate/prompt
 * 预览生成的提示词（用于调试）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 })
    }

    const project = await readProject(projectId)
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const director = getDirectorById(project.selectedDirector)
    const platform = project.platforms.find(
      (p) => p.id === project.currentPlatformId
    ) as PlatformConfig | undefined

    const options: PromptBuilderOptions = {
      director: director || null,
      visualStyle: project.visualStyle,
      duration: project.duration,
      isSTCEnabled: project.stcEnabled,
      isFaithfulMode: project.scriptFaithfulMode,
      isScriptImported: project.isScriptImported,
      assets: project.assets,
      platform,
      shotMode: project.shotMode,
      customShotCount: project.customShotCount,
      enableBGM: project.enableBGM,
      enableSubtitle: project.enableSubtitle,
    }

    const systemPrompt = buildFullSystemPrompt(options)

    return NextResponse.json({
      systemPrompt,
      narrativeMode:
        project.duration < 25 ? "burst" : project.duration < 85 ? "mini" : "full",
      director: director?.name || "通用",
      visualStyle: project.visualStyle,
    })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
