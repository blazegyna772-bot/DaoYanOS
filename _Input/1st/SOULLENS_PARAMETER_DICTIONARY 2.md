# SoulLens 参数字典

> 目的：单独沉淀 SoulLens 原型里的参数体系，按系统设计视角梳理字段、来源、写入点、读取点与作用。
>
> 原始文件：`/root/.openclaw/workspace/projects/已完成项目/soullens页面实验/soullensV5_original.html`

---

## 字段说明

| 列名 | 含义 |
|---|---|
| 字段名 | 代码中的变量/状态/编译产物名 |
| 层级 | UI / State / Compiled / Runtime |
| 类型 | string / boolean / number / object / array / enum |
| 来源 | 用户输入 / 默认值 / AI产出 / 编译过程 |
| 写入点 | 在哪里被赋值 |
| 读取点 | 在哪里被消费 |
| 作用 | 对系统的实际作用 |

---

## 1. 剧本输入参数

| 字段名 | 层级 | 类型 | 来源 | 写入点 | 读取点 | 作用 |
|---|---|---|---|---|---|---|
| `plotInput` | UI | string | 用户输入 / txt导入 | `processRawScript()` / 文本框输入 | `analyzePlot()` / `generatePrompts()` / `runSafetyPreCheck()` | 剧本原文主输入 |
| `charCount` | UI | number | 实时统计 | input listener / 导入后同步 | UI | 字数显示 |
| `isScriptImported` | State | boolean | 导入剧本流程 | `processRawScript()` | `generatePrompts()` / `analyzePlot()` | 触发保真链 |

## 2. 时长与镜头规模参数

| 字段名 | 层级 | 类型 | 来源 | 写入点 | 读取点 | 作用 |
|---|---|---|---|---|---|---|
| `duration` | UI | number | 滑块/输入框 | `setDuration()` / `onDurationSlider()` / `onDurationInput()` | `analyzePlot()` / `generatePrompts()` / `stageA_splitScenes()` / `generateSingleSegment()` | 决定路由、镜头密度、扩写深度 |
| `shotMode` | UI | enum(`auto`,`custom`) | 用户选择 | 单选框 | `getShotCountMode()` → 生成流程 | 控制镜头数量分配方式 |
| `customShotCount` | UI | number | 用户输入 | `customShotInput` | `getCustomShotCount()` → `generateSingleSegment()` / `stageB_generateOneScene()` | 锁定总镜数或按场均分 |
| `narrativeMode` | Runtime | enum(`burst`,`mini`,`full`,`mood`,`plain`) | Stage A 推导 | `stageA_splitScenes()` | `stageB_generateOneScene()` | 控制场次生成规则 |
| `estimatedDuration` | Runtime | number | Stage A 计算 | `stageA_splitScenes()` | `stageB_generateOneScene()` / `stageC_mergeAndRender()` | 每场时长、时间轴约束 |
| `contentSummary` | Runtime | string | Stage A 产出 | `stageA_splitScenes()` | `stageB_generateOneScene()` | 每场唯一剧情依据 |

## 3. 风格参数

| 字段名 | 层级 | 类型 | 来源 | 写入点 | 读取点 | 作用 |
|---|---|---|---|---|---|---|
| `selectedDirector` | State | string | 用户点击导演卡 | `selectDirector(id)` | `analyzePlot()` / `buildBaseSystemPrompt()` / `stageA_splitScenes()` | 导演风格主入口 |
| `director.style` | State | string | 导演数据库 | 常量定义 | `analyzePlot()` / `buildBaseSystemPrompt()` | 风格特征注入 |
| `director.techniques` | State | string[] | 导演数据库 | 常量定义 | `analyzePlot()` | 运镜风格注入 |
| `director.lighting` | State | string | 导演数据库 | 常量定义 | `analyzePlot()` / `buildBaseSystemPrompt()` | 光影风格注入 |
| `director.category` | State | enum | 导演数据库 | 常量定义 | `analyzePlot()` / `stageA_splitScenes()` | 决定人格分类和切分模式 |
| `visualStyle` | UI | enum | 用户选择 | style radio | `buildBaseSystemPrompt()` / `generateSingleSegment()` | 视觉风格底盘 |
| `selectedStyleDesc` | Compiled | string | `visualStyle` 映射 | `buildBaseSystemPrompt()` | Stage B / 单段生成 | 人类可读视觉风格描述 |

