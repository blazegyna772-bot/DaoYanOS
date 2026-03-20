/**
 * 提示词 YAML 加载器
 * 在启动时加载所有 YAML 文件到内存，运行时零 I/O 开销
 * 支持热重载（开发环境）
 */

import fs from "fs"
import path from "path"
import yaml from "js-yaml"

// ============================================
// 类型定义
// ============================================

export interface CategoryGuide {
  persona: string
  writingLogic: string
  motiveField: boolean
  themeField: boolean
  sceneField: string
}

export interface ShotRule {
  id: string
  name: string
  rule: string
}

export interface VisualStyle {
  name: string
  description: string
}

export interface ShotEditConfig {
  systemRole: string
  modeConstraint: string
  fieldFormatRule: string
  userTaskTemplate: string
}

export interface DonghuaProfile {
  charStyle: string
  worldStyle: string
  vfxStyle: string
  promptSuffix: string
}

export interface Director {
  id: string
  name: string
  nameEn: string
  style: string
  techniques: string[]
  lighting: string
  films: string[]
  color: string
  category: "narrative" | "atmosphere" | "suspense" | "anime" | "stcOff"
  donghuaProfile?: DonghuaProfile
}

export interface DurationRouting {
  maxDuration?: number
  minDuration?: number
  description: string
  shotCount: string
  rules: string[]
  wordLimit: string
}

export interface PromptConfig {
  directors: Record<string, Director>
  directorList: Director[]
  categoryLabels: Record<string, string>
  categoryGuides: Record<string, CategoryGuide>
  categoryMapping: Record<string, string[]>
  donghuaProfile: {
    charStyle: string
    worldStyle: string
    vfxStyle: string
    promptSuffix: string
  }
  visualStyles: Record<string, VisualStyle>
  defaultVisualStyle: string
  shotEdit: ShotEditConfig
  fiveDimensionRules: ShotRule[]
  tableFormat: {
    withSTC: string
    withoutSTC: string
  }
  seedanceFormat: {
    template: string
    rules: string[]
  }
  tensionFormat: {
    template: string
    example: Record<string, string>
  }
  routing: {
    burst: DurationRouting
    mini: DurationRouting
    full: DurationRouting
  }
  expansionSpecs: Array<{
    maxDuration?: number
    minDuration?: number
    wordCount: string
    description: string
    constraint: string
  }>
  faithfulHeader: string
  faithfulSuffix: string
  faithfulSystemPrompt: string
  assetTagInstruction: string
}

// ============================================
// 全局配置缓存（启动时加载，运行时零 I/O）
// ============================================

let configCache: PromptConfig | null = null
let lastLoadTime = 0
const CACHE_TTL = 60000 // 1 分钟缓存（生产环境可设为 Infinity）

// ============================================
// YAML 文件加载
// ============================================

function loadYamlFile(filename: string): Record<string, unknown> {
  const filePath = path.join(process.cwd(), "prompts", filename)
  try {
    const content = fs.readFileSync(filePath, "utf-8")
    return yaml.load(content) as Record<string, unknown>
  } catch (error) {
    console.error(`[PromptLoader] Failed to load ${filename}:`, error)
    return {}
  }
}

/**
 * 加载所有提示词配置（启动时调用一次）
 */
