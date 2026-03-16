# SoulLens 模块拆解记录

> 目的：拆解旧版 SoulLens HTML 原型的关键模块实现方式，作为后续 Seedance OS 迁移与重构参考。
>
> 原始文件：`/root/.openclaw/workspace/projects/已完成项目/soullens页面实验/soullensV5_original.html`

---

## 模块 01：导演风格系统

### 1. 结论
SoulLens 的“导演风格”不是“一位导演 = 一整套固定 system prompt”。

它采用的是 **三层注入结构**：

1. **导演数据层**  
   用结构化字段描述导演风格特征
2. **分类人格层**  
   按导演 `category` 映射到不同写作人格 / 系统规则
3. **任务拼装层**  
   在具体功能中，把导演信息 + 分类人格 + 当前参数拼成最终 system prompt

也就是说：

**导演对象 + 分类规则 + 当前任务上下文 = 最终提示词约束**

---

### 2. 导演对象的数据结构

以诺兰为例：

```js
{
  id: 'nolan',
  name: '克里斯托弗·诺兰',
  nameEn: 'Christopher Nolan',
  style: '非线性叙事、IMAX实拍、时间概念',
  techniques: ['Dolly Zoom', '超大广角', '交叉剪辑', '实拍特效'],
  lighting: '高对比、冷峻、IMAX质感',
  films: ['盗梦空间', '星际穿越', '奥本海默'],
  color: 'from-blue-600 to-slate-800',
  category: 'scifi'
}
```

### 3. 真正参与推理的核心字段

#### 直接进入 AI 推理的字段
- `style`：总体风格描述
- `techniques`：典型镜头 / 剪辑 / 运镜技法
- `lighting`：典型光影风格
- `category`：决定进入哪一类系统人格 prompt

#### 主要用于 UI / 展示的字段
- `films`
- `color`
- `name`
- `nameEn`

---

### 4. 分类人格层（categoryGuides）

SoulLens 没有为 28 位导演各写一整套独立 prompt，
而是先把导演映射到几种“系统人格”：

- `narrative`
- `atmosphere`
- `suspense`
- `anime`
- `stcOff`

#### narrative
适用：`scifi / action / war / classic / all`

人格：
> 好莱坞金牌编剧，深度运用《救猫咪》(Save the Cat) 剧本结构理论

特点：
- 强调原始驱动力
- 强调主题前置埋点
- 强调物理冲突
- 强调节拍结构

#### atmosphere
适用：`oriental / visual / minimalist`

人格：
> 视觉艺术家与散文诗人，专注于影像氛围与情绪意境的营造

特点：
- 强调色彩心理
- 强调光影纹理
- 强调空间留白
- 弱化强冲突和硬叙事结构

#### suspense
适用：`thriller / horror`

人格：
> 心理惊悚大师，专注于不可见之物的叙事力量

特点：
- 强调不在场之物
- 强调声音暗示
- 强调阴影遮蔽
- 强调不确定感和不可见恐惧

#### anime
适用：`anime`

人格：
> 资深动画监督，精通日系/中国3D动漫的视觉叙事语言

特点：
- 强调粒子特效
- 强调夸张动态曲线
- 强调华丽 3D 建模
- 强调视觉冲击优先于现实物理逻辑

#### stcOff
适用：关闭 STC / 戏剧结构构建时的降级模式

人格：
> 专业影视编剧，任务是将剧本内容直接转化为视觉画面描述，不添加任何叙事结构

特点：
- 只做视觉化
- 不主动构造冲突弧线
- 不植入节拍结构

---

### 5. 导演风格如何被拼进 system prompt

核心发生在 `analyzePlot()`。

#### 第一步：读取当前导演

```js
const director = directors.find(d => d.id === selectedDirector);
```

#### 第二步：按 category 映射人格 guide

```js
const cat = director ? director.category : 'classic';
```

然后按分类进入：
- narrative
- atmosphere
- suspense
- anime
- stcOff

#### 第三步：构造导演风格注入块

```js
styleInstruction = `【导演风格：${director.name}】
▶ 风格特征：${director.style}
▶ 运镜手法：${(director.techniques || []).join('、')}
▶ 光影风格：${director.lighting || ''}`;
```

#### 第四步：拼成最终 system prompt

核心结构：

```js
const systemPrompt = `你是一位才华横溢的${guide.persona}。
${styleInstruction}
...
- 整体风格必须高度符合【${director ? director.name : '通用'}】的视觉美学
...`;
```

---

### 6. 诺兰示例：最终起作用的大致提示词结构

```text
你是一位才华横溢的好莱坞金牌编剧，深度运用《救猫咪》(Save the Cat) 剧本结构理论。

【导演风格：克里斯托弗·诺兰】
▶ 风格特征：非线性叙事、IMAX实拍、时间概念
▶ 运镜手法：Dolly Zoom、超大广角、交叉剪辑、实拍特效
▶ 光影风格：高对比、冷峻、IMAX质感

【当前视频时长：30秒 | 扩写规格：建议150-250字】
【你的核心任务】：将用户提供的情节扩写为精彩的故事文本（expandedPlot）。

━━ 视觉化写作铁律 ━━
- 整体风格必须高度符合克里斯托弗·诺兰的视觉美学
- 所有情绪必须外化为可拍摄动作
...
```

重点：
**导演风格不是单独一句“模仿诺兰”，而是被拆成：风格特征 / 运镜手法 / 光影风格 三块注入。**

---

### 7. 导演风格在哪些功能区产生作用

#### 功能区 A：导演选择 UI
位置：
- `renderDirectors()`
- `selectDirector(id)`

作用：
- 让用户点击导演卡片
- 更新全局状态 `selectedDirector`

这里导演风格的身份是：
- 用户选择参数
- 全局状态参数

---

#### 功能区 B：AI 分析扩写 `analyzePlot()`
作用：
- 把导演风格正式注入 system prompt
- 影响 expandedPlot、recommendedShots、recommendedLighting、sceneBreakdown 等字段

这里导演风格的身份是：
- system prompt 约束参数
- 内容生成控制参数
- 镜头 / 光影推理参数

---

#### 功能区 C：正式生成阶段 `buildBaseSystemPrompt()`
核心代码：

```js
const styleContext = directorInfo.id === 'generic'
    ? `【创作模式】：${selectedStyleDesc}...`
    : `【视觉风格】：${selectedStyleDesc}。同时融合【${directorInfo.name}】的风格特征 (${directorInfo.style})。注意：禁止在输出中提到导演姓名。`;
```

这里导演风格的作用：
- 作为正式生成阶段的全局视觉基调
- 和 visualStyle 叠加成为长期约束

这里导演风格的身份是：
- 全局视觉基调参数
- 正式生成阶段的长期约束参数
- 风格融合参数

---

#### 功能区 D：视觉风格面板（visualStyle）
导演风格并不是单独使用，
而是和 `visualStyle` 叠加：

- `visualStyle` = 大风格母体
- `director` = 导演级审美偏置器

例如：
- 视觉风格选“电影写实”
- 导演选“王家卫”

最终形成的是：
**电影写实底盘 + 王家卫式镜头/色彩/情绪偏置**

---

#### 功能区 E：中间推理字段
在 `analyzePlot()` 的输出约束里，导演风格还会直接影响：

- `recommendedShots`
- `recommendedLighting`

这说明导演风格不仅影响“写法”，也影响：
- 镜头建议
- 光影建议
- 后续分镜参数生成

---

### 8. 特殊分支：动漫 / 国漫导演
动漫类不是只靠 `style / techniques / lighting`。

它还有 `donghuaProfile`：

```js
donghuaProfile: {
  charStyle: '3D精模人物、丝绸材质飘逸发丝、瞳孔流光、面容精致立体',
  worldStyle: '东方仙侠世界观、浮空仙山、灵脉山河、古朴宗门建筑',
  vfxStyle: '炫彩法术光效、灵力云雾、仙诀手印、飞剑如流星',
  promptSuffix: '中国3D修仙动漫风格，人物建模精细，东方仙侠美学...'
}
```

注入方式：

```text
【导演风格：xxx（资深动画监督）】
▶ 人物造型：...
▶ 世界观美学：...
▶ 特效表现：...
▶ 提示词基调：...
```

这说明 SoulLens 已经认识到：
**动画导演系统不能直接套用真人电影导演结构。**

---

### 9. 我对这套实现的判断

#### 优点
1. 导演风格被结构化了
2. 导演系统接入统一 prompt 引擎，而不是散落在 UI 文案里
3. 能和 visualStyle 叠加
4. 动画导演有特殊 profile，处理比真人导演更细

#### 不足
1. `style` 仍然偏一句话总结，颗粒度不够
2. 还没有沉淀成真正可编译的镜头 schema
   - 例如缺少：
     - 景别偏好
     - 焦段偏好
     - 镜头时长偏好
     - 剪辑节奏偏好
     - 构图偏好
3. 导演风格主要影响“扩写层”，还没有完全进入最终提示词编译层

---

### 10. 当前结论
SoulLens 的导演风格系统，本质上是一个：

**高阶美学控制参数系统**

它不是简单标签，而是分别在：
- UI 选择层
- system prompt 人格层
- 风格约束层
- 中间推理层
- 正式生成层

持续发挥作用。

后续建议继续拆：
1. 导演风格如何落到每镜 prompt 字段
2. 资产库标签系统
3. story timeline / chain engine
4. safety filter
5. 单镜修改

---

## 待续模块
- 模块 02：导演风格如何落到每镜 prompt 字段
- 模块 03：资产库与 @标签系统
- 模块 04：Storyline Timeline 与 Chain Engine
- 模块 05：安全过滤系统
- 模块 06：单镜精准修改

---

## 附录：导演风格系统分析原文记录（按当时回复原文补录）

先说结论：

**它这个“导演风格”不是一段固定 system prompt 模板直接硬编码到底。**  
它是一个 **三层注入结构**：

1. **导演数据层**：每个导演先定义成一个结构化对象  
2. **分类人格层**：按导演 `category` 映射到不同“系统人格/写作规则”  
3. **任务拼装层**：在具体功能里，把导演信息 + 分类人格 + 当前用户参数拼成最终 system prompt

所以它不是“一个导演 = 一整段独立 prompt 文件”，而是：
**导演对象 + 分类规则 + 当前任务上下文 = 最终提示词**

---

# 一、它到底给导演定义了什么字段

先看导演对象本身。  
以 **诺兰** 为例，原文件里就是这样定义的：

