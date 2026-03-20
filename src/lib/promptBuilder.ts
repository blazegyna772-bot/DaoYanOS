/**
 * 提示词构建引擎
 * 架构：只做组装逻辑，所有内容从 YAML 配置读取
 * 运行时零 I/O 开销（启动时加载到内存）
 */

import type { Director, AssetState, BridgeState, PlatformConfig } from "@/types"
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
    return `【导演风格：${director.name}（资深动画监督）】
▶ 人物造型：${director.donghuaProfile.charStyle}
▶ 世界观美学：${director.donghuaProfile.worldStyle}
▶ 特效表现：${director.donghuaProfile.vfxStyle}`
  }

  // 普通导演
  return `【导演风格：${director.name}】
▶ 风格特征：${director.style}
▶ 运镜手法：${(director.techniques || []).join("、")}
▶ 光影风格：${director.lighting || ""}`
}

/**
 * 构建资产库信息块
 */
export function buildAssetLibraryBlock(assets: AssetState): string {
  const { character, image, props, assetTagEnabled } = assets
  const hasAnyAsset = character.length > 0 || image.length > 0 || props.length > 0

  if (!hasAnyAsset) {
    return ""
  }

  let block = "【已注册资产清单（@标签模式）】：\n"

  // 角色资产
  if (character.length > 0 && assetTagEnabled.character) {
    block += "\n【角色资产】：\n"
    character.forEach((asset, index) => {
      block += `  · @人物${index + 1}（${asset.name}）：${asset.desc.slice(0, 50)}${asset.desc.length > 50 ? "…" : ""}\n`
    })
  }

  // 场景资产
  if (image.length > 0 && assetTagEnabled.image) {
    block += "\n【场景资产】：\n"
    image.forEach((asset, index) => {
      block += `  · @图片${index + 1}（${asset.name}）：${asset.desc.slice(0, 50)}${asset.desc.length > 50 ? "…" : ""}\n`
    })
  }

  // 道具资产
  if (props.length > 0 && assetTagEnabled.props) {
    block += "\n【道具资产】：\n"
    props.forEach((asset, index) => {
      block += `  · @道具${index + 1}（${asset.name}）：${asset.desc.slice(0, 50)}${asset.desc.length > 50 ? "…" : ""}\n`
    })
  }

  return block
}

/**
 * 构建资产标签调用规则
 */
export function buildAssetCallRule(assets: AssetState): string {
  const { character, image, props, assetTagEnabled } = assets
  const hasTags =
    (character.length > 0 && assetTagEnabled.character) ||
    (image.length > 0 && assetTagEnabled.image) ||
    (props.length > 0 && assetTagEnabled.props)

  if (!hasTags) {
    return ""
  }

  let rule = "【资产标签调用准则】：\n"

  if (character.length > 0 && assetTagEnabled.character) {
    const tags = character.map((_, i) => `@人物${i + 1}`).join("、")
    rule += `  · 每个出现已注册角色的镜头 → [主体] 字段必须使用 ${tags} 等标签\n`
  }

  if (image.length > 0 && assetTagEnabled.image) {
    const tags = image.map((_, i) => `@图片${i + 1}`).join("、")
    rule += `  · 场景与已注册环境匹配时 → [主体] 字段追加 ${tags} 等标签\n`
  }

  if (props.length > 0 && assetTagEnabled.props) {
    const tags = props.map((_, i) => `@道具${i + 1}`).join("、")
    rule += `  · 涉及已注册道具时 → 【角色分动】字段必须使用 ${tags} 等标签\n`
  }

  rule += "  · @标签后可追加该镜特有的动态细节（动作、表情、光影），但不得覆盖或矛盾于资产定义的基础外貌。"

  return rule
}

/**
 * 构建保真模式约束块
 */
