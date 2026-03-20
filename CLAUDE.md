# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**AI导演制作中台 (DaoYanOS)**
- 作者：QiYing
- 导演级分镜提示词生成系统
- 将剧本转化为AI视频生成平台可用提示词

## 参考文件

1. **`_Input/1st/soullensV5.1.html`** - 功能参考源（2635行，需复刻完整功能）
2. **`_Input/1st/SOULLENS_MODULE_ANALYSIS.md`** - 架构参考
3. **`_Input/1st/SOULLENS_PARAMETER_DICTIONARY.md`** - 参数字典（所有字段的完整定义）
4. **`_Input/cank/`** - 他人建议（供参考，以用户需求为优先）

## 技术栈（已确定）

- **框架**: Next.js 15 + React 19
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4
- **组件**: shadcn/ui
- **图标**: lucide-react（自动适配深浅主题，不使用图片资源）
- **主题**: next-themes（支持浅色/深色/跟随系统）
- **存储**: 本地文件系统（JSON）

## UI设计规范（已确定）

- **风格**: 方案A - 电影感暗色主题
- **强调色**: 琥珀色（amber-500/orange-600）
- **特性**: 支持浅色/深色双主题切换（跟随系统）
- **布局**: 三栏布局（左：分集列表，中：剧本+统计（上）+参数区（下），右：资产库）
- **原则**: 颜色不要太花，功能跑通后再优化细节

## 项目结构

```
DaoYanOS/
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API路由
│   │   ├── layout.tsx     # 根布局（ThemeProvider）
│   │   └── page.tsx       # 主页面
│   ├── components/        # UI组件
│   │   ├── ui/            # shadcn组件
│   │   ├── theme-provider.tsx  # 主题提供器
│   │   └── theme-toggle.tsx    # 主题切换按钮
│   ├── lib/               # 工具函数
│   │   ├── promptManager.ts  # 提示词热重载管理
│   │   └── utils.ts       # 通用工具
│   └── types/             # 类型定义
├── prompts/               # YAML提示词库（热重载监控）
└── package.json
```

## 本地存储结构

```
~/Documents/DaoYanOSProjects/
├── {project_id}/
│   ├── meta.json          # 项目元数据、剧本、分镜
│   ├── assets/            # 角色/场景/道具
│   │   ├── characters/
│   │   ├── scenes/
│   │   └── props/
│   └── outputs/           # 生成的图片/视频
│       ├── images/
│       └── videos/
```

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发（Turbopack）
npm run dev

# 构建
npm run build
```

## 核心功能清单（来自soullensV5.1.html，已验证）

### 链式生成系统（ChainEngine）
- Stage A: 剧本切分（BS2节拍/原著保真/情绪阶段）
- Stage B: 逐场分镜生成（携带bridgeState视觉桥梁）
- Stage C: 整合输出
- 视觉桥梁（bridgeState）: charPosition/lightPhase/environment/keyProp

### 资产系统（@Tag）
- 三类资产槽位：character / image / props
- @标签语法: @人物1, @图片1, @道具1
- 标签/文字双模式切换（assetTagEnabled.*控制）
- 原名映射表（assetNameMap）：剧本角色名 → @标签

### 导演风格（三层注入）
- **数据层**：39位导演（id/name/style/techniques/lighting/category/films/color）
- **分类人格层**（5种）：
  - `narrative`: 好莱坞叙事型（经典/科幻/动作/战争）
  - `atmosphere`: 意境氛围型（东方/视觉/极简）
  - `suspense`: 悬念心理型（悬疑/心理/恐怖）
  - `anime`: 动漫特化型（动漫/国漫）
  - `stcOff`: 关闭节拍结构
- **任务拼装层**：导演数据 + 分类人格 + 当前任务 → system prompt

### 视觉风格（visualStyle）
- cinematic / anime / cyberpunk / oil_painting / 3d_render / vintage / watercolor / pixel_art / comic / claymation / ukiyoe / surreal / minimalist / noir / fantasy / steampunk / donghua_xianxia / ink_wash

### 画幅比例（aspectRatio）
- 16:9 / 2.39:1 / 9:16 / 1:1 / 4:3 / 21:9 / 3:2

### 质量档位（quality）
- extreme_high / high / medium / low

### 安全与保真
- **四区检测**：redZone/yellowZone/celebrityZone/ipZone
- **双层过滤**：Jt替换词表（自动替换） + se禁词表（拦截阻断）
- **保真模式**：faithfulActive = scriptFaithfulMode || isScriptImported
  - faithfulHeader（输入侧约束） + faithfulSuffix（输出侧约束）

### STC/BS2节拍系统（13节拍）
- `narrative/suspense`类别：Opening→Setup→Catalyst→Debate→Act2In→BStory→Fun→Midpoint→BadClose→AllIsLost→Dark→Act3In→Finale
- `atmosphere/anime`类别：起→承→转→合（4阶段）
- **路由规则**：burst(<25s)/mini(<85s)/full(≥85s链式生成)

## 核心数据结构

### ChainEngine运行时
```typescript
ChainEngine {
  scenes: Scene[]           // Stage A切分结果
  totalDuration: number     // 用户设定的总时长
  globalOffset: number      // 当前场次起始时间（累加）
  isCancelled: boolean      // 用户中止标志
  isRunning: boolean        // 防竞争锁
  cleanPlot: string         // 清洗后的剧本文本
  sceneContents: { [sceneId: string]: string }      // 每场markdown输出
  sceneChatHistory: { [sceneId: string]: Message[] } // 每场对话历史
}