```js
{
    id: 'nolan',
    name: '克里斯托弗·诺兰',
    nameEn: 'Christopher Nolan',
    style: '非线性叙事、IMAX实拍、时间概念',
    techniques: ['Dolly Zoom', '超大广角', '交叉剪辑', '实拍特效'],
    lighting: '高对比、冷峻、IMAX质感',
    films: ['盗梦空间', '星际穿越', '奥本海默'],
    color: 'from-blue-600 to-slate-800',
    category: 'scifi'
}
```

它真正拿来参与 AI 推理的核心字段其实就 4 类：

- `style`  
  用来定义这个导演的总体风格标签
- `techniques`  
  用来定义这个导演典型的镜头/剪辑/技法
- `lighting`  
  用来定义这个导演偏好的光影基调
- `category`  
  这个最重要，决定它后面走哪一种“系统人格 prompt”

其他字段：
- `films` 主要是给 UI 展示、理解参考
- `color` 纯 UI
- `name` / `nameEn` 用于展示和在 prompt 里点名

---

# 二、导演风格不是直接一人一套 prompt，而是先走“分类人格”

这个文件里很关键的一段，是 `categoryGuides`。

它不是给 28 个导演分别写 28 套完整系统提示词。  
它是先把导演分成几类：

- `narrative`
- `atmosphere`
- `suspense`
- `anime`
- `stcOff`

然后不同导演按 `category` 映射过去。

## 映射关系大意

### 1）叙事型 narrative
适用于：
- scifi
- action
- war
- classic
- all

它对应的人格是：

```text
好莱坞金牌编剧，深度运用《救猫咪》(Save the Cat) 剧本结构理论
```

也就是说：
像诺兰、卡梅隆、斯皮尔伯格这类，不是只告诉模型“像诺兰拍”，  
而是先把模型变成一个 **擅长戏剧结构的编剧人格**。

---

### 2）氛围型 atmosphere
适用于：
- oriental
- visual
- minimalist

对应人格：

```text
视觉艺术家与散文诗人，专注于影像氛围与情绪意境的营造
```

这个时候它就不强调强冲突、强结构，  
而是强调：
- 色彩心理
- 光影纹理
- 空间留白
- 非线性意象

也就是说：
王家卫、韦斯安德森、张艺谋这一挂，会偏这个路数。

---

### 3）悬疑型 suspense
适用于：
- thriller
- horror

对应人格：

```text
心理惊悚大师，专注于不可见之物的叙事力量
```

然后它会强调：
- 门后的声音
- 看不见的恐惧
- 阴影遮蔽
- 不确定感

所以你看，**导演字段本身只是标签**，  
真正让 AI“进入某种创作脑回路”的，是这个分类人格层。

---

### 4）动漫型 anime
适用于：
- anime

对应人格：

```text
资深动画监督，精通日系/中国3D动漫的视觉叙事语言
```

然后规则就变成：
- 粒子特效
- 夸张动态曲线
- 华丽 3D 建模
- 视觉冲击优先于叙事逻辑

这个就是它把真人电影导演逻辑和动画监督逻辑拆开的关键。

---

# 三、它真正拼出来的 system prompt 长什么样

最关键的代码在 `analyzePlot()` 里。

它会构造一个 `systemPrompt`，核心结构是：

```js
const systemPrompt = `你是一位才华横溢的${guide.persona}。
${styleInstruction}

【当前视频时长：${duration}秒 | 扩写规格：${wordCountGuidance}】
【你的核心任务】：将用户提供的情节扩写为精彩的故事文本（expandedPlot）。

${isUltraShortAnalyze ? ultraShortOverride : guide.writingLogic}

━━ ⚠️ 台词原样保留协议（最高优先级，凌驾于所有其他规则之上）━━
...

━━ 视觉化写作铁律（所有分类通用）━━
...
- 整体风格必须高度符合【${director ? director.name : '通用'}】的视觉美学
...

━━ 其余分析字段 ━━
${motiveBlock}
- emotion：...
- recommendedShots：...
- recommendedLighting：...
- soundEffects：...
- sceneBreakdown：...

【输出格式】：只输出纯 JSON ...
`;
```

也就是说，导演风格不是独立 prompt 文件，  
而是通过这里的两个入口塞进去：

---

## 入口 A：`guide.persona`
这决定 **你是谁**

比如诺兰这种 narrative 类，会先变成：

```text
你是一位才华横溢的好莱坞金牌编剧，深度运用《救猫咪》(Save the Cat) 剧本结构理论。
```

---

## 入口 B：`styleInstruction`
这决定 **你要朝哪个导演审美收束**

普通导演时，它会写成：

```js
styleInstruction = `【导演风格：${director.name}】
▶ 风格特征：${director.style}
▶ 运镜手法：${(director.techniques || []).join('、')}
▶ 光影风格：${director.lighting || ''}`;
```

比如诺兰最终会变成：

```text
【导演风格：克里斯托弗·诺兰】
▶ 风格特征：非线性叙事、IMAX实拍、时间概念
▶ 运镜手法：Dolly Zoom、超大广角、交叉剪辑、实拍特效
▶ 光影风格：高对比、冷峻、IMAX质感
```

这就是你要的“导演系统提示词示例”的真实来源。

它不是一句“请模仿诺兰”，  
而是拆成三块：
- 风格特征
- 运镜手法
- 光影风格

这是它比较聪明的地方。

---

# 四、给你一个完整示例：诺兰导演风格在 `analyzePlot` 阶段怎么生效

假设当前：

- 选中导演：诺兰
- 视频时长：30 秒
- 视觉风格：电影写实
- STC 开启

那它给模型的大致 system prompt 会是这种结构：

```text
你是一位才华横溢的好莱坞金牌编剧，深度运用《救猫咪》(Save the Cat) 剧本结构理论。

【导演风格：克里斯托弗·诺兰】
▶ 风格特征：非线性叙事、IMAX实拍、时间概念
▶ 运镜手法：Dolly Zoom、超大广角、交叉剪辑、实拍特效
▶ 光影风格：高对比、冷峻、IMAX质感

【当前视频时长：30秒 | 扩写规格：建议150-250字】
【你的核心任务】：将用户提供的情节扩写为精彩的故事文本（expandedPlot）。

━━ 《救猫咪》原始动机规则（强制执行）━━
- 主角的原始驱动力必须是最直白的人类本能之一...
- 在故事开头10%处要埋主题...
- 每个场景节点必须有可见的物理冲突...

━━ 台词原样保留协议 ━━
- 用户输入里的引号台词必须逐字保留

━━ 视觉化写作铁律 ━━
- 所有情绪必须外化为可拍摄动作
- 整体风格必须高度符合克里斯托弗·诺兰的视觉美学

━━ 输出字段 ━━
- expandedPlot
- primaryMotive
- themeStatement
- emotion
- recommendedShots
- recommendedLighting
- soundEffects
- sceneBreakdown

【输出格式】：只输出 JSON
```

所以你看，它的导演风格作用不是“最后加一句风格词”，  
而是直接影响：

1. 你是谁  
2. 你按什么戏剧逻辑写  
3. 你用什么镜头语言想象  
4. 你按什么光影风格描述  
5. 你最后输出什么字段

---

# 五、这个导演风格具体在哪些功能区发生作用

你问得很对，不只是“它写进 prompt 了”，  
更关键是：**在哪些地方发生交互和作用**。

我给你按功能区拆。

---

## 1）功能区一：导演选择 UI
位置：
- `renderDirectors()`
- `selectDirector(id)`

作用：
- 用户点击某个导演卡片
- 把全局状态 `selectedDirector` 改掉

```js
let selectedDirector = 'generic';

function selectDirector(id) {
    selectedDirector = id;
    renderDirectors();
}
```

### 这里导演风格的参数身份
在这里它只是：
- **用户输入参数**
- **全局状态参数**

还没进 AI。

---

## 2）功能区二：AI 分析扩写 `analyzePlot()`
这是导演风格第一次真正进入模型。

流程是：

### 第一步：拿到选中导演
```js
const director = directors.find(d => d.id === selectedDirector);
```

### 第二步：判断它属于哪一类人格
```js
const cat = director ? director.category : 'classic';
...
if (isDonghua || ANIME_CATS.includes(cat)) guideKey = 'anime';
else if (ATMOSPHERE_CATS.includes(cat)) guideKey = 'atmosphere';
else if (SUSPENSE_CATS.includes(cat)) guideKey = 'suspense';
else guideKey = 'narrative';
```

### 第三步：拼 `styleInstruction`
```js
styleInstruction = `【导演风格：${director.name}】
▶ 风格特征：${director.style}
▶ 运镜手法：${(director.techniques || []).join('、')}
▶ 光影风格：${director.lighting || ''}`;
```

### 第四步：把它塞进 `systemPrompt`
最终影响：
- `expandedPlot`
- `recommendedShots`
- `recommendedLighting`
- `soundEffects`
- `sceneBreakdown`

### 这里导演风格的参数身份
在这里它是：
- **系统提示词约束参数**
- **内容生成控制参数**
- **镜头/光影推理参数**

---

## 3）功能区三：链式分段生成 `buildBaseSystemPrompt()`
这个是第二次深度生效。

这里不是“情节分析扩写”，  
而是后面正式做分镜/链式生成时，它继续作为基础系统约束。

关键代码：

```js
let directorInfo = directors.find(d => d.id === selectedDirector);

const styleContext = directorInfo.id === 'generic'
    ? `【创作模式】：${selectedStyleDesc}...`
    : `【视觉风格】：${selectedStyleDesc}。同时融合【${directorInfo.name}】的风格特征 (${directorInfo.style})。注意：禁止在输出中提到导演姓名。`;
```

这里和前面的不同点是：

### 前面 `analyzePlot`
更偏 **写故事、扩剧情、给镜头建议**

### 这里 `buildBaseSystemPrompt`
更偏 **正式生成分镜提示词时的长期基础约束**

它让导演风格变成一个长期的全局底色，而不是一次性分析变量。

### 这里导演风格的参数身份
在这里它是：
- **全局视觉基调参数**
- **正式生成阶段的长期约束参数**
- **和 visualStyle 叠加的风格融合参数**

---

## 4）功能区四：视觉风格面板
这个地方很容易忽略。

导演风格不是单独使用的，  
它还会和 `visualStyle` 叠加。

```js
const visualStyle = document.querySelector('input[name="visualStyle"]:checked').value;
const styleMap = {
  cinematic:'电影写实...',
  anime:'日式动漫...',
  cyberpunk:'赛博朋克...',
  ...
};
const selectedStyleDesc = styleMap[visualStyle] || '电影感';
```

然后再和导演合成：

