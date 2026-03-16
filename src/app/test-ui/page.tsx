"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";

// ============ 方案A: 暗色电影感 ============
function DarkCinematicView() {
  const [activeScene, setActiveScene] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const scenes = [
    { id: 1, name: "开场画面", duration: 3, status: "done" },
    { id: 2, name: "铺垫", duration: 10, status: "done" },
    { id: 3, name: "催化剂", duration: 2, status: "active" },
    { id: 4, name: "争执", duration: 6, status: "waiting" },
    { id: 5, name: "进入第二幕", duration: 2, status: "waiting" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* 顶部导航 - 玻璃拟态 */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
              <Film className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">AI导演制作中台</h1>
              <p className="text-xs text-gray-500">DaoYanOS v1.0</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-amber-500/30 text-amber-400">
              <Zap className="mr-1 h-3 w-3" />
              链式生成就绪
            </Badge>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
              <Play className="mr-2 h-4 w-4" />
              开始生成
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* 左侧：场次时间轴 */}
        <aside className="w-80 border-r border-white/5 bg-[#0d0d12]">
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-400">场次时间轴</h2>
              <Badge variant="secondary" className="bg-white/5">5 场次</Badge>
            </div>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-2">
                {scenes.map((scene) => (
                  <button
                    key={scene.id}
                    onClick={() => setActiveScene(scene.id)}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${
                      activeScene === scene.id
                        ? "border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-transparent"
                        : "border-white/5 bg-white/[0.02] hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-amber-500">S{scene.id}</span>
                          <span className="font-medium">{scene.name}</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{scene.duration}秒</p>
                      </div>
                      <div
                        className={`h-2 w-2 rounded-full ${
                          scene.status === "done"
                            ? "bg-green-500"
                            : scene.status === "active"
                            ? "bg-amber-500 animate-pulse"
                            : "bg-gray-600"
                        }`}
                      />
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
              <h2 className="text-xl font-bold">Scene 3 · 催化剂</h2>
              <p className="text-sm text-gray-500">一个外部事件砸向主角，打破旧世界平衡</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-white/10">
                <RotateCcw className="mr-2 h-4 w-4" />
                重试本场
              </Button>
              <Button variant="outline" size="sm" className="border-white/10">
                <Settings className="mr-2 h-4 w-4" />
                参数
              </Button>
            </div>
          </div>

          {/* 分镜表格 */}
          <div className="rounded-xl border border-white/10 bg-[#0d0d12] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">镜头</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">环境</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">角色分动</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">光影</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">SEEDANCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[1, 2, 3].map((shot) => (
                  <tr key={shot} className="group hover:bg-white/[0.02]">
                    <td className="px-4 py-4">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">
                        {shot}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge className="bg-sky-500/20 text-sky-300 border-0">
                        特写
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-300">昏暗的房间</td>
                    <td className="px-4 py-4 text-sm text-gray-300">@人物1 正在...</td>
                    <td className="px-4 py-4">
                      <Badge className="bg-orange-500/20 text-orange-300 border-0">
                        侧光
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-500 font-mono truncate max-w-[200px]">
                      镜头:特写 环境:昏暗房间...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>

        {/* 右侧：参数面板 */}
        <aside className="w-72 border-l border-white/5 bg-[#0d0d12] p-4">
          <h3 className="mb-4 text-sm font-semibold text-gray-400">生成参数</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">导演风格</Label>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span className="text-sm">诺兰</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">非线性叙事</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">视觉风格</Label>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <span className="text-sm">电影写实</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-500">保真模式</Label>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-500">自动音效</Label>
              <Switch defaultChecked />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ============ 方案B: 传统Dashboard风格 ============
function TraditionalDashboardView() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Film className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold">AI导演制作中台</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              设置
            </Button>
            <Button size="sm">
              <Play className="mr-2 h-4 w-4" />
              开始生成
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* 顶部状态栏 */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Layers className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">总场次</p>
                    <p className="text-2xl font-bold">13</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">总时长</p>
                    <p className="text-2xl font-bold">120s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <Camera className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">总分镜</p>
                    <p className="text-2xl font-bold">42</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">导演风格</p>
                    <p className="text-lg font-bold">诺兰</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 主内容区 */}
          <div className="grid grid-cols-12 gap-6">
            {/* 左侧：场次列表 */}
            <div className="col-span-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">场次列表</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setViewMode("grid")}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setViewMode("list")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {[
                        { id: 1, name: "开场画面", status: "completed" },
                        { id: 2, name: "铺垫", status: "completed" },
                        { id: 3, name: "催化剂", status: "generating" },
                        { id: 4, name: "争执", status: "pending" },
                        { id: 5, name: "进入第二幕", status: "pending" },
                      ].map((scene) => (
                        <div
                          key={scene.id}
                          className={`flex items-center justify-between rounded-lg border p-3 ${
                            scene.status === "generating"
                              ? "border-primary bg-primary/5"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium">
                              {scene.id}
                            </span>
                            <div>
                              <p className="font-medium">{scene.name}</p>
                              <p className="text-xs text-gray-500">
                                {scene.status === "completed" && "已完成"}
                                {scene.status === "generating" && "生成中..."}
                                {scene.status === "pending" && "待生成"}
                              </p>
                            </div>
                          </div>
                          {scene.status === "completed" && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              ✓
                            </Badge>
                          )}
                          {scene.status === "generating" && (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* 链式生成状态 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">链式生成状态</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                        ✓
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Stage A · 剧本切分</p>
                        <p className="text-xs text-gray-500">已完成</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                        2
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Stage B · 分镜生成</p>
                        <p className="text-xs text-gray-500">Scene 3 进行中...</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 opacity-50">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                        3
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Stage C · 整合输出</p>
                        <p className="text-xs text-gray-500">等待中</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 右侧：分镜表格 */}
            <div className="col-span-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Scene 3 · 催化剂</CardTitle>
                      <p className="text-sm text-gray-500">一个外部事件砸向主角，打破旧世界平衡</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        重试
                      </Button>
                      <Button variant="outline" size="sm">
                        导出
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-medium">#</th>
                          <th className="px-4 py-3 text-left text-xs font-medium">景别</th>
                          <th className="px-4 py-3 text-left text-xs font-medium">运镜</th>
                          <th className="px-4 py-3 text-left text-xs font-medium">画面描述</th>
                          <th className="px-4 py-3 text-left text-xs font-medium">光影氛围</th>
                          <th className="px-4 py-3 text-left text-xs font-medium">戏剧张力</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {[1, 2, 3].map((shot) => (
                          <tr key={shot} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                                {shot}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="secondary">特写</Badge>
                            </td>
                            <td className="px-4 py-3 text-sm">推镜</td>
                            <td className="px-4 py-3 text-sm">昏暗房间中，@人物1...</td>
                            <td className="px-4 py-3 text-sm">侧光勾勒轮廓</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="text-red-600">
                                紧张↑
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ 测试页面主入口 ============
export default function TestUIPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* 页面选择器 */}
      <div className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="px-6 py-4">
          <h1 className="text-lg font-bold mb-2">UI风格测试对比</h1>
          <p className="text-sm text-gray-500 mb-4">
            选择下方标签切换两种设计方案，请告诉我你更喜欢哪种风格。
          </p>
          <Tabs defaultValue="dark" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="dark" className="gap-2">
                <Film className="h-4 w-4" />
                方案A：暗色电影感
              </TabsTrigger>
              <TabsTrigger value="traditional" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                方案B：传统Dashboard
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dark" className="mt-0">
              <DarkCinematicView />
            </TabsContent>
            <TabsContent value="traditional" className="mt-0">
              <TraditionalDashboardView />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 设计说明 */}
      <div className="mx-auto max-w-4xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>设计方案对比说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">方案A：暗色电影感</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• 深色背景 + 琥珀色强调色</li>
                  <li>• 玻璃拟态(Glassmorphism)导航栏</li>
                  <li>• 沉浸式的电影制作氛围</li>
                  <li>• 适合长时间工作的暗色环境</li>
                  <li>• 更符合专业视频/电影工具调性</li>
                </ul>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">方案B：传统Dashboard</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• 浅色背景 + 标准卡片布局</li>
                  <li>• 经典的Dashboard数据展示风格</li>
                  <li>• 信息密度高，一目了然</li>
                  <li>• 符合大多数SaaS产品习惯</li>
                  <li>• 可读性好，适合数据密集型操作</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
