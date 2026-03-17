"use client"

import { useState, Suspense, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Play,
  Save,
  Settings,
  Film,
  Users,
  Image,
  Package,
  Clock,
  Maximize,
  Palette,
  Sparkles,
  Plus,
  BarChart3,
  FileText,
  Clapperboard,
  Layers,
  Shield,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { mockProjects, directors, directorCategoryLabels } from "@/mock"
import type { Project, Director, Episode } from "@/types"

const directorCategories = ["narrative", "atmosphere", "suspense", "anime", "stcOff"] as const

function EditorPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get("id")

  const initialProject = mockProjects.find((p) => p.id === projectId) || mockProjects[0]
  const [project, setProject] = useState<Project>(initialProject)

  const [activeEpisodeId, setActiveEpisodeId] = useState(
    initialProject.episodes[0]?.id || ""
  )
  const activeEpisode = project.episodes.find((ep) => ep.id === activeEpisodeId)

  const [selectedDirector, setSelectedDirector] = useState<Director | null>(
    directors.find((d) => d.id === initialProject.selectedDirector) || directors[0]
  )

  // 导演分类 tab
  const [directorTab, setDirectorTab] = useState<Director["category"]>(
    selectedDirector?.category || "narrative"
  )

  const handlePlotInput = (value: string) => {
    setProject((p) => ({
      ...p,
      episodes: p.episodes.map((ep) =>
        ep.id === activeEpisodeId ? { ...ep, plotInput: value } : ep
      ),
    }))
  }

  const handleAddEpisode = () => {
    const newEp: Episode = {
      id: `ep_${Date.now()}`,
      name: `第${project.episodes.length + 1}集`,
      plotInput: "",
      scenes: [],
      shots: [],
    }
    setProject((p) => ({ ...p, episodes: [...p.episodes, newEp] }))
    setActiveEpisodeId(newEp.id)
  }

  const stats = useMemo(() => {
    const text = activeEpisode?.plotInput || ""
    const charCount = text.length
    const estimatedScenes = Math.max(1, Math.ceil(charCount / 50))
    const estimatedShots = estimatedScenes * 3

    return { charCount, estimatedScenes, estimatedShots }
  }, [activeEpisode?.plotInput])

  const filteredDirectors = directors.filter((d) => d.category === directorTab)

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* 顶部工具栏 */}
      <header className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-amber-500" />
            <Input
              value={project.name}
              onChange={(e) => setProject((p) => ({ ...p, name: e.target.value }))}
              className="h-7 w-48 text-sm font-medium border-0 focus-visible:ring-1"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
            <Save className="w-3.5 h-3.5" />
            保存
          </Button>
          <Button size="sm" className="h-7 gap-1.5 text-xs bg-amber-600 hover:bg-amber-700">
            <Play className="w-3.5 h-3.5" />
            生成
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/settings")}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">

        {/* ===== 左侧栏 - 分集列表 ===== */}
        <aside className="w-44 border-r border-border bg-card/50 flex flex-col shrink-0">
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clapperboard className="w-4 h-4 text-amber-500" />
              分集
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {project.episodes.map((ep) => (
                <div
                  key={ep.id}
                  onClick={() => setActiveEpisodeId(ep.id)}
                  className={`px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm ${
                    activeEpisodeId === ep.id
                      ? "bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-medium"
                      : "hover:bg-muted border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    {ep.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 pl-5.5">
                    {ep.plotInput.length} 字
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs"
              onClick={handleAddEpisode}
            >
              <Plus className="w-3 h-3" />
              添加新集
            </Button>
          </div>
        </aside>

        {/* ===== 中间主区域 ===== */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* 上半部分：剧本 + 精简统计（底部对齐） */}
          <div className="h-[45%] flex min-h-0 border-b border-border shrink-0">

            {/* 剧本文本区 */}
            <div className="flex-[6] flex flex-col min-w-0 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">剧本文本</div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="faithful"
                    checked={project.scriptFaithfulMode}
                    onCheckedChange={(v) =>
                      setProject((p) => ({ ...p, scriptFaithfulMode: v }))
                    }
                  />
                  <Label htmlFor="faithful" className="text-xs cursor-pointer">
                    保真模式
                  </Label>
                </div>
              </div>
              <Textarea
                value={activeEpisode?.plotInput || ""}
                onChange={(e) => handlePlotInput(e.target.value)}
                placeholder="请输入剧情描述..."
                className="flex-1 resize-none text-sm"
              />
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>支持导入 .txt 剧本文件</span>
                <span>{stats.charCount} 字</span>
              </div>
            </div>

            {/* 右侧精简统计面板 */}
            <div className="flex-[4] border-l border-border p-4 flex flex-col min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">分析统计</span>
              </div>

              {/* 四格统计 */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2 rounded-lg bg-muted/50 text-center">
                  <div className="text-base font-bold">{stats.charCount}</div>
                  <div className="text-[10px] text-muted-foreground">字数</div>
                </div>
                <div className="p-2 rounded-lg bg-muted/50 text-center">
                  <div className="text-base font-bold">{stats.estimatedScenes}</div>
                  <div className="text-[10px] text-muted-foreground">预估场次</div>
                </div>
                <div className="p-2 rounded-lg bg-muted/50 text-center">
                  <div className="text-base font-bold">{stats.estimatedShots}</div>
                  <div className="text-[10px] text-muted-foreground">预估镜头</div>
                </div>
                <div className="p-2 rounded-lg bg-muted/50 text-center">
                  <div className="text-base font-bold">{project.duration}s</div>
                  <div className="text-[10px] text-muted-foreground">预估时长</div>
                </div>
              </div>

              {/* 当前导演摘要 */}
              {selectedDirector && (
                <div className="p-2.5 rounded-lg bg-muted/50 mb-3">
                  <div className={`h-1 rounded-full mb-1.5 bg-gradient-to-r ${selectedDirector.color}`} />
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium">{selectedDirector.name}</div>
                    <Badge variant="secondary" className="text-[10px] h-4">
                      {directorCategoryLabels[selectedDirector.category]}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                    {selectedDirector.style}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* 下半部分：参数区（可滚动） */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-5 space-y-5">

                {/* 导演选择 - 分类 Tab */}
                <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
                  <div className="px-4 py-2.5 bg-muted/50 border-b border-border flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">导演风格</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {/* 分类标签 */}
                    <div className="flex gap-2">
                    {directorCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setDirectorTab(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                          directorTab === cat
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium border border-amber-500/30"
                            : "text-muted-foreground hover:bg-muted border border-transparent"
                        }`}
                      >
                        {directorCategoryLabels[cat]}
                      </button>
                    ))}
                  </div>
                  {/* 导演卡片横向滚动 */}
                  <div className="flex gap-2.5 overflow-x-auto pb-1">
                    {filteredDirectors.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => {
                          setSelectedDirector(d)
                          setProject((p) => ({ ...p, selectedDirector: d.id }))
                        }}
                        className={`shrink-0 w-36 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedDirector?.id === d.id
                            ? "border-amber-500 bg-amber-500/10"
                            : "border-border hover:border-amber-500/30 bg-muted/30"
                        }`}
                      >
                        <div className={`h-1.5 rounded-full mb-2 bg-gradient-to-r ${d.color}`} />
                        <div className="text-xs font-medium truncate">{d.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{d.nameEn}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

                {/* 生成参数 */}
                <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
                  <div className="px-4 py-2.5 bg-muted/50 border-b border-border flex items-center gap-2">
                    <Settings className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">生成参数</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* 时长 */}
                      <div className="space-y-2 col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <Label className="text-xs">总时长</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[project.duration]}
                            onValueChange={(value) => {
                              const v = Array.isArray(value) ? value[0] : value
                              setProject((p) => ({ ...p, duration: v }))
                            }}
                            max={300}
                            min={10}
                            step={5}
                            className="flex-1"
                          />
                          <span className="text-xs text-muted-foreground w-10 text-right">{project.duration}s</span>
                        </div>
                      </div>

                      {/* 镜头模式 */}
                      <div className="space-y-2">
                        <Label className="text-xs">镜头模式</Label>
                        <Select defaultValue={project.shotMode}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="选择模式" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">自动</SelectItem>
                            <SelectItem value="custom">自定义</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 视觉风格 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                          <Label className="text-xs">视觉风格</Label>
                        </div>
                        <Select
                          value={project.visualStyle}
                          onValueChange={(v) => setProject((p) => ({ ...p, visualStyle: v as any }))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="选择风格" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cinematic">电影感</SelectItem>
                            <SelectItem value="anime">动漫风</SelectItem>
                            <SelectItem value="cyberpunk">赛博朋克</SelectItem>
                            <SelectItem value="oil_painting">油画</SelectItem>
                            <SelectItem value="3d_render">3D渲染</SelectItem>
                            <SelectItem value="vintage">复古</SelectItem>
                            <SelectItem value="watercolor">水彩</SelectItem>
                            <SelectItem value="pixel_art">像素</SelectItem>
                            <SelectItem value="comic">漫画</SelectItem>
                            <SelectItem value="claymation">粘土</SelectItem>
                            <SelectItem value="ukiyoe">浮世绘</SelectItem>
                            <SelectItem value="surreal">超现实</SelectItem>
                            <SelectItem value="minimalist">极简</SelectItem>
                            <SelectItem value="noir">黑色电影</SelectItem>
                            <SelectItem value="fantasy">奇幻</SelectItem>
                            <SelectItem value="steampunk">蒸汽朋克</SelectItem>
                            <SelectItem value="donghua_xianxia">国漫仙侠</SelectItem>
                            <SelectItem value="ink_wash">水墨</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 画幅 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Maximize className="w-3.5 h-3.5 text-muted-foreground" />
                          <Label className="text-xs">画幅比例</Label>
                        </div>
                        <Select
                          value={project.aspectRatio}
                          onValueChange={(v) => setProject((p) => ({ ...p, aspectRatio: v as any }))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="选择画幅" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="16:9">16:9 宽屏</SelectItem>
                            <SelectItem value="2.39:1">2.39:1 电影</SelectItem>
                            <SelectItem value="9:16">9:16 竖屏</SelectItem>
                            <SelectItem value="1:1">1:1 方形</SelectItem>
                            <SelectItem value="4:3">4:3 经典</SelectItem>
                            <SelectItem value="21:9">21:9 超宽</SelectItem>
                            <SelectItem value="3:2">3:2 摄影</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 质量 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                          <Label className="text-xs">质量档位</Label>
                        </div>
                        <Select
                          value={project.quality}
                          onValueChange={(v) => setProject((p) => ({ ...p, quality: v as any }))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="选择质量" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="extreme_high">极高</SelectItem>
                            <SelectItem value="high">高</SelectItem>
                            <SelectItem value="medium">中</SelectItem>
                            <SelectItem value="low">低</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 功能开关 */}
                <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
                  <div className="px-4 py-2.5 bg-muted/50 border-b border-border flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">功能开关</span>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
                      <label className="flex items-center justify-between gap-2 cursor-pointer">
                        <span className="text-xs">背景音乐</span>
                        <Switch
                          checked={project.enableBGM}
                          onCheckedChange={(v) => setProject((p) => ({ ...p, enableBGM: v }))}
                        />
                      </label>
                      <label className="flex items-center justify-between gap-2 cursor-pointer">
                        <span className="text-xs">字幕</span>
                        <Switch
                          checked={project.enableSubtitle}
                          onCheckedChange={(v) => setProject((p) => ({ ...p, enableSubtitle: v }))}
                        />
                      </label>
                      <label className="flex items-center justify-between gap-2 cursor-pointer">
                        <span className="text-xs">敏感词过滤</span>
                        <Switch
                          checked={project.enableWordFilter}
                          onCheckedChange={(v) => setProject((p) => ({ ...p, enableWordFilter: v }))}
                        />
                      </label>
                      <label className="flex items-center justify-between gap-2 cursor-pointer">
                        <span className="text-xs">安全预检</span>
                        <Switch
                          checked={project.autoSafetyCheck}
                          onCheckedChange={(v) => setProject((p) => ({ ...p, autoSafetyCheck: v }))}
                        />
                      </label>
                      <label className="flex items-center justify-between gap-2 cursor-pointer">
                        <span className="text-xs">严格模式</span>
                        <Switch
                          checked={project.strictMode}
                          onCheckedChange={(v) => setProject((p) => ({ ...p, strictMode: v }))}
                        />
                      </label>
                      <label className="flex items-center justify-between gap-2 cursor-pointer">
                        <span className="text-xs">STC节拍</span>
                        <Switch
                          checked={project.stcEnabled}
                          onCheckedChange={(v) => setProject((p) => ({ ...p, stcEnabled: v }))}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </main>

        {/* ===== 右侧栏 - 资产库 ===== */}
        <aside className="w-64 border-l border-border bg-card/50 flex flex-col shrink-0">
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Package className="w-4 h-4 text-amber-500" />
                资产库
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <Plus className="w-3 h-3" />
                提取
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-4">
              {/* 角色 */}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    角色 ({project.assets.character.length})
                  </div>
                  <Switch
                    checked={project.assets.assetTagEnabled.character}
                    onCheckedChange={(v) =>
                      setProject((p) => ({
                        ...p,
                        assets: {
                          ...p.assets,
                          assetTagEnabled: { ...p.assets.assetTagEnabled, character: v },
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  {project.assets.character.map((char) => (
                    <div key={char.id} className="p-2 rounded-md bg-background/60">
                      <div className="font-medium text-xs">{char.name}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{char.desc}</div>
                    </div>
                  ))}
                  {project.assets.character.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-3">暂无角色</div>
                  )}
                </div>
              </div>

              {/* 场景 */}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Image className="w-3.5 h-3.5 text-green-500" />
                    场景 ({project.assets.image.length})
                  </div>
                  <Switch
                    checked={project.assets.assetTagEnabled.image}
                    onCheckedChange={(v) =>
                      setProject((p) => ({
                        ...p,
                        assets: {
                          ...p.assets,
                          assetTagEnabled: { ...p.assets.assetTagEnabled, image: v },
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  {project.assets.image.map((img) => (
                    <div key={img.id} className="p-2 rounded-md bg-background/60">
                      <div className="font-medium text-xs">{img.name}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{img.desc}</div>
                    </div>
                  ))}
                  {project.assets.image.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-3">暂无场景</div>
                  )}
                </div>
              </div>

              {/* 道具 */}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Package className="w-3.5 h-3.5 text-amber-500" />
                    道具 ({project.assets.props.length})
                  </div>
                  <Switch
                    checked={project.assets.assetTagEnabled.props}
                    onCheckedChange={(v) =>
                      setProject((p) => ({
                        ...p,
                        assets: {
                          ...p.assets,
                          assetTagEnabled: { ...p.assets.assetTagEnabled, props: v },
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  {project.assets.props.map((prop) => (
                    <div key={prop.id} className="p-2 rounded-md bg-background/60">
                      <div className="font-medium text-xs">{prop.name}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{prop.desc}</div>
                    </div>
                  ))}
                  {project.assets.props.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-3">暂无道具</div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-background text-muted-foreground">加载中...</div>}>
      <EditorPageInner />
    </Suspense>
  )
}
