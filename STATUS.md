# DaoYanOS 项目状态记录
> 记录时间：2026-03-21 14:42 CST
> 用途：快速恢复当前真实开发状态

## 当前结论

- 项目当前可正常 `npm run build`
- 项目当前可正常 `npm run verify:regression`
- 新增最小回归命令：`npm run verify:shot-edit`
- 新增 source 主链回归命令：`npm run verify:source-chain`
- 新增组合回归命令：`npm run verify:regression`
- 新增真实质量复核命令：`npm run review:source-quality`
- 核心链路已具备：项目管理、剧本编辑、资产提取、链式生成、单镜修改、导出、提示词工作台
- 已开始按 `_Input/1st/soullensV5.1.html` 做“内在复刻”改造，目标从“能生成”转为“复刻源程序验证过的稳定控制链路”
- 当前已完成 3 组真实样本质量复核，强对白冲突 / 动作冲突 / 节奏平缓样本均通过
- 目前可判定：主生成链路与单镜修改链路已达到“可接受的 soullensV5 稳定控制链质量”
- 提示词迭代主工作流现已从设置页完全抽离到 `提示词` 标签页，可在不碰设置页 UI 的前提下持续迭代 YAML
- 提示词版本管理已可用：支持创建 / 读取 / 应用 / 删除版本快照
- 官方默认恢复已可用：支持从 `prompt-defaults/` 恢复，并在恢复前自动备份当前内容
- 最近已修复：
  - `src/app/api/shots/edit/route.ts` 语法错误
  - `src/lib/devLogger.ts` 与 `src/components/dev-log-panel.tsx` 的 `success` 日志类型缺失
  - `prompts/shotRules.yaml` YAML 引号错误
  - 单镜修改后的项目保存请求体格式错误
  - 资产页基础可用性：保存、添加资产、本地图片上传、图片移除、资产映射重建
  - 设置页“测试连接”改为真实接口探活
  - 编辑页自动保存优化为 `dirty/saving/saved/error` 状态流，5 秒防抖并保留关键动作前强制保存
  - 生成入口补上 `effectivePlotForGenerate = faithfulHeader + cleanPlot`
  - 主 prompt 开始注入 `assetNameMap -> nameMappingInstruction`
  - Stage B 改为按场次注入时间段 / 镜数 / bridgeState / 本场唯一依据剧本
  - burst / mini / full prompt 开始统一补回保真尾注入
  - 新增 `prompts/systemPrompts.yaml`，将 `full / burst / Stage A / Stage B` 主系统提示词骨架外置到 YAML
  - `src/app/api/shots/edit/route.ts` 已开始接入 `promptBuilder + shotEdit.yaml`
  - 单镜修改开始按完整 Markdown 分镜表输入，并支持兼容整表返回后回写
  - 单镜修改 `system prompt` 已收窄到 source 风格的 fresh asset 注入结构
  - 同场次目标镜头开始按场次局部分镜表编辑，不再默认整集送入修改
  - Stage A 补强了 `contentSummary` 缺失时的回退填充，并将 `beatTask` 回灌到 Stage B
  - 单镜修改纯逻辑已抽离到 `src/lib/shotEdit.ts`
  - `shotEdit.yaml` 已补强“场次内镜号 / 保留原顺序 / 返回完整 Markdown 表”规则
  - 新增 `scripts/shot-edit-regression.ts`，可本地验证单镜修改关键护栏
  - 新增 `scripts/source-chain-regression.ts`，可本地验证 source 主链关键护栏
  - 剧本页 / 分镜页 / 设置页提示词区已用页内反馈替换关键 `alert()`
  - 设置页提示词按钮由“重置默认”收口为“恢复已保存”
  - 已跑通一次真实单镜修改 smoke，确认 `/api/shots/edit` 可经由本地 API 调起外部模型并正确回写
  - 已跑通一次真实链式生成 smoke，确认 `/api/generate` 已进入真实 Stage A / Stage B 流式链路
  - 已修复真实 smoke 暴露出的 Stage A `beatType` 归一化问题，避免 `reaction / decision / resolution` 等非标准节拍导致 `beatTask` 丢失
  - 已补上 Stage A 台词回灌护栏，降低模型切场摘要遗漏原台词时的保真风险
  - 已修复 faithful 头部混入 Stage A 台词回灌的问题，回灌与摘要补齐现在只对原始剧本文本生效
  - 已支持合并 Stage A 模型显式返回的 `台词原文` 字段
  - 已修复单镜修改回写时台词格式未逐字逐符号保留原样的问题
  - 已补充并跑通 `scripts/source-quality-review.ts`，完成真实 3 样本复核闭环
  - 已新增独立提示词工作台 `src/app/editor/prompts/page.tsx`
  - 已新增 `src/app/api/prompts/versions/route.ts` 与 `src/lib/promptVersions.ts`
  - 已新增 `src/app/api/prompts/defaults/route.ts` 与 `src/lib/promptDefaults.ts`
  - 已新增 `prompt-defaults/` 官方默认提示词目录
  - 已修复提示词保存后只重载 `promptManager`、未重载 `promptLoader` 缓存的问题

## 当前可用功能

### 已可用
- 项目创建、复制、删除、读取、本地 JSON 存储
- 剧本输入与分集管理
- 剧本资产提取
- 导演风格、视觉风格、画幅、质量等参数配置
- 链式分镜生成与流式进度展示
  - Stage A 返回非标准节拍时会自动归一化到主链节拍
