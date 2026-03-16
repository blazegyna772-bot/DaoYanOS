# **SoulLens 新系统开发：Claude Code 协作指南**

在启动 claude 命令行工具之前，你需要做一系列准备工作。Claude Code 具有读取本地文件、执行终端命令的能力，因此前期为它构建好\*\*“知识库”**和**“清晰的边界”\*\*是成功的关键。

## **一、 需要准备的信息和文件清单**

在你的本地工作目录下，新建一个文件夹（例如 soullens-v6），并在其中创建一个 /docs/legacy（旧资料）目录和一个核心上下文文件。你需要准备以下 4 个核心文件：

### **1\. 原始代码库 (The Monolith)**

* **文件**：soullensV5.1(1).html  
* **用途**：作为绝对的逻辑参考。AI 在提取具体的生成逻辑（如资产怎么替换、时间轴怎么算）时，需要经常回头看这个文件。  
* **存放位置**：/docs/legacy/soullensV5.1.html

### **2\. 产品需求与功能盘点**

* **文件**：SoulLens旧系统功能盘点-粗版.md  
* **用途**：告诉 AI 这个系统**到底是什么、包含哪些核心功能、哪些是绝对不能丢的机制**（如：保真模式、链式生成、视觉桥梁）。  
* **存放位置**：/docs/legacy/feature\_inventory.md

### **3\. 重构与技术评估报告**

* **文件**：SoulLens\_Refactoring\_Analysis.md (即我们刚刚生成的技术评估报告)  
* **用途**：告诉 AI **新的技术栈是什么**（FastAPI \+ Python \+ React/Vue）、**架构要求是什么**（前后端分离、无状态、提示词解耦）。

### **4\. 项目大纲与 AI 规则文件 (新建)**

* **文件**：CLAUDE.md 或 CONTEXT.md (放在项目根目录)  
* **用途**：这是 Claude Code 的入口说明文件，每次启动它都会默认读取。  
* **内容必须包含**：  
  * **项目名称与目标**：重构 SoulLens 提示词引擎。  
  * **技术栈约束**：后端（Python/FastAPI/Pydantic），前端（React/Tailwind/Vite），配置（YAML）。  
  * **代码规范**：要求其必须编写类型提示（Type Hints），必须对 API 接口定义 Schema，禁止将业务逻辑写在前端组件中。

## **二、 初始项目结构（需让 AI 了解）**

在开始敲代码前，告诉 Claude Code 你期望的目录结构。你可以把这个结构写在 CLAUDE.md 中：

soullens-v6/  
├── CLAUDE.md                  \# AI 协作规则  
├── docs/  
│   └── legacy/                \# 旧系统的 HTML 和 MD 评估文档  
├── backend/                   \# Python FastAPI 后端  
│   ├── app/  
│   │   ├── api/               \# 路由层 (Endpoints)  
│   │   ├── services/          \# 业务逻辑 (链式生成, 资产提取等)  
│   │   ├── schemas/           \# Pydantic 模型 (输入/输出结构)  
│   │   └── core/              \# 配置与 LLM 客户端  
│   ├── prompts/               \# YAML 格式的提示词库  
│   ├── requirements.txt  
│   └── main.py  
└── frontend/                  \# React 前端  
    ├── src/  
    │   ├── components/        \# UI 组件  
    │   ├── store/             \# 状态管理 (取代 window.ChainEngine)  
    │   └── api/               \# 后端接口请求封装  
    └── package.json

## **三、 与 Claude Code 的分步执行策略**

不要让 Claude Code 一次性干完所有事。请按照以下四个阶段（Step 1 到 Step 4）依次向 Claude 派发任务。

### **Step 1: 基础设施构建与 Pydantic 模型定义**

**目标**：确立前后端数据交互的“契约”，并搭建空的项目骨架。

**给 Claude Code 的指令示例**：

"请读取 docs/legacy/ 下的分析报告和旧版代码。首先，在 backend/ 目录下初始化一个 FastAPI 项目。然后，参考旧代码中的功能，在 backend/app/schemas/ 下使用 Pydantic 定义所有的核心数据结构，包括：用户输入的请求 Schema、导演风格配置 Schema、资产库 (Character/Scene/Prop) Schema，以及分镜输出结果的 Schema。"

### **Step 2: 提示词解耦与外置 (Prompt Externalization)**

**目标**：将原来硬编码在 JS 里的模板字符串，转化为独立的 YAML 文件。

**给 Claude Code 的指令示例**：

"阅读旧代码 soullensV5.1.html 中所有大段的系统提示词（如 A、C、q、A() 等变量）。请在 backend/prompts/ 目录下创建对应的 .yaml 文件（如 stc\_analysis.yaml, scene\_generation.yaml）。将提示词内容提取进去，并将其中需要动态替换的变量（如 duration, style, assets）替换为 Jinja2 的 {{ 变量名 }} 语法。请确保提取时不遗漏'六字段强制约束'等核心规则。"

### **Step 3: 后端核心业务逻辑重写 (Services)**

**目标**：将旧 JS 代码中的 ChainEngine（链式生成）、剧本分析、视觉桥梁提取逻辑，用 Python 重写为纯粹的 Service 函数。

**给 Claude Code 的指令示例**：

"现在开始编写 backend/app/services/ 下的核心逻辑。请参考旧代码中的 Wn 函数（场次切分）和 Nt 函数（单段生成）。你需要实现一个无状态的 GeneratorService，它接收上一步定义的 Pydantic 参数，读取我们刚才写的 YAML 提示词，并组装调用 LLM。特别注意实现'视觉桥梁'逻辑：每次生成完一个场次，必须调用一次 LLM 提取终点状态，作为下一个场次的输入。"

### **Step 4: 前端视图层重构**

**目标**：开发 React 前端，只负责 UI 渲染和状态管理，剥离所有生成逻辑。

**给 Claude Code 的指令示例**：

"后端接口已就绪。请在 frontend/ 目录下使用 Vite \+ React \+ TailwindCSS 初始化前端。参考旧版 HTML 的 UI 布局，拆分出以下组件：导演选择卡片、资产库管理面板、参数配置面板、链式生成进度条、分镜结果表格。使用 Zustand 或 React Context 管理状态，通过 Fetch 或 Axios 调用后端的 FastAPI 接口。所有大段逻辑和模型调用全部交由后端处理。"

## **四、 你的第一条启动 Prompt (Copy & Paste)**

准备好文件和目录后，在终端运行 claude 进入交互模式，直接粘贴以下指令作为整个项目的启动点：

你好，Claude。我们现在的任务是重构一个名为 SoulLens 的“导演级分镜提示词系统”。  
旧系统是一个超过 3000 行的单文件 HTML，高度耦合。我们的目标是将其重构为一个【前后端分离、无状态、提示词 YAML 化外置】的现代化系统。

我已经将旧版源码和两份分析/规划报告放在了 \`docs/legacy/\` 目录下。

请你先做以下事情：  
1\. 仔细阅读 \`docs/legacy/\` 目录下的所有文件，理解系统的核心价值（链式生成、保真模式、五维输出、资产标签一致性）。  
2\. 阅读完成后，向我总结你理解的 3 个最核心的技术重构难点。  
3\. 根据 \`SoulLens\_Refactoring\_Analysis.md\` 的建议，为本项目在当前目录下生成标准的后端 (FastAPI) 和 前端 (React) 目录结构（暂时只建空目录和配置文件）。  
4\. 完成后，等待我发布第一阶段的具体开发指令。  
