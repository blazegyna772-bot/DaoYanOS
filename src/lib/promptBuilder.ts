/**
 * 提示词构建引擎
 * 架构：只做组装逻辑，所有内容从 YAML 配置读取
 * 运行时零 I/O 开销（启动时加载到内存）
 */

import type { Director, AssetState, BridgeState, PlatformConfig, Scene } from "@/types"
import { getPromptConfig, type CategoryGuide } from "./promptLoader"

// ============================================
// 类型定义
// ============================================

export interface PromptBuilderOptions {
  director: Director | null
  visualStyle: string
  duration: number
  isSTCEnabled: boolean
  isFaithfulMode: boolean
  isScriptImported: boolean
  assets: AssetState
  platform?: PlatformConfig
  bridgeState?: BridgeState | null
  shotMode?: "auto" | "custom"
  customShotCount?: number
  enableBGM?: boolean
  enableSubtitle?: boolean
}

interface ResolvedAssetMapping {
  originalName: string
  tag: string
  desc: string
  type: "character" | "image" | "props" | "unknown"
}

function fillTemplate(template: string, variables: Record<string, string | number | null | undefined>): string {
  let result = template

  for (const [key, rawValue] of Object.entries(variables)) {
    const value = rawValue == null ? "" : String(rawValue)
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value)
  }

  return result
    .replace(/\{\{/g, "{")
    .replace(/\}\}/g, "}")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function clipAssetDescription(desc: string, limit = 50): string {
  const trimmed = desc.trim()
  if (!trimmed) return "无补充描述"
  return trimmed.slice(0, limit) + (trimmed.length > limit ? "…" : "")
}

const SPEAKER_DIALOGUE_LINE_RE = /^[A-Za-z\u4E00-\u9FFF][A-Za-z0-9\u4E00-\u9FFF·（）()]{0,15}[：:]\s*\S+/

function normalizeDialogueCandidate(line: string): string {
  return line
    .trim()
    .replace(/^[-*•·]+\s*/, "")
    .replace(/^\d+[\.\-、]\s*/, "")
    .replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/, "")
}

function extractDialogueLines(text: string): string[] {
  if (!text.trim()) return []

  const candidates = text.includes("台词原文：")
    ? text.split("台词原文：").slice(1).join("台词原文：").split(/\s*\/\s*|\r?\n/)
    : text.split(/\s*\/\s*|\r?\n/)

  return candidates
    .map(normalizeDialogueCandidate)
    .filter((line) => !line.includes("1:1"))
    .filter((line) => SPEAKER_DIALOGUE_LINE_RE.test(line))
}

// ============================================
// 核心构建函数
// ============================================

/**
 * 根据导演分类映射到 categoryGuide
 */
function mapDirectorCategory(directorCategory: string): string {
  const config = getPromptConfig()

  for (const [guideCategory, directorCategories] of Object.entries(config.categoryMapping)) {
    if (directorCategories.includes(directorCategory)) {
      return guideCategory
    }
  }

  return "narrative" // 默认
}

/**
 * 确定分类人格
 */
export function determineCategoryGuide(
  director: Director | null,
  isSTCEnabled: boolean
): CategoryGuide {
  const config = getPromptConfig()

  // STC 关闭时使用 stcOff
  if (!isSTCEnabled) {
    return config.categoryGuides.stcOff
  }

  // 无导演时使用 narrative
  if (!director) {
    return config.categoryGuides.narrative
  }

  // 动漫导演特殊处理
  if (director.category === "anime") {
    return config.categoryGuides.anime
  }

  // 根据 director.category 映射
  const mappedCategory = mapDirectorCategory(director.category)
  return config.categoryGuides[mappedCategory] || config.categoryGuides.narrative
}

/**
 * 构建导演风格注入块
 */
