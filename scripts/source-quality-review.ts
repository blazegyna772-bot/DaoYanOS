import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import type { AssetState, Episode, Project, Scene, Shot } from "../src/types"

interface SampleCase {
  id: string
  label: string
  plotInput: string
}

interface GenerateReviewResult {
  scenes: Scene[]
  sceneOutputs: Record<string, string>
  bridgeStates: Record<string, unknown>
  finalOutput: string
}

interface ShotEditReviewResult {
  beforeShots: Shot[]
  afterShots: Shot[]
  targetShotId: string
  message: string
}

interface SampleReviewSummary {
  id: string
  label: string
  sceneCount: number
  stageADialoguePass: boolean
  beatTaskPass: boolean
  bridgeCarryPass: boolean
  shotEditTargetOnlyPass: boolean
  shotEditDialogueLockPass: boolean
  shotEditTagConsistencyPass: boolean
  conclusion: "通过" | "轻微偏差" | "明显偏差"
  notes: string[]
}

const BASE_URL = process.env.DAOYAN_BASE_URL || "http://127.0.0.1:3000"
const SOURCE_PROJECT_ID = process.env.DAOYAN_SOURCE_PROJECT_ID || "proj_1773882331604"
const REVIEW_DURATION = 90

async function main() {
  const sourceProject = await readSourceProject(SOURCE_PROJECT_ID)
  const globalConfig = await readGlobalConfig()
  const samples = buildSampleCases(sourceProject)
  const summaries: SampleReviewSummary[] = []
  const reportSections: string[] = []

  for (const sample of samples) {
    const tempProject = buildTempProject(sourceProject, sample)
    await createProject(tempProject)

    try {
      const generateResult = await runGenerateReview(tempProject.id, tempProject.episodes[0].id)
      const generatedShots = buildShotsFromSceneOutputs(generateResult.scenes, generateResult.sceneOutputs)
      const updatedProject = {
        ...tempProject,
        episodes: [
          {
            ...tempProject.episodes[0],
            scenes: generateResult.scenes,
            shots: generatedShots,
          },
        ],
      }
      await updateProject(updatedProject)

      const shotEditResult = await runShotEditReview(updatedProject)
      const summary = evaluateSample(sample, generateResult, shotEditResult)
      summaries.push(summary)
      reportSections.push(renderSampleSection(sample, generateResult, shotEditResult, summary))
    } finally {
      await deleteProject(tempProject.id)
    }
  }

  const reportPath = path.join(process.cwd(), "reports", "source-quality-review.md")
  await fs.mkdir(path.dirname(reportPath), { recursive: true })
  await fs.writeFile(
    reportPath,
    renderReport(globalConfig, summaries, reportSections),
    "utf8"
  )

  console.log(
    JSON.stringify(
      {
        reportPath,
        baseUrl: BASE_URL,
        platform: globalConfig.currentPlatform,
        model: globalConfig.model,
        summaries,
      },
      null,
      2
    )
  )
}

async function readSourceProject(projectId: string): Promise<Project> {
  const projectPath = path.join(
    os.homedir(),
    "Documents",
    "DaoYanOSProjects",
    projectId,
    "meta.json"
  )
  return JSON.parse(await fs.readFile(projectPath, "utf8")) as Project
}

async function readGlobalConfig() {
  const configPath = path.join(os.homedir(), "Documents", "DaoYanOSProjects", "global_config.json")
  const content = JSON.parse(await fs.readFile(configPath, "utf8")) as {
    currentPlatform: string
    platforms: Record<string, { textModel?: string }>
  }

  return {
    currentPlatform: content.currentPlatform,
    model: content.platforms?.[content.currentPlatform]?.textModel || "",
  }
}