Scene {
  id: string
  name: string              // 节拍名（如"催化剂"）
  duration: number          // 本场时长（秒）
  narrativeMode: 'burst'|'mini'|'full'|'mood'|'plain'
  contentSummary: string    // 本场剧情摘要
  bridgeState: {            // 视觉桥梁（传递给下场）
    charPosition: string
    lightPhase: string
    environment: string
    keyProp: string
  }
}
```

### 资产类型
```typescript
Asset {
  id: string
  name: string          // 显示名
  desc: string          // 描述（用于prompt）
  file?: File           // 上传的图片文件（运行时）
  url?: string          // 预览URL（运行时）
}

AssetState {
  character: Asset[]
  image: Asset[]
  props: Asset[]
  assetNameMap: { [originalName: string]: string }  // 原名→@标签
  assetTagEnabled: {
    character: boolean
    image: boolean
    props: boolean
  }
}
```

### 导演数据
```typescript
Director {
  id: string
  name: string
  nameEn: string
  style: string           // 风格描述（进入prompt）
  techniques: string[]    // 运镜技法
  lighting: string        // 光影风格
  films: string[]         // 代表作（UI展示）
  color: string           // UI渐变色（Tailwind类名）
  category: 'narrative'|'atmosphere'|'suspense'|'anime'|'stcOff'
  donghuaProfile?: {      // 国漫导演特有
    style: string
    lens: string
    color: string
  }
}
```

## 关键参数字段（开发时需对照）

| 字段 | 层级 | 说明 |
|-----|-----|------|
| `plotInput` | UI/State | 剧本原文主输入 |
| `duration` | UI | 总时长，决定路由burst/mini/full |
| `shotMode` | UI | auto/custom，控制镜头数分配 |
| `customShotCount` | UI | shotMode=custom时生效 |
| `selectedDirector` | State | 当前选中的导演ID |
| `visualStyle` | UI | 视觉风格枚举 |
| `aspectRatio` | UI | 画幅比例 |
| `scriptFaithfulMode` | State | 主动保真开关 |
| `faithfulActive` | Compiled | scriptFaithfulMode \\|\\| isScriptImported |
| `enableWordFilter` | State | 敏感词替换开关 |
| `currentPlatformId` | State | AI平台选择 |

**完整字段定义参考**：`_Input/1st/SOULLENS_PARAMETER_DICTIONARY.md`

## 风险点（需特别注意）

1. **faithfulActive** - 勿遗漏`isScriptImported`触发条件
2. **ChainEngine.isCancelled** - 所有异步点必须检查，防竞态
3. **file/url** - ObjectURL用完后需revoke，防内存泄漏
4. **sanResult.detectedRedZone** - 命中后必须强制弹窗阻断
5. **bridgeState传递** - 每场生成后提取，传递至下场输入
6. **assetNameMap重建** - 资产增删改后需重建映射表

## 开发检查清单

- [ ] 开发新功能前，先查阅`_Input/1st/soullensV5.1.html`对应逻辑
- [ ] 复杂功能（如ChainEngine）对照`_Input/1st/SOULLENS_MODULE_ANALYSIS.md`
- [ ] 参数使用对照`_Input/1st/SOULLENS_PARAMETER_DICTIONARY.md`
- [ ] 两阶段评估：定型前以源文件为准，定型后可接受第三方建议
- [ ] 颜色保持简洁，功能优先
- [ ] 不使用图片资源，只用lucide-react图标

## 注意事项

1. **不要添加未明确要求的内容** - 严格按用户指令执行
2. **复刻完整功能** - 除非用户明确说不要的
3. **两阶段评估** - 定型前对比源文件，定型后接受第三方建议
4. **颜色简洁** - 先实现功能，跑通后再优化视觉效果

---

## ⚠️ 核心开发原则（第一阶段）

### 1. 原程序逻辑完整移植

**核心需求**：第一阶段必须将原程序（soullensV5.1.html）中从剧本到分镜的核心逻辑和系统提示词**原样移植**。

**关键要求**：
- **不是"通了就行"** - 设计逻辑和算法必须与原程序相同
- **提示词结构一致** - 三层注入、分类人格、五维叙事铁律等必须完整复刻
- **验证标准** - 相同输入应产生相同/高度相似的输出

### 2. 提示词配置化

**后续目标**：将提示词提取到配置页面中，允许用户编辑。

**实现路径**：
1. 先将原程序提示词完整移植到 `prompts/` 目录
2. 实现 `lib/promptManager.ts` 热重载管理
3. 在设置页添加"系统提示词"编辑板块
4. 支持用户自定义覆盖默认提示词

### 3. 原程序核心提示词结构（必须完整移植）

```
┌─────────────────────────────────────────────────────────────┐
│                    System Prompt 构成                        │
├─────────────────────────────────────────────────────────────┤
│  1. 分类人格层（categoryGuides）                              │
│     - narrative: 好莱坞金牌编剧 + STC节拍理论                  │
│     - atmosphere: 视觉艺术家 + 情绪意境营造                    │
│     - suspense: 心理惊悚大师 + 不可见恐惧                      │
│     - anime: 资深动画监督 + 动漫视觉叙事                       │
│     - stcOff: 专业影视编剧 + 直接视觉化模式                    │
├─────────────────────────────────────────────────────────────┤
│  2. 导演风格注入                                              │
│     【导演风格：{name}】                                       │
│     ▶ 风格特征：{style}                                       │
│     ▶ 运镜手法：{techniques}                                  │
│     ▶ 光影风格：{lighting}                                    │
├─────────────────────────────────────────────────────────────┤
│  3. 资产标签约束                                              │
│     - 资产库信息（assetLibraryInfo）                          │
│     - 标签调用规则（assetCallRule）                           │
│     - 姓名映射指令（nameMappingInstruction）                   │
├─────────────────────────────────────────────────────────────┤
│  4. 时长与叙事规模                                            │
│     - burst模式（<25s）：极速瞬间，单一焦点                    │
│     - mini模式（<85s）：迷你弧线，小反转                       │
│     - full模式（≥85s）：链式生成，完整节拍                     │
├─────────────────────────────────────────────────────────────┤
│  5. 五维叙事铁律                                              │
│     ❶ 拒绝抽象：情绪必须视觉化                                 │
│     ❷ 动词驱动：【角色分动】必须含"正在"                        │
│     ❸ 细节禁区：【细节】只刻画微表情，禁止描述道具               │
│     ❹ 台词铁律：原文逐字不改                                   │
│     ❺ 资产一致：@标签全篇统一                                  │
├─────────────────────────────────────────────────────────────┤
│  6. 保真模式约束（可选）                                       │
│     - faithfulHeader：输入侧约束                              │
│     - faithfulSuffix：输出侧约束                              │
│     - 触发条件：scriptFaithfulMode || isScriptImported        │
└─────────────────────────────────────────────────────────────┘
```

### 4. 移植优先级

| 优先级 | 模块 | 状态 |
|-------|------|-----|
| P0 | 分类人格提示词（完整5种） | ❌ 待移植 |
| P0 | 导演风格注入逻辑 | ❌ 待移植 |
| P0 | 五维叙事铁律 | ❌ 待移植 |
| P0 | 时长路由规则（burst/mini/full） | ❌ 待移植 |
| P1 | ChainEngine 链式生成 | ❌ 待移植 |
| P1 | 视觉桥梁 bridgeState | ❌ 待移植 |
| P1 | 资产标签替换系统 | ❌ 待移植 |
| P2 | 安全过滤系统 | ❌ 待移植 |
| P2 | 单镜修改功能 | ❌ 待移植 |
| P3 | 提示词配置页面 | ❌ 待开发 |