export function buildDirectorStyleBlock(director: Director | null): string {
  if (!director || director.id === "generic") {
    return ""
  }

  const config = getPromptConfig()

  // 动漫导演使用 donghuaProfile
  if (director.category === "anime" && director.donghuaProfile) {
    return fillTemplate(config.systemPrompts.directorStyleAnime, {
      directorName: director.name,
      charStyle: director.donghuaProfile.charStyle,
      worldStyle: director.donghuaProfile.worldStyle,
      vfxStyle: director.donghuaProfile.vfxStyle,
    })
  }

  // 普通导演
  return fillTemplate(config.systemPrompts.directorStyleStandard, {
    directorName: director.name,
    directorStyle: director.style,
    directorTechniques: (director.techniques || []).join("、"),
    directorLighting: director.lighting || "",
  })
}

/**
 * 构建资产库信息块
 */
export function buildAssetLibraryBlock(assets: AssetState): string {
  const config = getPromptConfig()
  const { character, image, props, assetTagEnabled } = assets
  const hasAnyAsset = character.length > 0 || image.length > 0 || props.length > 0

  if (!hasAnyAsset) {
    return ""
  }

  const sections: string[] = [config.systemPrompts.assetLibraryHeader]

  // 角色资产
  if (character.length > 0 && assetTagEnabled.character) {
    sections.push(config.systemPrompts.assetLibraryCharacterSection)
    sections.push(
      character.map((asset, index) =>
        fillTemplate(config.systemPrompts.assetLibraryCharacterLine, {
          index: index + 1,
          name: asset.name,
          desc: clipAssetDescription(asset.desc),
        })
      ).join("\n")
    )
  }

  // 场景资产
  if (image.length > 0 && assetTagEnabled.image) {
    sections.push(config.systemPrompts.assetLibraryImageSection)
    sections.push(
      image.map((asset, index) =>
        fillTemplate(config.systemPrompts.assetLibraryImageLine, {
          index: index + 1,
          name: asset.name,
          desc: clipAssetDescription(asset.desc),
        })
      ).join("\n")
    )
  }

  // 道具资产
  if (props.length > 0 && assetTagEnabled.props) {
    sections.push(config.systemPrompts.assetLibraryPropSection)
    sections.push(
      props.map((asset, index) =>
        fillTemplate(config.systemPrompts.assetLibraryPropLine, {
          index: index + 1,
          name: asset.name,
          desc: clipAssetDescription(asset.desc),
        })
      ).join("\n")
    )
  }

  return sections.filter(Boolean).join("\n\n")
}

function hasAnyEnabledTagAsset(assets: AssetState): boolean {
  return (
    (assets.assetTagEnabled.character && assets.character.length > 0) ||
    (assets.assetTagEnabled.image && assets.image.length > 0) ||
    (assets.assetTagEnabled.props && assets.props.length > 0)
  )
}

function resolveAssetMapping(assets: AssetState): ResolvedAssetMapping[] {
  return Object.entries(assets.assetNameMap)
    .map(([originalName, tag]) => {
      if (tag.startsWith("@人物")) {
        const index = Number.parseInt(tag.replace("@人物", ""), 10) - 1
        const asset = assets.character[index]
        return {
          originalName,
          tag,
          desc: asset?.desc?.trim() || "",
          type: "character" as const,
        }
      }

      if (tag.startsWith("@图片")) {
        const index = Number.parseInt(tag.replace("@图片", ""), 10) - 1
        const asset = assets.image[index]
        return {
          originalName,
          tag,
          desc: asset?.desc?.trim() || "",
          type: "image" as const,
        }
      }

      if (tag.startsWith("@道具")) {
        const index = Number.parseInt(tag.replace("@道具", ""), 10) - 1
        const asset = assets.props[index]
        return {
          originalName,
          tag,
          desc: asset?.desc?.trim() || "",
          type: "props" as const,
        }
      }

      return {
        originalName,
        tag,
        desc: "",
        type: "unknown" as const,
      }
    })
    .filter((entry) => {
      if (entry.type === "character") return assets.assetTagEnabled.character
      if (entry.type === "image") return assets.assetTagEnabled.image
      if (entry.type === "props") return assets.assetTagEnabled.props
      return true
    })
}

