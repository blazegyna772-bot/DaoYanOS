/**
 * DaoYanOS 完整类型定义
 * 基于 soullensV5.1.html 源代码分析
 */

// ============================================
// 基础枚举类型
// ============================================

/**
 * 导演分类（5种人格类型）
 */
export type DirectorCategory =
  | "narrative"   // 好莱坞叙事型（经典/科幻/动作/战争）
  | "atmosphere"  // 意境氛围型（东方/视觉/极简）
  | "suspense"    // 悬念心理型（悬疑/心理/恐怖）
  | "anime"       // 动漫特化型（动漫/国漫）
  | "stcOff";     // 关闭节拍结构

/**
 * 视觉风格
 */
export type VisualStyle =
  | "cinematic"
  | "anime"
  | "cyberpunk"
  | "oil_painting"
  | "3d_render"
  | "vintage"
  | "watercolor"
  | "pixel_art"
  | "comic"
  | "claymation"
  | "ukiyoe"
  | "surreal"
  | "minimalist"
  | "noir"
  | "fantasy"
  | "steampunk"
  | "donghua_xianxia"
  | "ink_wash";

/**
 * 画幅比例
 */
export type AspectRatio =
  | "16:9"
  | "2.39:1"
  | "9:16"
  | "1:1"
  | "4:3"
  | "21:9"
  | "3:2";

/**
 * 质量档位
 */
export type Quality = "extreme_high" | "high" | "medium" | "low";

/**
 * 叙事模式（由Stage A根据时长推导）
 */
export type NarrativeMode =
  | "burst"   // <25s，爆发型
  | "mini"    // <85s，迷你型
  | "full"    // ≥85s，完整型
  | "mood"    // 意境型
  | "plain";  // 平铺型

/**
 * 镜头数量模式
 */
export type ShotMode = "auto" | "custom";

/**
 * STC/BS2 节拍（13节拍）
 */
export type BeatType =
  | "opening"
  | "setup"
  | "catalyst"
  | "debate"
  | "act2in"
  | "bstory"
  | "fun"
  | "midpoint"
  | "badclose"
  | "allis"
  | "dark"
  | "act3in"
  | "finale";

/**
 * 资产类型
 */
export type AssetType = "character" | "image" | "props";

/**
 * AI平台协议类型
 */
export type PlatformMode =
  | "openai"       // OpenAI 兼容格式
  | "gemini"       // Google Gemini
  | "claude"       // Anthropic Claude
  | "qwen"         // 阿里云通义千问
  | "doubao"       // 字节豆包
  | "deepseek"     // DeepSeek
  | "moonshot"     // 月之暗面 Kimi
  | "siliconflow"  // 硅基流动
  | "openrouter"   // OpenRouter
  | "custom";      // 自定义端点

// ============================================
// 导演系统
// ============================================

/**
 * 导演数据
 * 对应源代码中的 ao 数组项
 */
export interface Director {
  id: string;
  name: string;
  nameEn: string;
  style: string;           // 风格描述（进入AI推理）
  techniques: string[];    // 典型运镜技法
  lighting: string;        // 光影风格
  films: string[];         // 代表作（UI展示用）
  color: string;           // UI渐变色（Tailwind类名）
  category: DirectorCategory;
  donghuaProfile?: {       // 国漫导演特有字段
    charStyle: string;     // 角色建模风格
    worldStyle: string;    // 世界观场景风格
    vfxStyle: string;      // 特效表现风格
    promptSuffix: string;  // 提示词后缀
  };
}

// ============================================
// 视觉桥梁与场次
// ============================================

/**
 * 视觉桥梁（跨场次连续性保障）
 */
export interface BridgeState {
  charPosition: string;  // 角色位置
  lightPhase: string;    // 光线状态
  environment: string;   // 环境状态
  keyProp: string;       // 关键道具
}

/**
 * 单个场次（Stage A切分结果）
 */