```js
【视觉风格】：${selectedStyleDesc}。同时融合【${directorInfo.name}】的风格特征 (${directorInfo.style})
```

所以导演不是唯一风格源。

### 这里的实际逻辑是：
- `visualStyle` = 大风格母体  
- `director` = 美学偏置器 / 具体导演味道修正器

比如：
- 视觉风格选“电影写实”
- 导演选“王家卫”

那它不是纯王家卫，也不是纯写实，  
而是：
**电影写实底盘 + 王家卫偏色/节奏/镜头性格**

### 这里导演风格的参数身份
在这里它是：
- **风格融合参数**
- **视觉偏置参数**

---

## 5）功能区五：recommendedShots / recommendedLighting 的生成
在 `analyzePlot()` 的 system prompt 里它还明确写了：

```text
- recommendedShots：... 符合导演的运镜风格
- recommendedLighting：光影基调建议，符合导演 lighting 或 style
```

所以导演不只是影响故事语言，  
还直接影响两个中间结果字段：

- 镜头建议
- 光影建议

这两个字段之后又会反过来影响分镜生成。

### 这里导演风格的参数身份
在这里它是：
- **中间推理结果的生成约束**
- **镜头语言推荐器**
- **光影推荐器**

---

# 六、特殊情况：动漫/国漫导演为什么更重

动漫类不是只靠 `style / techniques / lighting` 三个字段。

它还有一层 `donghuaProfile`。

这层东西非常重，比如：

```js
donghuaProfile: {
    charStyle: '3D精模人物、丝绸材质飘逸发丝、瞳孔流光、面容精致立体',
    worldStyle: '东方仙侠世界观、浮空仙山、灵脉山河、古朴宗门建筑',
    vfxStyle: '炫彩法术光效、灵力云雾、仙诀手印、飞剑如流星',
    promptSuffix: '中国3D修仙动漫风格，人物建模精细，东方仙侠美学...'
}
```

然后它会被单独注入：

```js
【导演风格：xxx（资深动画监督）】
▶ 人物造型：...
▶ 世界观美学：...
▶ 特效表现：...
▶ 提示词基调：...
```

这个说明它已经意识到：

**动画导演风格不能只用真人电影导演那套字段表达。**

所以国漫导演系统，实际上是：
- 一套更强的角色建模约束
- 一套更强的世界观约束
- 一套更强的特效规范约束
- 一条固定 prompt suffix

这部分比普通导演的实现更成熟。

---

# 七、总结成一句话：导演风格到底被当成什么参数在用

如果压缩成一句：

**它把导演风格当成“高阶美学控制参数”在用，而不是普通标签。**

具体分层是：

### 1. UI 层
- 选择参数
- 展示参数

### 2. Prompt 层
- 系统人格补充
- 风格特征注入
- 运镜手法注入
- 光影风格注入

### 3. 推理层
- 决定 expandedPlot 的写法
- 决定 recommendedShots
- 决定 recommendedLighting
- 决定 sceneBreakdown 的组织方式

### 4. 生成层
- 作为后续正式分镜提示词生成的底层风格约束

---

# 八、我对它这套实现的判断

我直接说实话：

### 它好的地方
1. **导演风格结构化了**
   - style / techniques / lighting / category 拆得对

2. **导演不是单独 prompt，而是接入统一 prompt 引擎**
   - 可扩展性强

3. **导演风格和视觉风格分离**
   - 这点很对

4. **动漫导演有特殊 profile**
   - 说明它知道不同媒介语言不一样

---

### 它不足的地方
1. **导演字段太粗**
   - `style` 还是一句总结话
   - 还不够像真正可编译参数

2. **缺少“导演风格 → 镜头参数 schema”**
   - 比如诺兰应该细化到：
     - 景别偏好
     - 焦段偏好
     - 镜头时长偏好
     - 剪辑节奏偏好
     - 构图偏好
   - 现在还只是文本描述

3. **导演作用更多在“扩写阶段”，而不是“最终 prompt 编译阶段”**
   - 它是个很强的前端创作器
   - 但不是强编译器

---

如果你要的话，下一条我可以继续给你拆：

## 第二层：
**它的导演风格，最后是怎么具体落到每一镜的 prompt 字段里的**

也就是我继续往下讲：
- 它怎么从导演风格
- 变成镜头表里的列
- 又怎么变成最终给 Seedance 的提示词结构

这一层会更接近你现在要做的 Seedance OS。

---

## 附录：资产库系统与 @标签 分析原文记录（按当时回复原文补录）

好，这一块我按你刚才要的那种方式拆。  
我们就拆 **资产库系统 + `@标签` 系统**。

先说结论：

**这套系统本质上不是“素材备注栏”，而是一个“可被 prompt 编译器调用的结构化资产注入系统”。**

它分 5 层：

1. **资产槽位数据层**  
2. **资产提取与映射层**  
3. **标签模式开关层**  
4. **prompt 注入层**  
5. **最终提示词生成层**

所以它真正厉害的地方不是“能填人物设定”，  
而是它把这些设定一路送进了最终分镜 prompt。

---

# 一、它的核心数据结构是什么

先看最底层状态。

## 1）主资产库 `materials`
它的总资产状态是：

```js
let materials = { 
    character: Array.from({length: 10}, () => ({name: '', desc: '', file: null, url: null})),
    image:     Array.from({length: 10}, () => ({name: '', desc: '', file: null, url: null})),
    props:     Array.from({length: 10}, () => ({name: '', desc: '', file: null, url: null})),
    video: [], 
    audio: [] 
};
```

也就是说它固定有三类主资产：

- `character`
- `image`
- `props`

每类默认 10 个槽位。  
每个槽位结构是：

```js
{
  name: '',
  desc: '',
  file: null,
  url: null
}
```

### 每个字段的作用
- `name`  
  资产名。比如“韩立”“乱星海”“古铜令牌”
- `desc`  
  这个最关键，是最终注入 prompt 的核心描述
- `file`  
  本地上传文件对象，只用于当前会话
- `url`  
  文件预览地址，只用于 UI 缩略图

所以，**真正进入 AI 的，不是图片文件本身，而是 `name + desc`。**

---

## 2）名称到标签的映射表 `assetNameMap`
第二个特别关键的是：

```js
let assetNameMap = {}; 
// { "韩立": { tag:"@人物1", desc:"...", type:"character" }, ... }
```

这个是 **名字 → 标签** 的编译映射表。

比如最后会变成：

```js
{
  "韩立":   { tag: "@人物1", desc: "白衣修士，黑发束冠...", type: "character" },
  "乱星海": { tag: "@图片1", desc: "海雾弥漫的修仙海域...", type: "image" },
  "令牌":   { tag: "@道具1", desc: "古铜色令牌，正面龙纹...", type: "props" }
}
```

这个表是后面 prompt 注入的中枢。

---

## 3）标签模式开关 `assetTagEnabled`
第三个关键状态：

```js
let assetTagEnabled = { character: true, image: true, props: true };
```

意思是每一类资产可以单独切换：

- 开：用 `@人物N / @图片N / @道具N`
- 关：不用标签，直接把文字描述展开进 prompt

这点非常重要。  
它不是一刀切，而是 **每个资产类别分别决定走标签模式还是文字模式**。

---

# 二、它的 UI 是怎么把资产收进去的

## 1）三类资产卡片
在素材页里，它动态渲染三种卡片：

- 角色卡：`@人物1-10`
- 场景卡：`@图片1-10`
- 道具卡：`@道具1-10`

卡片核心输入就是 `textarea`：

```js
<textarea id="char_desc_${i}" oninput="updateAssetDesc('character', ${i})">
<textarea id="scene_desc_${i}" oninput="updateAssetDesc('image', ${i})">
<textarea id="prop_desc_${i}" oninput="updateAssetDesc('props', ${i})">
```

也就是说，用户输入描述时，实际上直接写进了：

```js
materials[type][index].desc
```

通过：

```js
function updateAssetDesc(type, index) {
    ...
    materials[type][index].desc = val;
    saveMaterials();
    updateAssetStats();
}
```

---

## 2）图片上传只是辅助，不是核心编译输入
上传图片走：

```js
handleMaterialUpload(type, index, inputEl)
```

这个函数只会：
- 存文件对象
- 生成预览图
- 自动用文件名填 `name`

但注意：

**文件本身不会持久化到最终生成逻辑里。**  
它在 `saveMaterials()` 时只保存：

```js
{
  name,
  desc
}
```

所以这套系统当前仍然是 **文本资产优先**，  
图片上传更像“人类辅助参考”。

---

# 三、它的资产是怎么来的：手填 + AI提取 两条上游

这个系统的上游来源有两条。

---

## 路径 A：人工手填
用户在素材库里直接填：
- 人物外貌
- 场景环境
- 道具细节

这就进入 `materials`

这是最直接的资产来源。

---

## 路径 B：AI 自动提取
这个更重要。

它有一个专门的提取 prompt：

```js
function buildExtractionSystemPrompt() {
    return `你是一位顶级影视统筹师...
你的任务：从剧本或故事文字中提取可供 AI 视频生成平台使用的完整视觉资产清单。
...
JSON 结构：
{
  "characters": [{"name":"角色原名","visual_desc":"50-80字详细视觉描述"}],
  "scenes":     [{"name":"场景原名","visual_desc":"50-80字详细视觉描述"}],
  "props":      [{"name":"道具原名","visual_desc":"50-80字详细视觉描述"}]
}
`
}
```

然后有两条调用路径：

### 路径 B1：导入剧本时提取
```js
processRawScript(text)
```

流程：
1. 剧本进 `plotInput`
2. 调 AI 提取角色 / 场景 / 道具
3. 回填素材库
4. 建立 `assetNameMap`

---

### 路径 B2：AI 扩写后静默提取
```js
runAssetExtractionSilent(text, source)
```

流程：
1. 先把剧本扩写
2. 再从扩写后的文本里提取资产
3. 回填素材库
4. 建立 `assetNameMap`

也就是说，资产库并不是孤立模块，  
它和“剧本输入 / AI扩写”直接连着。

---

# 四、它怎么把提取结果回填成资产库

这一步是：

```js
fillMaterialsFromExtraction(jsonData, animate)
```

它会把提取结果写回三类数组：

```js
materials.character[i] = { name: c.name || '', desc, file: null, url: null };
materials.image[i]     = { name: s.name || '', desc, file: null, url: null };
materials.props[i]     = { name: p.name || '', desc, file: null, url: null };
```

其中 `desc` 不是只写视觉描述，  
而是拼成：

```js
`${name}：${visual_desc}`
```

