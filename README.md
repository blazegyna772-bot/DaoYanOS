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
- **单镜修改**: 精准修改指定分镜，AI智能调整
- **导出功能**: 支持CSV/JSON格式导出

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

# 启动开发
npm run dev

# 构建
npm run build

# 生产运行
npm run start
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
- `PUT /api/projects/[id]` - 更新项目
- `DELETE /api/projects/[id]` - 删除项目

### 生成
- `POST /api/generate` - 分镜生成（流式）
- `DELETE /api/generate` - 取消生成
- `GET /api/generate?projectId=xxx` - 预览提示词

### 资产
- `POST /api/assets/extract` - 从剧本提取资产

### 分镜
- `POST /api/shots/edit` - 单镜修改

### 提示词管理
- `GET /api/prompts` - 获取所有提示词模板
- `POST /api/prompts` - 重载提示词

## 目录结构

```
DaoYanOS/
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API路由
│   │   ├── editor/        # 编辑器页面
│   │   │   ├── page.tsx   # 剧本页
│   │   │   ├── assets/    # 资产页
│   │   │   └── shots/     # 分镜页
│   │   ├── settings/      # 设置页
│   │   ├── layout.tsx     # 根布局
│   │   └── page.tsx       # 首页
│   ├── components/        # UI组件
│   ├── lib/               # 工具函数
│   │   ├── chainEngine.ts # 链式生成引擎
│   │   ├── promptBuilder.ts # 提示词构建
│   │   ├── storage.ts     # 本地存储
│   │   └── ...
│   └── types/             # 类型定义
├── prompts/               # YAML提示词库
│   ├── categoryGuides.yaml  # 分类人格
│   ├── directors.yaml       # 导演数据
│   ├── durationRules.yaml   # 时长路由
│   ├── shotRules.yaml       # 分镜规则
│   ├── shotEdit.yaml        # 单镜修改
│   ├── faithfulMode.yaml    # 保真模式
│   ├── safetyFilter.yaml    # 安全过滤
│   ├── visualStyles.yaml    # 视觉风格
│   └── platforms.yaml       # 平台配置
└── package.json
```

## 功能清单

### 核心生成链
- [x] 剧本导入（TXT/粘贴）→ 资产自动提取
- [x] 导演风格选择（39位导演+5种分类人格）
- [x] 视觉风格选择（18种风格）
- [x] 链式分镜生成（Stage A→B→C）
- [x] 时间轴自动计算
- [x] 视觉桥梁（跨场次连续性）

### 资产系统
- [x] 三类资产槽位（角色/场景/道具）
- [x] @标签系统
- [x] 资产自动提取
- [x] 标签/文字双模式

### 安全与保真
- [x] 四区检测（红区/黄区/名人区/IP区）
- [x] 敏感词替换
- [x] 保真模式（1:1视觉化）

### 编辑闭环
- [x] 单镜精准修改
- [x] 手动编辑分镜字段
- [x] 批量删除分镜

### 导出
- [x] CSV导出
- [x] JSON导出

## License

Copyright © 2025 QiYing. All rights reserved.参考soullens 5.0.HTML源码,仅供学习研究.