function buildSampleCases(project: Project): SampleCase[] {
  const firstEpisode = project.episodes.find((episode) => episode.id === "ep_1773882331604")
  const thirdEpisode = project.episodes.find((episode) => episode.id === "ep_1773912341675")
  if (!firstEpisode?.plotInput || !thirdEpisode?.plotInput) {
    throw new Error("缺少质量复核所需的样本剧本")
  }

  const fullPlot = normalizePlot(firstEpisode.plotInput)
  const [openingConflict, decisionTail] = fullPlot.split("4-3 洞口空地，外，夜")

  return [
    {
      id: "dialogue-conflict",
      label: "强对白冲突样本",
      plotInput: fullPlot,
    },
    {
      id: "threat-escalation",
      label: "动作冲突样本",
      plotInput: openingConflict.trim(),
    },
    {
      id: "steady-decision",
      label: "节奏平缓样本",
      plotInput: normalizePlot(thirdEpisode.plotInput || decisionTail).trim(),
    },
  ]
}

function buildTempProject(sourceProject: Project, sample: SampleCase): Project {
  const now = new Date().toISOString()
  return {
    ...JSON.parse(JSON.stringify(sourceProject)) as Project,
    id: `proj_quality_review_${sample.id}_${Date.now()}`,
    name: `质量复核_${sample.label}`,
    createdAt: now,
    updatedAt: now,
    duration: REVIEW_DURATION,
    episodes: [
      {
        id: `ep_quality_review_${sample.id}`,
        name: sample.label,
        plotInput: sample.plotInput,
        scenes: [],
        shots: [],
      },
    ],
  }
}

async function createProject(project: Project) {
  const response = await fetch(`${BASE_URL}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project }),
  })

  if (!response.ok) {
    throw new Error(`创建临时项目失败: ${response.status}`)
  }
}

async function updateProject(project: Project) {
  const response = await fetch(`${BASE_URL}/api/projects/${project.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project }),
  })

  if (!response.ok) {
    throw new Error(`更新临时项目失败: ${response.status}`)
  }
}

async function deleteProject(projectId: string) {
  await fetch(`${BASE_URL}/api/projects/${projectId}`, {
    method: "DELETE",
  })
}

async function runGenerateReview(projectId: string, episodeId: string): Promise<GenerateReviewResult> {
  const response = await fetch(`${BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId,
      episodeId,
      stage: "full",
    }),
  })

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "")
    throw new Error(`生成请求失败: ${response.status} ${detail}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let currentEvent = ""
  const sceneOutputs: Record<string, string> = {}
  const bridgeStates: Record<string, unknown> = {}
  let finalOutput = ""
  let scenes: Scene[] = []

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split("\n")
    buffer = chunks.pop() || ""

    for (const line of chunks) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim()
        continue
      }

      if (!line.startsWith("data: ")) continue
      const data = JSON.parse(line.slice(6))
      const event = data.event || data.type || currentEvent

      if (event === "stage_a_complete") {
        scenes = data.scenes
      }

      if (event === "scene_progress") {
        sceneOutputs[data.sceneId] = data.content
      }

      if (event === "bridge_extracted") {
        bridgeStates[data.sceneId] = data.bridgeState
      }

      if (event === "output") {
        finalOutput = data.content
      }

      if (event === "error") {
        throw new Error(`生成链路失败: ${data.message}`)
      }
    }
  }

  if (scenes.length === 0) {
    throw new Error("未采集到 Stage A 场次结果")
  }

  return { scenes, sceneOutputs, bridgeStates, finalOutput }
}

