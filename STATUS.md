# DaoYanOS 项目状态记录
> 记录时间：2026-03-17
> 用途：电脑重启后恢复参考

## 项目概况
- **目标**：SoulLens V5.1 重构为 DaoYanOS
- **技术栈**：Next.js 15 + React 19 + TypeScript 5 + Tailwind CSS 4 + shadcn/ui
- **存储**：本地文件系统 (~/Documents/DaoYanOSProjects/)

## 核心功能（已完成类型定义）
- ✅ 39位导演数据 (src/mock/directors.ts)
- ✅ 5种导演分类人格 (narrative/atmosphere/suspense/anime/stcOff)
- ✅ 13节拍结构 (BS2/STC)
- ✅ @Tag资产系统 (@人物1/@图片1/@道具1)
- ✅ ChainEngine 分集生成架构
- ✅ Visual Bridge 跨场次连续性
- ✅ 保真模式 / 安全审核系统

## 当前文件状态

### ✅ 存在的关键文件
```
package.json                    (已重建)
next.config.ts                  (已重建)
tailwind.config.ts              (已重建)
tsconfig.json                   (已重建)
next-env.d.ts
src/types/index.ts              (完整类型定义)
src/mock/directors.ts           (39位导演)
src/mock/projects.ts            (示例项目+分集结构)
src/mock/index.ts
src/app/layout.tsx              (已重建)
src/app/globals.css             (已重建)
src/app/error.tsx
src/app/not-found.tsx
src/app/global-error.tsx
src/app/editor/page.tsx         (完整编辑器页面)
src/app/settings/page.tsx       (设置页面)
src/lib/utils.ts
src/components/ui/input.tsx
src/components/ui/select.tsx
src/components/ui/separator.tsx
src/components/ui/slider.tsx
src/components/ui/textarea.tsx
```

### ❌ 丢失的文件（需重建）
```
src/app/page.tsx                (项目管理主页 - 丢失)
src/components/ui/button.tsx    (shadcn)
src/components/ui/card.tsx      (shadcn)
src/components/ui/badge.tsx     (shadcn)
src/components/ui/tabs.tsx      (shadcn)
src/components/ui/switch.tsx    (shadcn)
src/components/ui/label.tsx     (shadcn)
src/components/ui/scroll-area.tsx (shadcn)
src/components/ui/dropdown-menu.tsx
src/components/theme-toggle.tsx (主题切换组件)
src/components/theme-provider.tsx
```

## 下一步任务

1. **安装缺失的 shadcn 组件**
   ```bash
   npx shadcn@latest add button card badge tabs switch label scroll-area dropdown-menu
   ```

2. **重建 theme-toggle.tsx**
   - 使用 next-themes
   - 支持 light/dark/system 三种模式
   - 使用 lucide-react 图标 (Sun, Moon, Monitor)

3. **重建 theme-provider.tsx**
   - 包裹 ThemeProvider
   - 属性: attribute="class", defaultTheme="dark"

4. **重建 page.tsx (项目管理主页)**
   - 顶部导航栏（Logo + ThemeToggle）
   - 项目网格卡片展示
   - 新建项目按钮
   - 点击进入编辑器 /editor?id={projectId}

5. **运行构建验证**
   ```bash
   npm run build
   npm run dev
   ```

## 数据结构参考

### Project 接口
```typescript
interface Project {
  id: string;
  name: string;
  plotInput: string;
  charCount: number;
  isScriptImported: boolean;
  duration: number;
  shotMode: "auto" | "custom";
  selectedDirector: string;
  visualStyle: VisualStyle;
  aspectRatio: AspectRatio;
  quality: Quality;
  enableBGM: boolean;
  enableSubtitle: boolean;
  scriptFaithfulMode: boolean;
  enableWordFilter: boolean;
  autoSafetyCheck: boolean;
  stcEnabled: boolean;
  assets: AssetState;
  currentPlatformId: string;
  platforms: PlatformConfig[];
  episodes: Episode[];  // 分集数据
}
```

### Episode 接口
```typescript
interface Episode {
  id: string;
  name: string;
  plotInput: string;
  scenes: Scene[];
  shots: Shot[];
}
```

## 参考文档
- CLAUDE.md (项目根目录) - 完整架构文档
- _Input/1st/SOULLENS_MODULE_ANALYSIS.md
- _Input/1st/SOULLENS_PARAMETER_DICTIONARY.md
- _Input/1st/soullensV5.1.html (原始源码)
