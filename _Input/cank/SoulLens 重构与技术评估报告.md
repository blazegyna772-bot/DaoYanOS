# **SoulLens 5.1 旧系统与重构评估报告**

## **一、 《功能盘点 (MD)》与底层代码 (HTML) 交叉对比评估**

整体而言，盘点文档对旧系统架构的抓取是准确的，但也存在少数遗漏与界定偏差。

### **1\. 确认无误的部分（无幻觉）**

* **资产库与标签替换 (@人物1 等)**：代码中 highlightAtTags 和相关正则证实了这一套复杂替换逻辑的存在。  
* **链式生成 (ChainEngine)**：代码中确有 ChainEngine 对象，包含时间轴计算、场次切分 (Wn 函数)、单段生成 (Nt 函数)。  
* **多平台/视觉反推**：PLATFORMS 和 VISION\_PLATFORMS 数组证实了多模型接入；视频抽帧 (Io 函数) 和图片解析证明反推功能属实。  
* **安全审核机制**：Jt 和 se 字典实现了严格的红黄区词汇映射与替换。

### **2\. 盘点文档的遗漏项 (Omissions)**

盘点文档忽略了几个对生成质量起决定性作用的底层硬编码规则：

* **严格的六字段输出格式**：代码中强制约束了 镜头、环境、角色分动、细节、光影、音效、台词 的单行输出格式。这是保证其解析成功的基石，文档未提及。  
* **视觉桥梁逻辑 (Bridge State)**：代码在链式生成中，有一段逻辑专门提取“最后一镜的视觉终点状态”，并将其作为下一场次生成的输入约束。这是保持长视频连贯性的核心机制，盘点文档漏掉了这一点。

### **3\. 盘点文档的判定偏差 (Inaccuracies)**

* 文档在“缺失功能”中提到“缺少质量评估闭环”。**这是不准确的。**  
* **事实反驳**：代码中存在 Ht 函数 (STC QA Panel)，这是一个明确的“导演自检报告”功能，包含“救猫咪时刻”、“双重魔法检测”、“陈词滥调剥离”三个维度的自动化质量评估。系统并非完全没有评估闭环，只是目前偏向剧本结构而非纯视觉质量。

## **二、 提示词解耦方案（JSON/MD 化）**

旧系统将大量 Prompt 硬编码在 JS 逻辑中（如模板字符串 ${...}）。要实现提示词的外置管理，需客观看待不同格式的优劣，并采用结构化模板引擎。

### **1\. 格式选择：不建议纯 JSON，推荐 YAML 或 MD+FrontMatter**

* **JSON 的缺陷**：不支持多行字符串，编写长篇 Prompt 时必须使用 \\n，极其破坏可读性，非技术人员（如提示词工程师）无法维护。  
* **推荐方案 1：YAML**。原生支持多行字符串（\> 或 |），层级清晰，适合定义带参数的 Prompt 库。  
* **推荐方案 2：Markdown \+ FrontMatter**。将 Prompt 描述写在 MD 正文，元数据（变量名、适用模型、温度等）写在头部 YAML。

### **2\. 架构设计：模板引擎 \+ 变量注入**

重构时，需要引入提示词渲染层（Prompt Rendering Layer）。

* **静态模板**：将 Prompt 存为独立文件（例：prompts/stc\_analysis.yaml）。  
* **变量注入**：使用模板语法（如 Jinja2, Handlebars, Mustache）。  
* **动态控制**：旧系统中大量存在 if (isSTC) 的逻辑片段。在解耦时，应避免在 Prompt 模板中写复杂逻辑，而是由业务代码拼装“子模板”（Sub-prompts），如将“资产约束规则”、“导演风格约束”作为独立积木，由核心引擎根据参数组装后渲染。

## **三、 自动化执行与 AI Agentic 调用的技术栈建议**

旧系统是高度耦合的单文件“大前端”架构，业务逻辑与 DOM 操作绑定死，**根本无法在无头(Headless)环境或 CLI 中运行**。要实现自动化与 AI Agent 调用，必须进行**前后端分离**。

### **1\. 后端技术栈建议：Python (FastAPI \+ LangChain/Pydantic)**

* **为什么选 Python**：当前 AI 编排、Agent 构建、数据校验的基础设施基本集中在 Python 生态。  
* **核心组件**：  
  * **FastAPI**：构建 RESTful 或 RPC API，天然支持异步，高并发处理链式生成。  
  * **Pydantic**：旧系统靠手写正则和 try-catch 解析 JSON (robustParseJSON)，极其脆弱。使用 Pydantic 结合各大模型的 Structured Output，可保证输出结构 100% 稳定。  
  * **LangChain / LlamaIndex**：用于管理外置的 Prompt 模板链和模型调用。

### **2\. 接口设计（面向 Agent 与 CLI 优化）**

要让 AI 能推荐参数并调用，系统必须暴露强类型的“工具箱（Tools）”。

* **参数配置打平**：将旧系统 UI 上散落的配置，定义为严格的 JSON Schema。  
  // Agent 需要输出的调用参数示例  
  {  
    "plot": "...",  
    "director\_style": "nolan",  
    "duration\_seconds": 30,  
    "enable\_stc": true,  
    "assets": {"characters": \[\], "scenes": \[\]}  
  }

* **无状态化 (Stateless)**：旧系统强依赖全局变量 window.ChainEngine 保存状态。重构后，生成引擎必须是无状态的，状态（上下文、上一个镜头的视觉桥梁）应存储在 Redis 或数据库中，通过 task\_id 传递。

### **3\. 自动化形态：CLI 与 Agent 接入**

* **CLI (命令行工具)**：基于 Python 的 Typer 或 Click 库，封装 API。  
  * *指令示例*：soullens generate \--script ./input.md \--style cyberpunk \--duration 60 \--out ./result.xlsx  
* **AI Agent 调用**：  
  * 将后端 API 封装为 OpenAI Tool (Function Calling) 格式。  
  * 系统作为“工具”注册给大语言模型。用户输入：“帮我写一个15秒的赛博朋克风悬疑短片提示词”，LLM 会自动理解意图，生成上述的 JSON Schema 并调用后端接口，最后将结果返回。

### **4\. 总结重构路线图**

1. **剥离核心逻辑**：将 JS 中的 API 请求、JSON 截取、红黄区词汇过滤，用 Python/Node.js 重写为纯粹的后端 Service。  
2. **提示词外置**：抽离所有模板字符串，建立 .yaml 提示词库。  
3. **API 化**：提供 /analyze, /extract\_assets, /generate\_chain, /qa 等独立接口。  
4. **前端轻量化**：前端仅作为纯粹的视图层（推荐 React/Vue），负责状态展示，不再处理大段逻辑运算。