/**
 * 构建资产标签调用规则
 */
export function buildAssetCallRule(assets: AssetState): string {
  const config = getPromptConfig()
  const { character, image, props, assetTagEnabled } = assets
  const hasTags =
    (character.length > 0 && assetTagEnabled.character) ||
    (image.length > 0 && assetTagEnabled.image) ||
    (props.length > 0 && assetTagEnabled.props)

  if (!hasTags) {
    return ""
  }

  const lines: string[] = [config.systemPrompts.assetCallRuleHeader]

  if (character.length > 0 && assetTagEnabled.character) {
    const tags = character.map((_, i) => `@人物${i + 1}`).join("、")
    lines.push(fillTemplate(config.systemPrompts.assetCallRuleCharacter, { tags }))
  }

  if (image.length > 0 && assetTagEnabled.image) {
    const tags = image.map((_, i) => `@图片${i + 1}`).join("、")
    lines.push(fillTemplate(config.systemPrompts.assetCallRuleImage, { tags }))
  }

  if (props.length > 0 && assetTagEnabled.props) {
    const tags = props.map((_, i) => `@道具${i + 1}`).join("、")
    lines.push(fillTemplate(config.systemPrompts.assetCallRuleProp, { tags }))
  }

  lines.push(config.systemPrompts.assetCallRuleFooter)

  return lines.filter(Boolean).join("\n")
}

export function buildNameMappingInstruction(assets: AssetState): string {
  const config = getPromptConfig()
  const mappings = resolveAssetMapping(assets)

  if (mappings.length === 0 || !hasAnyEnabledTagAsset(assets)) {
    return ""
  }

  const [header, lineTemplate, footer] = config.nameMappingFormat.split("\n").filter(Boolean)
  const lines = mappings.map((entry) =>
    fillTemplate(lineTemplate || config.systemPrompts.faithfulHeaderMappingLine, {
      原名: entry.originalName,
      标签: entry.tag,
      描述: entry.desc || "无补充描述",
      originalName: entry.originalName,
      tag: entry.tag,
      descSuffix: entry.desc ? ` ｜${entry.desc}` : "",
    })
  )

  return [header, ...lines, footer].filter(Boolean).join("\n")
}

export function buildPropConsistencyBlock(assets: AssetState): string {
  const config = getPromptConfig()

  if (!assets.assetTagEnabled.props || assets.props.length === 0 || !config.propConsistencyRule) {
    return ""
  }

  const propLines = assets.props
    .map((asset, index) => {
      if (!asset.desc.trim()) return ""
      return `· @道具${index + 1}（${asset.desc.trim()}）`
    })
    .filter(Boolean)
    .join("\n")

  if (!propLines) {
    return ""
  }

  return config.propConsistencyRule
    .replace("· {标签}（{描述}）", propLines)
}

/**
 * 构建保真模式约束块
 */
export function isFaithfulActive(
  isFaithfulMode: boolean,
  isScriptImported: boolean
): boolean {
  return isFaithfulMode || isScriptImported
}

export function buildFaithfulHeader(
  isFaithfulMode: boolean,
  isScriptImported: boolean,
  assets: AssetState
): string {
  if (!isFaithfulActive(isFaithfulMode, isScriptImported)) {
    return ""
  }

  const config = getPromptConfig()
  const mappingLines = resolveAssetMapping(assets).map((entry) =>
    fillTemplate(config.systemPrompts.faithfulHeaderMappingLine, {
      originalName: entry.originalName,
      tag: entry.tag,
      descSuffix: entry.desc ? ` ｜${entry.desc}` : "",
    })
  )

  const mappingBlock = mappingLines.length > 0
    ? `\n${fillTemplate(config.systemPrompts.faithfulHeaderMappingBlock, {
        mappingLines: mappingLines.join("\n"),
      })}\n`
    : "\n"

  return `${config.faithfulHeader.trimEnd()}${mappingBlock}`
}

