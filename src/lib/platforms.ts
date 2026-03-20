/**
 * AI 平台定义数据
 * 包含所有支持的 AI 平台配置
 */

import type { PlatformDefinition, PlatformConfig } from "@/types";

/**
 * 所有支持的 AI 平台定义
 */
export const platformDefinitions: PlatformDefinition[] = [
  {
    id: "openai",
    name: "OpenAI",
    nameEn: "OpenAI",
    description: "GPT-4 / GPT-3.5 · 全球通用",
    icon: "🤖",
    color: "from-emerald-500 to-teal-600",
    recommended: true,
    textModels: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
    visionModels: ["gpt-4-vision-preview"],
    defaultTextEndpoint: "https://api.openai.com/v1/chat/completions",
    defaultVisionEndpoint: "https://api.openai.com/v1/chat/completions",
    keyPlaceholder: "sk-xxxxxxxxxxxxxxxxxxxxxxxx",
    keyUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "claude",
    name: "Claude",
    nameEn: "Anthropic",
    description: "图像理解强 · Anthropic",
    icon: "🧬",
    color: "from-amber-500 to-orange-600",
    recommended: true,
    textModels: ["claude-3-sonnet-20240229", "claude-3-opus-20240229", "claude-3-haiku-20240307"],
    visionModels: ["claude-3-sonnet-20240229", "claude-3-opus-20240229"],
    defaultTextEndpoint: "https://api.anthropic.com/v1/messages",
    defaultVisionEndpoint: "https://api.anthropic.com/v1/messages",
    keyPlaceholder: "sk-ant-api03-xxxxxxxx",
    keyUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "gemini",
    name: "Gemini",
    nameEn: "Google",
    description: "支持视频 · Google",
    icon: "♊",
    color: "from-blue-500 to-indigo-600",
    recommended: false,
    textModels: ["gemini-1.5-pro", "gemini-1.5-flash"],
    visionModels: ["gemini-1.5-pro-vision"],
    defaultTextEndpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
    defaultVisionEndpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-vision:generateContent",
    keyPlaceholder: "AIzaSyxxxxxxxxxxxxxxxx",
    keyUrl: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "doubao",
    name: "豆包",
    nameEn: "Doubao",
    description: "字节跳动 · 国内",
    icon: "🫘",
    color: "from-blue-400 to-cyan-500",
    recommended: false,
    textModels: ["doubao-pro-128k", "doubao-lite-128k"],
    visionModels: ["doubao-vision"],
    defaultTextEndpoint: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    defaultVisionEndpoint: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    keyPlaceholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    keyUrl: "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    nameEn: "DeepSeek",
    description: "深度求索 · 性价比",
    icon: "🔍",
    color: "from-purple-500 to-violet-600",
    recommended: true,
    textModels: ["deepseek-chat", "deepseek-coder"],
    visionModels: [],
    defaultTextEndpoint: "https://api.deepseek.com/v1/chat/completions",
    defaultVisionEndpoint: "",
    keyPlaceholder: "sk-xxxxxxxxxxxxxxxx",
    keyUrl: "https://platform.deepseek.com/api_keys",
  },
  {
    id: "qwen",
    name: "通义千问",
    nameEn: "Qwen",
    description: "阿里云 · 国内稳定",
    icon: "🌐",
    color: "from-orange-500 to-red-500",
    recommended: true,
    textModels: ["qwen-max", "qwen-plus", "qwen-turbo", "qwen-long"],
    visionModels: ["qwen-vl-max", "qwen-vl-plus"],
    // 使用 OpenAI 兼容模式端点
    defaultTextEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    defaultVisionEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    keyPlaceholder: "sk-xxxxxxxxxxxxxxxx",
    keyUrl: "https://dashscope.console.aliyun.com/apiKey",
  },
  {
    id: "moonshot",
    name: "Kimi",
    nameEn: "Moonshot",
    description: "月之暗面 · 长文本",
    icon: "🌙",
    color: "from-cyan-500 to-blue-600",
    recommended: true,
    textModels: ["moonshot-v1-128k", "moonshot-v1-32k", "moonshot-v1-8k"],
    visionModels: [],
    defaultTextEndpoint: "https://api.moonshot.cn/v1/chat/completions",
    defaultVisionEndpoint: "",
    keyPlaceholder: "sk-xxxxxxxxxxxxxxxx",
    keyUrl: "https://platform.moonshot.cn/console/api-keys",
  },
  {
    id: "siliconflow",
    name: "SiliconFlow",
    nameEn: "SiliconFlow",
    description: "硅基流动 · 多模型",
    icon: "⚡",
    color: "from-yellow-500 to-amber-600",
    recommended: false,
    textModels: ["Qwen/Qwen2-72B-Instruct", "deepseek-ai/DeepSeek-V2-Chat"],
    visionModels: [],
    defaultTextEndpoint: "https://api.siliconflow.cn/v1/chat/completions",
    defaultVisionEndpoint: "",
    keyPlaceholder: "sk-xxxxxxxxxxxxxxxx",
    keyUrl: "https://cloud.siliconflow.cn/account/ak",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    nameEn: "OpenRouter",
    description: "聚合平台 · 含Claude",
    icon: "🔀",
    color: "from-gray-500 to-slate-600",
    recommended: false,
    textModels: ["anthropic/claude-3-sonnet", "openai/gpt-4", "google/gemini-pro"],
    visionModels: ["anthropic/claude-3-sonnet"],
    defaultTextEndpoint: "https://openrouter.ai/api/v1/chat/completions",
    defaultVisionEndpoint: "https://openrouter.ai/api/v1/chat/completions",
    keyPlaceholder: "sk-or-v1-xxxxxxxx",
    keyUrl: "https://openrouter.ai/keys",
  },
  {
    id: "custom",
    name: "自定义",
    nameEn: "Custom",
    description: "任意兼容端点",
    icon: "🔧",
    color: "from-gray-400 to-gray-600",
    recommended: false,
    textModels: ["custom-model"],
    visionModels: [],
    defaultTextEndpoint: "https://your-api-endpoint.com/v1/chat/completions",
    defaultVisionEndpoint: "",
    keyPlaceholder: "your-api-key",
    keyUrl: "",
  },
];