比如会变成：

- `韩立：白衣修士，黑发束冠，神情冷峻...`
- `乱星海：海雾弥漫的修仙海域，远处有灵舟...`
- `古铜令牌：古铜材质，表面刻龙纹，边缘磨损...`

这一步完成后，素材库就不是空卡片了，而是 AI 自动建好的结构化资产库。

---

# 五、`assetNameMap` 怎么建立

这是最关键的编译桥。

函数：

```js
function buildAssetMap(jsonData) {
    assetNameMap = {};
    (jsonData.characters || []).slice(0, 10).forEach((c, i) => {
        if (c.name) {
            assetNameMap[c.name] = { tag: `@人物${i+1}`, desc: c.visual_desc || '', type: 'character' };
        }
    });
    (jsonData.scenes || []).slice(0, 10).forEach((s, i) => {
        if (s.name) {
            assetNameMap[s.name] = { tag: `@图片${i+1}`, desc: s.visual_desc || '', type: 'image' };
        }
    });
    (jsonData.props || []).slice(0, 10).forEach((p, i) => {
        if (p.name) {
            assetNameMap[p.name] = { tag: `@道具${i+1}`, desc: p.visual_desc || '', type: 'props' };
        }
    });
}
```

### 这一步的意义
把“剧本里的名字”变成“prompt 里的标签引用”。

也就是说，后面模型可以被要求：

- 看到“韩立” → 不准写成普通文字
- 必须替换成 `@人物1`

这就是它从“素材备注”升级成“编译器输入”的关键。

---

# 六、标签模式开关怎么影响 prompt

函数：

```js
function toggleAssetTag(type) {
    assetTagEnabled[type] = !assetTagEnabled[type];
}
```

它影响的是后面 `buildBaseSystemPrompt()` 里的分流逻辑。

---

## 1）如果该类开了标签模式
比如角色开了：

```js
const charTagOn = assetTagEnabled.character !== false;
```

那么角色资产会进入：

```js
charAssets.push({ index, label: `@人物${i+1}`, desc })
```

后面会拼成这种 prompt 约束：

```text
【已注册资产清单（@标签模式）】：
  · @人物1 视觉定义：白衣修士，黑发束冠...
  · @图片1 场景定义：海雾弥漫的修仙海域...
  · @道具1 道具定义：古铜令牌，表面龙纹...

【标签替换铁律】：
⛔ 严禁在 [SEEDANCE提示词] 的 [主体] 字段直接书写任何外貌细节
✅ 必须替换为对应的资产标签（@人物1、@图片1 等）
```

也就是说：  
**开标签模式 = 强制 prompt 使用符号引用**

---

## 2）如果该类关了标签模式
比如角色关了，它不会要求用 `@人物N`，  
而是把角色描述展开成普通文字模式：

```text
【角色参考描述（文字模式，禁止使用@标签，直接写入提示词主体）】：
  · 人物1：白衣修士，黑发束冠...
  ✅ 以上角色请直接将外貌描述融入 [主体] 字段的文字中，不要使用任何@标签。
```

所以：

- 开标签模式：走“引用”
- 关标签模式：走“展开”

这点很高级，因为它允许不同生产偏好。

---

# 七、它在 prompt 里到底注入了哪些资产约束

这个是 `buildBaseSystemPrompt()` 里的核心。

我给你拆成几块。

---

## 1）资产定义段 `assetLibraryInfo`
这是资产的总注入块。

里面包含：

### A. 已注册资产清单
```text
· @人物1 视觉定义：...
· @图片1 场景定义：...
· @道具1 道具定义：...
```

### B. 标签替换铁律
```text
错误写法：[主体：白发少女在奔跑]
正确写法：[主体：(@人物1) 在奔跑]
```

### C. 画面描述列禁令
```text
@标签只允许出现在 [SEEDANCE提示词] 列
“画面描述”列必须用正常文字
```

这一条很重要。  
说明它不是所有字段都能用标签，  
它把：
- 人类可读列
- 机器提示词列

故意分开了。

---

## 2）姓名映射规则 `nameMappingLines`
这个更关键。

如果 `assetNameMap` 已经建立，它会在 prompt 里直接注入：

```text
【剧本角色→标签映射表（必须严格执行）】：
  · "韩立" → @人物1 ｜视觉描述：...
  · "南宫婉" → @人物2 ｜视觉描述：...
⚠️ 禁止在 [主体] 字段使用人名本身或重新描述外貌，必须用标签。
```

这意味着模型在生成分镜时，不是自由发挥，  
而是被硬性要求做“名字替换编译”。

---

## 3）道具一致性铁律 `propIronRule`
这条非常有生产价值。

当道具开标签模式时，它会注入：

```text
🔥【道具一致性铁律（最高优先级）】：
① 凡分镜画面或台词中涉及以上任意已注册道具，[SEEDANCE提示词] 必须显式包含 (@道具N) 标签
② 道具标签不得省略、合并或用文字描述替代
③ 道具特写镜头：整条提示词以该道具标签开头
```

这个其实已经不是“素材管理”，  
而是在做 **连续性控制规则引擎**。

---

## 4）资产调用准则 `assetCallRule`
它还会再补一层：

```text
【资产标签调用准则】：
· 每个出现已注册角色的镜头 → [主体] 字段必须使用 @人物N
· 场景与已注册环境匹配时 → [主体] 字段追加 @图片N
· 涉及已注册道具时 → [SEEDANCE提示词] 必须使用 @道具N
```

所以它不是只定义资产，而是连**调用时机**都写进 prompt 了。

---

# 八、它最终怎么作用到最终提示词生成

这个要看 `stageB_generateOneScene()`。

这里是正式生成分镜表的阶段。

它会从 `buildBaseSystemPrompt()` 拿到：

```js
const { 
  styleContext,
  donghuaRules,
  assetLibraryInfo,
  assetCallRule,
  subjectTagHint,
  nameMappingInstruction
} = basePrompt;
```

然后直接拼进正式 system prompt：

```js
const systemPrompt = `
${styleContext}
${assetLibraryInfo}
${donghuaRules}
${assetCallRule}
${nameMappingInstruction}
...
`;
```

然后它规定最终输出格式：

```text
[SEEDANCE提示词] 规范：
[主体：(${subjectTagHint})] [动作：...] [镜头：...] [光影：...] ...
```

如果有标签资产，它会把 `subjectTagHint` 设成类似：

```text
使用@标签替换角色姓名+镜头动态细节
```

也就是说，最终分镜 prompt 不是“可能会用标签”，  
而是 **prompt schema 本身已经要求主体字段按标签方式写。**

---

# 九、最终作用到提示词的方式是什么

总结一下最终落地效果：

---

## 情况 A：标签模式开启
假设：
- 韩立 → `@人物1`
- 乱星海 → `@图片1`
- 古铜令牌 → `@道具1`

那么最终某一镜的 SEEDANCE 提示词会被要求写成：

```text
[主体：(@人物1) 低头握紧 (@道具1)]
[动作：缓慢抬眼，衣袍在海风中扬起]
[镜头：中近景，缓慢推进]
[光影：冷蓝海雾，远处雷光映边]
```

而不是：

```text
[主体：韩立，白衣修士，手握古铜令牌]
```

重点是：  
**名字与外貌被抽象成标签引用。**

---

## 情况 B：标签模式关闭
那就变成文字展开：

```text
[主体：白衣修士，黑发束冠，手握古铜令牌]
```

这时候资产仍然参与了 prompt，  
但不是通过标签，而是通过文字展开。

---

# 十、这套系统的上下游链路

你刚才特别问“上下游”，这个我给你串成完整链。

---

## 上游输入
1. 手工填资产卡
2. 上传剧本后 AI 提取资产
3. AI 扩写后静默提取资产

---

## 中游结构化处理
1. 写入 `materials`
2. 建立 `assetNameMap`
3. 根据 `assetTagEnabled` 决定标签模式还是文字模式
4. 在 `buildBaseSystemPrompt()` 中编译成资产规则块

---

## 下游输出
1. 注入 `analyzePlot()` 的理解过程
2. 注入 `generatePrompts()` / `stageB_generateOneScene()`
3. 影响每镜的：
   - 主体字段
   - 场景字段
   - 道具字段
   - 连续性一致性
4. 通过 `highlightAtTags()` 在 UI 里高亮展示

---

# 十一、与它关联的旁支联系有哪些

这块也很重要，不只是主链。

---

## 1）和“保真模式”强关联
在保真模式下，它会额外要求：

```text
已开启@标签模式的素材类别，标签必须优先于任何外貌描写
```

也就是说保真模式 + 标签系统结合后，
会变成：
- 剧情不改
- 角色不重写
- 统一用已锁定资产标签

这其实非常适合连续性强的项目。

---

## 2）和“单镜修改”强关联
虽然你这次问的是资产系统，但它其实会直接影响单镜修改。

因为单镜修改后，如果一个镜头里出现：
- 已注册角色
- 已注册场景
- 已注册道具

那修改 prompt 也必须继续遵守这些标签规则。

所以资产库其实是单镜修改的底层约束之一。

---

## 3）和“高亮渲染”强关联
它有：

```js
highlightAtTags(html)
```

会把：
- `@人物N`
- `@图片N`
- `@道具N`

在界面上分别高亮成不同颜色。

这意味着：
资产系统不只是“后台编译规则”，  
它还是前台可视化解释系统。

---

## 4）和“安全过滤”弱关联
这块不是强耦合，但有关。

因为一旦角色/场景/道具是通过资产库锁定的，  
后续就不容易在每次 prompt 里随意出现：
- 名人名
- IP 名
- 危险替换词

所以资产库在某种程度上，也能提升 prompt 稳定性和可控性。

---

# 十二、我对这套资产库系统的判断

我直接给你结论：

## 它最有价值的地方
不是“素材管理”，而是这三点：

### 1. 名称 → 标签映射
这是最值钱的机制。  
它把“韩立”这种剧本名字，编译成 `@人物1`。

### 2. 标签模式 / 展开模式双通道
这个很成熟，不死板。

### 3. 资产规则直接进 system prompt
不是 UI 附属功能，而是进入最终生成链。

---

## 它的不足
### 1. 文件资产没有真正进入模型
现在图片只是预览，没有做真正多模态引用

### 2. `assetNameMap` 还是字符串替换级别
还没上升到更强的实体解析层

### 3. 缺少版本控制
资产改了之后，没有“这一版角色设定”的版本概念

---

# 十三、如果压缩成一句话

**SoulLens 的资产库系统，本质上是一个“角色/场景/道具的结构化一致性编译器”。**

