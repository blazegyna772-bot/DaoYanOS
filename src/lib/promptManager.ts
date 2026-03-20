/**
 * 提示词管理器
 * 用途：加载、缓存、热重载提示词模板
 * 支持用户自定义覆盖默认提示词
 */

import fs from "fs/promises"
import path from "path"
import yaml from "yaml"

// ============================================
// 类型定义
// ============================================

export interface PromptConfig {
  categoryGuides: Record<string, CategoryGuideConfig>
  durationRules: DurationRuleConfig
  shotRules: ShotRuleConfig
  faithfulMode: FaithfulModeConfig
  customOverrides: Record<string, string>
}

export interface CategoryGuideConfig {
  persona: string
  writingLogic: string
  motiveField: boolean
  themeField: boolean
  sceneField: string
}

export interface DurationRuleConfig {
  burst: BurstRuleConfig
  mini: MiniRuleConfig
  full: FullRuleConfig
}

export interface BurstRuleConfig {
  threshold: number
  maxShots: number
  description: string
  systemPrompt: string
}

export interface MiniRuleConfig {
  minDuration: number
  maxDuration: number
  description: string
}

export interface FullRuleConfig {
  minDuration: number
  description: string
  stageAPrompt: string
  stageBPrompt: string
  bridgeExtractionPrompt: string
}

export interface ShotRuleConfig {
  fiveDimensionRules: string
  seedanceFormat: string
  tableFormat: string
}

export interface FaithfulModeConfig {
  triggerConditions: string[]
  faithfulHeader: string
  faithfulSuffix: string
  assetConstraints: {
    withTags: string
    withoutTags: string
  }
}

// ============================================
// 提示词管理器
// ============================================

class PromptManager {
  private config: PromptConfig | null = null
  private lastLoadTime: number = 0
  private readonly cacheDuration: number = 5000 // 5秒缓存
  private promptsDir: string

  constructor() {
    this.promptsDir = path.join(process.cwd(), "prompts")
  }

  /**
   * 加载所有提示词配置
   */
  async loadConfig(): Promise<PromptConfig> {
    // 检查缓存
    if (this.config && Date.now() - this.lastLoadTime < this.cacheDuration) {
      return this.config
    }

    try {
      const [categoryGuides, durationRules, shotRules, faithfulMode] = await Promise.all([
        this.loadYamlFile("categoryGuides.yaml"),
        this.loadYamlFile("durationRules.yaml"),
        this.loadYamlFile("shotRules.yaml"),
        this.loadYamlFile("faithfulMode.yaml"),
      ])

      this.config = {
        categoryGuides: (categoryGuides || {}) as Record<string, CategoryGuideConfig>,
        durationRules: (durationRules || {}) as unknown as DurationRuleConfig,
        shotRules: (shotRules || {}) as unknown as ShotRuleConfig,
        faithfulMode: (faithfulMode || {}) as unknown as FaithfulModeConfig,
        customOverrides: {},
      }

      this.lastLoadTime = Date.now()
      return this.config
    } catch (error) {
      console.error("Failed to load prompt config:", error)
      // 返回默认配置
      return this.getDefaultConfig()
    }
  }

  /**
   * 强制重新加载
   */
  async reload(): Promise<PromptConfig> {
    this.lastLoadTime = 0
    return this.loadConfig()
  }

  /**
   * 加载 YAML 文件
   */
  private async loadYamlFile(filename: string): Promise<Record<string, unknown> | null> {
    try {
      const filePath = path.join(this.promptsDir, filename)
      const content = await fs.readFile(filePath, "utf-8")
      return yaml.parse(content)
    } catch (error) {
      console.warn(`Failed to load ${filename}:`, error)
      return null
    }
  }

  /**
   * 获取分类人格配置
   */
  async getCategoryGuide(category: string): Promise<CategoryGuideConfig | null> {
    const config = await this.loadConfig()
    return config.categoryGuides[category] || null
  }

  /**
   * 获取时长规则
   */
  async getDurationRules(): Promise<DurationRuleConfig> {
    const config = await this.loadConfig()
    return config.durationRules
  }

  /**
   * 获取分镜规则
   */
  async getShotRules(): Promise<ShotRuleConfig> {
    const config = await this.loadConfig()
    return config.shotRules
  }

  /**
   * 获取保真模式配置
   */
  async getFaithfulModeConfig(): Promise<FaithfulModeConfig> {
    const config = await this.loadConfig()
    return config.faithfulMode
  }

  /**
   * 设置用户自定义覆盖
   */
  setCustomOverride(key: string, value: string): void {
    if (this.config) {
      this.config.customOverrides[key] = value
    }
  }

