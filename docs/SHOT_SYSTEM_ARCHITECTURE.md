# 分镜系统数据流梳理

## 问题根因

**当前实现与原程序的核心差异：**

| 维度 | 原程序 (soullensV5.1.html) | 当前实现 (DaoYanOS) |
|------|---------------------------|-------------------|
| AI 输出格式 | Markdown 表格 | JSON 数组 |
| 分镜存储 | HTML DOM（实时渲染） | React State（内存） |
| 分镜 ID | 从表格行号推导 | 由 AI 返回（不可控） |
| 单镜修改 | 传递完整 Markdown，让 AI 修改后返回 | 传递 JSON，让 AI 返回新 JSON |

---

## 原程序逻辑

### 1. 首次生成

```
用户输入剧本
    ↓
构建 System Prompt（要求输出 Markdown 表格）
    ↓
AI 返回 Markdown 表格字符串
    ↓
marked.parse(markdown) → HTML
    ↓
innerHTML 渲染到 #storyboardTable
    ↓
用户看到分镜表格
```

**关键点**：分镜 ID 不存储，每次从 DOM 表格中重新解析。

### 2. 单镜修改

```javascript
// 原程序代码（简化）
async function Vt(e, t, n) {
  const editNote = document.getElementById("singleShotInput").value.trim();

  // 获取当前分镜内容（Markdown 格式）
  let currentContent;
  if (e.currentEditSceneId && v.sceneChatHistory[e.currentEditSceneId]) {
    currentContent = v.sceneContents[e.currentEditSceneId] || "";
  } else {
    const lastAssistant = [...e.chatHistory].reverse().find(p => p.role === "assistant");
    currentContent = lastAssistant.content;
  }

  // 构建修改请求
  const userMessage = `当前分镜表格如下：

${currentContent}

===任务要求===
请【只修改第 ${shotIndex} 镜】的内容，修改要求为：${editNote}

严格规则：
1. 其余所有镜头的内容全部原字不动复制
2. 只对第 ${shotIndex} 镜的内容按照修改要求进行调整
3. 返回格式：与原分镜内容完全一致的格式，包含所有镜头
4. 不要输出任何说明文字，直接输出完整的分镜块`;

  // 调用 AI
  const response = await callAI(systemPrompt, userMessage);

  // 直接用新内容替换旧内容
  v.sceneContents[sceneId] = response;

  // 重新渲染 Markdown
  document.getElementById("storyboardTable").innerHTML = marked.parse(response);
}
```

**关键点**：
- 传递**原始 Markdown 内容**给 AI
- AI 返回**完整的 Markdown 表格**
- 直接替换内容，**不解析 JSON**
- **ID 概念不存在**，只有"第 N 镜"的概念

### 3. 从表格提取分镜数据

```javascript
// We() 函数：从 HTML 表格中提取分镜
function We() {
  const table = document.getElementById("storyboardTable");
  const shots = [];

  table.querySelectorAll("tr").forEach((row, index) => {
    if (index === 0) return; // 跳过表头
    const cells = row.querySelectorAll("td");
    if (cells.length < 2) return;

    shots.push({
      time: cells[0].textContent.trim(),      // 时间段
      shotType: cells[1].textContent.trim(),   // 景别
      camera: cells[2].textContent.trim(),     // 运镜
      scene: cells[3].textContent.trim(),      // 画面
      lighting: cells[4].textContent.trim(),   // 光影
      prompt: cells[5].textContent.trim(),     // 提示词
    });
  });

  return shots;
}
```

**关键点**：分镜数据**每次从 DOM 重新解析**，不持久化。

---

## 当前实现问题

### 1. ID 不一致

**问题**：当前实现要求 AI 返回 JSON，并包含 `id` 字段：

```json
[
  {
    "id": "S1-2",    // AI 自己生成的 ID
    "sceneId": "S1",
    "type": "中景",
    ...
  }
]
```

但原始分镜的 ID 是前端生成的 `shot_1`, `shot_2` 等。

**结果**：前端更新时找不到匹配的分镜。

### 2. 提示词设计问题

当前 `/api/shots/edit` 的提示词：

```
【修改要求】：
...
3. 输出格式为JSON数组，每个分镜包含以下字段：
   - id: 分镜ID（保持不变）
   - sceneId: 场次ID
   ...
```

AI 可能：
1. 忽略 "保持不变" 指令，自己生成 ID
2. 返回的不是纯 JSON，而是 Markdown 包裹的 JSON
3. 返回的 JSON 结构与预期不符

### 3. 解析逻辑脆弱