async function runShotEditReview(project: Project): Promise<ShotEditReviewResult> {
  const episode = project.episodes[0]
  const targetShot = episode.shots.find((shot) => (shot.dialogue || "").trim()) || episode.shots[0]
  if (!targetShot) {
    throw new Error("没有可用于单镜修改的生成分镜")
  }

  const beforeShots = JSON.parse(JSON.stringify(episode.shots)) as Shot[]
  const response = await fetch(`${BASE_URL}/api/shots/edit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId: project.id,
      episodeId: episode.id,
      shotIds: [targetShot.id],
      editNote: "只微调该镜的压迫感、光影层次和运镜力度，保留台词原文、剧情动作和全部资产标签。",
      mode: "single",
    }),
  })

  const result = await response.json()
  if (!response.ok) {
    throw new Error(`单镜修改失败: ${result.error || response.status}`)
  }

  return {
    beforeShots,
    afterShots: result.shots as Shot[],
    targetShotId: targetShot.id,
    message: result.message || "",
  }
}

function buildShotsFromSceneOutputs(scenes: Scene[], sceneOutputs: Record<string, string>): Shot[] {
  let globalIndex = 1
  let globalOffset = 0
  const shots: Shot[] = []

  for (const scene of scenes) {
    const markdown = sceneOutputs[scene.id]
    if (!markdown) continue

    const sceneShots = parseMarkdownShots(markdown, scene.id, globalIndex, globalOffset)
    shots.push(...sceneShots)
    globalIndex += sceneShots.length
    globalOffset += sceneShots.reduce((sum, shot) => sum + shot.duration, 0)
  }

  return shots
}

function parseMarkdownShots(markdown: string, sceneId: string, startIndex: number, startOffset: number): Shot[] {
  const rows = markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && !line.includes("---") && !line.includes("时间段"))

  let currentOffset = startOffset

  return rows.map((row, index) => {
    const cells = row
      .slice(1, row.endsWith("|") ? -1 : undefined)
      .split("|")
      .map((cell) => cell.trim())

    const hasTension = cells.length >= 7
    const timeRange = cells[0] || `${currentOffset}-${currentOffset + 5}s`
    const duration = parseDurationFromTimeRange(timeRange, 5)
    const seedancePrompt = hasTension ? cells[6] : cells[5]
    const dialogue = extractDialogue(seedancePrompt)
    const shot: Shot = {
      id: `shot_${sceneId}_${index + 1}`,
      sceneId,
      index: index + 1,
      globalIndex: startIndex + index,
      type: cells[1] || "中景",
      duration,
      timeRange: `${currentOffset}-${currentOffset + duration}s`,
      env: cells[3] || "",
      action: cells[3] || "",
      light: cells[4] || "",
      tension: hasTension ? cells[5] || "" : "",
      seedancePrompt,
      camera: cells[2] || "",
      dialogue,
      sound: extractSound(seedancePrompt),
    }
    currentOffset += duration
    return shot
  })
}

function parseDurationFromTimeRange(timeRange: string, fallback: number): number {
  const match = timeRange.match(/(\d+(?:\.\d+)?)s?\s*-\s*(\d+(?:\.\d+)?)s?/)
  if (!match) return fallback
  const start = Number.parseFloat(match[1])
  const end = Number.parseFloat(match[2])
  return end > start ? end - start : fallback
}

function extractDialogue(seedancePrompt: string): string {
  const match = seedancePrompt.match(/台词\([^)]*\)：(.+?)(?=\s*音效：|\s*拍摄指令：|$)/)
  return match?.[1]?.trim().replace(/^["“]|["”]$/g, "") || ""
}

function extractSound(seedancePrompt: string): string {
  const match = seedancePrompt.match(/音效：(.+?)(?=\s*拍摄指令：|$)/)
  return match?.[1]?.trim() || ""
}

function evaluateSample(
  sample: SampleCase,
  generateResult: GenerateReviewResult,
  shotEditResult: ShotEditReviewResult
): SampleReviewSummary {
  const plotDialogueLines = extractDialogueLinesFromPlot(sample.plotInput)
  const allSummaries = generateResult.scenes.map((scene) => scene.contentSummary).join("\n")
  const stageADialoguePass = plotDialogueLines.every((line) => allSummaries.includes(line))
  const beatTaskPass = generateResult.scenes.every((scene) => Boolean(scene.beatTask?.trim()))
  const bridgeCarryPass = evaluateBridgeCarry(generateResult.scenes, generateResult.sceneOutputs, generateResult.bridgeStates)
  const shotEditTargetOnlyPass = evaluateTargetOnly(shotEditResult.beforeShots, shotEditResult.afterShots, shotEditResult.targetShotId)
  const shotEditDialogueLockPass = evaluateDialogueLock(shotEditResult.beforeShots, shotEditResult.afterShots, shotEditResult.targetShotId)
  const shotEditTagConsistencyPass = evaluateTagConsistency(shotEditResult.beforeShots, shotEditResult.afterShots, shotEditResult.targetShotId)

  const notes = [
    stageADialoguePass ? "Stage A 台词原文保留正常" : "Stage A 仍有台词原文遗漏",
    beatTaskPass ? "beatTask 无丢失" : "存在 beatTask 丢失",
    bridgeCarryPass ? "桥梁字段与下一场首镜有重合" : "桥梁传递效果偏弱",
    shotEditTargetOnlyPass ? "单镜修改保持局部 patch" : "单镜修改影响到非目标镜",
    shotEditDialogueLockPass ? "单镜修改未改动台词原文" : "单镜修改改动了台词原文",
    shotEditTagConsistencyPass ? "单镜修改保持了原有 @标签" : "单镜修改丢失了原有 @标签",
  ]

  const hardFail = !stageADialoguePass || !shotEditTargetOnlyPass || !shotEditDialogueLockPass
  const softFail = !beatTaskPass || !bridgeCarryPass || !shotEditTagConsistencyPass

  return {
    id: sample.id,
    label: sample.label,
    sceneCount: generateResult.scenes.length,
    stageADialoguePass,
    beatTaskPass,
    bridgeCarryPass,
    shotEditTargetOnlyPass,
    shotEditDialogueLockPass,
    shotEditTagConsistencyPass,
    conclusion: hardFail ? "明显偏差" : softFail ? "轻微偏差" : "通过",
    notes,
  }
}

function evaluateBridgeCarry(
  scenes: Scene[],
  sceneOutputs: Record<string, string>,
  bridgeStates: Record<string, unknown>
): boolean {
  if (scenes.length < 2) return true

  for (let index = 0; index < scenes.length - 1; index += 1) {
    const currentScene = scenes[index]
    const nextScene = scenes[index + 1]
    const bridge = bridgeStates[currentScene.id] as Record<string, string> | undefined
    const nextOutput = sceneOutputs[nextScene.id] || ""
    if (!bridge || !nextOutput) continue

    const bridgeKeywords = Object.values(bridge)
      .flatMap((value) => tokenizeText(value))
      .filter((token) => token.length >= 2)
    const nextKeywords = new Set(tokenizeText(nextOutput))

    if (bridgeKeywords.some((token) => nextKeywords.has(token))) {
      return true
    }
  }

  return false
}

function evaluateTargetOnly(beforeShots: Shot[], afterShots: Shot[], targetShotId: string): boolean {
  const afterMap = new Map(afterShots.map((shot) => [shot.id, shot]))

  return beforeShots.every((beforeShot) => {
    const afterShot = afterMap.get(beforeShot.id)
    if (!afterShot) return false
    if (beforeShot.id === targetShotId) return true
    return JSON.stringify(beforeShot) === JSON.stringify(afterShot)
  })
}

function evaluateDialogueLock(beforeShots: Shot[], afterShots: Shot[], targetShotId: string): boolean {
  const beforeTarget = beforeShots.find((shot) => shot.id === targetShotId)
  const afterTarget = afterShots.find((shot) => shot.id === targetShotId)
  if (!beforeTarget || !afterTarget) return false

  const beforeDialogue = (beforeTarget.dialogue || "").trim()
  const afterDialogue = (afterTarget.dialogue || "").trim()
  return beforeDialogue === afterDialogue && afterTarget.seedancePrompt.includes(beforeDialogue || "")
}

function evaluateTagConsistency(beforeShots: Shot[], afterShots: Shot[], targetShotId: string): boolean {
  const beforeTarget = beforeShots.find((shot) => shot.id === targetShotId)
  const afterTarget = afterShots.find((shot) => shot.id === targetShotId)
  if (!beforeTarget || !afterTarget) return false

  const originalTags = beforeTarget.seedancePrompt.match(/@(?:人物|图片|道具)\d+/g) || []
  return originalTags.every((tag) => afterTarget.seedancePrompt.includes(tag))
}

function extractDialogueLinesFromPlot(plotInput: string): string[] {
  return normalizePlot(plotInput)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[A-Za-z\u4E00-\u9FFF][A-Za-z0-9\u4E00-\u9FFF·（）()]{0,15}[：:]\s*\S+/.test(line))
}

function tokenizeText(text: string): string[] {
  return text
    .split(/[^\p{L}\p{N}@]+/u)
    .map((token) => token.trim())
    .filter(Boolean)
}

function normalizePlot(plotInput: string): string {
  return plotInput.replace(/\r/g, "").trim()
}

function renderSampleSection(
  sample: SampleCase,
  generateResult: GenerateReviewResult,
  shotEditResult: ShotEditReviewResult,
  summary: SampleReviewSummary
): string {
  const stageATable = generateResult.scenes
    .map((scene, index) => `| ${index + 1} | ${scene.name} | ${scene.beatType} | ${scene.beatTask || "缺失"} | ${scene.contentSummary.replace(/\n/g, " ")} |`)
    .join("\n")

  const bridgePreview = Object.entries(generateResult.bridgeStates)
    .slice(0, 2)
    .map(([sceneId, bridgeState]) => `- ${sceneId}: \`${JSON.stringify(bridgeState)}\``)
    .join("\n") || "- 无桥梁提取结果"

  const targetBefore = shotEditResult.beforeShots.find((shot) => shot.id === shotEditResult.targetShotId)
  const targetAfter = shotEditResult.afterShots.find((shot) => shot.id === shotEditResult.targetShotId)

  return [
    `## ${sample.label}`,
    "",
    `- 结论：**${summary.conclusion}**`,
    `- 场次数：${summary.sceneCount}`,
    `- 复核备注：${summary.notes.join("；")}`,
    "",
    "### Stage A",
    "",
    "| # | 场次 | beatType | beatTask | contentSummary |",
    "| --- | --- | --- | --- | --- |",
    stageATable,
    "",
    "### Bridge",
    "",
    bridgePreview,
    "",
    "### Shot Edit",
    "",
    `- 目标镜头：\`${shotEditResult.targetShotId}\``,
    `- API 返回：${shotEditResult.message}`,
    `- 修改前：${targetBefore?.seedancePrompt || "无"}`,
    `- 修改后：${targetAfter?.seedancePrompt || "无"}`,
    "",
  ].join("\n")
}

