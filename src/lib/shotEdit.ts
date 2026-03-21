import type { Shot } from "../types"

export interface ShotEditContextResolution {
  contextShots: Shot[]
  sceneScoped: boolean
  sceneId: string | null
  relativeShotIndices: number[]
}

interface ParsedSeedanceFields {
  camera?: string
  env?: string
  action?: string
  light?: string
  dialogue?: string
  sound?: string
}

export function recalculateShotTimeRanges(shots: Shot[]): Shot[] {
  let offset = 0

  return shots.map((shot) => {
    const nextShot = {
      ...shot,
      timeRange: `${offset}-${offset + shot.duration}s`,
    }
    offset += shot.duration
    return nextShot
  })
}

export function resolveShotEditContext(
  allShots: Shot[],
  targetShotIds: string[]
): ShotEditContextResolution {
  const targetShots = allShots.filter((shot) => targetShotIds.includes(shot.id))
  if (targetShots.length === 0) {
    return {
      contextShots: [],
      sceneScoped: false,
      sceneId: null,
      relativeShotIndices: [],
    }
  }

  const sceneIds = Array.from(new Set(targetShots.map((shot) => shot.sceneId).filter(Boolean)))
  const contextShots = sceneIds.length === 1
    ? allShots.filter((shot) => shot.sceneId === sceneIds[0])
    : allShots

  const relativeShotIndices = targetShotIds
    .map((shotId) => contextShots.findIndex((shot) => shot.id === shotId))
    .filter((index) => index >= 0)
    .map((index) => index + 1)

  if (sceneIds.length === 1 && contextShots.length > 0) {
    return {
      contextShots,
      sceneScoped: true,
      sceneId: sceneIds[0],
      relativeShotIndices,
    }
  }

  return {
    contextShots: allShots,
    sceneScoped: false,
    sceneId: null,
    relativeShotIndices,
  }
}

export function buildStoryboardMarkdown(shots: Shot[], isSTCEnabled: boolean): string {
  const header = isSTCEnabled
    ? "| 时间段 | 景别 | 运镜 | 画面内容 | 光影氛围 | 戏剧张力 | SEEDANCE提示词 |"
    : "| 时间段 | 景别 | 运镜 | 画面内容 | 光影氛围 | SEEDANCE提示词 |"
  const separator = isSTCEnabled
    ? "| --- | --- | --- | --- | --- | --- | --- |"
    : "| --- | --- | --- | --- | --- | --- |"

  let offset = 0
  const rows = shots.map((shot) => {
    const start = offset
    const end = offset + (Number.isFinite(shot.duration) ? shot.duration : 0)
    offset = end

    const timeRange = sanitizeMarkdownCell(shot.timeRange || `${start}-${end}s`)
    const cells = [
      timeRange,
      sanitizeMarkdownCell(shot.type),
      sanitizeMarkdownCell(shot.camera),
      sanitizeMarkdownCell(buildSceneDescription(shot)),
      sanitizeMarkdownCell(shot.light),
    ]

    if (isSTCEnabled) {
      cells.push(sanitizeMarkdownCell(shot.tension))
    }

    cells.push(sanitizeMarkdownCell(shot.seedancePrompt))

    return `| ${cells.join(" | ")} |`
  })

  return [header, separator, ...rows].join("\n")
}

export function enforceTargetOnlyChanges(
  originalShots: Shot[],
  updatedShots: Shot[],
  targetShotIds: string[]
): Shot[] {
  const targetIdSet = new Set(targetShotIds)

  return originalShots.map((originalShot) => {
    if (!targetIdSet.has(originalShot.id)) {
      return originalShot
    }

    const updatedShot = updatedShots.find((shot) => shot.id === originalShot.id)
    if (!updatedShot) {
      return originalShot
    }

    return normalizeDialogueInSeedancePrompt(originalShot, {
      ...updatedShot,
      id: originalShot.id,
      sceneId: originalShot.sceneId,
      index: originalShot.index,
      globalIndex: originalShot.globalIndex,
    })
  })
}

