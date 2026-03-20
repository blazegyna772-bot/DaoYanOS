# AI 平台 API 接入方式分析报告

## 概述

原程序支持两种配置模式：
1. **文字生成** - 用于生成分镜提示词、分析剧本、提取资产
2. **视觉分析** - 用于图片反推（描述图片内容）

## 平台分类

### 一、OpenAI 兼容格式（OpenAI-Compatible）

大部分平台都支持 OpenAI 兼容的 API 格式，包括：

| 平台 | Endpoint 格式 | 认证方式 | 特殊说明 |
|------|--------------|----------|----------|
| **OpenAI** | `https://api.openai.com/v1/chat/completions` | Bearer Token | 标准格式 |
| **DeepSeek** | `https://api.deepseek.com/v1/chat/completions` | Bearer Token | 完全兼容 |
| **SiliconFlow** | `https://api.siliconflow.cn/v1/chat/completions` | Bearer Token | 完全兼容 |
| **OpenRouter** | `https://openrouter.ai/api/v1/chat/completions` | Bearer Token + HTTP-Referer | 需额外 Header |
| **豆包** | `https://ark.cn-beijing.volces.com/api/v3/chat/completions` | Bearer Token | 字节火山引擎 |
| **智谱AI** | `https://open.bigmodel.cn/api/paas/v4/chat/completions` | Bearer Token | ZhipuAI |

**请求格式（统一）**:
```json
{
  "model": "gpt-4",
  "messages": [
    {"role": "system", "content": "系统提示词"},
    {"role": "user", "content": "用户输入"}
  ],
  "temperature": 0.7,
  "max_tokens": 2000
}
```

**响应格式（统一）**:
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "生成的内容"
    }
  }]
}
```

---

### 二、Google Gemini 格式

| 平台 | Endpoint 格式 | 认证方式 | 特殊说明 |
|------|--------------|----------|----------|
| **Gemini** | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` | API Key（URL 参数） | Google 原生 |

**请求格式（不同）**:
```json
{
  "contents": [{
    "parts": [{"text": "用户输入"}]
  }],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 2000
  }
}
```

**响应格式（不同）**:
```json
{
  "candidates": [{
    "content": {
      "parts": [{"text": "生成的内容"}]
    }
  }]
}
```

**认证方式差异**:
- Gemini 使用 URL 参数 `?key=YOUR_API_KEY`
- 不是 Bearer Token

---

### 三、Anthropic Claude 格式

| 平台 | Endpoint 格式 | 认证方式 | 特殊说明 |
|------|--------------|----------|----------|
| **Claude** | `https://api.anthropic.com/v1/messages` | x-api-key Header | Anthropic 原生 |

**请求格式（不同）**:
```json
{
  "model": "claude-3-sonnet-20240229",
  "max_tokens": 2000,
  "messages": [
    {"role": "user", "content": "用户输入"}
  ],
  "system": "系统提示词"
}
```

**特殊点**:
- `system` 字段在顶层，不是在 messages 里
- Header 使用 `x-api-key` 而不是 `Authorization: Bearer`

---

### 四、阿里云通义千问（DashScope）

| 平台 | Endpoint 格式 | 认证方式 | 特殊说明 |
|------|--------------|----------|----------|
| **通义千问** | `https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation` | Authorization: API-Key | 阿里云原生 |

**请求格式（不同）**:
```json
{
  "model": "qwen-max",
  "input": {
    "messages": [
      {"role": "system", "content": "系统提示词"},
      {"role": "user", "content": "用户输入"}
    ]
  },
  "parameters": {
    "temperature": 0.7,
    "max_tokens": 2000
  }
}
```

**特殊点**:
- 请求结构嵌套在 `input` 和 `parameters` 里
- Header: `Authorization: API-Key xxxxxx`（不是 Bearer）

---

### 五、月之暗面 Moonshot / Kimi

| 平台 | Endpoint 格式 | 认证方式 | 特殊说明 |
|------|--------------|----------|----------|
| **Moonshot** | `https://api.moonshot.cn/v1/chat/completions` | Bearer Token | OpenAI 兼容 |
| **Kimi** | 同 Moonshot | Bearer Token | 同一公司 |

**特点**:
- 完全兼容 OpenAI 格式
- 支持超长上下文（200k tokens）

---

## 视觉分析（Vision）API 差异

视觉分析用于图片反推（上传图片，返回描述文字）。不同平台的实现方式：

### 1. OpenAI Vision（GPT-4V）

```json
{
  "model": "gpt-4-vision-preview",
  "messages": [{
    "role": "user",
    "content": [
      {"type": "text", "text": "描述这张图片"},
      {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,xxx"}}
    ]
  }]
}
```