export function buildEffectivePlotForGenerate(
  plot: string,
  isFaithfulMode: boolean,
  isScriptImported: boolean,
  assets: AssetState
): string {
  const faithfulHeader = buildFaithfulHeader(isFaithfulMode, isScriptImported, assets)
  return faithfulHeader ? `${faithfulHeader}${plot}` : plot
}

export function buildFaithfulSuffix(
  isFaithfulMode: boolean,
  isScriptImported: boolean,
  assets: AssetState
): string {
  if (!isFaithfulActive(isFaithfulMode, isScriptImported)) {
    return ""
  }

  const config = getPromptConfig()
  const hasTags = hasAnyEnabledTagAsset(assets)

  return hasTags
    ? `${config.faithfulSuffix.trimEnd()}\n${config.systemPrompts.faithfulSuffixTagPriority}`
    : `${config.faithfulSuffix.trimEnd()}\n${config.systemPrompts.faithfulSuffixTextOnly}`
}

/**
 * 计算镜头数量范围
 */
export function calcShotCountRange(duration: number): { min: number; max: number } {
  const min = Math.max(1, Math.floor(duration / 15))
  const max = Math.max(min, Math.ceil(duration / 5))
  return { min, max: Math.min(max, min * 3) }
}

/**
 * 确定叙事模式
 */
export function determineNarrativeMode(duration: number): "burst" | "mini" | "full" {
  const config = getPromptConfig()
  const burstMax = config.routing.burst.maxDuration || 25
  const miniMax = config.routing.mini.maxDuration || 85

  if (duration < burstMax) return "burst"
  if (duration < miniMax) return "mini"
  return "full"
}

/**
 * 构建五维叙事铁律（从 YAML 读取）
 */
export function buildFiveDimensionRules(): string {
  const config = getPromptConfig()

  const rules = config.fiveDimensionRules.map((rule, index) => {
    const emoji = ["❶", "❷", "❸", "❹", "❺"][index] || `${index + 1}.`
    return fillTemplate(config.systemPrompts.fiveDimensionRuleLine, {
      emoji,
      ruleName: rule.name,
      ruleText: rule.rule,
    })
  }).join("\n   ")

  return fillTemplate(config.systemPrompts.fiveDimensionRuleBlock, {
    ruleLines: rules,
  })
}

/**
 * 获取视觉风格描述（从 YAML 读取）
 */
export function getVisualStyleDescription(styleId: string): string {
  const config = getPromptConfig()
  const style = config.visualStyles[styleId]
  return style?.description || config.visualStyles[config.defaultVisualStyle]?.description || "电影感"
}

/**
 * 构建 SEEDANCE 提示词格式（从 YAML 读取）
 */
export function buildSeedanceFormat(enableBGM: boolean, enableSubtitle: boolean): string {
  const config = getPromptConfig()
  let template = config.seedanceFormat.template

  // 根据配置调整
  if (!enableBGM || !enableSubtitle) {
    const restrictions = []
    if (!enableBGM) restrictions.push("禁BGM")
    if (!enableSubtitle) restrictions.push("禁字幕")
    template += ` ${fillTemplate(config.systemPrompts.seedanceDisabledInstructions, {
      restrictions: restrictions.join(" "),
    })}`
  }

  return template
}

/**
 * 构建时长与叙事规模块（从 YAML 读取）
 */
function buildNarrativeScaleBlock(
  narrativeMode: "burst" | "mini" | "full",
  isAtmosphere: boolean,
  isSTCEnabled: boolean
): string {
  const config = getPromptConfig()

  if (!isSTCEnabled) {
    return config.systemPrompts.narrativeScaleDirectVisualization
  }

  if (narrativeMode === "burst") {
    const burstConfig = config.routing.burst
    return fillTemplate(config.systemPrompts.narrativeScaleBurst, {
      burstMaxDuration: burstConfig.maxDuration || 25,
      burstRules: burstConfig.rules.map((rule) => `- ${rule}`).join("\n"),
    })
  }

  if (isAtmosphere) {
    return config.systemPrompts.narrativeScaleAtmosphere
  }

  return config.systemPrompts.narrativeScaleMini
}