export function parseShotsFromResponse(
  response: string,
  originalShots: Shot[],
  targetShotIds: string[]
): { shots: Shot[]; error?: string; debug?: unknown } {
  try {
    const content = unwrapMarkdownContent(response)

    try {
      const parsed = JSON.parse(content)
      const jsonResult = parseShotsFromJsonArray(parsed, originalShots, targetShotIds)
      if (jsonResult) {
        return jsonResult
      }
    } catch {
      // Keep falling through to markdown parsing.
    }

    const markdownResult = parseShotsFromMarkdownTable(content, originalShots, targetShotIds)
    if (markdownResult) {
      return markdownResult
    }

    return {
      shots: originalShots,
      error: "AI 返回结果既不是可解析的 JSON，也不是标准 Markdown 分镜表，请重试",
    }
  } catch (error) {
    return {
      shots: originalShots,
      error: `解析 AI 响应失败: ${(error as Error).message}`,
      debug: {
        preview: response.slice(0, 1000),
      },
    }
  }
}

function sanitizeMarkdownCell(value: string | number | undefined): string {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim()
}

function buildSceneDescription(shot: Shot): string {
  const parts = [shot.env?.trim(), shot.action?.trim()].filter(Boolean)
  return Array.from(new Set(parts)).join("；")
}

function unwrapMarkdownContent(response: string): string {
  let content = response.trim()
  if (content.startsWith("```json")) {
    content = content.slice(7)
  } else if (content.startsWith("```markdown")) {
    content = content.slice(11)
  } else if (content.startsWith("```md")) {
    content = content.slice(5)
  } else if (content.startsWith("```")) {
    content = content.slice(3)
  }

  if (content.endsWith("```")) {
    content = content.slice(0, -3)
  }

  return content.trim()
}

function parseDurationFromTimeRange(timeRange: string, fallbackDuration: number): number {
  const rangeMatch = timeRange.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)s?/)
  if (rangeMatch) {
    const start = Number.parseFloat(rangeMatch[1])
    const end = Number.parseFloat(rangeMatch[2])
    const duration = end - start
    return duration > 0 ? duration : fallbackDuration
  }

  const singleMatch = timeRange.match(/(\d+(?:\.\d+)?)\s*s?/)
  if (singleMatch) {
    return Number.parseFloat(singleMatch[1]) || fallbackDuration
  }

  return fallbackDuration
}

function extractSection(text: string, startLabel: string, endLabels: string[]): string {
  const start = text.indexOf(startLabel)
  if (start === -1) return ""

  const from = start + startLabel.length
  const candidates = endLabels
    .map((label) => text.indexOf(label, from))
    .filter((index) => index >= 0)
  const end = candidates.length > 0 ? Math.min(...candidates) : text.length
  return text.slice(from, end).trim()
}

function extractShotFieldsFromSeedance(seedancePrompt: string): ParsedSeedanceFields {
  const normalized = seedancePrompt.replace(/\s+/g, " ").trim()
  if (!normalized) return {}

  const camera = extractSection(normalized, "镜头：", ["环境："])
  const env = extractSection(normalized, "环境：", ["角色分动："])
  const action = extractSection(normalized, "角色分动：", ["细节："])
  const light = extractSection(normalized, "光影：", ["台词(", "音效："])
  const dialogueMatch = normalized.match(/台词\([^)]*\)：(.+?)(?=\s*音效：|$)/)
  const sound = extractSection(normalized, "音效：", ["拍摄指令："])

  return {
    camera,
    env,
    action,
    light,
    dialogue: dialogueMatch?.[1]?.trim() || "",
    sound,
  }
}