## 4. 输出与画面参数

| 字段名 | 层级 | 类型 | 来源 | 写入点 | 读取点 | 作用 |
|---|---|---|---|---|---|---|
| `aspectRatio` | UI | enum | 用户选择 | 基础设定面板 | `buildBaseSystemPrompt()` / `generateSingleSegment()` | 最终提示词参数 `--ar` |
| `quality` | UI | enum | 用户选择 | 基础设定面板 | `buildBaseSystemPrompt()` / `generateSingleSegment()` | 最终提示词参数 `--quality` |
| `enableBGM` | UI | boolean | 用户开关 | Toggle | `buildBaseSystemPrompt()` / `stageB_generateOneScene()` / `generateSingleSegment()` | 决定是否追加禁用BGM |
| `enableSubtitle` | UI | boolean | 用户开关 | Toggle | `buildBaseSystemPrompt()` / `stageB_generateOneScene()` / `generateSingleSegment()` | 决定是否追加禁用字幕 |

## 5. 保真系统参数

| 字段名 | 层级 | 类型 | 来源 | 写入点 | 读取点 | 作用 |
|---|---|---|---|---|---|---|
| `scriptFaithfulMode` | State | boolean | 用户开关 | `toggleFaithfulMode()` | `isFaithfulMode()` / `generatePrompts()` / `stageB_generateOneScene()` | 主动保真开关 |
| `faithfulActive` | Compiled | boolean | `scriptFaithfulMode || isScriptImported` | `generatePrompts()` | 单段/链式生成 | 决定是否注入保真约束 |
| `faithfulHeader` | Compiled | string | 保真编译 | `generatePrompts()` | `stageA_splitScenes()` / 单段生成 | 输入侧不可篡改头部 |
| `faithfulSuffix` | Compiled | string | 保真编译 | `stageB_generateOneScene()` / `generateSingleSegment()` | finalSystemPrompt | 输出侧最高优先级约束 |
| `effectivePlotForGenerate` | Compiled | string | `faithfulHeader + cleanPlot` | `generatePrompts()` | Stage A / 单段生成 | 最终用于生成的剧情文本 |

## 6. 安全审核与词过滤参数

| 字段名 | 层级 | 类型 | 来源 | 写入点 | 读取点 | 作用 |
|---|---|---|---|---|---|---|
| `enableWordFilter` | UI/State | boolean | 用户开关 | `quickToggleWordFilter()` / 设置恢复 | `isWordFilterEnabled()` / `sanitizePrompt()` | 是否启用词替换 |
| `autoSafetyCheck` | UI/State | boolean | 用户开关 | 设置保存/读取 | `generatePrompts()` | 是否生成前自动预检 |
| `safetyReplacements` | State | object map | 内置词典 | 常量定义 | `sanitizePrompt()` | 自动替换敏感词 |
| `strictBannedWords.redZone` | State | string[] | 内置词库 | 常量定义 | `sanitizePrompt()` | 绝对禁区检测 |
| `strictBannedWords.yellowZone` | State | string[] | 内置词库 | 常量定义 | `sanitizePrompt()` | 版权/IP/品牌检测 |
| `strictBannedWords.celebrityZone` | State | string[] | 内置词库 | 常量定义 | `sanitizePrompt()` | 名人检测 |
| `strictBannedWords.ipZone` | State | string[] | 内置词库 | 常量定义 | `sanitizePrompt()` | 知名角色/IP检测 |
| `sanResult.text` | Runtime | string | `sanitizePrompt()` 输出 | `sanitizePrompt()` | 生成前写回输入框 | 替换后的安全文本 |
| `sanResult.replaced` | Runtime | array | `sanitizePrompt()` 输出 | `sanitizePrompt()` | 预检报告 / 生成前提示 | 已替换项 |
| `sanResult.detectedRedZone` | Runtime | array | `sanitizePrompt()` 输出 | `sanitizePrompt()` | `generatePrompts()` | 是否拦截 |

## 7. 资产库参数

