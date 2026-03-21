# DaoYanOS 开发日志与待办

## v0.2.4 (2026-03-21)

### 本轮完成
- ✅ 完成一次项目全面体检
  - `npm run verify:regression` 已通过
  - `npm run build` 已通过
  - 当前可继续作为下一阶段提示词迭代基线
- ✅ 提示词主工作流已从设置页彻底抽离到独立标签页
  - 新增 `src/app/editor/prompts/page.tsx`
  - 剧本 / 资产 / 分镜页均可直达 `提示词` 标签页
  - 设置页现在主要负责平台配置与连接测试
- ✅ 提示词版本管理已落地
  - 新增 `GET/POST/PUT/DELETE /api/prompts/versions`
  - 支持为单个 YAML 文件创建 / 读取 / 应用 / 删除 `V1 / V2 / V3` 等版本快照
- ✅ 官方默认恢复能力已落地
  - 新增 `prompt-defaults/` 官方基线目录
  - 新增 `/api/prompts/defaults`
  - 恢复前会自动备份当前内容为 `AUTO_BEFORE_RESTORE_<timestamp>`
- ✅ 主系统提示词进一步从 TS 常量解耦到 YAML
  - `prompts/systemPrompts.yaml` 已承接更多 source 风格模板片段
  - `src/lib/promptBuilder.ts` 继续改为从 YAML 组装系统提示词
- ✅ 提示词保存 / 应用 / 恢复后的运行时重载缺口已补齐
  - `promptManager.reload()` 与 `reloadPromptConfig()` 现会同时触发

### 当前结论
- 当前主生成链路、单镜修改链路、提示词工作台都已处于可继续迭代状态
- 下一阶段可以直接在 `提示词` 标签页里反复改 `systemPrompts.yaml`、`shotEdit.yaml` 和相关规则文件
- 当前唯一上层目标仍是：延用 `soullensV5` 的稳定控制链路，不做偏题扩张

### 下一阶段待办
- [ ] 以真实样本继续迭代 `systemPrompts.yaml` / `shotEdit.yaml`
- [ ] 继续清理页面与服务端残留的低价值 `console.log`
- [ ] 把提示词工作台里的少量 `window.confirm` 也逐步收口为页内反馈
- [ ] 单独处理 Next dev 长时间运行后偶发 `.next` chunk 缺失问题
- [ ] `AI生图` 继续延后，不进入当前主线

## v0.2.3 (2026-03-21)

### 本轮完成
- ✅ 单镜修改链路继续向 soullensV5 对齐
  - 场次局部上下文 / 场次内相对镜号已显式进入主链
  - 返回约束补强为“保留原顺序 + 保留总镜数 + 返回完整 Markdown 表”
  - 单镜修改纯逻辑已抽到 `src/lib/shotEdit.ts`
- ✅ 新增最小本地回归校验
  - 新增 `npm run verify:shot-edit`
  - 已覆盖场次局部上下文、相对镜号、台词锁死、时间轴重算、Markdown/JSON 回写
- ✅ 新增 source 主链回归校验
  - 新增 `npm run verify:source-chain`
  - 新增 `npm run verify:regression`
  - 已覆盖 `faithfulHeader / faithfulSuffix / Stage B bridge / beatTask / narrative routing`
- ✅ 已跑通真实本地 smoke
  - 临时项目已成功走通真实 `/api/shots/edit`
  - 临时项目已成功进入真实 `/api/generate` 的 Stage A / Stage B 流式链路
- ✅ 修复真实 smoke 暴露出的节拍归一化缺口
  - Stage A 模型返回 `reaction / decision / resolution` 等非标准节拍时，现会先归一化再回灌 `beatTask`
- ✅ 补上 Stage A 台词回灌护栏
  - 当模型切场摘要未带原台词时，现会按场次比例从原剧本中回灌台词原文到 `contentSummary`
- ✅ 完成 3 组真实样本质量复核并二次修正控制链
  - 已新增 `npm run review:source-quality`
  - 已修复 faithful 头部误入 Stage A 台词回灌的问题，改为只对原始剧本文本做对白补齐
  - 已把 Stage A 显式返回的 `台词原文` 字段并入 `contentSummary`
  - 已修复单镜修改回写时台词字段未逐字逐符号保留原格式的问题
  - 已修正复核脚本对 `@标签` 的误判口径
  - 最新真实复核结论：强对白冲突 / 动作冲突 / 节奏平缓 3 组样本均通过
- ✅ 关键编辑链路的阻断式 `alert()` 已收口为页内反馈
  - 剧本页
  - 分镜页
  - 设置页提示词编辑区
- ✅ 设置页提示词“重置默认”文案收口为“恢复已保存”，避免误导
- ✅ 当前再次确认可通过 `npm run build`

### 剩余重点
- [x] 第 5 步：完成一次 source 对照回归
  - [x] 对照 `_Input/1st/soullensV5.1.html`
  - [x] 对照 `_Input/1st/SOULLENS_MODULE_ANALYSIS.md`
  - [x] 对照 `_Input/1st/SOULLENS_PARAMETER_DICTIONARY.md`
  - [x] 补单镜修改的局部上下文 / 相对镜号 / 台词锁死 / 全表返回护栏
  - [x] 跑通一次真实本地 smoke，确认链路不只是本地假回归
  - [x] 重新评估“是否达到可接受的 Seedance2.0 稳定质量”
    - 说明：已完成 3 组真实样本质量复核，当前结论为“达到可接受的 soullensV5 稳定控制链质量”