export function loadPromptConfig(): PromptConfig {
  // 检查缓存
  if (configCache && Date.now() - lastLoadTime < CACHE_TTL) {
    return configCache
  }

  console.log("[PromptLoader] Loading prompt configuration from YAML files...")

  // 加载各个 YAML 文件
  const directorsYaml = loadYamlFile("directors.yaml")
  const categoryGuidesYaml = loadYamlFile("categoryGuides.yaml")
  const shotRulesYaml = loadYamlFile("shotRules.yaml")
  const durationRulesYaml = loadYamlFile("durationRules.yaml")
  const faithfulModeYaml = loadYamlFile("faithfulMode.yaml")
  const visualStylesYaml = loadYamlFile("visualStyles.yaml")
  const shotEditYaml = loadYamlFile("shotEdit.yaml")

  // 构建导演数据
  const directors: Record<string, Director> = {}
  const directorList: Director[] = []
  const directorsData = directorsYaml.directors as Record<string, Record<string, unknown>>
  if (directorsData) {
    for (const [id, value] of Object.entries(directorsData)) {
      const director: Director = {
        id,
        name: value.name as string || id,
        nameEn: value.nameEn as string || "",
        style: value.style as string || "",
        techniques: value.techniques as string[] || [],
        lighting: value.lighting as string || "",
        films: value.films as string[] || [],
        color: value.color as string || "",
        category: value.category as Director["category"] || "narrative",
        donghuaProfile: value.donghuaProfile as DonghuaProfile | undefined,
      }
      directors[id] = director
      directorList.push(director)
    }
  }

  // 构建分类标签
  const categoryLabels = directorsYaml.categoryLabels as Record<string, string> || {
    narrative: "叙事型",
    atmosphere: "意境型",
    suspense: "悬疑型",
    anime: "动漫型",
    stcOff: "自由型",
  }

  // 构建 categoryGuides
  const categoryGuides: Record<string, CategoryGuide> = {}
  const categoryGuidesData = categoryGuidesYaml.categoryGuides as Record<string, unknown>
  if (categoryGuidesData) {
    for (const [key, value] of Object.entries(categoryGuidesData)) {
      const guide = value as Record<string, unknown>
      categoryGuides[key] = {
        persona: guide.persona as string || "",
        writingLogic: guide.writingLogic as string || "",
        motiveField: guide.motiveField as boolean || false,
        themeField: guide.themeField as boolean || false,
        sceneField: guide.sceneField as string || "",
      }
    }
  }

  // 构建 categoryMapping
  const categoryMapping: Record<string, string[]> = {}
  const categoryMappingData = categoryGuidesYaml.categoryMapping as Record<string, string[]>
  if (categoryMappingData) {
    for (const [key, value] of Object.entries(categoryMappingData)) {
      categoryMapping[key] = value
    }
  }

  // 构建 donghuaProfile
  const donghuaProfileData = categoryGuidesYaml.donghuaProfile as Record<string, string>
  const donghuaProfile = {
    charStyle: donghuaProfileData?.charStyle || "",
    worldStyle: donghuaProfileData?.worldStyle || "",
    vfxStyle: donghuaProfileData?.vfxStyle || "",
    promptSuffix: donghuaProfileData?.promptSuffix || "",
  }

  // 构建 visualStyles
  const visualStyles: Record<string, VisualStyle> = {}
  const visualStylesData = visualStylesYaml.visualStyles as Record<string, Record<string, unknown>>
  if (visualStylesData) {
    for (const [key, value] of Object.entries(visualStylesData)) {
      visualStyles[key] = {
        name: value.name as string || key,
        description: value.description as string || "",
      }
    }
  }
  const defaultVisualStyle = visualStylesYaml.defaultStyle as string || "cinematic"

  // 构建 fiveDimensionRules
  const fiveDimensionRules: ShotRule[] = []
  const fiveDimensionRulesData = shotRulesYaml.fiveDimensionRules as Array<Record<string, unknown>>
  if (fiveDimensionRulesData) {
    for (const rule of fiveDimensionRulesData) {
      fiveDimensionRules.push({
        id: rule.id as string || "",
        name: rule.name as string || "",
        rule: rule.rule as string || "",
      })
    }
  }

  // 构建 tableFormat
  const tableFormatData = shotRulesYaml.tableFormat as Record<string, string>
  const tableFormat = {
    withSTC: tableFormatData?.withSTC || "",
    withoutSTC: tableFormatData?.withoutSTC || "",
  }

  // 构建 seedanceFormat
  const seedanceFormatData = shotRulesYaml.seedanceFormat as Record<string, unknown>
  const seedanceFormat = {
    template: seedanceFormatData?.template as string || "",
    rules: seedanceFormatData?.rules as string[] || [],
  }

  // 构建 tensionFormat
  const tensionFormatData = shotRulesYaml.tensionFormat as Record<string, unknown>
  const tensionFormat = {
    template: tensionFormatData?.template as string || "",
    example: tensionFormatData?.example as Record<string, string> || {},
  }

  // 构建 routing
  const routingData = durationRulesYaml.routing as Record<string, unknown>

  const buildDurationRouting = (key: string): DurationRouting => {
    const route = routingData?.[key] as Record<string, unknown> || {}
    return {
      maxDuration: route.maxDuration as number | undefined,
      minDuration: route.minDuration as number | undefined,
      description: route.description as string || "",
      shotCount: route.shotCount as string || "",
      rules: route.rules as string[] || [],
      wordLimit: route.wordLimit as string || "",
    }
  }

  const routing = {
    burst: buildDurationRouting("burst"),
    mini: buildDurationRouting("mini"),
    full: buildDurationRouting("full"),
  }

  // 构建 expansionSpecs
  const expansionSpecsData = durationRulesYaml.expansionSpecs as Array<Record<string, unknown>>
  const expansionSpecs = expansionSpecsData?.map((spec) => ({
    maxDuration: spec.maxDuration as number | undefined,
    minDuration: spec.minDuration as number | undefined,
    wordCount: spec.wordCount as string || "",
    description: spec.description as string || "",
    constraint: spec.constraint as string || "",
  })) || []

  // 构建保真模式配置
  const faithfulHeader = faithfulModeYaml.faithfulHeader as string || ""
  const faithfulSuffix = faithfulModeYaml.faithfulSuffix as string || ""
  const faithfulSystemPrompt = faithfulModeYaml.faithfulSystemPrompt as string || ""
  const assetTagInstruction = faithfulModeYaml.assetTagInstruction as string || ""

  // 构建单镜修改配置
  const shotEdit: ShotEditConfig = {
    systemRole: shotEditYaml.systemRole as string || "",
    modeConstraint: shotEditYaml.modeConstraint as string || "",
    fieldFormatRule: shotEditYaml.fieldFormatRule as string || "",
    userTaskTemplate: shotEditYaml.userTaskTemplate as string || "",
  }

  // 组装完整配置
  configCache = {
    directors,
    directorList,
    categoryLabels,
    categoryGuides,
    categoryMapping,
    donghuaProfile,
    visualStyles,
    defaultVisualStyle,
    shotEdit,
    fiveDimensionRules,
    tableFormat,
    seedanceFormat,
    tensionFormat,
    routing,
    expansionSpecs,
    faithfulHeader,
    faithfulSuffix,
    faithfulSystemPrompt,
    assetTagInstruction,
  }

  lastLoadTime = Date.now()
  console.log("[PromptLoader] Configuration loaded successfully")

  return configCache
}