function renderReport(
  globalConfig: { currentPlatform: string; model: string },
  summaries: SampleReviewSummary[],
  sections: string[]
): string {
  const summaryRows = summaries
    .map(
      (summary) =>
        `| ${summary.label} | ${summary.conclusion} | ${summary.stageADialoguePass ? "通过" : "偏差"} | ${summary.beatTaskPass ? "通过" : "偏差"} | ${summary.bridgeCarryPass ? "通过" : "偏差"} | ${summary.shotEditTargetOnlyPass && summary.shotEditDialogueLockPass && summary.shotEditTagConsistencyPass ? "通过" : "偏差"} |`
    )
    .join("\n")

  return [
    "# Source 质量复核报告",
    "",
    `- 执行时间：${new Date().toISOString()}`,
    `- 平台：${globalConfig.currentPlatform}`,
    `- 模型：${globalConfig.model}`,
    `- 统一参数：时长 ${REVIEW_DURATION}s / 保真模式开启 / 资产标签开启 / 通过本地 API 调真实模型`,
    "",
    "## 总览",
    "",
    "| 样本 | 结论 | Stage A 台词 | beatTask | bridge | 单镜修改 |",
    "| --- | --- | --- | --- | --- | --- |",
    summaryRows,
    "",
    ...sections,
  ].join("\n")
}

void main()