export interface Scene {
  id: string;
  name: string;              // 节拍名（如"催化剂"）
  beatType: BeatType;
  beatTask?: string;         // 节拍任务（供 Stage B 提示词使用）
  duration: number;          // 本场时长（秒）
  narrativeMode: NarrativeMode;
  contentSummary: string;    // 剧情摘要（Stage A产出）
  estimatedDuration?: number;// 预估本场时长
  bridgeState?: BridgeState; // 本场的视觉桥梁（传递给下场）
}

// ============================================
// 分集系统
// ============================================

/**
 * 单集数据
 * 每集有独立的剧本文本和生成结果，共享项目级参数
 */
export interface Episode {
  id: string;
  name: string;              // "第一集"、"第二集"
  plotInput: string;         // 本集剧本文本
  scenes: Scene[];
  shots: Shot[];
  assetRefs?: EpisodeAssetRefs;
  generatedMarkdown?: string;
}

// ============================================
// 分镜系统
// ============================================

/**
 * 单镜数据
 * 对应分镜表格的一行
 */
export interface Shot {
  id: string;
  sceneId: string;        // 所属场次
  index: number;          // 场次内镜号（从1开始）
  globalIndex: number;    // 全局镜号

  // 镜头基础信息
  type: string;           // 镜头类型（特写/近景/全景等）
  duration: number;       // 镜头时长（秒）
  timeRange: string;      // 时间轴位置（如"0-3s"）

  // 核心字段（SEEDANCE要求）
  env: string;            // 环境
  action: string;         // 角色分动（含@标签）
  light: string;          // 光影
  tension: string;        // 戏剧张力（紧张↑/悬念→/爆发↑等）

  // 完整提示词
  seedancePrompt: string;

  // 其他可选字段
  camera?: string;        // 运镜
  sound?: string;         // 音效
  dialogue?: string;      // 台词
}

// ============================================
// 资产系统
// ============================================

/**
 * 单个资产
 */
export interface Asset {
  id: string;
  type: AssetType;
  name: string;           // 显示名
  desc: string;           // 描述（用于prompt）
  fileName?: string;      // 上传的文件名
  url?: string;           // 预览URL（运行时ObjectURL）
}

/**
 * 资产状态
 */
export interface AssetState {
  character: Asset[];
  image: Asset[];
  props: Asset[];

  /**
   * 原名到@标签的映射
   * 例如：{"主角": "@人物1", "女主角": "@人物2"}
   */
  assetNameMap: Record<string, string>;

  /**
   * 各类资产是否启用@标签模式
   * false时使用文字描述替代@标签
   */
  assetTagEnabled: {
    character: boolean;
    image: boolean;
    props: boolean;
  };
}

// ============================================
// AI平台配置
// ============================================

/**
 * AI平台配置
 * 支持文字生成和视觉分析双模式
 */
export interface PlatformConfig {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;

  // 文字生成配置
  textEndpoint: string;
  textModel: string;
  textApiKey: string;

  // 视觉分析配置
  visionEndpoint: string;
  visionModel: string;
  visionApiKey: string;

  // 模式（决定如何格式化请求）
  mode: PlatformMode;

  // 是否启用
  enabled: boolean;
}

/**
 * 平台定义（用于 UI 展示）
 */
export interface PlatformDefinition {
  id: PlatformMode;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  recommended: boolean;
  textModels: string[];
  visionModels: string[];
  defaultTextEndpoint: string;
  defaultVisionEndpoint: string;
  keyPlaceholder: string;
  keyUrl: string;
}

/**
 * 分集数据
 */
export interface Episode {
  id: string;
  name: string;
  plotInput: string;
  scenes: Scene[];
  shots: Shot[];
  assetRefs?: EpisodeAssetRefs;
  generatedMarkdown?: string;
}

export interface EpisodeAssetRefs {
  characterIds: string[];
  imageIds: string[];
  propIds: string[];
}

// ============================================
// 项目数据（完整定义）
// ============================================

/**
 * 项目元数据
 * 存储在 ~/Documents/DaoYanOSProjects/{project_id}/meta.json
 */