它做的不是“记笔记”，而是：

- 把剧本实体抽出来
- 变成结构化资产
- 再变成标签映射
- 再注入到系统提示词
- 最后控制每镜 prompt 的主体/场景/道具表达方式

---

如果你要，下一步我可以继续按这个方式给你拆：

## 下一层：
**它这个资产库系统，最后在“单镜修改”和“重新生成”里是怎么被继承的**

这个会更接近生产环境里的“为什么改一镜不乱全片”。

---

## 模块 02：链式分段生成（Chain Engine）图案化拆解

### 0）一句话概括（图案版）

```
输入剧本 plot + 总时长 duration
        |
        v
   ┌───────────┐
   │ STAGE A   │  切分场次 + 每场次摘要 contentSummary（并强制保留台词）
   └─────┬─────┘
         |
         v
   ┌───────────┐
   │ STAGE B   │  逐场次生成分镜表（强制时间轴、镜数、@标签资产一致性）
   └─────┬─────┘
         |
         v
   ┌───────────┐
   │ STAGE C   │  无缝拼接渲染（按场次锚点合并输出，注入“修改此镜”按钮）
   └───────────┘
```

### 1）核心全局状态（它靠什么把链跑起来）

```
ChainEngine = {
  scenes: [],                  // STAGE A 的产物（场次数组）
  totalDuration: 0,            // 总时长（秒）
  globalOffset: 0,             // 时间轴累计偏移（用于每场次 startSec/endSec）
  isCancelled: false,          // 中止生成
  isRunning: false,            // 防竞争（尤其 retryScene）
  cleanPlot: "...",            // 清洗/扩充后的剧情文本（STAGE A可能会扩写）
  sceneContents: { sceneId: markdown },      // 每场次生成的 markdown 分镜表
  sceneChatHistory: { sceneId: [{role,content}] }, // 每场次上下文（用于单镜修改/重试）
  currentSceneId: null
}
```

### 2）STAGE A：剧本切分（它怎么“分段”）

#### 2.1 分支总览（图案）

```
STC 开启？
  ├─ 否：原著保真切分（自然边界）→ plainScenes
  └─ 是：进入“规模感知”模式
          |
          v
   导演 category 是否属于氛围类（oriental/visual/minimalist）且非burst？
          ├─ 是：4 情绪阶段（起承转合）→ mood scenes
          └─ 否：BS2 节拍表（Save the Cat Beat Sheet）→ bsScenes
```

#### 2.2 关键产物
STAGE A 最终产出 `scenes[]`，每个 scene 结构类似：

```
scene = {
  id,
  title,
  beatName / beatTask,         // 节拍任务（或情绪阶段任务）
  narrativeMode,               // mood/plain/burst/mini/full（给 STAGE B 用）
  estimatedDuration,           // 本场时长（秒）
  contentSummary               // 本场唯一摘要（后续生成“唯一依据”）
}
```

#### 2.3 STAGE A 的“保障性”设计点
- 台词强制保留进 contentSummary（为 STAGE B 的 `[台词:"..."]` 镜像铁律服务）
- 短剧本会先扩充 workingPlot（按 burst/mini/full 不同模式扩充密度）
- 切分不是纯字符均分（STC关时也尝试 AI 识别自然场景边界，失败才降级均分）

### 3）STAGE B：逐场次生成分镜表（它怎么“生成”）

#### 3.1 输入输出（图案）

```
输入：scene(contentSummary + estimatedDuration) + basePrompt(导演/资产/视觉风格) + previousBridgeState
  |
  v
输出：本场次 Markdown 表格（严格时间轴） + scene.bridgeState（视觉衔接状态）
```

#### 3.2 System Prompt 的注入结构（上下游）

```
buildBaseSystemPrompt() 产出：
  styleContext（导演+visualStyle）
  assetLibraryInfo（@标签资产定义+铁律+映射表）
  assetCallRule（调用准则）
  nameMappingInstruction（生成前先扫角色名→锁定@人物X）
  donghuaRules（国漫特化）
        |
        v
stageB_generateOneScene() systemPrompt 直接拼进去
```

#### 3.3 它怎么强制“时间轴无缝”

```
startSec = ChainEngine.globalOffset
endSec   = startSec + scene.estimatedDuration

铁律：
- 第一镜从 startSec 开始
- 最后一镜结束必须 = endSec
- 全部镜头时长和 = scene.estimatedDuration（不允许偏差）
```

#### 3.4 它怎么控制“镜头数量”
- custom：用户指定总镜数 → 平均分配到每场（避免每场都生成总镜数）
- auto：按 estimatedDuration/7 到 estimatedDuration/4 推算 min/max

#### 3.5 旁支：视觉桥梁（跨场次衔接）
生成完一个 scene 后，会额外静默提取最后一镜视觉终点：

```
scene.bridgeState = {
  charPosition,
  lightPhase,
  environment,
  keyProp
}
```

下一场次会注入：
- “第一镜必须从此视觉终点状态开始”

### 4）STAGE C：无缝拼接渲染（它怎么“合并输出”）

```
对每个 scene：
  - 生成一个 scene-anchor（可点击跳转）
  - 把 sceneContents[sceneId] 的 markdown 渲染并高亮 @标签
最后：
  - injectShotEditButtonsChain() 注入“修改此镜”
```

### 5）链式分段生成的旁支联系
- Storyline Timeline UI：renderStorylineTimeline(scenes)
  - 显示每场次块（waiting/loading/done/error）
  - 点击跳转 anchor
  - error 提供 retryScene
- cancelChainGeneration：isCancelled = true
- retryScene：防主流程竞争 isRunning gate；重算 globalOffset；用 prevBridgeState 重跑该场次

---

## 模块 03：保真系统（Faithful Mode）图案化拆解

### 0）一句话概括（图案版）

```
保真系统 = 一个“全链路高优先级约束层”
  - UI 层：一个 toggle（默认开）
  - 状态层：scriptFaithfulMode + isScriptImported
  - 生成层：把“禁止改写/禁止扩写/台词逐字/资产标签精准替换”注入到
           (1) 输入剧本头部 faithfulHeader
           (2) systemPrompt 尾部 faithfulSuffix
```

### 1）核心状态与数据结构

#### 1.1 开关与触发条件

```js
let scriptFaithfulMode = true;  // 默认开启
let isScriptImported = false;   // 导入剧本后会置 true

function isFaithfulMode() { return scriptFaithfulMode; }

const faithfulActive = isFaithfulMode() || isScriptImported;
```

**解释：**
- `scriptFaithfulMode`：用户手动 toggle 的开关
- `isScriptImported`：只要走“导入剧本/粘贴剧本提取资产”那条路径，就强制进入保真态
- `faithfulActive`：两者任一为 true，就视为保真生效

#### 1.2 UI 入口
按钮：
- `faithfulToggleBtn` → `toggleFaithfulMode()`

逻辑：
```js
function toggleFaithfulMode() {
  scriptFaithfulMode = !scriptFaithfulMode;
  // 同步按钮样式与文案
}
```

### 2）保真系统的两种“注入点”（上游→下游）

#### 注入点 A：剧本头部注入 faithfulHeader（输入侧）
位置：`generatePrompts()`

当 `faithfulActive` 为真，会构造：
- `assetMapLines`：从 `assetNameMap` 导出映射表（且会过滤掉关闭标签的类别）
- `faithfulHeader`：把“导演定稿/不可篡改/禁止扩写/标签精准替换”等规则写在剧本前面

然后：

```js
const effectivePlotForGenerate = faithfulHeader + cleanPlot;
```

并在后续路由里作为：
- 单段生成：传给 `generateSingleSegment(effectivePlot, ...)`
- 链式生成：传给 `stageA_splitScenes(effectivePlotForGenerate, ...)`

**核心作用：**
让“原始剧本内容”在进入任何 STAGE 前，就携带不可篡改的最高优先级前置约束。

#### 注入点 B：systemPrompt 尾部注入 faithfulSuffix（生成侧）
位置：
- 链式：`stageB_generateOneScene()`
- 单段：`generateSingleSegment()`（内部同样追加）

追加内容类似：
- “保真直通模式（最高优先级指令）”
- “严禁增删情节/人物/台词”
- “禁止扩写/润色/节拍重构逻辑”
- “@标签模式时标签必须优先；标签关则禁止出现@标签”

**核心作用：**
即便模型在生成分镜表时倾向扩写，它也会被最后的最高优先级铁律压回“只做 1:1 视觉化”。

### 3）保真系统对各功能区的影响（图案）

```
[用户点“AI分析扩写” analyzePlot]
   |
   |-- 若 faithfulActive 为真 → 弹 confirm：扩写会覆盖剧本，是否继续？
   v
[用户点“生成分镜” generatePrompts]
   |
   |-- faithfulHeader 注入到 effectivePlotForGenerate
   |-- ChainEngine.cleanPlot 也会带上 faithfulHeader（链式模式）
   v
[STAGE A 切分]
   |
   |-- 输入 plot 已包含“导演定稿/不可改写/标签映射”等头部约束
   v
[STAGE B 生成分镜]
   |
   |-- finalSystemPrompt = systemPrompt + faithfulSuffix
   v
[输出表格]
   |
   |-- 台词镜像铁律 + 保真直通铁律 → 强制逐字
   v
[单镜修改/重试]
   |
   |-- sceneChatHistory 中保存了该场次 systemPrompt / user / assistant
       （在保真态下，这些上下文天然携带“不可改写”约束）
```

### 4）保真系统与资产库/@标签的强耦合点

保真态下，`faithfulHeader` 会显式注入：
- “所有已注册资产标签必须精准替换（见下方映射表）”
- 并附带 `assetMapLines`：
  - 只包含“当前开启 @标签 的类别”

这意味着：
- 保真系统不仅管“剧情不改”，还管“标签映射不漂”
- 角色名/场景名/道具名会被要求严格映射到 `@人物N/@图片N/@道具N`

### 5）旁支联系与潜在冲突点（设计评估）

- 保真系统与 STC 开关是两个轴：
  - STC 开：stageA 会走 BS2/情绪阶段切分
  - 保真开：剧本头与系统尾都写“禁止节拍重构逻辑”
  - 这在概念上可能“相互拉扯”（切分仍按节拍，但内容不允许被重构）
- 保真系统与“AI扩写 analyzePlot”直接对立：
  - 所以它用 confirm 明确提示“扩写会覆盖原剧本”
- 保真系统和“台词镜像铁律”叠加：
  - 形成双保险：台词一字不差

---