export function buildFaithfulBlock(
  isFaithfulMode: boolean,
  isScriptImported: boolean,
  assets: AssetState
): string {
  const faithfulActive = isFaithfulMode || isScriptImported

  if (!faithfulActive) {
    return ""
  }

  const hasTags =
    assets.character.some((_, i) => assets.assetTagEnabled.character) ||
    assets.image.some((_, i) => assets.assetTagEnabled.image) ||
    assets.props.some((_, i) => assets.assetTagEnabled.props)

  let block = `
🔒【保真直通模式（最高优先级指令）】：
- 当前剧本为导演终稿，严禁增删任何情节、人物或台词
- 你的唯一任务是将原始剧本内容 1:1 视觉化
- 禁止调用任何扩写/润色/戏剧节拍重构逻辑`

  if (hasTags) {
    block += "\n- 已开启@标签模式的素材类别，标签必须优先于任何外貌描写"
  } else {
    block += "\n- 所有资产均使用文字描述模式，禁止在提示词中出现任何@人物/@图片/@道具标签"
  }

  return block
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
    return `${emoji} ${rule.name}：${rule.rule}`
  }).join("\n   ")

  return `【五维铁律（每镜必须遵守）】：\n   ${rules}`
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
    template += ` 拍摄指令：[${restrictions.join(" ")}]`
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
    return `【直接视觉化模式（叙事结构构建已关闭）】：
- 你的唯一任务是将剧本内容转化为画面，不添加、不改变、不重构任何情节
- 按剧本的自然顺序逐段视觉化，镜头时长由画面内容决定
- 不需要"冲突障碍"、"情绪转折"、"节拍任务"等叙事逻辑`
  }

  if (narrativeMode === "burst") {
    const burstConfig = config.routing.burst
    return `⚡ 极速瞬间模式（≤${burstConfig.maxDuration}s）：捕捉一个极具张力的瞬间
${burstConfig.rules.map(r => `- ${r}`).join("\n")}`
  }

  if (isAtmosphere) {
    return `【叙事规模（情绪意境模式）】：
- 这是一个氛围/意境短片，禁止强行套入冲突结构。
- 节奏：起（建立情绪锚点）→ 承（深化意象）→ 转（情绪偏移）→ 合（收束留余韵）。

【情绪意象规则（禁止强行寻找冲突障碍）】：
▶ 聚焦视觉意象的延展：每一镜延伸或变奏上一镜的核心意象（光线、材质、空间、色彩温度）
▶ "戏剧张力"列只需标注情绪细微偏移，禁止填写冲突障碍格式`
  }

  // mini/full 模式的 STC 规则
  return `【叙事规模（迷你弧线模式）】：
- 这是一个迷你故事，重点在于情境设置和一个小反转。
- 结构：开场铺垫→变故发生→冒险展开→峰回路转→终章闭环。

【场景动力学规则（每一镜必须遵守）】：
▶ +/- 情绪转折：每一镜结束时情绪张力必须发生方向性转变。
▶ >< 冲突标注：每一镜必须暗示或明示阻碍主角的障碍。
▶ 泳池里的教皇：交代背景信息时必须加入娱乐性视觉背景细节。`
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
  const faithfulBlock = buildFaithfulBlock(isFaithfulMode, isScriptImported, assets)
  const fiveDimensionRules = buildFiveDimensionRules()

  // 3. 计算镜头数量
  let shotCountText: string
  let shotCountLock = ""

  if (shotMode === "custom" && customShotCount) {
    shotCountText = `恰好 ${customShotCount} 镜`
    shotCountLock = `\n【绝对指令 — 镜数锁定】：你必须且只能生成恰好 ${customShotCount} 个分镜，不得多于或少于 ${customShotCount} 镜。`
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

  // 6. 组装完整提示词
  const systemPrompt = `你是DaoYanOS首席导演与分镜师。
${directorStyle}

${assetLibrary}

${assetCallRule}

【时长与节奏掌控】：
- 总时长严格限制为：${duration} 秒，累计时间轴必须刚好等于 ${duration}s。
- 分镜数量：${shotCountText}，根据剧本节奏自行决定。${shotCountLock}
- 每镜时长：动作/紧张镜头 2–5s，叙事/对话镜头 5–10s。禁止所有镜头时长相同。

${narrativeScaleBlock}

【分镜生成规则（五维视听叙事）】：
1. 输出标准Markdown表格：${tableHeader}
2. 所有内容使用中文。
3. 「SEEDANCE提示词」列规范（每个镜头写成一行，不换行，按此顺序）：
   ${buildSeedanceFormat(enableBGM, enableSubtitle)}
4. 「画面描述」列：用自然语言写人类可读的画面描述，严禁出现任何 @标签。
5. 「光影氛围」列：简短描述本镜整体光影色调。
6. 视觉基调：深度体现"${visualStyleDesc}"的视觉风格特征。
7. 严禁在 SEEDANCE提示词列 输出 --ar、--motion、--quality 等技术参数。
8. 严禁出现任何明星、名人姓名或版权角色名。
9. ⚠️${fiveDimensionRules}

${faithfulBlock}

【一致性要求】：确保人物服装、环境、光影在分镜间完全统一，动作逻辑无缝衔接。`

  return systemPrompt
}