| 字段名 | 层级 | 类型 | 来源 | 写入点 | 读取点 | 作用 |
|---|---|---|---|---|---|---|
| `materials.character` | State | array | 手填 / AI提取 | `fillMaterialsFromExtraction()` / `updateAssetDesc()` | `buildBaseSystemPrompt()` | 角色资产源 |
| `materials.image` | State | array | 手填 / AI提取 | 同上 | `buildBaseSystemPrompt()` | 场景资产源 |
| `materials.props` | State | array | 手填 / AI提取 | 同上 | `buildBaseSystemPrompt()` | 道具资产源 |
| `name` | State | string | 文件名 / AI提取 | 上传 / 填充 | UI / 映射 | 资产名 |
| `desc` | State | string | 手填 / AI提取 | `updateAssetDesc()` / `fillMaterialsFromExtraction()` | prompt 编译 | 资产描述核心 |
| `file` | Runtime | File/null | 用户上传 | `handleMaterialUpload()` | UI | 当前会话参考图 |
| `url` | Runtime | string/null | `URL.createObjectURL` | `handleMaterialUpload()` | UI | 缩略图预览 |
| `assetNameMap` | State | object map | AI提取后建立 | `buildAssetMap()` | 保真 / basePrompt / 标签替换 | 原名到标签映射 |
| `assetTagEnabled.character` | UI/State | boolean | 用户开关 | `toggleAssetTag('character')` | `buildBaseSystemPrompt()` / 保真 | 角色走 @标签还是文字 |
| `assetTagEnabled.image` | UI/State | boolean | 用户开关 | `toggleAssetTag('image')` | 同上 | 场景走 @标签还是文字 |
| `assetTagEnabled.props` | UI/State | boolean | 用户开关 | `toggleAssetTag('props')` | 同上 | 道具走 @标签还是文字 |

## 8. Prompt 编译产物参数

| 字段名 | 层级 | 类型 | 来源 | 写入点 | 读取点 | 作用 |
|---|---|---|---|---|---|---|
| `styleContext` | Compiled | string | 导演+视觉风格 | `buildBaseSystemPrompt()` | Stage B / 单段生成 | 全局风格约束 |
| `donghuaRules` | Compiled | string | 动漫导演特化 | `buildBaseSystemPrompt()` | Stage B / 单段生成 | 国漫/动漫额外约束 |
| `assetLibraryInfo` | Compiled | string | 资产编译 | `buildBaseSystemPrompt()` | Stage B / 单镜修改 | 资产清单+标签铁律 |
| `assetCallRule` | Compiled | string | 资产编译 | `buildBaseSystemPrompt()` | Stage B / 单镜修改 | 资产调用准则 |
| `nameMappingInstruction` | Compiled | string | 资产编译 | `buildBaseSystemPrompt()` | Stage B / 单镜修改 | 角色名→@人物映射 |
| `subjectTagHint` | Compiled | string | 资产编译 | `buildBaseSystemPrompt()` | Stage B / 单段生成 | 主体字段写法提示 |
| `hasAnyTagAsset` | Compiled | boolean | 资产编译 | `buildBaseSystemPrompt()` | 多处逻辑判断 | 是否有启用标签的资产 |

## 9. 链式运行时参数（ChainEngine）

| 字段名 | 层级 | 类型 | 来源 | 写入点 | 读取点 | 作用 |
|---|---|---|---|---|---|---|
| `ChainEngine.scenes` | Runtime | array | Stage A 结果 | `stageA_splitScenes()` 返回后 | Stage B / C / retry | 场次列表 |
| `ChainEngine.totalDuration` | Runtime | number | `duration` | `generatePrompts()` | timeline / Stage A | 总时长 |
| `ChainEngine.globalOffset` | Runtime | number | 运行中累计 | `generatePrompts()` / `retryScene()` / 循环内累加 | Stage B | 当前场次起始偏移 |
| `ChainEngine.isCancelled` | Runtime | boolean | 用户中止 | `cancelChainGeneration()` | 生成循环 | 是否中止 |
| `ChainEngine.isRunning` | Runtime | boolean | 主流程状态 | `generatePrompts()` | `retryScene()` | 防竞争 |
| `ChainEngine.cleanPlot` | Runtime | string | 生成前编译文本 | `generatePrompts()` | Stage A / fallback | 链式主文本 |
| `ChainEngine.sceneContents` | Runtime | object map | 每场生成结果 | `stageB_generateOneScene()` | Stage C / refine / 单镜修改 | 每场 markdown |
| `ChainEngine.sceneChatHistory` | Runtime | object map | 每场对话历史 | `stageB_generateOneScene()` | 单镜修改 / retry | 场次独立上下文 |
| `scene.bridgeState` | Runtime | object | 场次结束后提取 | `stageB_generateOneScene()` | 下一场次 | 视觉桥梁 |
| `previousBridgeState` | Runtime | object/null | 上一场 bridgeState | 生成循环中传递 | `stageB_generateOneScene()` | 场次衔接 |