## v0.2.2 (2026-03-20)

### 源程序内在复刻审查结论
- 当前实现还不能判定为已复刻 `_Input/1st/soullensV5.1.html` 的核心内在
- 主要问题不在“能不能生成提示词”，而在“是否沿用了源程序验证过的稳定控制链路”
- 已确认的关键缺口：
  - [ ] 缺少 `faithfulHeader + cleanPlot` 的输入侧保真注入
  - [ ] 缺少 `assetNameMap -> nameMappingInstruction` 的主链路注入
  - [ ] Stage B 仍按整片 prompt 生成，而不是按场次独立组装 scene 级 prompt
  - [ ] 单镜修改未使用 source 风格的 fresh base prompt + 标签映射约束
  - [ ] 已配置到 YAML 的部分 source 规则仍未真正进入线上主链

### 按源程序对齐的改造路线
- [~] 第 1 步：补齐保真双注入
  - [x] 生成入口开始支持 `effectivePlotForGenerate = faithfulHeader + cleanPlot`
  - [~] 输出侧 `faithfulSuffix` 统一回灌到 burst / mini / full / scene 级 prompt
- [~] 第 2 步：补齐资产映射控制链
  - [x] 读取并编译 `assetNameMap`
  - [x] 将 `nameMappingInstruction`、资产标签铁律、道具一致性规则注入主 prompt
  - [ ] 继续核对与源程序在 `[主体]` / `@标签` 细节上的字面一致性
- [~] 第 3 步：重构 Stage B 为场次级 prompt
  - [x] 补回 scene 级时间段、镜数、bridgeState、唯一依据剧本输入
  - [~] Stage A 已补强 scene 摘要缺失时的回退填充，继续核对是否与源程序完全一致
- [x] 第 3.5 步：主系统提示词模板外置到 YAML
  - [x] 新增 `prompts/systemPrompts.yaml`
  - [x] `full / burst / Stage A / Stage B` 主模板改为 YAML 驱动
  - [~] 单镜修改链路开始收口到 YAML + source 逻辑
- [~] 第 4 步：重构单镜修改链路
  - [x] `/api/shots/edit` 已接入 `promptBuilder + shotEdit.yaml`
  - [x] 单镜修改开始按完整 Markdown 分镜表输入，并兼容整表返回回写
  - [~] system prompt 已收窄到 source 风格的 fresh asset 注入结构（assetLibrary / assetCallRule / nameMappingInstruction / modeConstraint）
  - [x] 同场次目标镜头开始按场次局部分镜表编辑，不再默认整集送入修改
  - [x] 继续对齐台词锁死、全表返回、标签一致性边界策略
- [ ] 第 5 步：完成一次 source 对照回归
  - [x] 对照 `_Input/1st/soullensV5.1.html`
  - [x] 对照 `_Input/1st/SOULLENS_MODULE_ANALYSIS.md`
  - [x] 对照 `_Input/1st/SOULLENS_PARAMETER_DICTIONARY.md`
  - [ ] 重新评估“是否达到可接受的 Seedance2.0 稳定质量”

---

## v0.2.1 (2026-03-20)

### 本轮修复
- ✅ 修复 `src/app/api/shots/edit/route.ts` 语法错误
- ✅ 修复 `devLogger.success()` 类型缺失
- ✅ 修复 `prompts/shotRules.yaml` YAML 解析错误
- ✅ 修复单镜修改后项目保存请求体错误
- ✅ 资产页支持基础闭环
  - 添加资产
  - 编辑名称 / 描述
  - 上传本地图片
  - 移除图片
  - 资产变更时重建 `assetNameMap`
- ✅ 设置页“测试连接”改为真实接口探活
- ✅ 编辑页自动保存优化为 5 秒防抖 + dirty 状态
- ✅ 项目当前可通过 `npm run build`

### 当前明确未做
- ⏸ 资产页 `AI生图` 暂缓

---

## v0.2.0 (2026-03-20)

### 新增功能
- ✅ 分镜页面重构（卡片式布局，所有字段直接展示）
- ✅ 单镜修改功能（支持 AI 精准修改指定分镜）
- ✅ 资产页面重构（列表布局，完整资产详情）
- ✅ 导出功能（CSV/JSON）
- ✅ 日志面板（开发调试用）

### 核心修复
- ✅ timeRange 自动计算（duration 变化后自动重算所有时间段）
- ✅ 单镜修改 ID 匹配问题
- ✅ 分镜生成性能优化（精简输入内容）
- ✅ 品牌信息清理（移除 SoulLens 相关字样）

### 技术改进
- ✅ 提示词配置化（YAML 热重载）
- ✅ 平台配置完善（支持多家 AI 平台）
- ✅ 自动保存机制（2秒防抖）
- ✅ 提示词在线编辑（设置页）

---

## 已确认待办

### 高优先级
- [x] 更新 README，使其与当前 API 和功能状态一致
- [x] 用更稳定的反馈方式替换关键流程中的 `alert()`

### 中优先级
- [ ] 实现资产页 `AI生图`
- [~] 清理调试期 `console.log()`，保留必要日志
- [x] 为关键流程补基本异常提示和失败回退

### 低优先级
- [ ] 完整测试覆盖
- [ ] 性能优化
- [ ] 文档完善
