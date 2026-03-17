"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Camera,
  Film,
  Sparkles,
  Zap,
  Settings,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  Layers,
  Wand2,
  Clock,
  Grid3X3,
  LayoutGrid,
  List,
  Sun,
  Moon,
} from "lucide-react";

// 主应用界面 - 支持浅色/深色双主题
function DaoYanOSView() {
  const [activeScene, setActiveScene] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const scenes = [
    { id: 1, name: "开场画面", duration: 3, status: "done", beat: "Opening Image" },
    { id: 2, name: "铺垫", duration: 10, status: "done", beat: "Setup" },
    { id: 3, name: "催化剂", duration: 2, status: "active", beat: "Catalyst" },
    { id: 4, name: "争执", duration: 6, status: "waiting", beat: "Debate" },
    { id: 5, name: "进入第二幕", duration: 2, status: "waiting", beat: "Act 2 In" },
    { id: 6, name: "B故事", duration: 5, status: "waiting", beat: "B Story" },
    { id: 7, name: "游戏与乐趣", duration: 25, status: "waiting", beat: "Fun & Games" },
  ];

  const activeSceneData = scenes.find(s => s.id === activeScene);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* 顶部导航 - 玻璃拟态效果 */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl transition-colors duration-300">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {/* Logo - 深色/浅色自适应 */}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
              <Film className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">AI导演制作中台</h1>
              <p className="text-xs text-muted-foreground">DaoYanOS v1.0</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 链式生成状态指示器 */}
            <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground">A</span>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-medium">B</span>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <div className="flex items-center gap-1.5 opacity-50">
                <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                <span className="text-xs text-muted-foreground">C</span>
              </div>
            </div>

            <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5">
              <Zap className="mr-1 h-3 w-3" />
              链式生成就绪
            </Badge>

            {/* 主题切换 */}
            <ThemeToggle />

            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20">
              <Play className="mr-2 h-4 w-4" />
              开始生成
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* 左侧：场次时间轴 */}
        <aside className="w-80 border-r border-border bg-muted/30 transition-colors duration-300">
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">场次时间轴</h2>
                <p className="text-xs text-muted-foreground">BS2 节拍结构</p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className={viewMode === "grid" ? "grid grid-cols-2 gap-2" : "space-y-2"}>
                {scenes.map((scene) => (
                  <button
                    key={scene.id}
                    onClick={() => setActiveScene(scene.id)}
                    className={`relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 ${
                      activeScene === scene.id
                        ? "border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-transparent shadow-lg shadow-amber-500/10 dark:shadow-amber-500/5"
                        : "border-border/50 bg-card hover:border-border hover:shadow-md"
                    } ${viewMode === "grid" ? "p-3" : ""}`}
                  >
                    {/* 状态指示条 */}
                    <div className={`absolute left-0 top-0 h-full w-1 ${
                      scene.status === "done" ? "bg-green-500" :
                      scene.status === "active" ? "bg-amber-500" : "bg-transparent"
                    }`} />

                    <div className={viewMode === "grid" ? "" : "pl-2"}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-mono ${
                              activeScene === scene.id ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                            }`}>
                              S{scene.id}
                            </span>
                            {scene.status === "done" && (
                              <span className="text-green-500 text-xs">✓</span>
                            )}
                          </div>
                          <span className={`font-medium ${viewMode === "grid" ? "text-sm" : ""}`}>
                            {scene.name}
                          </span>
                        </div>
                        {scene.status === "active" && (
                          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        )}
                      </div>

                      <div className={`mt-2 flex items-center gap-2 text-xs text-muted-foreground ${viewMode === "grid" ? "flex-col items-start gap-0.5" : ""}`}>
                        <span>{scene.duration}秒</span>
                        <span className="hidden sm:inline">·</span>
                        <span className="text-xs opacity-70">{scene.beat}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* 中间：分镜表格 */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">Scene {activeScene} · {activeSceneData?.name}</h2>
                <Badge variant="secondary" className="text-xs">
                  {activeSceneData?.beat}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {activeScene === 3 ? "一个外部事件砸向主角，打破旧世界平衡" : "场景描述..."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RotateCcw className="mr-2 h-4 w-4" />
                重试本场
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                参数
              </Button>
            </div>
          </div>

          {/* 分镜表格 - 深色/浅色自适应 */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-12">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-20">镜头</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-24">环境</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">角色分动</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-24">光影</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">戏剧张力</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">SEEDANCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { shot: 1, type: "特写", env: "昏暗房间", action: "@人物1 正在握紧拳头", light: "侧光", tension: "紧张↑", time: "0-3s" },
                  { shot: 2, type: "近景", env: "雨夜街道", action: "@人物1 正在转身", light: "逆光", tension: "悬念→", time: "3-7s" },
                  { shot: 3, type: "全景", env: "废弃工厂", action: "@人物1 正在奔跑", light: "顶光", tension: "紧迫↑", time: "7-12s" },
                ].map((row, i) => (
                  <tr key={i} className="group hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-xs font-bold text-white shadow-md">
                        {row.shot}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge className="bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800">
                        {row.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-sm">{row.env}</td>
                    <td className="px-4 py-4 text-sm">
                      <span className="text-amber-600 dark:text-amber-400 font-medium">@人物1</span>
                      <span className="text-muted-foreground"> 正在</span>
                      <span className="border-b-2 border-black dark:border-white font-medium">握紧拳头</span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className="border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300">
                        {row.light}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge className={`${
                        row.tension.includes("↑") ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                        row.tension.includes("→") ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      }`}>
                        {row.tension}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                      {row.time} | {row.type} | {row.env}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 底部：时间轴可视化 */}
          <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">时间轴预览</span>
              <span className="text-xs text-muted-foreground">总时长: 12秒</span>
            </div>
            <div className="flex gap-1 h-8">
              {[
                { width: "25%", color: "bg-sky-500" },
                { width: "33%", color: "bg-amber-500" },
                { width: "42%", color: "bg-purple-500" },
              ].map((bar, i) => (
                <div
                  key={i}
                  className={`${bar.color} rounded-md opacity-80 hover:opacity-100 transition-opacity cursor-pointer relative group`}
                  style={{ width: bar.width }}
                >
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs bg-popover text-popover-foreground px-2 py-1 rounded shadow-lg">
                      镜{i + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>0s</span>
              <span>3s</span>
              <span>7s</span>
              <span>12s</span>
            </div>
          </div>
        </main>

        {/* 右侧：参数面板 */}
        <aside className="w-72 border-l border-border bg-muted/30 p-4 transition-colors duration-300">
          <h3 className="mb-4 text-sm font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4" />
            生成参数
          </h3>

          <div className="space-y-5">
            {/* 导演风格 */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">导演风格</Label>
              <div className="rounded-lg border border-border bg-card p-3 hover:border-amber-500/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">诺兰</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">非线性叙事 · 时间重构</p>
              </div>
            </div>

            {/* 视觉风格 */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">视觉风格</Label>
              <div className="rounded-lg border border-border bg-card p-3">
                <span className="text-sm">电影写实</span>
                <p className="mt-1 text-xs text-muted-foreground"> cinematic · 追求极致真实感</p>
              </div>
            </div>

            {/* 画幅比例 */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">画幅比例</Label>
              <div className="flex gap-2">
                {["16:9", "2.39:1", "9:16"].map((ratio) => (
                  <button
                    key={ratio}
                    className={`flex-1 rounded-md border py-2 text-xs transition-colors ${
                      ratio === "16:9"
                        ? "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        : "border-border bg-card hover:border-muted-foreground"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-4">
              {/* 保真模式 */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">保真模式</Label>
                  <p className="text-xs text-muted-foreground">1:1视觉化</p>
                </div>
                <Switch />
              </div>

              {/* STC模式 */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">STC节拍</Label>
                  <p className="text-xs text-muted-foreground">BS2结构</p>
                </div>
                <Switch defaultChecked />
              </div>

              {/* 自动音效 */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">自动音效</Label>
                  <p className="text-xs text-muted-foreground">AI生成音效描述</p>
                </div>
                <Switch defaultChecked />
              </div>

              {/* BGM */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">背景音乐</Label>
                  <p className="text-xs text-muted-foreground">提示词中启用BGM</p>
                </div>
                <Switch />
              </div>
            </div>

            {/* 视觉桥梁状态 */}
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <h4 className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2">视觉桥梁（来自上一场）</h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>角色位置: 背对镜头</p>
                <p>光线状态: 昏暗</p>
                <p>环境状态: 雨夜</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ============ 测试页面主入口 ============
export default function TestUIPage() {
  return (
    <div>
      {/* 说明卡片 - 只在页面顶部显示 */}
      <div className="border-b border-border bg-muted/50 px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">UI风格测试</h1>
              <p className="text-sm text-muted-foreground">
                方案A：电影感深色主题 · 支持浅色/深色/跟随系统切换
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sun className="h-4 w-4" />
              <span>点击右上角图标切换主题</span>
              <Moon className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 主应用界面 */}
      <DaoYanOSView />
    </div>
  );
}