## 10. 单镜精准修改参数

| 字段名 | 层级 | 类型 | 来源 | 写入点 | 读取点 | 作用 |
|---|---|---|---|---|---|---|
| `currentEditShotIndex` | Runtime | number | 点按钮选择 | `openSingleShotModal()` / `openSingleShotModalChain()` | `submitSingleShotEdit()` | 当前镜号 |
| `currentEditSceneId` | Runtime | number/null | 链式场次定位 | `openSingleShotModalChain()` | `submitSingleShotEdit()` | 当前场次 |
| `relShotIndex` | Runtime | number | 运行时计算 | `submitSingleShotEdit()` | 单镜修改 prompt | 场次内镜号 |
| `request` | Runtime | string | 用户输入 | `singleShotInput` | `submitSingleShotEdit()` | 修改要求 |
| `currentTable` | Runtime | string | 场次表/全局表 | `submitSingleShotEdit()` | 单镜修改请求 | 当前上下文表格 |
| `singleShotSystemContent` | Compiled | string | fresh basePrompt + 约束 | `submitSingleShotEdit()` | buildRequest | 单镜修改 system prompt |
| `newContent` | Runtime | string | AI 返回 | `submitSingleShotEdit()` | 写回 sceneContents/chatHistory | 修改后的完整表格 |

## 11. 全局修改参数

| 字段名 | 层级 | 类型 | 来源 | 写入点 | 读取点 | 作用 |
|---|---|---|---|---|---|---|
| `refineText` | Runtime | string | 用户输入 | `refineInput` | `refinePrompts()` | 全局修改要求 |
| `currentTable` | Runtime | string | 当前全表 | `refinePrompts()` | buildRequest | 全局修改输入 |
| `MAX_TABLE_CHARS` | Runtime | number | 常量 | `refinePrompts()` | 截断保护 | 防 context 爆炸 |
| `tableForRequest` | Runtime | string | 截断后表格 | `refinePrompts()` | buildRequest | 实际发送内容 |
| `output` | Runtime | string | AI 返回 | `refinePrompts()` | 渲染 / chatHistory | 全局修改后的完整表格 |

## 12. 平台/API 参数

| 字段名 | 层级 | 类型 | 来源 | 写入点 | 读取点 | 作用 |
|---|---|---|---|---|---|---|
| `currentPlatformId` | State | string | 用户设置 | `selectPlatform()` | `buildRequest()` | 选择平台 |
| `endpoint` | State | string | 平台配置/自定义 | 设置保存/读取 | `buildRequest()` | API 地址 |
| `model` | State | string | 用户选择 | 设置保存/读取 | `buildRequest()` | 模型名 |
| `mode` | State | enum(`openai`,`gemini`) | 平台定义 | 设置保存/读取 | `buildRequest()` | 请求协议 |
| `apiKey` | State | string | 用户输入 | 设置保存/读取 | `buildRequest()` | 鉴权 |

---

## 附录 A：字段依赖关系表

> 说明：→ 表示"影响/决定"，⇄ 表示"双向联动"

### A1. 输入层依赖链

| 被依赖字段 | 依赖字段 | 关系类型 | 说明 |
|---|---|---|---|
| `faithfulActive` | `scriptFaithfulMode` + `isScriptImported` | 或运算 | 任一开启即激活保真模式 |
| `effectivePlotForGenerate` | `faithfulHeader` + `cleanPlot` | 字符串拼接 | 保真头+清洗后剧本 |
| `faithfulHeader` | `faithfulActive` | 条件编译 | 激活时才生成 |
| `faithfulSuffix` | `faithfulActive` | 条件编译 | 激活时才追加 |