```javascript
function parseShotsFromResponse(response, originalShots) {
  try {
    const parsed = JSON.parse(content.trim());

    return parsed.map((item, index) => {
      const original = originalShots[index];
      return {
        id: item.id || original?.id || ...,  // 问题：允许 AI 覆盖 ID
        ...
      }
    });
  } catch {
    return originalShots;  // 静默失败
  }
}
```

---

## 正确的架构设计

### 方案：回归原程序的 Markdown 表格模式

#### 数据流设计

```
┌─────────────────────────────────────────────────────────────────┐
│                        数据结构                                   │
├─────────────────────────────────────────────────────────────────┤
│  Episode {                                                       │
│    id: string                                                    │
│    name: string                                                  │
│    plotInput: string           // 剧本文本                        │
│    storyboardMarkdown: string  // 分镜 Markdown 表格（核心数据）   │
│    scenes: Scene[]             // 场次列表（Stage A 产出）         │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        生成流程                                   │
├─────────────────────────────────────────────────────────────────┤
│  1. 首次生成                                                     │
│     AI 返回 Markdown 表格 → 存储到 storyboardMarkdown            │
│                                                                 │
│  2. 显示分镜                                                     │
│     marked.parse(storyboardMarkdown) → React 组件渲染            │
│                                                                 │
│  3. 单镜修改                                                     │
│     传递完整 Markdown + 修改要求                                  │
│     AI 返回新 Markdown → 替换 storyboardMarkdown                 │
│                                                                 │
│  4. 人工修改                                                     │
│     直接编辑分镜字段 → 更新 React State                           │
│     同时更新 storyboardMarkdown（同步）                           │
└─────────────────────────────────────────────────────────────────┘
```

#### 分镜 ID 方案

**方案 A：不使用 ID，使用索引**

```typescript
// 分镜数据从 Markdown 解析出来，带索引
interface ParsedShot {
  index: number;        // 第几镜（从 1 开始）
  timeRange: string;    // 时间段 "0-3s"
  type: string;         // 景别
  camera: string;       // 运镜
  action: string;       // 画面描述
  light: string;        // 光影
  seedancePrompt: string; // 提示词
}

// 解析函数
function parseMarkdownToShots(markdown: string): ParsedShot[] {
  // 解析 Markdown 表格，返回分镜数组
  // 索引 = 表格行号 - 1
}
```

**方案 B：使用时间戳 ID**

```typescript
// 生成时创建 ID
interface Shot {
  id: string;           // shot_{timestamp}_{index}
  // ... 其他字段
}

// AI 返回时，强制使用原始 ID
function parseShotsFromResponse(response: string, originalShots: Shot[]): Shot[] {
  // 解析 AI 返回的分镜数据
  // 强制使用 originalShots 的 ID
}
```

---

## 实施计划

### 第一阶段：修复当前问题

1. **强制使用原始 ID**（已完成）
   ```javascript
   id: original?.id || `shot_${Date.now()}_${index}`,
   ```

2. **改进提示词**
   - 明确告诉 AI：不要修改 ID
   - 或者：不要求返回 ID，前端根据索引匹配

3. **添加错误反馈**
   - 解析失败时，显示 AI 原始响应
   - 让用户知道发生了什么

### 第二阶段：架构重构

1. **存储 Markdown 表格**
   ```typescript
   interface Episode {
// ...
     storyboardMarkdown: string;  // AI 返回的原始 Markdown
   }
   ```

2. **前端解析显示**
   - 从 Markdown 解析出分镜列表
   - 渲染为可编辑的表格

3. **单镜修改回归 Markdown 模式**
   - 传递完整 Markdown
   - AI 返回完整 Markdown
   - 直接替换存储

### 第三阶段：人工编辑同步

1. **双向绑定**
   - 人工编辑字段 → 更新 React State → 同步更新 Markdown
   - AI 修改 → 更新 Markdown → 重新解析 → 更新 React State

2. **增量更新**
   - 记录哪些分镜被人工修改过
   - AI 修改时保留人工修改的内容

---

## 关键结论

1. **分镜 ID 应由前端控制**，不应依赖 AI 返回
2. **单镜修改应传递完整上下文**（Markdown 表格），而非单个分镜 JSON
3. **AI 输出格式应与显示格式一致**（Markdown → HTML 渲染）
4. **持久化的是原始 AI 输出**，而非解析后的结构化数据

---

## 后续迭代方向

1. **YAML 配置化**：提示词、输出格式、解析规则
2. **多模型适配**：不同模型的输出格式可能不同
3. **版本控制**：记录每次修改的历史，支持回滚
4. **冲突解决**：人工修改与 AI 修改的合并策略