  /**
   * 获取提示词（支持自定义覆盖）
   */
  async getPrompt(key: string): Promise<string | null> {
    const config = await this.loadConfig()

    // 优先返回自定义覆盖
    if (config.customOverrides[key]) {
      return config.customOverrides[key]
    }

    // 从配置中获取
    const keys = key.split(".")
    let value: unknown = config

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = (value as Record<string, unknown>)[k]
      } else {
        return null
      }
    }

    return typeof value === "string" ? value : null
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): PromptConfig {
    return {
      categoryGuides: {
        narrative: {
          persona: "好莱坞金牌编剧，深度运用《救猫咪》(Save the Cat) 剧本结构理论",
          writingLogic: "",
          motiveField: true,
          themeField: true,
          sceneField: "场景节奏节点",
        },
        atmosphere: {
          persona: "视觉艺术家与散文诗人，专注于影像氛围与情绪意境的营造",
          writingLogic: "",
          motiveField: false,
          themeField: false,
          sceneField: "情绪阶段节点",
        },
        suspense: {
          persona: "心理惊悚大师，专注于不可见之物的叙事力量",
          writingLogic: "",
          motiveField: true,
          themeField: false,
          sceneField: "恐惧节点",
        },
        anime: {
          persona: "资深动画监督，精通日系/中国3D动漫的视觉叙事语言",
          writingLogic: "",
          motiveField: false,
          themeField: false,
          sceneField: "动作节点",
        },
        stcOff: {
          persona: "专业影视编剧，任务是将剧本内容直接转化为视觉画面描述",
          writingLogic: "",
          motiveField: false,
          themeField: false,
          sceneField: "场景节点",
        },
      },
      durationRules: {
        burst: {
          threshold: 25,
          maxShots: 3,
          description: "极速瞬间模式",
          systemPrompt: "",
        },
        mini: {
          minDuration: 25,
          maxDuration: 85,
          description: "迷你弧线模式",
        },
        full: {
          minDuration: 85,
          description: "完整链式生成模式",
          stageAPrompt: "",
          stageBPrompt: "",
          bridgeExtractionPrompt: "",
        },
      },
      shotRules: {
        fiveDimensionRules: "",
        seedanceFormat: "",
        tableFormat: "",
      },
      faithfulMode: {
        triggerConditions: [],
        faithfulHeader: "",
        faithfulSuffix: "",
        assetConstraints: {
          withTags: "",
          withoutTags: "",
        },
      },
      customOverrides: {},
    }
  }
}

// 单例导出
export const promptManager = new PromptManager()

// ============================================
// 客户端兼容版本（用于浏览器环境）
// ============================================

/**
 * 获取提示词配置（客户端版本）
 * 直接返回硬编码的默认值，因为浏览器无法读取文件系统
 */
export function getClientPromptConfig(): PromptConfig {
  return {
    categoryGuides: {
      narrative: {
        persona: "好莱坞金牌编剧，深度运用《救猫咪》(Save the Cat) 剧本结构理论",
        writingLogic: "",
        motiveField: true,
        themeField: true,
        sceneField: "场景节奏节点",
      },
      atmosphere: {
        persona: "视觉艺术家与散文诗人，专注于影像氛围与情绪意境的营造",
        writingLogic: "",
        motiveField: false,
        themeField: false,
        sceneField: "情绪阶段节点",
      },
      suspense: {
        persona: "心理惊悚大师，专注于不可见之物的叙事力量",
        writingLogic: "",
        motiveField: true,
        themeField: false,
        sceneField: "恐惧节点",
      },
      anime: {
        persona: "资深动画监督，精通日系/中国3D动漫的视觉叙事语言",
        writingLogic: "",
        motiveField: false,
        themeField: false,
        sceneField: "动作节点",
      },
      stcOff: {
        persona: "专业影视编剧，任务是将剧本内容直接转化为视觉画面描述",
        writingLogic: "",
        motiveField: false,
        themeField: false,
        sceneField: "场景节点",
      },
    },
    durationRules: {
      burst: {
        threshold: 25,
        maxShots: 3,
        description: "极速瞬间模式",
        systemPrompt: "",
      },
      mini: {
        minDuration: 25,
        maxDuration: 85,
        description: "迷你弧线模式",
      },
      full: {
        minDuration: 85,
        description: "完整链式生成模式",
        stageAPrompt: "",
        stageBPrompt: "",
        bridgeExtractionPrompt: "",
      },
    },
    shotRules: {
      fiveDimensionRules: "",
      seedanceFormat: "",
      tableFormat: "",
    },
    faithfulMode: {
      triggerConditions: [],
      faithfulHeader: "",
      faithfulSuffix: "",
      assetConstraints: {
        withTags: "",
        withoutTags: "",
      },
    },
    customOverrides: {},
  }
}