### A2. 导演风格依赖链

| 被依赖字段 | 依赖字段 | 关系类型 | 说明 |
|---|---|---|---|
| `styleContext` | `selectedDirector` + `visualStyle` | 组合映射 | 导演库+视觉风格→风格上下文 |
| `donghuaRules` | `selectedDirector.category` | 条件判断 | category为动漫/国漫时注入 |
| `selectedStyleDesc` | `visualStyle` | 枚举映射 | 视觉风格→人类可读描述 |

### A3. 资产标签依赖链

| 被依赖字段 | 依赖字段 | 关系类型 | 说明 |
|---|---|---|---|
| `assetLibraryInfo` | `materials.*` + `assetTagEnabled.*` | 条件过滤 | 只编译启用标签的资产 |
| `assetCallRule` | `hasAnyTagAsset` | 条件编译 | 有标签资产时才生成规则 |
| `nameMappingInstruction` | `assetNameMap` | 直接引用 | 原名→@标签映射说明 |
| `subjectTagHint` | `assetTagEnabled.*` | 条件编译 | 启用标签时提示写法 |
| `hasAnyTagAsset` | `assetTagEnabled.*` + `materials.*` | 存在性检查 | 任一类别启用即true |

### A4. 时长-镜头依赖链

| 被依赖字段 | 依赖字段 | 关系类型 | 说明 |
|---|---|---|---|
| `narrativeMode` | `duration` + `plotInput` | 推导计算 | Stage A根据时长和剧本推导 |
| `estimatedDuration` | `duration` / `customShotCount` | 分配计算 | 总时长÷镜头数或场均分 |
| `customShotCount` | `shotMode` | 条件启用 | shotMode=custom时才生效 |

### A5. 链式运行时依赖链

| 被依赖字段 | 依赖字段 | 关系类型 | 说明 |
|---|---|---|---|
| `ChainEngine.globalOffset` | `ChainEngine.scenes[i-1].duration` | 累加计算 | 前序场次时长累加 |
| `previousBridgeState` | `scene[i-1].bridgeState` | 传递引用 | 上一场视觉状态传递 |
| `scene.bridgeState` | `stageB_generateOneScene()`输出 | 提取赋值 | 每场结束后提取 |
| `ChainEngine.sceneContents` | `stageB_generateOneScene()` | 写入映射 | sceneId→markdown内容 |
| `ChainEngine.sceneChatHistory` | `stageB_generateOneScene()` | 写入映射 | sceneId→对话历史 |

### A6. 安全审核依赖链

| 被依赖字段 | 依赖字段 | 关系类型 | 说明 |
|---|---|---|---|
| `sanResult.text` | `plotInput` + `enableWordFilter` | 条件处理 | 开启过滤时才替换 |
| `sanResult.replaced` | `safetyReplacements`命中项 | 数组收集 | 记录所有替换操作 |
| `sanResult.detectedRedZone` | `strictBannedWords.redZone` | 匹配检测 | 命中即拦截 |

### A7. 单镜修改依赖链

| 被依赖字段 | 依赖字段 | 关系类型 | 说明 |
|---|---|---|---|
| `relShotIndex` | `currentEditShotIndex` + 场次偏移 | 计算得出 | 全局镜号→场次内镜号 |
| `singleShotSystemContent` | `buildBaseSystemPrompt()` + 修改约束 | 动态编译 | 基于当前basePrompt+
| `newContent` | `currentTable` + `request` | AI生成 | 输入表格+修改要求→新表格 |

---

## 附录 B：关键字段生命周期表

> 阶段：Init(初始化) → Input(输入期) → Compile(编译期) → Runtime(运行时) → Cleanup(清理)

### B1. 剧本输入类生命周期

| 字段名 | 创建时机 | 覆盖时机 | 清理时机 | 持久化 |
|---|---|---|---|---|
| `plotInput` | 页面加载/txt导入 | 每次新输入/导入 | 页面关闭 | localStorage(可选) |
| `charCount` | input事件监听 | 每次输入变化 | 页面关闭 | 不持久化 |
| `isScriptImported` | `processRawScript()`成功 | 下次导入 | 页面关闭 | sessionStorage |