/**
 * 获取当前配置（如果未加载则先加载）
 */
export function getPromptConfig(): PromptConfig {
  if (!configCache) {
    return loadPromptConfig()
  }
  return configCache
}

/**
 * 清除缓存（用于热重载）
 */
export function clearPromptCache(): void {
  configCache = null
  lastLoadTime = 0
  console.log("[PromptLoader] Cache cleared")
}

/**
 * 热重载配置（开发环境使用）
 */
export function reloadPromptConfig(): PromptConfig {
  clearPromptCache()
  return loadPromptConfig()
}

/**
 * 获取所有导演列表
 */
export function getDirectors(): Director[] {
  const config = getPromptConfig()
  return config.directorList
}

/**
 * 根据 ID 获取导演
 */
export function getDirectorById(id: string): Director | undefined {
  const config = getPromptConfig()
  return config.directors[id]
}

/**
 * 按分类获取导演
 */
export function getDirectorsByCategory(category: Director["category"]): Director[] {
  const config = getPromptConfig()
  return config.directorList.filter(d => d.category === category)
}

/**
 * 获取分类标签
 */
export function getCategoryLabels(): Record<string, string> {
  const config = getPromptConfig()
  return config.categoryLabels
}

// 启动时自动加载
if (typeof window === "undefined") {
  loadPromptConfig()
}