export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;

  // ===== 剧本输入 =====
  plotInput: string;           // 剧本原文主输入（兼容旧版本）
  charCount: number;           // 字数统计（UI实时显示）
  isScriptImported: boolean;   // 是否通过txt导入

  // ===== 分集数据（新版本）=====
  episodes: Episode[];         // 分集列表

  // ===== 时长与规模参数 =====
  duration: number;            // 总时长（秒）
  shotMode: ShotMode;          // 镜头数分配模式
  customShotCount?: number;    // shotMode=custom时生效

  // ===== 风格参数 =====
  selectedDirector: string;    // 选中的导演ID
  visualStyle: VisualStyle;    // 视觉风格
  aspectRatio: AspectRatio;    // 画幅比例
  quality: Quality;            // 质量档位

  // ===== 输出开关 =====
  enableBGM: boolean;          // 启用BGM
  enableSubtitle: boolean;     // 启用字幕

  // ===== 功能开关 =====
  scriptFaithfulMode: boolean; // 主动保真模式
  enableWordFilter: boolean;   // 敏感词过滤
  autoSafetyCheck: boolean;    // 生成前自动安检
  strictMode: boolean;         // 严格模式（严格安全检测）
  stcEnabled: boolean;         // STC节拍结构

  // ===== 资产库 =====
  assets: AssetState;

  // ===== 平台配置 =====
  currentPlatformId: string;
  platforms: PlatformConfig[];

  // ===== ChainEngine运行时状态（可选保存，用于恢复） =====
  chainEngineState?: {
    sceneContents: Record<string, string>;      // sceneId → markdown内容
    sceneChatHistory: Record<string, ChatMessage[]>;
  };
}

// ============================================
// 对话与消息
// ============================================

/**
 * 对话消息
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: string;
}

// ============================================
// 安全审核
// ============================================

/**
 * 安全审核结果
 */
export interface SafetyResult {
  text: string;                                     // 替换后的安全文本
  replaced: Array<{ from: string; to: string }>;    // 替换记录
  detectedRedZone: string[];                        // 红区命中
  detectedYellowZone: string[];                     // 黄区命中
  detectedCelebrity: string[];                      // 名人命中
  detectedIP: string[];                             // IP命中
}

// ============================================
// ChainEngine运行时
// ============================================

/**
 * ChainEngine运行时状态
 * 这些字段不持久化，仅在生成过程中存在
 */
export interface ChainEngineRuntime {
  scenes: Scene[];
  totalDuration: number;
  globalOffset: number;                    // 当前场次起始时间偏移
  isCancelled: boolean;                    // 用户中止标志
  isRunning: boolean;                      // 防竞争锁
  cleanPlot: string;                       // 清洗后的剧本文本
  sceneContents: Record<string, string>;   // 每场生成的markdown内容
  sceneChatHistory: Record<string, ChatMessage[]>;
  previousBridgeState: BridgeState | null; // 上一场的状态
}

// ============================================
// UI状态
// ============================================

/**
 * 单镜编辑状态
 */
export interface SingleShotEditState {
  currentEditShotIndex: number;
  currentEditSceneId: string | null;
  request: string;
}

/**
 * 全局修改状态
 */
export interface RefineState {
  refineText: string;
}

// ============================================
// 分类人格提示词（用于生成）
// ============================================

/**
 * 分类人格配置
 */
export interface CategoryPersona {
  id: DirectorCategory;
  name: string;
  description: string;
  systemPrompt: string;
}

// ============================================
// API请求/响应类型
// ============================================

/**
 * 生成请求参数
 */
export interface GenerateRequest {
  projectId: string;
  stage: "A" | "B" | "C" | "single";
  sceneId?: string;
  shotIndex?: number;
  refineText?: string;
}

/**
 * 生成响应
 */
export interface GenerateResponse {
  success: boolean;
  content?: string;
  error?: string;
  sceneId?: string;
}
