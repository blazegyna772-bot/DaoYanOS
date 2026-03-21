# AI导演制作中台 (DaoYanOS)

**作者**: QiYing

导演级分镜提示词生成系统，当前主线目标是延用 `soullensV5` 已验证过的稳定控制链路。

## 项目简介

DaoYanOS 是一款面向AI视频生成的导演工具，将剧本转化为可执行的AI视频平台提示词。

### 核心功能

- **项目管理**: 本地文件系统管理，项目数据完全归属用户
- **剧本编辑**: 支持直接粘贴剧本、分集管理、参数配置
- **资产库**: 角色/场景/道具管理，支持@标签系统
- **资产编辑**: 支持添加资产、编辑描述、上传本地图片、移除图片
- **链式生成**: 长剧本分场次生成，沿用 soullensV5 风格的 Stage A / B / C 稳定控制链路
- **单镜修改**: 优先按场次局部分镜表进行精准修改，锁死台词，仅允许目标镜头变更
- **提示词工作台**: 独立 `提示词` 标签页支持 YAML 查看、编辑、保存、重载
- **提示词版本管理**: 支持为每个 YAML 文件创建 / 应用 / 删除 `V1 / V2 / V3` 等版本快照
- **官方默认恢复**: 支持一键恢复 `prompt-defaults/` 官方默认，并在恢复前自动备份当前内容
- **平台配置**: 设置页专注多平台配置与真实连接测试，不再承担提示词主工作流
- **导出功能**: 支持 CSV / JSON / Markdown 导出
- **页内反馈**: 剧本页 / 分镜页 / 提示词工作台关键动作已尽量改为非阻断式页内提示

## 技术栈

- **框架**: Next.js 15 + React 19
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4
- **组件**: shadcn/ui
- **存储**: 本地文件系统 (JSON)

## 本地存储结构

当前实际存储以项目级 `meta.json` 为主，包含项目元数据、分集、分镜、资产信息等。
资产图片当前也会以内联数据的形式保存在 `meta.json` 中，尚未拆分到独立文件目录。

```
~/Documents/DaoYanOSProjects/
├── {project_id}/
│   ├── meta.json          # 项目元数据、剧本、分镜
│   └── outputs/           # 预留输出目录
└── global_config.json     # 全局平台配置
```

## 开发启动

```bash
# 安装依赖
npm install

# 启动开发
npm run dev

# 构建
npm run build

# 单镜修改最小回归校验
npm run verify:shot-edit

# source 主链回归校验
npm run verify:source-chain

# 组合回归
npm run verify:regression

# 真实样本质量复核
npm run review:source-quality

# 生产运行
npm run start
```

默认开发地址：

- `http://localhost:3000`

## 提示词管理

提示词存储在 `prompts/` 目录下的 YAML 文件。
当前主入口是编辑器内的 `提示词` 标签页：`/editor/prompts?id=项目ID&episodeId=分集ID`。

相关能力：
- 当前运行版本在 `prompts/*.yaml`
- 官方保底版本在 `prompt-defaults/*.yaml`
- 手动版本快照在 `prompts/_versions/<filename>/`
- 保存与应用版本后，服务端会同时重载 `promptManager` 和 `promptLoader` 缓存

手动重载 API:
```bash
POST /api/prompts
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
  - 同场次目标镜头优先按场次局部分镜表编辑
  - 兼容 Markdown 表格与旧 JSON 数组回写
  - 后端会再次执行目标镜头限制、台词锁死、时间轴重算

### 配置
- `GET /api/config` - 获取全局平台配置
- `PUT /api/config` - 保存全局平台配置
- `POST /api/config` - 测试平台连接

### 导出
- `GET /api/export?projectId=xxx&format=json&type=shots` - 导出分镜
- `GET /api/export?projectId=xxx&format=csv&type=prompts` - 导出提示词

### 提示词管理
- `GET /api/prompts` - 获取所有提示词模板
- `PUT /api/prompts` - 更新指定 YAML 提示词文件
- `POST /api/prompts` - 重载提示词
- `GET /api/prompts/versions?filename=xxx.yaml` - 获取版本列表
- `GET /api/prompts/versions?filename=xxx.yaml&versionName=V1` - 读取指定版本
- `POST /api/prompts/versions` - 创建版本快照
- `PUT /api/prompts/versions` - 应用指定版本为当前运行版本
- `DELETE /api/prompts/versions` - 删除指定版本
- `GET /api/prompts/defaults?filename=xxx.yaml` - 查看官方默认版本
- `PUT /api/prompts/defaults` - 恢复官方默认版本（恢复前自动备份当前内容）

## 目录结构

```
DaoYanOS/
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API路由
│   │   ├── editor/        # 编辑器页面
│   │   │   ├── page.tsx   # 剧本页
│   │   │   ├── assets/    # 资产页
│   │   │   ├── shots/     # 分镜页
│   │   │   └── prompts/   # 提示词工作台
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
│   ├── _versions/         # 提示词版本快照
│   ├── categoryGuides.yaml  # 分类人格
│   ├── directors.yaml       # 导演数据
│   ├── durationRules.yaml   # 时长路由
│   ├── shotRules.yaml       # 分镜规则
│   ├── shotEdit.yaml        # 单镜修改
│   ├── systemPrompts.yaml   # 主系统提示词骨架
│   ├── faithfulMode.yaml    # 保真模式
│   ├── safetyFilter.yaml    # 安全过滤
│   ├── visualStyles.yaml    # 视觉风格
│   └── platforms.yaml       # 平台配置
├── prompt-defaults/        # 官方默认提示词保底版本
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
- [x] 本地图片上传 / 移除

### 安全与保真
- [x] 四区检测（红区/黄区/名人区/IP区）
- [x] 敏感词替换
- [x] 保真模式（1:1视觉化）

### 编辑闭环
- [x] 单镜精准修改
- [x] 场次局部上下文单镜修改
- [x] 单镜修改本地回归校验
- [x] 手动编辑分镜字段
- [x] 批量删除分镜
- [x] 独立提示词工作台
- [x] 提示词版本管理
- [x] 恢复官方默认并自动备份

### 导出
- [x] CSV导出
- [x] JSON导出
- [x] Markdown导出

## 当前已知暂缓项

- [ ] 资产页 `AI生图`
- [ ] 非主链调试日志继续收口
- [ ] Next dev 长时间运行后偶发 `.next` chunk 缺失问题单独治理

## License

Copyright © 2025 QiYing. All rights reserved. 参考 soullens 5.0 HTML 源码，仅供学习研究。
