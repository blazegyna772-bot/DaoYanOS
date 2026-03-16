# AI导演制作中台 (DaoYanOS)

**作者**: QiYing

导演级分镜提示词生成系统。

## 项目简介

DaoYanOS 是一款面向AI视频生成的导演工具，将剧本转化为可执行的AI视频平台提示词。

### 核心功能

- **项目管理**: 本地文件系统管理，项目数据完全归属用户
- **剧本编辑**: 支持导入TXT/直接粘贴，AI自动分析扩写
- **资产库**: 角色/场景/道具管理，支持@标签系统
- **链式生成**: 长剧本分场次生成，保持视觉连贯性
- **提示词管理**: YAML外置，运行时热重载调试

## 技术栈

- **框架**: Next.js 15 + React 19
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4
- **组件**: shadcn/ui
- **存储**: 本地文件系统 (JSON)

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

## 开发启动

```bash
# 安装依赖
npm install

# 启动开发（使用Turbopack）
npm run dev
```

## 提示词热重载

提示词存储在 `prompts/` 目录下的 YAML 文件。

修改后自动热重载，无需重启服务。

手动重载API:
```bash
POST /api/prompts
{ "action": "reload" }
```

## API端点

### 项目管理
- `GET /api/projects` - 列出所有项目
- `POST /api/projects` - 创建新项目
- `GET /api/projects/[id]` - 获取项目详情
- `PATCH /api/projects/[id]` - 更新项目
- `DELETE /api/projects/[id]` - 删除项目

### 提示词管理
- `GET /api/prompts` - 获取所有提示词模板
- `POST /api/prompts` - 重载提示词

## 目录结构

```
DaoYanOS/
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API路由
│   │   ├── layout.tsx     # 根布局
│   │   └── page.tsx       # 主页面
│   ├── components/        # UI组件
│   ├── lib/               # 工具函数
│   └── types/             # 类型定义
├── prompts/               # YAML提示词库
├── data/                  # 用户项目数据（gitignored）
└── package.json
```

## 功能完整复刻清单（来自 soullensV5.1.html）

### 核心生成链
- [ ] 剧本导入（TXT/粘贴）→ 资产自动提取
- [ ] AI分析扩写
- [ ] 导演风格选择（28位导演+分类人格）
- [ ] 视觉风格选择
- [ ] 链式分镜生成（Stage A→B→C）
- [ ] 时间轴无缝衔接
- [ ] 视觉桥梁（跨场次连续性）

### 资产系统
- [ ] 三类资产槽位（角色/场景/道具）
- [ ] @标签系统
- [ ] 资产自动提取
- [ ] 标签/文字双模式

### 安全与保真
- [ ] 红黄区词过滤
- [ ] 保真模式（1:1视觉化）
- [ ] 台词镜像

### 编辑闭环
- [ ] 单镜精准修改
- [ ] 全局整体修改
- [ ] 场次重试

### 导出
- [ ] Excel导出
- [ ] Markdown导出

## License

Copyright © 2025 QiYing. All rights reserved.