## 附录：保真系统分析原文记录（按当时回复原文补录）

（本模块为本次回复原文，已同步记录到此文件；后续若继续深入单镜修改与保真继承链路，可继续在此模块下追加。）

### 补充问答：链式生成是否“分发到不同 AI 上下文再合并”？

- 触发阈值：代码在 `generatePrompts()` 路由里明确：`duration >= 85` 且非极速通道（<15s）时启用链式引擎（Stage A→B→C）。
- 结论：**是“每个场次一次独立 API 调用（独立上下文）”，最后再合并渲染**。
  - Stage B 的 `stageB_generateOneScene(scene, ...)` 会针对每个 scene 单独构造 `finalSystemPrompt`，并把 **本场次唯一依据** `sceneScript = scene.contentSummary || ChainEngine.cleanPlot` 作为 user 输入发给模型。
  - 该调用不会把前面所有场次的完整内容作为上下文一起发（避免上下文膨胀）。跨场次只通过两种“轻量桥梁”传递：
    1) `previousBridgeState`（上一场次最后一镜视觉终点 JSON）注入到下一场次 prompt 里；
    2) 全局资产库/@标签与导演/视觉风格等 basePrompt 约束（每场次重复注入）。
- “合并”的实现不在 system prompt 里，而在编排逻辑：
  - 每场次生成内容累积到 `ChainEngine.sceneContents[scene.id]`，并在每段完成后调用 `stageC_mergeAndRender()` 把多个场次拼起来显示。
  - 同时保存 `ChainEngine.sceneChatHistory[scene.id] = [system,user,assistant]`，用于 retry 或单镜修改时复用该场次上下文。

---

## 模块 04：预检审核（Safety Pre-check）与 词过滤（Word Filter）图案化拆解

### 0）一句话概括（图案版）

```
安全系统 = 过滤开关 + 替换词典 + 分级检测词库 + 两种触发路径

触发路径 A（手动）：工具栏「🛡️ 审核预检」→ runSafetyPreCheck() → 弹窗报告 + 一键应用修复
触发路径 B（自动）：点击生成 generatePrompts() 时（autoSafety=on）→ sanitizePrompt() →
                       ① redZone 残留：拦截
                       ② 有可替换项：自动替换并继续生成
```

### 1）核心数据结构

#### 1.1 替换词典：safetyReplacements（可自动修复）
- 形式：`{ badWord: safeWord }` 的大映射表
- 覆盖：政治敏感、色情低俗、暴力恐怖、违法行为、名人明星、IP/品牌等
- 特点：它会把“高危词”替换成“安全描述词”，以尽可能不改变叙事又能过审

#### 1.2 分级检测词库：strictBannedWords（替换后仍要检测）
- `redZone`：绝对禁区（检测到就必须人工修改/直接拦截）
- `yellowZone`：版权/IP/品牌等（建议规避）
- `celebrityZone`：名人明星词
- `ipZone`：知名角色/IP 词

### 2）词过滤开关（enableWordFilter）

#### 2.1 UI/状态
- 开关控件：`#enableWordFilter`（默认 checked）
- 快捷按钮：`#filterQuickToggle` 一键切换

#### 2.2 生效函数
- `isWordFilterEnabled()`：默认 true
- `onWordFilterToggle()`：同步描述文字与行背景样式
- `quickToggleWordFilter()`：切换后立即写回 localStorage 的 `seedance_settings.enableWordFilter`

**关键语义：**
- 关闭过滤：sanitizePrompt 直接返回原文，不做任何替换/检测报告

### 3）核心算法：sanitizePrompt(text)

```
if 过滤关闭：
  return 原文 + 全部空数组

if 过滤开启：
  1) 用 safetyReplacements 做全文替换（全局 g；先 escape 再 RegExp）
  2) 替换后再次扫描 strictBannedWords 四个区：
     - redZone / yellowZone / celebrityZone / ipZone
  3) 返回：
     - text: 替换后的文本
     - replaced: 替换列表
     - replacedRedZone / replacedYellowZone: 按分级归类的“已替换项”
     - detectedRedZone / detectedYellowZone / detectedCelebrity / detectedIP: 替换后仍残留项（需要人工）
```

### 4）手动预检：runSafetyPreCheck()

输入：`plotInput` 当前情节

输出：弹窗 `#safetyModal` + `#safetyReport` HTML 报告

报告逻辑（分级展示）：
- 已自动修复（蓝：redZone 已替换、橙：yellow/celebrity/ip 已替换）
- 仍需人工修改（红：detectedRedZone）
- 建议人工修改（橙/黄：detectedYellowZone / detectedCelebrity / detectedIP）

并提供按钮：
- `applySafetyFix()`：把替换后的 text 写回 plotInput，并提示“已自动替换 X 个敏感词”

### 5）自动预检：generatePrompts() 生成前拦截/自动修复

`seedance_settings.autoSafety`（UI：autoSafetyCheck）决定是否启用自动预检：

- 若 detectedRedZone 非空：直接 alert 拦截（必须人工改）
- 若 replaced 非空：自动把 plotInput 替换为 sanResult.text，并显示“生成前自动修复了 X 个敏感词”提示

### 6）与其他模块的旁支联系

- 与“AI扩写 analyzePlot()”关联：扩写后也会对 expandedPlot 做 sanitizePrompt，并在 UI 显示已替换数量（但此处不做强拦截）
- 与“资产库/@标签”弱关联：标签化可降低名人/IP 词自由漂移概率，但审核系统本身不依赖资产库
- 与“历史记录”关联：历史记录保存的是渲染后的表格与 markdown snapshot；安全替换主要发生在 plotInput 与生成前阶段

---

## 附录：预检审核与词过滤分析原文记录（按当时回复原文补录）

（本模块为本次回复原文，已同步记录到此文件。）

---

## 模块 05：单镜精准修改（Single Shot Edit）与 全局修改（Refine / Global Edit）图案化拆解

### 0）一句话概括（图案版）

```
单镜精准修改 = “局部可控 patch”：只改指定镜号，其余逐字复制（强约束）
全局修改     = “整体再编译 refine”：按修改意见重写全表（弱约束，但锁死台词）

二者都以“当前分镜表格 Markdown”作为主上下文输入。
```

---

## A. 单镜精准修改（Single Shot Edit）

### A1）UI 入口与定位逻辑

```
生成分镜后（渲染表格）
  |
  v
injectShotEditButtons() 在每一行最后一列插入按钮「✏️ 修改此镜」
  |
  v
点击按钮 → openSingleShotModal(...) 打开弹窗
  |
  v
弹窗确认 → submitSingleShotEdit() 发起单镜修改请求
```

- 按钮插入点：每行最后一个 cell（SEEDANCE提示词那一列）
- 会给按钮写入：shotIndex / timeRange

### A2）核心状态

```js
let currentEditShotIndex = -1;  // 当前正在编辑的镜头序号（从1开始）
let currentEditSceneId = null;  // 链式模式下的场次 ID
```

### A3）单段 vs 链式：上下文选择（关键设计）

```
if 链式模式（ChainEngine.scenes.length > 0）:
  - 用该 scene 的独立上下文 ChainEngine.sceneChatHistory[sceneId]
  - 用该 scene 的当前表格 ChainEngine.sceneContents[sceneId]
else 单段模式:
  - 用全局 chatHistory
  - 用 lastAssistant.content 作为 currentTable
```

这意味着：**链式生成里单镜修改是真正的“按场次分上下文”修改**，不会把全片塞进一次请求。

### A4）链式模式下“绝对镜号 → 场次相对镜号”的换算

链式渲染时 UI 上的镜号是全片累加的，但修改时必须定位到当前场次内第几镜。

它用一个粗略统计：
- 遍历当前 sceneId 之前的所有场次内容
- 用正则数 table 行数来估算“之前有多少镜”
- 得到 `relShotIndex = currentEditShotIndex - prevShots`

### A5）单镜修改请求的 Prompt 结构（强约束 patch）

user prompt 核心是：

```
当前(场次/完整)分镜表格如下：
  <currentTable>

===任务要求===
请【只修改第 N 镜】... 修改要求为：<request>

严格规则：
1) 其余所有镜头原字不动复制
2) 只改第 N 镜
3) 台词锁死协议：所有 [台词:"..."] 原字不动
4) 返回完整 Markdown 表格，不要解释
```

system prompt 核心是：
- “你是单镜精准修改专家”
- **重新注入 freshBasePrompt 的资产库规则**（assetLibraryInfo / assetCallRule / nameMappingInstruction）
- 追加单镜模式约束：只改指定镜、台词不得改、@标签不得退回外貌文字描述

**关键点：**
- 单镜修改不是“沿用老 systemPrompt”，而是每次都会 fresh rebuild 资产约束注入，保证 @标签一致性不会丢。

### A6）修改结果写回链路

```
请求成功 → newContent (markdown table)
  |
  +-- 链式模式：
  |     ChainEngine.sceneContents[sceneId] = newContent
  |     更新 sceneChatHistory[sceneId] 的最后 assistant 内容
  |     stageC_mergeAndRender() 重拼渲染
  |     chatHistory[2].content = 合并后的全文
  |
  +-- 单段模式：
        直接替换 storyboardTable.innerHTML
        更新 chatHistory 最后 assistant
        追加（单镜修改）user/assistant 到 chatHistory
```

并会对被修改行做短暂高亮。

---

## B. 全局整体修改（Refine / Global Edit）

### B1）入口函数
- `refinePrompts()`（注释：修改优化/全局整体修改）

### B2）输入上下文的选择（防上下文爆）

它明确避免在链式模式下把全量 chatHistory 发给模型：

```
currentTable =
  if chain: Object.values(ChainEngine.sceneContents).join('\n\n')
  else: lastAssistant.content

MAX_TABLE_CHARS = 12000
超出则截断并提醒“建议使用单镜精准修改”
```

### B3）全局修改请求结构（弱约束、整体重写）

它用的是：
- system：`chatHistory[0]?.content || '你是SEEDANCE 2.0分镜提示词专家'`
- user：
  - 当前完整表格（截断后）
  - 修改要求 refineText
  - 强制规则：台词字段必须原字不动保留

相比单镜：
- 没有“其余镜头逐字复制”的硬约束
- 允许整体优化/重排措辞
- 但仍锁死台词字段

### B4）修改结果写回
- 重置 chatHistory（保持不无限增长）：`chatHistory = chatHistory.slice(0,3)` 后再 push
- 用 `highlightAtTags(marked.parse(output))` 重渲染
- 重新注入单镜按钮 `injectShotEditButtons()`

---