- 单镜修改
  - 同场次优先按场次局部分镜表编辑
  - 锁死台词并仅允许目标镜头变更
- 分镜导出：CSV / JSON / Markdown
- 提示词工作台
  - 独立标签页查看、编辑、保存、重载 YAML
  - 创建 / 读取 / 应用 / 删除版本快照
  - 恢复到当前已保存版本
  - 恢复官方默认版本并自动备份
- 全局平台配置保存
- 设置页平台连接测试
- 资产页的基础编辑闭环
  - 添加资产
  - 编辑名称 / 描述
  - 删除资产
  - 上传本地图片
  - 移除图片

### 暂未实现或有意暂缓
- 资产页 `AI生图`

## 本轮代码变更摘要

- `src/app/editor/prompts/page.tsx`
  - 新增独立提示词工作台页面
  - 集中承接提示词编辑、版本管理、官方默认恢复
- `src/app/api/prompts/versions/route.ts`
  - 新增版本快照列表 / 读取 / 创建 / 应用 / 删除接口
- `src/lib/promptVersions.ts`
  - 新增版本快照存储能力，版本文件保存在 `prompts/_versions/`
- `src/app/api/prompts/defaults/route.ts`
  - 新增官方默认读取 / 恢复接口
- `src/lib/promptDefaults.ts`
  - 新增恢复官方默认逻辑，并在恢复前自动创建 `AUTO_BEFORE_RESTORE_*` 备份
- `prompt-defaults/`
  - 新增官方默认提示词基线目录
- `src/app/api/shots/edit/route.ts`
  - 继续对齐 soullensV5 风格的单镜修改上下文选择
  - 按场次局部上下文计算相对镜号
  - 回写前继续执行目标镜头限制、台词锁死、时间轴重算
- `src/lib/shotEdit.ts`
  - 新增单镜修改纯逻辑模块，承接上下文选择、Markdown/JSON 解析、目标镜头护栏、时间轴重算
- `scripts/shot-edit-regression.ts`
  - 新增最小本地回归校验脚本
- `scripts/source-chain-regression.ts`
  - 新增 source 主链回归校验脚本
- `src/lib/chainEngine.ts`
  - 新增 `beatType` 归一化逻辑，兼容真实模型返回的非标准节拍名
  - 新增 Stage A 台词回灌逻辑，尽量把原剧本台词带回 `contentSummary`
- `src/app/editor/shots/page.tsx`
  - 将关键 `alert()` 收口为页内反馈
- `src/app/editor/page.tsx`
  - 将生成前校验与资产提取结果收口为页内反馈
- `src/app/settings/page.tsx`
  - 提示词编辑主工作流已迁出，设置页现在聚焦平台配置与连接测试
- `src/lib/devLogger.ts`
  - 新增 `success` 日志类型
- `src/components/dev-log-panel.tsx`
  - 支持显示和筛选 `success` 日志
- `prompts/shotRules.yaml`
  - 修复 YAML 解析错误
- `src/app/editor/shots/page.tsx`
  - 修复单镜修改后保存项目的请求体
- `src/app/editor/assets/page.tsx`
  - 补齐保存、添加资产、本地图片上传、图片移除
  - 资产变更时重建 `assetNameMap`
- `src/app/api/config/route.ts`
  - 新增平台连接测试接口
- `src/app/settings/page.tsx`
  - 设置页改为真实测试连接，并显示成功/失败信息

## 当前风险与缺口

1. 资产页 `AI生图` 仍是占位按钮
2. 代码里仍有少量 `console.log()` / 调试式交互噪音待收口
   - 关键主链已不阻塞，但还有进一步产品化空间
3. 提示词工作台仍残留少量 `window.confirm`
   - 不影响使用，但后续可继续改成页内反馈
4. 单镜修改链路仍未完全对齐 source
  - source 风格的局部上下文 / 相对镜号 / 全表返回 / 台词锁死 / 标签一致性目前已通过真实样本复核
5. 真实样本质量已通过，但运行期仍有非主链噪音待收口
  - 长时间运行后的部分 Next dev 实例偶发 `.next` chunk 缺失，需通过单独的工程稳定性清理处理
  - 页面与服务端仍有少量低价值调试日志，可继续收口，但已不阻塞 soullensV5 稳定控制链目标

## 建议下一步

1. 保持 `soullensV5` 稳定控制链不再大改，只做低风险收尾
2. 直接在 `提示词` 标签页里迭代 `systemPrompts.yaml`、`shotEdit.yaml` 与相关规则 YAML
3. 继续清理剩余页面与服务端调试日志
4. 把提示词工作台里少量确认弹窗继续改为页内反馈
5. 单独处理 Next dev 长时间运行后的 `.next` chunk 缺失问题
6. `AI生图` 继续延后，不进入当前主线

## 常用命令

```bash
npm install
npm run dev
npm run build
npm run verify:shot-edit
npm run verify:source-chain
npm run verify:regression
npm run review:source-quality
```

## 关键参考

- `CLAUDE.md`
- `_Input/1st/soullensV5.1.html`
- `_Input/1st/SOULLENS_MODULE_ANALYSIS.md`
- `_Input/1st/SOULLENS_PARAMETER_DICTIONARY.md`
