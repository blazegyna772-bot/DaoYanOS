# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**AI导演制作中台 (DaoYanOS)**
- 作者：QiYing
- 导演级分镜提示词生成系统
- 将剧本转化为AI视频生成平台（RunwayML等）可用提示词

## 参考文件

1. **`_Input/1st/soullensV5.1.html`** - 功能参考源（需复刻完整功能，但移除版权/作者信息）
2. **`_Input/1st/SOULLENS_MODULE_ANALYSIS.md`** - 架构参考
3. **`_Input/cank/`** - 他人建议（供参考，以用户需求为优先）

## 重构方向

- 方便迭代
- 方便改动
- 本地文件系统管理（项目数据完全归属用户）

## 技术栈

- **框架**: Next.js 15 + React 19
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4
- **组件**: shadcn/ui
- **存储**: 本地文件系统（JSON）
- **运行时**: Node.js

## 项目结构

```
DaoYanOS/
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API路由
│   │   │   ├── projects/  # 项目管理
│   │   │   ├── assets/    # 资产管理
│   │   │   ├── prompts/   # 提示词管理（热重载）
│   │   │   └── generate/  # AI生成接口
│   │   ├── layout.tsx     # 根布局
│   │   └── page.tsx       # 主页面
│   ├── components/        # UI组件
│   ├── lib/               # 工具函数
│   │   ├── storage.ts     # 本地存储
│   │   ├── promptManager.ts  # 提示词热重载管理
│   │   └── utils.ts       # 通用工具
│   └── types/             # 类型定义
├── prompts/               # YAML提示词库（热重载监控）
├── data/                  # 用户项目数据（gitignored）
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

## 新增功能

1. **项目管理**: 本地文件系统管理，新建项目即创建文件夹
2. **提示词管理系统**: YAML外置，运行时热重载，支持开发时在线优化调试

## 命名规范

- 项目名称：DaoYanOS（英文）/ AI导演制作中台（中文）
- 作者：QiYing
- 不再使用原soullens相关名称
- 核心概念术语保持（链式生成、视觉桥梁、保真模式、@标签系统）