function getDialogueSpeakerTag(seedancePrompt: string, fallbackAction: string | undefined): string {
  const explicitMatch = seedancePrompt.match(/台词\(([^)]*)\)/)
  if (explicitMatch?.[1]?.trim()) {
    return explicitMatch[1].trim()
  }

  const actionMatch = (fallbackAction || "").match(/@人物\d+/)
  if (actionMatch?.[0]) {
    return actionMatch[0]
  }

  return "@人物1"
}

function extractOriginalDialogueSegment(originalShot: Shot): string {
  const dialoguePattern = /\s*台词\(([^)]*)\)：(.+?)(?=\s*音效：|\s*拍摄指令：|$)/
  const existingSegment = (originalShot.seedancePrompt || "").match(dialoguePattern)?.[0]?.trim()
  if (existingSegment) {
    return ` ${existingSegment}`
  }

  const speakerTag = getDialogueSpeakerTag(
    originalShot.seedancePrompt || "",
    originalShot.action
  )
  return ` 台词(${speakerTag})："${(originalShot.dialogue || "").trim()}"`
}

function normalizeDialogueInSeedancePrompt(originalShot: Shot, updatedShot: Shot): Shot {
  const originalDialogue = (originalShot.dialogue || "").trim()
  const prompt = (updatedShot.seedancePrompt || "").trim()

  if (!prompt) {
    return { ...updatedShot, dialogue: originalShot.dialogue }
  }

  const dialoguePattern = /\s*台词\(([^)]*)\)：(.+?)(?=\s*音效：|\s*拍摄指令：|$)/
  const hasDialogueSegment = dialoguePattern.test(prompt)

  if (!originalDialogue) {
    return {
      ...updatedShot,
      seedancePrompt: prompt.replace(dialoguePattern, "").replace(/\s{2,}/g, " ").trim(),
      dialogue: originalShot.dialogue,
    }
  }

  const normalizedDialogueSegment = extractOriginalDialogueSegment(originalShot)

  if (hasDialogueSegment) {
    return {
      ...updatedShot,
      seedancePrompt: prompt.replace(dialoguePattern, normalizedDialogueSegment).trim(),
      dialogue: originalShot.dialogue,
    }
  }

  const soundIndex = prompt.indexOf("音效：")
  const patchedPrompt = soundIndex >= 0
    ? `${prompt.slice(0, soundIndex).trim()}${normalizedDialogueSegment} ${prompt.slice(soundIndex).trim()}`
    : `${prompt}${normalizedDialogueSegment}`

  return {
    ...updatedShot,
    seedancePrompt: patchedPrompt.trim(),
    dialogue: originalShot.dialogue,
  }
}

function normalizeUpdatedShot(originalShot: Shot, updatedShot: Shot): Shot {
  const normalizedDuration = Number.isFinite(updatedShot.duration) && updatedShot.duration > 0
    ? updatedShot.duration
    : originalShot.duration

  return {
    ...updatedShot,
    type: updatedShot.type?.trim() || originalShot.type,
    duration: normalizedDuration,
    timeRange: updatedShot.timeRange?.trim() || originalShot.timeRange,
    env: updatedShot.env?.trim() || originalShot.env,
    action: updatedShot.action?.trim() || originalShot.action,
    light: updatedShot.light?.trim() || originalShot.light,
    tension: updatedShot.tension?.trim() || originalShot.tension,
    seedancePrompt: updatedShot.seedancePrompt?.trim() || originalShot.seedancePrompt,
    camera: updatedShot.camera?.trim() || originalShot.camera,
    sound: updatedShot.sound?.trim() || originalShot.sound,
    dialogue: updatedShot.dialogue?.trim() || originalShot.dialogue,
  }
}

