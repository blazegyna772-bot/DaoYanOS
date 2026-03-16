在 Trae（或 VS Code）的终端中从零初始化这样一个现代化的前端项目，核心逻辑是通过官方提供的脚手架（CLI 工具）自动化生成基础配置。这种方式的**优势**在于高度标准化、不易出错且配置极快；**局限**在于它高度依赖底层的 Node.js 环境和顺畅的网络连接（npm 源服务器）。

以下是客观、线性的具体执行流程。请在 Trae 中打开你的终端（快捷键通常是 `Ctrl + `` 或通过顶部菜单栏 `终端 -> 新建终端`），然后按顺序执行：

### 前置环境检查

在终端中输入以下命令并回车，确保你已经安装了 Node.js：

```bash
node -v

```

*预期结果：输出类似 `v18.x.x` 或 `v20.x.x` 的版本号。如果提示“找不到命令”，则需要先去 Node.js 官网下载并安装长期支持版（LTS）。*

---

### 第一步：创建 React (Vite) 基础工程

Vite 是目前构建 React 项目最快、最现代的工具。在终端中逐行输入并回车：

```bash
# 1. 创建一个名为 director-dashboard 的项目，并指定使用 React + TypeScript 模板
npm create vite@latest director-dashboard -- --template react-ts

# 2. 进入刚刚创建的项目文件夹
cd director-dashboard

# 3. 安装项目所需的基础依赖包
npm install

```

### 第二步：初始化 Shadcn UI (自动配置 Tailwind CSS)

Shadcn 的初始化工具会自动帮你把 Tailwind CSS 配置好，免去了手动修改配置文件的繁琐。

```bash
# 初始化 Shadcn UI 环境
npx shadcn@latest init

```

执行此命令后，终端会出现一系列交互式的英文问答。为了实现你要求的“高级深色模式”，请按以下选项进行选择（使用键盘上下键移动，回车确认）：

1. **Which style would you like to use?** -> 选择 `New York` (文字偏小，更具专业工具的质感)
2. **Which color would you like to use as base color?** -> 选择 `Zinc` (一种极具极客感、不偏蓝不偏黄的中性冷灰色)
3. **Do you want to use CSS variables for colors?** -> 选择 `yes`
后面关于 `tailwind.config.js` 等路径的问题，**全部直接按回车，保持默认即可**。

### 第三步：下载所需的基础组件源码

正如之前所评估的，我们需要把按钮、标签页、折叠面板等源码“拿”到你的项目中。

```bash
# 批量下载 Prompt 中提到的基础组件
npx shadcn@latest add button tabs scroll-area separator accordion

# 安装极简线性图标库
npm install lucide-react

```

*执行完毕后，你会在左侧的项目目录树中看到新增了 `src/components/ui/` 文件夹，里面包含了这些组件的源码文件。*

### 第四步：启动本地开发服务器

一切准备就绪后，启动项目预览：

```bash
npm run dev

```

终端会输出一个类似 `http://localhost:5173` 的本地链接。按住 `Ctrl` (Windows) 或 `Cmd` (Mac) 键点击这个链接，就能在浏览器中看到一个纯白的初始 React 页面。

---

**下一步建议：**
如果在执行 `npm install` 或下载组件时遇到长时间卡顿或报错（通常是因为国内网络访问 npm 官方源不稳定），请告诉我，我可以为你提供切换国内镜像源（如淘宝源或腾讯源）的客观解决方案。如果一切顺利，你可以直接把之前我写的那段 Prompt 发给 AI，让它帮你生成 `MainLayout.tsx` 的代码了。需要我教你把生成的代码放到哪个具体的文件里吗？