### B2. 导演风格类生命周期

| 字段名 | 创建时机 | 覆盖时机 | 清理时机 | 持久化 |
|---|---|---|---|---|
| `selectedDirector` | 用户点击导演卡 | 切换导演 | 页面关闭 | localStorage |
| `director.*` | 选择后从常量库读取 | 切换导演 | 页面关闭 | 不持久化(常量) |
| `visualStyle` | 用户选择/默认值 | 切换风格 | 页面关闭 | localStorage |
| `selectedStyleDesc` | `buildBaseSystemPrompt()`时编译 | 每次重新编译 | 单次生成结束 | 不持久化 |

### B3. 保真系统类生命周期

| 字段名 | 创建时机 | 覆盖时机 | 清理时机 | 持久化 |
|---|---|---|---|---|
| `scriptFaithfulMode` | 用户开关/设置恢复 | 用户切换 | 页面关闭 | localStorage |
| `faithfulActive` | `generatePrompts()`时计算 | 每次生成重新计算 | 单次生成结束 | 不持久化 |
| `faithfulHeader` | `generatePrompts()`时编译 | 每次生成重新编译 | 单次生成结束 | 不持久化 |
| `faithfulSuffix` | Stage B生成时编译 | 每次生成重新编译 | 单次生成结束 | 不持久化 |
| `effectivePlotForGenerate` | `generatePrompts()`时拼接 | 每次生成重新拼接 | 单次生成结束 | 不持久化 |

### B4. 资产库类生命周期

| 字段名 | 创建时机 | 覆盖时机 | 清理时机 | 持久化 |
|---|---|---|---|---|
| `materials.*` | 手填/AI提取/上传 | 增删改资产 | 页面关闭 | localStorage |
| `assetNameMap` | AI提取后`buildAssetMap()` | 资产变化时重建 | 页面关闭 | 不持久化(可重建) |
| `assetTagEnabled.*` | 用户开关/默认值 | 用户切换 | 页面关闭 | localStorage |
| `file` / `url` | `handleMaterialUpload()` | 新上传覆盖 | 页面关闭/手动删除 | 不持久化(内存URL) |

### B5. Prompt编译产物生命周期

| 字段名 | 创建时机 | 覆盖时机 | 清理时机 | 持久化 |
|---|---|---|---|---|
| `styleContext` | `buildBaseSystemPrompt()` | 每次重新编译 | 单次生成结束 | 不持久化 |
| `donghuaRules` | `buildBaseSystemPrompt()`条件编译 | 每次重新编译 | 单次生成结束 | 不持久化 |
| `assetLibraryInfo` | `buildBaseSystemPrompt()` | 资产变化时重建 | 单次生成结束 | 不持久化 |
| `assetCallRule` | `buildBaseSystemPrompt()` | 每次重新编译 | 单次生成结束 | 不持久化 |
| `nameMappingInstruction` | `buildBaseSystemPrompt()` | 每次重新编译 | 单次生成结束 | 不持久化 |
| `subjectTagHint` | `buildBaseSystemPrompt()` | 每次重新编译 | 单次生成结束 | 不持久化 |
| `hasAnyTagAsset` | `buildBaseSystemPrompt()`计算 | 每次重新计算 | 单次生成结束 | 不持久化 |

### B6. 链式运行时生命周期

| 字段名 | 创建时机 | 覆盖时机 | 清理时机 | 持久化 |
|---|---|---|---|---|
| `ChainEngine.scenes` | `stageA_splitScenes()`返回 | 重新生成时全量覆盖 | `cancelChainGeneration()`/完成 | 不持久化 |
| `ChainEngine.totalDuration` | `generatePrompts()`传入 | 固定不变 | 链式结束 | 不持久化 |
| `ChainEngine.globalOffset` | 生成循环中累加初始化 | 每场生成后累加 | 链式结束 | 不持久化 |
| `ChainEngine.isCancelled` | `cancelChainGeneration()`置true | 用户点击取消 | 链式结束重置false | 不持久化 |
| `ChainEngine.isRunning` | `generatePrompts()`置true | 开始/结束切换 | 链式结束置false | 不持久化 |
| `ChainEngine.cleanPlot` | `generatePrompts()`清洗后 | 重新生成时覆盖 | 链式结束 | 不持久化 |
| `ChainEngine.sceneContents` | `stageB_generateOneScene()`逐场写入 | 单镜修改时更新 | 链式结束/新链式清空 | 不持久化 |
| `ChainEngine.sceneChatHistory` | `stageB_generateOneScene()`逐场写入 | retry/修改时追加 | 链式结束/新链式清空 | 不持久化 |
| `scene.bridgeState` | `stageB_generateOneScene()`提取 | 每场独立 | 传递至下一场后丢弃 | 不持久化 |
| `previousBridgeState` | 生成循环中传递 | 每场更新 | 链式结束置null | 不持久化 |