### 2. Claude Vision

```json
{
  "model": "claude-3-sonnet-20240229",
  "max_tokens": 1024,
  "messages": [{
    "role": "user",
    "content": [
      {"type": "text", "text": "描述这张图片"},
      {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": "xxx"}}
    ]
  }]
}
```

**差异点**:
- 图片字段名：`image_url` vs `image`
- base64 格式：OpenAI 直接放 URL，Claude 单独字段

### 3. Gemini Vision

```json
{
  "contents": [{
    "parts": [
      {"text": "描述这张图片"},
      {"inline_data": {"mime_type": "image/jpeg", "data": "base64xxx"}}
    ]
  }]
}
```

**差异点**:
- 完全不同的结构
- 使用 `inline_data` 字段

---

## 实现建议

### 1. 统一请求封装

需要为每种格式写一个转换器：

```typescript
// OpenAI 兼容格式（大部分平台）
function createOpenAIRequest(messages, model, temperature) {
  return {
    model,
    messages,
    temperature,
    max_tokens: 2000
  }
}

// Claude 格式
function createClaudeRequest(messages, model, temperature) {
  const systemMsg = messages.find(m => m.role === 'system')?.content || ''
  const userMessages = messages.filter(m => m.role !== 'system')
  return {
    model,
    max_tokens: 2000,
    messages: userMessages,
    system: systemMsg,
    temperature
  }
}

// Gemini 格式
function createGeminiRequest(messages, model, temperature) {
  const text = messages.map(m => m.content).join('\n')
  return {
    contents: [{ parts: [{ text }] }],
    generationConfig: { temperature, maxOutputTokens: 2000 }
  }
}

// 阿里云通义千问格式
function createQwenRequest(messages, model, temperature) {
  return {
    model,
    input: { messages },
    parameters: { temperature, max_tokens: 2000 }
  }
}
```

### 2. 认证方式处理

```typescript
function getHeaders(platform: string, apiKey: string) {
  switch(platform) {
    case 'openai':
    case 'deepseek':
    case 'moonshot':
    case 'siliconflow':
      return { 'Authorization': `Bearer ${apiKey}` }

    case 'claude':
      return { 'x-api-key': apiKey }

    case 'qwen':
      return { 'Authorization': `API-Key ${apiKey}` }

    case 'gemini':
      return {} // Key in URL

    case 'openrouter':
      return {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://daoyanos.com',
        'X-Title': 'DaoYanOS'
      }
  }
}
```

### 3. 响应解析

```typescript
function parseResponse(platform: string, response: any) {
  switch(platform) {
    case 'openai':
    case 'deepseek':
    case 'moonshot':
      return response.choices[0].message.content

    case 'claude':
      return response.content[0].text

    case 'gemini':
      return response.candidates[0].content.parts[0].text

    case 'qwen':
      return response.output.text
  }
}
```

---

## 推荐模型列表

### 文字生成（LLM）

| 平台 | 推荐模型 | 备注 |
|------|---------|------|
| OpenAI | gpt-4, gpt-4-turbo | 最强 |
| Claude | claude-3-sonnet, claude-3-opus | 最强 |
| Gemini | gemini-1.5-pro | 多模态 |
| DeepSeek | deepseek-chat | 中文好 |
| Moonshot | moonshot-v1-128k | 长文本 |
| Qwen | qwen-max, qwen-plus | 中文好 |
| SiliconFlow | Qwen/Qwen2-72B-Instruct | 国内稳定 |
| OpenRouter | anthropic/claude-3-sonnet | 聚合 |

### 视觉分析（Vision）

| 平台 | 推荐模型 | 备注 |
|------|---------|------|
| OpenAI | gpt-4-vision-preview | 最强 |
| Claude | claude-3-sonnet-20240229 | 图像理解强 |
| Gemini | gemini-1.5-pro-vision | 支持视频 |

---

## 总结

### 需要处理的差异点

1. **Endpoint URL** - 每个平台不同
2. **认证方式** - Bearer / API-Key / x-api-key / URL参数
3. **请求格式** - messages 结构差异巨大
4. **响应格式** - choices vs candidates vs output
5. **Vision 图片格式** - image_url vs image vs inline_data

### 实现复杂度

- **简单**（OpenAI兼容）：OpenAI, DeepSeek, Moonshot, SiliconFlow
- **中等**（需转换）：Claude（Header不同，system字段不同）
- **复杂**（完全不同）：Gemini, Qwen

建议实现一个统一的 `AIClient` 类，根据平台类型自动处理这些差异。