/**
 * 获取平台定义
 */
export function getPlatformDefinition(id: string): PlatformDefinition | undefined {
  return platformDefinitions.find((p) => p.id === id);
}

/**
 * 获取所有平台定义
 */
export function getAllPlatformDefinitions(): PlatformDefinition[] {
  return platformDefinitions;
}

/**
 * 获取推荐的平台
 */
export function getRecommendedPlatforms(): PlatformDefinition[] {
  return platformDefinitions.filter((p) => p.recommended);
}

/**
 * 创建默认平台配置
 */
export function createDefaultPlatformConfig(platformId: string): PlatformConfig {
  const definition = getPlatformDefinition(platformId);
  if (!definition) {
    throw new Error(`Unknown platform: ${platformId}`);
  }

  return {
    id: platformId,
    name: definition.name,
    description: definition.description,
    icon: definition.icon,
    color: definition.color,
    textEndpoint: definition.defaultTextEndpoint,
    textModel: definition.textModels[0] || "",
    textApiKey: "",
    visionEndpoint: definition.defaultVisionEndpoint,
    visionModel: definition.visionModels[0] || "",
    visionApiKey: "",
    mode: platformId as any,
    enabled: true,
  };
}

/**
 * 获取平台的请求头
 */
export function getPlatformHeaders(
  platformId: string,
  apiKey: string
): Record<string, string> {
  switch (platformId) {
    case "claude":
      return { "x-api-key": apiKey, "anthropic-version": "2023-06-01" };
    case "qwen":
      return { Authorization: `API-Key ${apiKey}` };
    case "openrouter":
      return {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://daoyanos.com",
        "X-Title": "DaoYanOS",
      };
    default:
      // OpenAI 兼容格式
      return { Authorization: `Bearer ${apiKey}` };
  }
}

/**
 * 获取平台支持的模型列表
 */
export function getPlatformModels(
  platformId: string,
  type: "text" | "vision"
): string[] {
  const definition = getPlatformDefinition(platformId);
  if (!definition) return [];
  return type === "text" ? definition.textModels : definition.visionModels;
}