/**
 * 构建完整系统提示词（主入口）
 */
export function buildFullSystemPrompt(options: PromptBuilderOptions): string {
  const {
    director,
    visualStyle,
    duration,
    isSTCEnabled,
    isFaithfulMode,
    isScriptImported,
    assets,
    shotMode = "auto",
    customShotCount,
    enableBGM = false,
    enableSubtitle = true,
  } = options

  const config = getPromptConfig()

  // 获取视觉风格描述
  const visualStyleDesc = getVisualStyleDescription(visualStyle)

  // 1. 确定分类人格
  const categoryGuide = determineCategoryGuide(director, isSTCEnabled)

  // 2. 构建各部分
  const directorStyle = buildDirectorStyleBlock(director)
  const assetLibrary = buildAssetLibraryBlock(assets)
  const assetCallRule = buildAssetCallRule(assets)
  const nameMappingInstruction = buildNameMappingInstruction(assets)
  const propConsistencyRule = buildPropConsistencyBlock(assets)
  const faithfulBlock = buildFaithfulSuffix(isFaithfulMode, isScriptImported, assets)
  const fiveDimensionRules = buildFiveDimensionRules()
  const assetTagInstruction = hasAnyEnabledTagAsset(assets)
    ? getPromptConfig().assetTagInstruction
    : ""

  // 3. 计算镜头数量
  let shotCountText: string
  let shotCountLock = ""

  if (shotMode === "custom" && customShotCount) {
    shotCountText = `恰好 ${customShotCount} 镜`
    shotCountLock = `\n${fillTemplate(config.systemPrompts.fullShotCountLock, {
      customShotCount,
    })}`
  } else {
    const { min, max } = calcShotCountRange(duration)
    shotCountText = min === max ? `${min} 镜` : `${min}–${max} 镜`
  }

  // 4. 构建叙事模式
  const narrativeMode = determineNarrativeMode(duration)
  const isAtmosphere = categoryGuide === config.categoryGuides.atmosphere
  const narrativeScaleBlock = buildNarrativeScaleBlock(narrativeMode, isAtmosphere, isSTCEnabled)

  // 5. 选择表格格式
  const tableHeader = isSTCEnabled ? config.tableFormat.withSTC : config.tableFormat.withoutSTC

  return fillTemplate(config.systemPrompts.fullSystemPrompt, {
    directorStyle,
    assetLibrary,
    assetTagInstruction,
    assetCallRule,
    nameMappingInstruction,
    propConsistencyRule,
    duration,
    shotCountText,
    shotCountLock,
    narrativeScaleBlock,
    tableHeader,
    seedanceFormat: buildSeedanceFormat(enableBGM, enableSubtitle),
    visualStyleDesc,
    fiveDimensionRules,
    faithfulBlock,
  })
}

/**
 * 构建极速瞬间模式提示词（<25s）
 */
export function buildBurstModePrompt(options: PromptBuilderOptions): string {
  const { director, visualStyle, duration, assets, enableBGM, enableSubtitle, isFaithfulMode, isScriptImported } = options
  const config = getPromptConfig()

  const visualStyleDesc = getVisualStyleDescription(visualStyle)
  const directorStyle = buildDirectorStyleBlock(director)
  const assetLibrary = buildAssetLibraryBlock(assets)
  const assetCallRule = buildAssetCallRule(assets)
  const nameMappingInstruction = buildNameMappingInstruction(assets)
  const propConsistencyRule = buildPropConsistencyBlock(assets)
  const faithfulSuffix = buildFaithfulSuffix(isFaithfulMode, isScriptImported, assets)
  const fiveDimensionRules = buildFiveDimensionRules()
  const burstConfig = config.routing.burst
  const assetTagInstruction = hasAnyEnabledTagAsset(assets)
    ? config.assetTagInstruction
    : ""

  return fillTemplate(config.systemPrompts.burstSystemPrompt, {
    duration,
    burstMaxDuration: burstConfig.maxDuration || 25,
    directorStyle,
    assetLibrary,
    assetTagInstruction,
    assetCallRule,
    nameMappingInstruction,
    propConsistencyRule,
    tableHeader: config.tableFormat.withoutSTC,
    seedanceFormat: buildSeedanceFormat(enableBGM, enableSubtitle),
    visualStyleDesc,
    fiveDimensionRules,
    faithfulBlock: faithfulSuffix,
  })
}