/**
 * 构建极速瞬间模式提示词（<25s）
 */
export function buildBurstModePrompt(options: PromptBuilderOptions): string {
  const { director, visualStyle, duration, assets, enableBGM, enableSubtitle } = options
  const config = getPromptConfig()

  const visualStyleDesc = getVisualStyleDescription(visualStyle)
  const directorStyle = buildDirectorStyleBlock(director)
  const assetLibrary = buildAssetLibraryBlock(assets)
  const assetCallRule = buildAssetCallRule(assets)
  const fiveDimensionRules = buildFiveDimensionRules()
  const burstConfig = config.routing.burst

  return `你是DaoYanOS首席导演与分镜师，专注极短视频（${duration}秒）的视觉瞬间设计。
⚡ 极速瞬间模式（≤${burstConfig.maxDuration || 25}s）：捕捉一个极具张力的瞬间，1–3 镜，每镜都是强视觉冲击画面。
${directorStyle}

${assetLibrary}

${assetCallRule}

【极速瞬间模式铁律（${duration}秒以下）】：
⚡ 目标：捕捉一个极具张力的瞬间，像一张会动的顶级摄影作品。
⚡ 只需要：一个主体、一个动作、一种强烈的情绪光影——仅此三要素。
⚡ 完全关闭叙事模式：无起承转合、无人物弧线、无STC逻辑，直接输出视觉奇观。
⚡ 生成 1–3 镜，每镜都是独立的强视觉冲击画面，总时长精确等于 ${duration}s。

【分镜生成规则】：
1. 输出Markdown表格：${config.tableFormat.withoutSTC}
2. 「SEEDANCE提示词」格式：${buildSeedanceFormat(enableBGM, enableSubtitle)}
3. 视觉基调：深度体现"${visualStyleDesc}"的视觉风格特征。
4. ⚠️${fiveDimensionRules}`
}

/**
 * 构建视觉桥梁提取提示词
 */
export function buildBridgeExtractionPrompt(sceneContent: string): string {
  return `请从以下分镜内容中提取【最后一镜的视觉终点状态】。
只输出纯JSON：{"charPosition":"...","lightPhase":"...","environment":"...","keyProp":"..."}

分镜内容：
${sceneContent}`
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
  const categoryGuide = determineCategoryGuide(director, isSTCEnabled)
  const directorStyle = buildDirectorStyleBlock(director)

  return `你是一位才华横溢的${categoryGuide.persona}。
${directorStyle}

【当前视频时长：${duration}秒】
【你的核心任务】：将剧本切分为多个场次，每场有明确的节拍和时长分配。

${categoryGuide.writingLogic}

【输出格式】：只输出纯 JSON，禁止任何前缀、后缀、markdown代码块。
结构：
{
  "scenes": [
    {
      "id": "scene_001",
      "name": "场次名称",
      "beatType": "opening|setup|catalyst|...",
      "duration": 估计时长（秒）,
      "contentSummary": "本场剧情摘要"
    }
  ],
  "totalScenes": 场次数,
  "narrativeMode": "burst|mini|full"
}

剧本内容：
${plot}`
}

/**
 * 构建 Stage B 单场生成提示词
 */
export function buildStageBPrompt(
  sceneId: string,
  sceneContent: string,
  options: PromptBuilderOptions
): string {
  const basePrompt = buildFullSystemPrompt(options)

  return `${basePrompt}

【当前场次】：${sceneId}
【本场剧本内容】：
${sceneContent}

请为当前场次生成完整分镜表格。`
}

/**
 * 构建单镜修改提示词
 */
export function buildShotEditPrompt(
  shotIndex: number,
  requirement: string,
  currentContent: string,
  assets: AssetState
): { systemPrompt: string; userPrompt: string } {
  const config = getPromptConfig()

  // 构建资产相关提示词
  const assetLibrary = buildAssetLibraryBlock(assets)
  const assetCallRule = buildAssetCallRule(assets)

  // 构建系统提示词
  const systemParts = [
    config.shotEdit.systemRole,
    assetLibrary,
    assetCallRule,
    config.shotEdit.modeConstraint,
  ].filter(Boolean)

  const systemPrompt = systemParts.join("\n\n")

  // 构建用户提示词
  const userPrompt = config.shotEdit.userTaskTemplate
    .replace(/{shotIndex}/g, String(shotIndex))
    .replace(/{requirement}/g, requirement)
    .replace(/{currentContent}/g, currentContent)

  return { systemPrompt, userPrompt }
}