## C. 二者的设计定位（为什么要两套）

```
“全局修改”解决：整体风格统一、节奏整体调整、光影/运镜统一升级
“单镜修改”解决：局部镜头不满意时的可控修补（不破坏其他镜头）

两者共同的护栏：台词镜像铁律（任何情况下台词不得改）
```

---

## 附录：单镜/全局修改分析原文记录（按当时回复原文补录）

（本模块为本次回复原文，已同步记录到此文件。）

---

## 模块 06：120s TXT 导入（保真）+ 词过滤/预检 + 人工调参 的“执行拓扑图”与参数注入明细（模拟流程）

> 目标：模拟导入约 120 秒 txt 剧本，在【保真模式 ON】、【词过滤 ON】、【自动预检 ON】的情况下，人工调参后点击生成，展示各模块执行顺序与“下一步注入的参数组”。

### 0）前置条件（模拟设定）
- 时长：`duration ≈ 120s`（≥ 85s → 进入链式分段生成）
- 保真：`scriptFaithfulMode = true`（且导入剧本会令 `isScriptImported = true`，双重触发保真）
- 词过滤：`enableWordFilter = true`
- 自动预检：`autoSafetyCheck = true`
- STC：默认 ON（可由用户切换）
- @标签：默认 ON（`assetTagEnabled = { character:true, image:true, props:true }`，可由用户切换）

---

## A）拓扑示意图（高层）

```
┌──────────────────────────────────────────────────────────┐
│ (人) 导入TXT剧本                                          │
└───────────────┬──────────────────────────────────────────┘
                │ handleScriptUpload / 粘贴 -> processRawScript(text)
                │  注入：isScriptImported=true
                v
┌──────────────────────────────────────────────────────────┐
│ (机) 资产提取（AI）                                       │
│  buildExtractionSystemPrompt + buildRequest + fetch       │
└───────────────┬──────────────────────────────────────────┘
                │ 输出：jsonData{characters,scenes,props}
                │ 写回：materials + assetNameMap
                v
┌──────────────────────────────────────────────────────────┐
│ (人) 调整参数面板                                         │
│  director / visualStyle / aspectRatio / quality           │
│  shotMode(auto/custom)/customShotCount                    │
│  STC开关 / BGM字幕开关 / @标签模式开关                    │
└───────────────┬──────────────────────────────────────────┘
                │ 可选：手动预检 runSafetyPreCheck()
                │  sanitizePrompt -> 报告 -> applySafetyFix
                v
┌──────────────────────────────────────────────────────────┐
│ (人) 点击生成 generatePrompts()                            │
└───────────────┬──────────────────────────────────────────┘
                │ 自动预检（autoSafety=on） sanitizePrompt(plot)
                │  - redZone残留：拦截
                │  - replaced：自动替换 plotInput
                v
┌──────────────────────────────────────────────────────────┐
│ (机) 保真头部注入 faithfulHeader + assetMapLines           │
│  effectivePlotForGenerate = faithfulHeader + cleanPlot     │
└───────────────┬──────────────────────────────────────────┘
                │ duration>=85 -> useChain=true
                v
┌──────────────────────────────────────────────────────────┐
│ STAGE A：stageA_splitScenes(plot, duration, settings)      │
│  产物：scenes[{id,title,estimatedDuration,contentSummary}] │
└───────────────┬──────────────────────────────────────────┘
                │ basePrompt = buildBaseSystemPrompt(settings)
                v
┌──────────────────────────────────────────────────────────┐
│ STAGE B：for scene in scenes                               │
│  stageB_generateOneScene(scene, prevBridge, settings, bp)  │
│  每场次：1次独立AI上下文调用                               │
│  输出：sceneContents[sceneId] + bridgeState                │
└───────────────┬──────────────────────────────────────────┘
                │ 每段后 stageC_mergeAndRender()
                v
┌──────────────────────────────────────────────────────────┐
│ STAGE C：拼接渲染 + 锚点 + 注入“修改此镜”按钮              │
└──────────────────────────────────────────────────────────┘

（可选）STAGE D：STC 导演自检（仅 STC ON 时）
```

---

## B）关键“参数注入组”明细（逐步）

### B1）TXT 导入 → processRawScript(text)
**输入：** raw script 文本

**写入状态：**
- `plotInput.value = text`
- `isScriptImported = true`（这会让后续 faithfulActive 永远为真，除非你显式清理）

**下游注入：**
- 触发 AI 资产提取（buildExtractionSystemPrompt）

---

### B2）资产提取（AI）→ fillMaterialsFromExtraction + buildAssetMap
**输出：**
- `materials.character/image/props`（每类10槽位 name+desc）
- `assetNameMap`：`{ 原名 -> {tag, desc, type} }`

**下游注入（最关键）：**
- `buildBaseSystemPrompt()` 的 `assetLibraryInfo / assetCallRule / nameMappingInstruction`
- 以及保真头部 `assetMapLines`（只包含当前开启@标签的类别）

---

### B3）人工调参（UI → 全局状态）
这一步主要是在为后续 system prompt 组装提供参数：

**风格组：**
- `selectedDirector` → directorInfo{style/techniques/lighting/category}
- `visualStyle`（styleMap）

**画面参数组：**
- `aspectRatio`
- `quality`

**叙事/结构组：**
- `enableSTC`（STC ON/OFF）
- `duration=120`（决定 useChain=true 且叙事规模 full/mini/burst）

**镜头密度组：**
- `shotMode` = auto/custom
- `customShotCount`（若 custom）

**输出约束组：**
- `enableBGM` / `enableSubtitle`

**资产表达组：**
- `assetTagEnabled.character/image/props`（@标签/文字模式）

---

### B4）手动预检（可选）→ runSafetyPreCheck()
**调用：**
- `sanitizePrompt(plotInput.value)`

**产生：**
- 分级报告（已替换 / 仍残留 redZone/yellow/celebrity/ip）

**下游注入：**
- `applySafetyFix()` 会把替换后的 `result.text` 写回 `plotInput`

---

### B5）点击生成 → generatePrompts()（自动预检）
**自动预检开关：**
- `seedance_settings.autoSafety`（autoSafetyCheck）

**调用：**
- `sanitizePrompt(plot)`

**分支：**
- `detectedRedZone.length > 0` → **拦截**（必须人工改）
- `replaced.length > 0` → **自动替换** plotInput 后继续

---

### B6）保真头部注入（输入侧）→ faithfulHeader + assetMapLines
当 `faithfulActive = isFaithfulMode() || isScriptImported` 为真：

- 构造 `assetMapLines`：从 `assetNameMap` 导出映射表，并按 `assetTagEnabled` 过滤
- 构造 `faithfulHeader`（导演定稿、不可篡改、禁止扩写/节拍重构、标签精准替换）

**下游注入：**
- `effectivePlotForGenerate = faithfulHeader + cleanPlot`
- 单段/链式两条路都会使用该 effectivePlot

---

### B7）链式路由（duration>=85）→ Stage A / B / C
**路由条件：**
- `duration >= 85` 且非 ultraShort

#### Stage A（切分）注入：
输入 plot 已带 faithfulHeader，因此 Stage A 的 contentSummary 倾向：
- 不改原著
- 保留台词
- 避免强戏剧化加工

#### Stage B（逐场次生成）注入：
每个 scene 单独请求，systemPrompt 组装包含：

**basePrompt 注入组（每场重复）：**
- `styleContext`（visualStyle + director flavor）
- `assetLibraryInfo`（资产清单+@标签铁律+映射表）
- `assetCallRule`（何时调用@标签）
- `nameMappingInstruction`（生成前先扫角色名→锁定@人物X）
- `donghuaRules`（如属动漫导演）

**时间轴/镜数注入组（每场独立计算）：**
- `startSec/endSec`（由 globalOffset 计算）
- `shotMin/shotMax` 或 `shotAbsoluteDirective`

**保真尾部注入组（生成侧 finalSystemPrompt 追加）：**
- `faithfulSuffix`：禁止增删人物/台词/情节；禁止扩写/润色/节拍重构；并与 @标签开关联动（开则必须用标签，关则禁止出现标签）

**跨场次桥梁注入：**
- `previousBridgeState`（上一场最后一镜视觉终点 JSON）

#### Stage C（合并渲染）注入：
- `highlightAtTags()` 负责可视化 @标签与字段
- `injectShotEditButtonsChain()` 注入单镜按钮（后续进入单镜精准修改模块）

---

### 备注：这套拓扑的核心“保障性”来源
- 安全保障：sanitizePrompt（可替换 + 分级检测 + redZone拦截）
- 保真保障：faithfulHeader（输入侧）+ faithfulSuffix（生成侧）双注入
- 一致性保障：资产库 + assetNameMap + @标签铁律
- 上下文保障：链式每场独立上下文 + previousBridgeState 轻量桥梁


---

## 模块 07：120 秒保真链式生成系统设计图（System Design View）

> 目标：不是功能说明，而是用“节点 / 参数 / 状态 / 约束 / 输出”的系统设计图视角，描述 SoulLens 在 120 秒 txt 剧本、保真模式、词过滤、自动预检开启时的完整执行链。

### 0）系统总览图

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Node 0  用户输入层                                                   │
│  TXT剧本 + 人工参数选择                                              │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ rawScript, UI params
                       v
┌──────────────────────────────────────────────────────────────────────┐
│ Node 1  剧本导入/落位层                                              │
│  processRawScript(text)                                              │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ plotInput, isScriptImported=true
                       v
┌──────────────────────────────────────────────────────────────────────┐
│ Node 2  资产提取与映射层                                             │
│  buildExtractionSystemPrompt -> AI -> fillMaterials/buildAssetMap    │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ materials, assetNameMap
                       v
┌──────────────────────────────────────────────────────────────────────┐
│ Node 3  安全过滤层                                                   │
│  enableWordFilter / sanitizePrompt / autoSafetyCheck                 │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ cleanPlot / blocked / replaced words
                       v
┌──────────────────────────────────────────────────────────────────────┐
│ Node 4  保真注入层                                                   │
│  faithfulHeader + assetMapLines + faithfulSuffix                     │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ effectivePlotForGenerate
                       v
┌──────────────────────────────────────────────────────────────────────┐
│ Node 5  生成路由层                                                   │
│  duration 路由：<15 / 15-84 / >=85                                   │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ useChain = true (120s)
                       v
┌──────────────────────────────────────────────────────────────────────┐
│ Node 6  Stage A 切分层                                               │
│  stageA_splitScenes(plot, duration, settings)                        │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ scenes[] with contentSummary/estimatedDuration
                       v