/**
 * 构建视觉桥梁提取提示词
 */
export function buildBridgeExtractionPrompt(sceneContent: string): string {
  const config = getPromptConfig()
  return fillTemplate(config.systemPrompts.bridgeExtractionPrompt, {
    sceneContent,
  })
}

/**
 * 构建 Stage A 剧本切分提示词
 */
export function buildStageAPrompt(
  plot: string,
  duration: number,
  director: Director | null,
  isSTCEnabled: boolean
): string {
  const config = getPromptConfig()
  const categoryGuide = determineCategoryGuide(director, isSTCEnabled)
  const directorStyle = buildDirectorStyleBlock(director)

  return fillTemplate(config.systemPrompts.stageAPrompt, {
    persona: categoryGuide.persona,
    directorStyle,
    duration,
    writingLogic: categoryGuide.writingLogic,
    plot,
  })
}

/**
 * 构建 Stage B 单场生成提示词
 */
export function buildStageBPrompt(
  scene: Scene,
  sceneIndex: number,
  totalScenes: number,
  globalOffset: number,
  previousBridgeState: BridgeState | null,
  options: PromptBuilderOptions
): { systemPrompt: string; userPrompt: string } {
  const {
    director,
    visualStyle,
    isSTCEnabled,
    isFaithfulMode,
    isScriptImported,
    assets,
    shotMode = "auto",
    customShotCount,
    enableBGM = false,
    enableSubtitle = true,
  } = options

  const config = getPromptConfig()
  const categoryGuide = determineCategoryGuide(director, isSTCEnabled)
  const isAtmosphere = categoryGuide === config.categoryGuides.atmosphere
  const tableHeader = isSTCEnabled ? config.tableFormat.withSTC : config.tableFormat.withoutSTC
  const directorStyle = buildDirectorStyleBlock(director)
  const assetLibrary = buildAssetLibraryBlock(assets)
  const assetCallRule = buildAssetCallRule(assets)
  const nameMappingInstruction = buildNameMappingInstruction(assets)
  const propConsistencyRule = buildPropConsistencyBlock(assets)
  const faithfulSuffix = buildFaithfulSuffix(isFaithfulMode, isScriptImported, assets)
  const visualStyleDesc = getVisualStyleDescription(visualStyle)
  const assetTagInstruction = hasAnyEnabledTagAsset(assets)
    ? config.assetTagInstruction
    : ""

  let shotCountInstruction: string
  if (shotMode === "custom" && customShotCount) {
    if (totalScenes > 1) {
      const suggested = Math.max(1, Math.round(customShotCount / totalScenes))
      shotCountInstruction = fillTemplate(config.systemPrompts.stageBShotCountPerScene, {
        customShotCount,
        totalScenes,
        suggestedShotCount: suggested,
      })
    } else {
      shotCountInstruction = fillTemplate(config.systemPrompts.stageBShotCountAbsolute, {
        customShotCount,
      })
    }
  } else {
    const min = Math.max(1, Math.ceil(scene.duration / 7))
    const max = Math.max(min, Math.ceil(scene.duration / 4))
    shotCountInstruction = fillTemplate(config.systemPrompts.stageBShotCountRange, {
      minShots: min,
      maxShots: max,
    })
  }

  const endSec = globalOffset + scene.duration
  const bridgePrompt = previousBridgeState
    ? fillTemplate(config.systemPrompts.stageBBridgePrompt, {
        bridgeStateJson: JSON.stringify(previousBridgeState, null, 2),
      })
    : ""

  const narrativePrompt = !isSTCEnabled
    ? config.systemPrompts.stageBDirectVisualization
    : isAtmosphere
      ? config.systemPrompts.stageBAtmosphereNarrative
      : config.systemPrompts.stageBMiniNarrative

  const tensionFormatHint = isSTCEnabled
    ? isAtmosphere
      ? config.systemPrompts.stageBTensionFormatAtmosphere
      : config.systemPrompts.stageBTensionFormatStandard
    : ""

  const beatTaskInstruction = scene.beatTask
    ? fillTemplate(config.systemPrompts.stageBBeatTaskExplicit, {
        beatTask: scene.beatTask,
      })
    : scene.contentSummary
      ? config.systemPrompts.stageBBeatTaskSummary
      : config.systemPrompts.stageBBeatTaskGeneric

  const assetConsistencyRule = hasAnyEnabledTagAsset(assets)
    ? config.systemPrompts.stageBAssetConsistencyTagged
    : config.systemPrompts.stageBAssetConsistencyPlain

  const systemPrompt = fillTemplate(config.systemPrompts.stageBSystemPrompt, {
    sceneNumber: sceneIndex + 1,
    totalScenes,
    sceneName: scene.name,
    directorStyle,
    assetLibrary,
    assetTagInstruction,
    assetCallRule,
    nameMappingInstruction,
    propConsistencyRule,
    bridgePrompt,
    startSec: globalOffset,
    endSec,
    sceneDuration: scene.duration,
    shotCountInstruction,
    narrativePrompt,
    tableHeader,
    tensionFormatHint,
    seedanceFormat: buildSeedanceFormat(enableBGM, enableSubtitle),
    visualStyleDesc,
    fiveDimensionRules: buildFiveDimensionRules(),
    beatTask: beatTaskInstruction,
    assetConsistencyRule,
    faithfulBlock: faithfulSuffix,
  })

  const dialogueLines = extractDialogueLines(scene.contentSummary || "")
  const dialogueLockBlock = dialogueLines.length > 0
    ? fillTemplate(config.systemPrompts.stageBDialogueLockBlock, {
        dialogueLines: dialogueLines
          .map((line) =>
            fillTemplate(config.systemPrompts.stageBDialogueLockLine, {
              dialogueLine: line,
            })
          )
          .join("\n"),
      })
    : config.systemPrompts.stageBDialogueLockEmpty

  const userPrompt = fillTemplate(config.systemPrompts.stageBUserPrompt, {
    sceneContent: scene.contentSummary || "",
    dialogueLockBlock,
  })

  return { systemPrompt, userPrompt }
}

/**
 * 构建单镜修改提示词
 */
export function buildShotEditPrompt(
  shotIndex: string | number,
  requirement: string,
  currentContent: string,
  assets: AssetState,
  contextLabel = "完整"
): { systemPrompt: string; userPrompt: string } {
  const config = getPromptConfig()

  const assetLibrary = buildAssetLibraryBlock(assets)
  const assetCallRule = buildAssetCallRule(assets)
  const nameMappingInstruction = buildNameMappingInstruction(assets)

  const systemParts = [
    config.shotEdit.systemRole,
    assetLibrary,
    assetCallRule,
    nameMappingInstruction,
    config.shotEdit.modeConstraint,
  ].filter(Boolean)

  const systemPrompt = systemParts.join("\n\n")

  // 构建用户提示词
  const userPrompt = config.shotEdit.userTaskTemplate
    .replace(/{contextLabel}/g, contextLabel)
    .replace(/{shotIndex}/g, String(shotIndex))
    .replace(/{requirement}/g, requirement)
    .replace(/{currentContent}/g, currentContent)

  return { systemPrompt, userPrompt }
}