### B7. 单镜修改类生命周期

| 字段名 | 创建时机 | 覆盖时机 | 清理时机 | 持久化 |
|---|---|---|---|---|
| `currentEditShotIndex` | 点击修改按钮时设置 | 选择另一镜时覆盖 | 关闭修改弹窗/提交后 | 不持久化 |
| `currentEditSceneId` | `openSingleShotModalChain()` | 选择另一镜时覆盖 | 关闭修改弹窗/提交后 | 不持久化 |
| `relShotIndex` | `submitSingleShotEdit()`计算 | 每次提交重新计算 | 提交结束 | 不持久化 |
| `request` | 用户输入 | 每次修改重新输入 | 提交后清空 | 不持久化 |
| `singleShotSystemContent` | `submitSingleShotEdit()`编译 | 每次修改重新编译 | 提交结束 | 不持久化 |
| `newContent` | AI返回后 | 每次修改重新生成 | 写回后丢弃 | 不持久化 |

### B8. 全局修改类生命周期

| 字段名 | 创建时机 | 覆盖时机 | 清理时机 | 持久化 |
|---|---|---|---|---|
| `refineText` | 用户输入 | 每次修改重新输入 | 提交后清空 | 不持久化 |
| `currentTable` | `refinePrompts()`时捕获 | 每次修改重新捕获 | 提交结束 | 不持久化 |
| `tableForRequest` | `refinePrompts()`截断后 | 每次修改重新处理 | 提交结束 | 不持久化 |
| `output` | AI返回后 | 每次修改重新生成 | 渲染后保留在UI | 不持久化 |

### B9. 安全审核类生命周期

| 字段名 | 创建时机 | 覆盖时机 | 清理时机 | 持久化 |
|---|---|---|---|---|
| `enableWordFilter` | 用户开关/设置恢复 | 用户切换 | 页面关闭 | localStorage |
| `autoSafetyCheck` | 用户开关/设置恢复 | 用户切换 | 页面关闭 | localStorage |
| `safetyReplacements` | 系统常量 | 版本更新 | 应用更新 | 内置常量 |
| `strictBannedWords.*` | 系统常量 | 版本更新 | 应用更新 | 内置常量 |
| `sanResult.*` | `sanitizePrompt()`执行时 | 每次调用重新生成 | 函数返回后丢弃 | 不持久化 |

---

## 附录 C：风险字段速查

| 字段名 | 风险点 | 缓解措施 |
|---|---|---|
| `faithfulActive` | 误关闭导致剧本偏离 | UI高亮状态，切换时二次确认 |
| `ChainEngine.isCancelled` | 竞态条件 | 所有异步点检查标志位 |
| `file` / `url` | 内存泄漏(ObjectURL) | 页面关闭前revokeObjectURL |
| `sanResult.detectedRedZone` | 拦截后未提示用户 | 强制弹窗阻断，明确告知 |
| `apiKey` | 敏感信息泄露 | 存储加密，界面脱敏显示 |
| `ChainEngine.sceneChatHistory` | 内存膨胀 | 设置单场上限，超限时截断 |
| `customShotCount` | 与duration冲突 | 输入校验，异常值回退到auto |

---

## 版本记录

| 版本 | 日期 | 变更 |
|---|---|---|
| v1.0 | 2026-03-17 | 初始版本：12类参数定义 |
| v1.1 | 2026-03-17 | 追加附录A/B/C：依赖关系、生命周期、风险速查 |