function parseShotsFromJsonArray(
  parsed: unknown,
  originalShots: Shot[],
  targetShotIds: string[]
): { shots: Shot[]; debug: unknown } | null {
  if (!Array.isArray(parsed)) return null

  const mergedShots = [...originalShots]
  const debugInfo: Array<{
    targetId: string
    originalIndex: number
    found: boolean
    returnedData?: unknown
  }> = []

  for (const targetId of targetShotIds) {
    const originalIndex = originalShots.findIndex((shot) => shot.id === targetId)
    if (originalIndex === -1) continue

    const original = originalShots[originalIndex]
    const returnedShot = parsed.find((item: { index?: number }) => item.index === originalIndex + 1)
    debugInfo.push({
      targetId,
      originalIndex: originalIndex + 1,
      found: !!returnedShot,
      returnedData: returnedShot,
    })

    if (!returnedShot) continue

    mergedShots[originalIndex] = normalizeUpdatedShot(original, {
      ...original,
      type: returnedShot.type !== undefined ? returnedShot.type : original.type,
      duration: returnedShot.duration !== undefined ? returnedShot.duration : original.duration,
      timeRange: returnedShot.timeRange !== undefined ? returnedShot.timeRange : original.timeRange,
      env: returnedShot.env !== undefined ? returnedShot.env : original.env,
      action: returnedShot.action !== undefined ? returnedShot.action : original.action,
      light: returnedShot.light !== undefined ? returnedShot.light : original.light,
      tension: returnedShot.tension !== undefined ? returnedShot.tension : original.tension,
      seedancePrompt: returnedShot.seedancePrompt !== undefined ? returnedShot.seedancePrompt : original.seedancePrompt,
      camera: returnedShot.camera !== undefined ? returnedShot.camera : original.camera,
      sound: returnedShot.sound !== undefined ? returnedShot.sound : original.sound,
      dialogue: returnedShot.dialogue !== undefined ? returnedShot.dialogue : original.dialogue,
    })
  }

  return { shots: mergedShots, debug: { mode: "json-array", parsed, debugInfo } }
}

function parseShotsFromMarkdownTable(
  content: string,
  originalShots: Shot[],
  targetShotIds: string[]
): { shots: Shot[]; debug: unknown } | null {
  const tableLines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && !/^(\|\s*-+\s*)+\|?$/.test(line))

  if (tableLines.length < 2) {
    return null
  }

  const dataLines = tableLines.slice(1)
  if (dataLines.length === 0) {
    return null
  }

  const parsedRows = dataLines.map((line) =>
    line
      .slice(1, line.endsWith("|") ? -1 : undefined)
      .split("|")
      .map((cell) => cell.replace(/\\\|/g, "|").trim())
  )

  const mergedShots = originalShots.map((original, index) => {
    const row = parsedRows[index]
    if (!row || row.length < 6) {
      return original
    }

    const hasTension = row.length >= 7
    const timeRange = row[0] || original.timeRange
    const seedancePrompt = hasTension ? row[6] : row[5]
    const extracted = extractShotFieldsFromSeedance(seedancePrompt)

    return normalizeUpdatedShot(original, {
      ...original,
      type: row[1] || original.type,
      duration: parseDurationFromTimeRange(timeRange, original.duration),
      timeRange,
      camera: extracted.camera || row[2] || original.camera,
      env: extracted.env || row[3] || original.env,
      action: extracted.action || original.action,
      light: extracted.light || row[4] || original.light,
      tension: hasTension ? (row[5] || original.tension) : original.tension,
      seedancePrompt: seedancePrompt || original.seedancePrompt,
      sound: extracted.sound || original.sound,
      dialogue: extracted.dialogue || original.dialogue,
    })
  })

  const debugInfo = targetShotIds.map((targetId) => {
    const originalIndex = originalShots.findIndex((shot) => shot.id === targetId)
    return {
      targetId,
      originalIndex: originalIndex + 1,
      found: originalIndex >= 0 && originalIndex < parsedRows.length,
      returnedData: originalIndex >= 0 ? parsedRows[originalIndex] : undefined,
    }
  })

  return {
    shots: mergedShots,
    debug: {
      mode: "markdown-table",
      parsedRowCount: parsedRows.length,
      debugInfo,
    },
  }
}