┌──────────────────────────────────────────────────────────────────────┐
│ Node 7  基础 Prompt 编译层                                           │
│  buildBaseSystemPrompt(settings)                                     │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ styleContext, assetLibraryInfo, ...
                       v
┌──────────────────────────────────────────────────────────────────────┐
│ Node 8  Stage B 场次生成层                                           │
│  for scene -> stageB_generateOneScene(...)                           │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ sceneContents[sceneId], bridgeState
                       v
┌──────────────────────────────────────────────────────────────────────┐
│ Node 9  Stage C 拼接渲染层                                           │
│  stageC_mergeAndRender()                                             │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ merged storyboard HTML/markdown
                       v
┌──────────────────────────────────────────────────────────────────────┐
│ Node 10 编辑闭环层                                                   │
│  单镜修改 / 全局修改 / retryScene / STC QA                           │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 1）Node 0：用户输入层

### 输入
- `rawScript`：约 120 秒 TXT 剧本
- UI 参数：
  - `selectedDirector`
  - `visualStyle`
  - `duration = 120`
  - `shotMode / customShotCount`
  - `enableSTC`
  - `enableBGM`
  - `enableSubtitle`
  - `assetTagEnabled`
  - `enableWordFilter`
  - `autoSafetyCheck`
  - `scriptFaithfulMode`

### 状态
- 还未进入系统状态，只是用户侧输入

### 输出到下一步
- 文本本体 + 参数组

---

## 2）Node 1：剧本导入/落位层

### 调用函数
- `handleScriptUpload(input)`
- `processRawScript(text)`

### 输入
- `text`（TXT 内容）

### 内部状态写入
- `plotInput.value = text`
- `isScriptImported = true`

### 关键意义
- 一旦 `isScriptImported = true`，后续 `faithfulActive = isFaithfulMode() || isScriptImported` 基本成立
- 即：**导入剧本天然触发保真链**

### 输出到下一步的参数组
```text
plotInput
isScriptImported
```

---

## 3）Node 2：资产提取与映射层

### 调用函数
- `buildExtractionSystemPrompt()`
- `buildRequest()`
- `fillMaterialsFromExtraction(jsonData, animate)`
- `buildAssetMap(jsonData)`

### 输入
- `plotInput.value`（原始剧本）
- `settings.endpoint/key/model/mode`

### AI 输出
```json
{
  "characters": [{"name":"...","visual_desc":"..."}],
  "scenes": [{"name":"...","visual_desc":"..."}],
  "props": [{"name":"...","visual_desc":"..."}]
}
```

### 内部状态写入
- `materials.character/image/props`
- `assetNameMap = { 原名 -> {tag, desc, type} }`

### 输出到下一步的参数组
```text
materials
assetNameMap
```

### 注入价值
这些不会停留在 UI，而会在后续编译为：
- `assetLibraryInfo`
- `assetCallRule`
- `nameMappingInstruction`
- `assetMapLines`

---

## 4）Node 3：安全过滤层

### 调用函数
- `isWordFilterEnabled()`
- `sanitizePrompt(text)`
- `runSafetyPreCheck()`（手动）
- `generatePrompts()` 内自动预检（自动）

### 输入
- `plotInput.value`
- `enableWordFilter`
- `autoSafetyCheck`
- `safetyReplacements`
- `strictBannedWords`

### 内部逻辑
```text
过滤关：原文直通
过滤开：
  - 替换 safetyReplacements
  - 再检测 red/yellow/celebrity/ip 残留
```

### 分支结果
- `detectedRedZone > 0` → **拦截，不进入生成**
- `replaced.length > 0` → 自动写回 `plotInput`
- 无问题 → 放行

### 输出到下一步的参数组
```text
cleanPlot
sanResult.replaced
sanResult.detected*
```

### 系统作用
- 这是第一道“硬拦截节点”
- 120 秒链式生成只有在这里放行后才会继续

---

## 5）Node 4：保真注入层

### 调用位置
- `generatePrompts()`
- `stageB_generateOneScene()`
- `generateSingleSegment()`

### 核心条件
```js
faithfulActive = isFaithfulMode() || isScriptImported
```

### 输入
- `cleanPlot`
- `assetNameMap`
- `assetTagEnabled`
- `scriptFaithfulMode`
- `isScriptImported`

### 注入物 1：faithfulHeader（输入侧）
内容包括：
- 导演定稿剧本
- 严禁增删人物/台词/场景/情节
- 禁止 AI 扩写与戏剧节拍重构
- 已注册资产标签必须精准替换
- 附带 `assetMapLines`

### 注入物 2：faithfulSuffix（生成侧）
内容包括：
- 保真直通模式（最高优先级）
- 只做 1:1 视觉化
- 标签开则必须使用标签
- 标签关则禁止出现标签

### 输出到下一步的参数组
```text
effectivePlotForGenerate = faithfulHeader + cleanPlot
faithfulSuffix
```

### 系统作用
- 这是第二道“高优先级约束节点”
- 一头卡输入，一头卡输出

---

## 6）Node 5：生成路由层

### 调用函数
- `generatePrompts()`

### 输入
- `duration`
- `chainEnabled`
- `faithfulActive`

### 路由规则
```text
< 15s   -> 极速通道
15-84s  -> 单段生成
>= 85s  -> 链式分段生成
```

### 120 秒场景
- `duration = 120`
- `useChain = true`

### 输出到下一步的参数组
```text
ChainEngine.cleanPlot = faithfulHeader + cleanPlot
ChainEngine.totalDuration = 120
ChainEngine.globalOffset = 0
```

---

## 7）Node 6：Stage A 切分层

### 调用函数
- `stageA_splitScenes(plot, totalDuration, settings)`

### 输入
- `effectivePlotForGenerate`
- `duration=120`
- `enableSTC`
- `selectedDirector.category`

### 分支
```text
STC off  -> 原著保真切分（自然边界 plainScenes）
STC on   ->
   氛围类导演 -> 4情绪阶段 mood
   其他       -> BS2 节拍切分 bsScenes
```

### 产物
```text
scenes[] = {
  id,
  title,
  beatName,
  beatTask,
  narrativeMode,
  estimatedDuration,
  contentSummary
}
```

### 注入到下一步的参数组
```text
scene.contentSummary
scene.estimatedDuration
scene.narrativeMode
scene.beatTask
```

### 系统作用
- 把全剧本压缩成“分场的唯一依据”
- 后面每场不会再吃全片长文本，而主要吃 `contentSummary`

---

## 8）Node 7：基础 Prompt 编译层

### 调用函数
- `buildBaseSystemPrompt(settings)`

### 输入
- `selectedDirector`
- `visualStyle`
- `materials`
- `assetNameMap`
- `assetTagEnabled`
- `aspectRatio`
- `quality`
- `enableBGM`
- `enableSubtitle`

### 编译产物
```text
styleContext
assetLibraryInfo
assetCallRule
nameMappingInstruction
subjectTagHint
donghuaRules
```

### 注入到下一步的参数组
```text
basePrompt = {
  styleContext,
  assetLibraryInfo,
  assetCallRule,
  nameMappingInstruction,
  subjectTagHint,
  donghuaRules,
  aspectRatio,
  quality,
  enableBGM,
  enableSubtitle,
  ...
}
```

### 系统作用
- 这是“全局约束编译器”
- Stage B 每个 scene 都会重复使用这组约束

---

## 9）Node 8：Stage B 场次生成层

### 调用函数
- `stageB_generateOneScene(scene, previousBridgeState, settings, basePrompt)`

### 输入
#### A. 场次局部参数组
- `scene.contentSummary`
- `scene.estimatedDuration`
- `scene.narrativeMode`
- `scene.beatTask`

#### B. 全局编译参数组
- `basePrompt.*`

#### C. 运行时参数组
- `startSec = ChainEngine.globalOffset`
- `endSec`
- `shotMin/shotMax` 或 `shotAbsoluteDirective`
- `previousBridgeState`
- `faithfulSuffix`

### 每场次 systemPrompt 的真实组成
```text
basePrompt 全局约束
+ 场次时间轴约束
+ 镜头数量约束
+ narrativeMode 对应的叙事规则
+ previousBridgeState 视觉桥梁
+ faithfulSuffix 保真尾注入
```

### 输出
- `scene.content = fullContent`
- `ChainEngine.sceneContents[scene.id] = fullContent`
- `ChainEngine.sceneChatHistory[scene.id] = [system,user,assistant]`
- `scene.bridgeState = { charPosition, lightPhase, environment, keyProp }`

### 注入到下一步的参数组
```text
sceneContents[sceneId]
sceneChatHistory[sceneId]
bridgeState
```

### 系统作用
- 这是“真正生成分镜”的核心节点
- **每个 scene = 一次独立 AI 上下文调用**
- 跨场一致性只靠：
  - `basePrompt`
  - `previousBridgeState`

---

## 10）Node 9：Stage C 拼接渲染层

### 调用函数
- `stageC_mergeAndRender()`
- `highlightAtTags()`
- `injectShotEditButtonsChain()`

### 输入
- `ChainEngine.sceneContents`
- `ChainEngine.scenes`

### 输出
- 合并后的 storyboard HTML
- scene anchor
- 单镜修改按钮

### 注入到下一步的参数组
```text
可编辑的完整分镜页面
sceneId + shotIndex 定位信息
```

### 系统作用
- 把“分场独立生成”重新表现成“整片连续成品”

---

## 11）Node 10：编辑闭环层

### 包含
- `submitSingleShotEdit()` 单镜精准修改
- `refinePrompts()` 全局修改
- `retryScene()` 场次重试
- `runSTCQualityCheck()` 导演自检

### 输入来源
- `ChainEngine.sceneChatHistory[sceneId]`
- `ChainEngine.sceneContents`
- `chatHistory`

### 系统作用
- 提供生成后的二次编辑闭环
- 不必回到最初重新导入/切分

---

## 12）最终设计判断：120 秒保真链式生成的“真正主干”

```text
TXT剧本
  -> 资产提取
  -> 安全过滤
  -> 保真注入
  -> Stage A（场次摘要）
  -> Stage B（按场独立上下文生成）
  -> Stage C（合并成整片）
  -> 编辑闭环（单镜/全局/重试）
```

### 真正决定质量的四个关键节点
1. `sanitizePrompt()` 是否放行 / 是否替换过度
2. `assetNameMap` 是否建立准确
3. `stageA_splitScenes()` 的 `contentSummary` 是否高质量
4. `stageB_generateOneScene()` 是否正确组合了 basePrompt + bridgeState + faithfulSuffix

