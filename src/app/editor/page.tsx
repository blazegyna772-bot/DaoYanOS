"use client"

import { useState, Suspense, useMemo, useEffect, useCallback, useRef } from "react"
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
  Loader2,
  Upload,
  Video,
  Search,
  Wand2,
  XCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { DevLogPanel, DevLogToggle } from "@/components/dev-log-panel"
import { devLogger } from "@/lib/devLogger"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { directors, directorCategoryLabels } from "@/mock/directors"
import type { Project, Director, Episode } from "@/types"
import { generationStore } from "@/lib/generationStore"

const directorCategories = ["narrative", "atmosphere", "suspense", "anime", "stcOff"] as const

// 视觉风格数据
const visualStyles = [
  { id: "cinematic", name: "电影感", nameEn: "Cinematic", desc: "经典电影质感，自然光影，专业镜头语言", icon: "🎬", color: "from-amber-600 to-orange-700" },
  { id: "anime", name: "动漫风", nameEn: "Anime", desc: "日式动漫风格，鲜明色彩，夸张表情", icon: "✨", color: "from-pink-500 to-purple-600" },
  { id: "cyberpunk", name: "赛博朋克", nameEn: "Cyberpunk", desc: "霓虹灯光，高科技低生活，未来都市", icon: "🌃", color: "from-cyan-500 to-purple-700" },
  { id: "oil_painting", name: "油画", nameEn: "Oil Painting", desc: "油画质感，厚重笔触，古典美学", icon: "🎨", color: "from-amber-700 to-rose-800" },
  { id: "3d_render", name: "3D渲染", nameEn: "3D Render", desc: "计算机三维渲染，真实光影，现代感", icon: "🧊", color: "from-blue-500 to-cyan-600" },
  { id: "vintage", name: "复古", nameEn: "Vintage", desc: "胶片质感，怀旧色调，复古氛围", icon: "📷", color: "from-amber-800 to-yellow-900" },
  { id: "watercolor", name: "水彩", nameEn: "Watercolor", desc: "水彩晕染，柔和透明，艺术感", icon: "💧", color: "from-cyan-400 to-blue-500" },
  { id: "pixel_art", name: "像素", nameEn: "Pixel Art", desc: "像素风格，复古游戏感，点阵艺术", icon: "👾", color: "from-green-500 to-emerald-600" },
  { id: "comic", name: "漫画", nameEn: "Comic", desc: "美漫风格，粗线条，网点纹理", icon: "💥", color: "from-red-500 to-orange-600" },
  { id: "claymation", name: "粘土", nameEn: "Claymation", desc: "定格动画质感，粘土材质，手工感", icon: "🏺", color: "from-orange-400 to-amber-500" },
  { id: "ukiyoe", name: "浮世绘", nameEn: "Ukiyo-e", desc: "日本浮世绘，平面化，装饰性线条", icon: "🌊", color: "from-blue-600 to-indigo-700" },
  { id: "surreal", name: "超现实", nameEn: "Surreal", desc: "超现实主义，梦境感，不合常理", icon: "🌀", color: "from-purple-600 to-pink-700" },
  { id: "minimalist", name: "极简", nameEn: "Minimalist", desc: "极简主义，留白，几何图形", icon: "⬜", color: "from-gray-400 to-gray-600" },
  { id: "noir", name: "黑色电影", nameEn: "Film Noir", desc: "黑白高对比，阴影，神秘氛围", icon: "🕵️", color: "from-gray-800 to-black" },
  { id: "fantasy", name: "奇幻", nameEn: "Fantasy", desc: "奇幻世界，魔法元素，史诗感", icon: "🗡️", color: "from-indigo-500 to-purple-600" },
  { id: "steampunk", name: "蒸汽朋克", nameEn: "Steampunk", desc: "维多利亚风格，机械装置，铜黄铜质感", icon: "⚙️", color: "from-amber-600 to-orange-800" },
  { id: "donghua_xianxia", name: "国漫仙侠", nameEn: "Chinese Xianxia", desc: "中国仙侠国漫，飘逸仙气，东方美学", icon: "🗻", color: "from-teal-500 to-cyan-700" },
  { id: "ink_wash", name: "水墨", nameEn: "Ink Wash", desc: "中国水墨画，墨色晕染，意境深远", icon: "🖌️", color: "from-gray-600 to-gray-800" },
]

function EditorPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get("id")

  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeEpisodeId, setActiveEpisodeId] = useState<string>("")
  const activeEpisode = project?.episodes.find((ep) => ep.id === activeEpisodeId)

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<{
    stage: "idle" | "splitting" | "generating" | "merging" | "complete" | "error"
    currentScene: number
    totalScenes: number
    sceneName: string
    output: string
    error?: string
  }>({
    stage: "idle",
    currentScene: 0,
    totalScenes: 0,
    sceneName: "",
    output: "",
  })
  const abortControllerRef = useRef<AbortController | null>(null)

  // 资产提取状态
  const [isExtractingAssets, setIsExtractingAssets] = useState(false)

  // 开发日志面板状态
  const [isDevLogOpen, setIsDevLogOpen] = useState(false)

  // 从 API 加载项目
  useEffect(() => {
    if (projectId) {
      loadProject(projectId)
    } else {
      // 没有项目ID时创建新项目
      const now = new Date().toISOString()
      const newProject: Project = {
        id: `proj_${Date.now()}`,
        name: "未命名项目",
        createdAt: now,
        updatedAt: now,
        plotInput: "",
        charCount: 0,
        isScriptImported: false,
        duration: 60,
        shotMode: "auto",
        selectedDirector: "nolan",
        visualStyle: "cinematic",
        aspectRatio: "2.39:1",
        quality: "high",
        enableBGM: false,
        enableSubtitle: true,
        scriptFaithfulMode: false,
        enableWordFilter: true,
        autoSafetyCheck: true,
        strictMode: false,
        stcEnabled: true,
        assets: {
          character: [],
          image: [],
          props: [],
          assetNameMap: {},
          assetTagEnabled: { character: true, image: true, props: true },
        },
        currentPlatformId: "openai",
        platforms: [{ id: "openai", name: "OpenAI", description: "GPT-4 / GPT-3.5", icon: "🤖", color: "from-emerald-500 to-teal-600", textEndpoint: "https://api.openai.com/v1/chat/completions", textModel: "gpt-4", textApiKey: "", visionEndpoint: "https://api.openai.com/v1/chat/completions", visionModel: "gpt-4-vision-preview", visionApiKey: "", mode: "openai", enabled: true }],
        episodes: [{ id: `ep_${Date.now()}`, name: "第一集", plotInput: "", scenes: [], shots: [] }],
      }
      setProject(newProject)
      setIsLoading(false)
    }
  }, [projectId])

  const loadProject = async (id: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${id}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
      } else {
        setError("加载项目失败")
      }
    } catch (err) {
      setError("加载项目失败")
    } finally {
      setIsLoading(false)
    }
  }

  // 保存项目
  const handleSave = useCallback(async () => {
    if (!project) return
    try {
      setIsSaving(true)
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project }),
      })
      if (!response.ok) {
        console.error("Failed to save project")
      }
    } catch (err) {
      console.error("Failed to save project:", err)
    } finally {
      setIsSaving(false)
    }
  }, [project])

  // 自动保存（防抖）
  useEffect(() => {
    if (!project) return
    const timer = setTimeout(() => {
      handleSave()
    }, 2000) // 2秒后自动保存
    return () => clearTimeout(timer)
  }, [project, handleSave])

  // 生成分镜 - 立即跳转到分镜页面
  const handleGenerate = useCallback(async () => {
    if (!project) return

    // 验证必填项
    if (!activeEpisode?.plotInput.trim()) {
      alert("请先输入剧本内容")
      return
    }

    // 先保存项目
    await handleSave()

    // 立即跳转到分镜页（分镜页负责初始化生成状态）
    router.push(`/editor/shots?id=${project.id}&generating=true&episodeId=${activeEpisodeId}`)
  }, [project, activeEpisode, activeEpisodeId, handleSave, router])

  // 提取资产
  const handleExtractAssets = useCallback(async () => {
    if (!activeEpisode?.plotInput.trim()) {
      alert("请先输入剧本内容")
      return
    }

    setIsExtractingAssets(true)
    devLogger.info("🔍 开始提取资产", { plotLength: activeEpisode.plotInput.length })

    try {
      const startTime = Date.now()
      const response = await fetch("/api/assets/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plot: activeEpisode.plotInput }),
      })

      devLogger.api("← 资产提取响应", { status: response.status, ok: response.ok }, Date.now() - startTime)

      if (!response.ok) {
        const error = await response.json()
        devLogger.error("❌ 资产提取失败", error)
        throw new Error(error.error || "提取失败")
      }

      const data = await response.json()
      devLogger.info("✅ 资产提取成功", data)

      if (data.success && data.assets) {
        // 追加资产（保留现有资产，按 name 去重）
        setProject((prev) => {
          if (!prev) return prev

          const existingAssets = prev.assets || {
            character: [],
            image: [],
            props: [],
            assetNameMap: {},
            assetTagEnabled: { character: true, image: true, props: true },
          }

          // 提取新资产
          const newCharacters = (data.assets.characters || []).map((char: any) => ({
            id: `char_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: char.name,
            desc: char.desc || "",
            type: "character" as const,
          }))

          const newScenes = (data.assets.scenes || []).map((scene: any) => ({
            id: `scene_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: scene.name,
            desc: scene.desc || "",
            type: "image" as const,
          }))

          const newProps = (data.assets.props || []).map((prop: any) => ({
            id: `prop_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: prop.name,
            desc: prop.desc || "",
            type: "props" as const,
          }))

          // 合并并去重（按 name 字段）
          const mergeAssets = (existing: any[], newItems: any[]) => {
            const existingNames = new Set(existing.map((a) => a.name))
            const uniqueNew = newItems.filter((a) => !existingNames.has(a.name))
            return [...existing, ...uniqueNew]
          }

          const newAssets = {
            character: mergeAssets(existingAssets.character, newCharacters),
            image: mergeAssets(existingAssets.image, newScenes),
            props: mergeAssets(existingAssets.props, newProps),
            assetNameMap: { ...existingAssets.assetNameMap },
            assetTagEnabled: existingAssets.assetTagEnabled,
          }

          const newProject = {
            ...prev,
            assets: newAssets,
          }

          // 自动保存到服务器
          fetch(`/api/projects/${prev.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ project: newProject }),
          }).catch((err) => console.error("自动保存失败:", err))

          return newProject
        })

        // 统计提取数量
        const counts = {
          characters: data.assets.characters?.length || 0,
          scenes: data.assets.scenes?.length || 0,
          props: data.assets.props?.length || 0,
        }
        alert(`提取完成！\n人物: ${counts.characters}个\n场景: ${counts.scenes}个\n道具: ${counts.props}个`)
      } else if (data.rawContent) {
        // AI 返回了非 JSON 内容
        console.log("Raw AI response:", data.rawContent)
        alert("提取结果格式异常，请查看控制台")
      }
    } catch (error) {
      console.error("Asset extraction error:", error)
      alert(`提取失败: ${(error as Error).message}`)
    } finally {
      setIsExtractingAssets(false)
    }
  }, [activeEpisode?.plotInput])

  // 解析 Markdown 表格为镜头数组
  const parseShotsFromMarkdown = (markdown: string) => {
    if (!markdown || typeof markdown !== "string") return []

    const lines = markdown.split("\n")
    const shots: any[] = []

    for (const line of lines) {
      // 跳过表头和分隔行
      if (line.startsWith("|") && !line.includes("时间段") && !line.includes("---")) {
        const cells = line.split("|").filter((c) => c.trim())
        // 支持6列或7列格式
        // 6列：时间段 | 景别 | 运镜 | 画面描述 | 光影氛围 | SEEDANCE提示词
        // 7列：时间段 | 景别 | 运镜 | 画面描述 | 光影氛围 | 戏剧张力 | SEEDANCE提示词
        if (cells.length >= 6) {
          const hasDramaColumn = cells.length >= 7
          const shotIndex = shots.length + 1

          shots.push({
            id: `shot_${shotIndex}`,
            // Shot 类型必需字段
            sceneId: "S1",
            index: shotIndex,
            globalIndex: shotIndex,
            type: cells[1]?.trim() || "中景",
            duration: parseInt(cells[0]?.match(/\d+/)?.[0] || "5"),
            timeRange: "", // 先留空，后面统一计算
            // 核心字段
            env: cells[3]?.trim() || "",
            action: cells[3]?.trim() || "",
            light: cells[4]?.trim() || "",
            tension: hasDramaColumn ? cells[5]?.trim() : "",
            seedancePrompt: hasDramaColumn ? cells[6]?.trim() : cells[5]?.trim() || "",
            // 可选字段
            camera: cells[2]?.trim() || "",
            // 兼容旧字段（保留）
            time: cells[0]?.trim() || "",
            shotSize: cells[1]?.trim() || "",
            cameraMove: cells[2]?.trim() || "",
            description: cells[3]?.trim() || "",
            lighting: cells[4]?.trim() || "",
            drama: hasDramaColumn ? cells[5]?.trim() : "",
          })
        }
      }
    }

    // 统一根据 duration 计算 timeRange
    let offset = 0
    for (const shot of shots) {
      shot.timeRange = `${offset}-${offset + shot.duration}s`
      offset += shot.duration
    }

    console.log("解析完成，镜头数:", shots.length)
    devLogger.parse("📊 解析镜头", { inputLength: markdown.length, outputCount: shots.length, preview: shots.slice(0, 2) })
    return shots
  }

  const [selectedDirector, setSelectedDirector] = useState<Director | null>(null)

  // 导演分类 tab
  const [directorTab, setDirectorTab] = useState<Director["category"]>("narrative")

  // 导演选择浮窗状态
  const [directorDialogOpen, setDirectorDialogOpen] = useState(false)
  const [tempSelectedDirector, setTempSelectedDirector] = useState<Director | null>(null)

  // 视觉风格选择浮窗状态
  const [visualStyleDialogOpen, setVisualStyleDialogOpen] = useState(false)
  const [tempVisualStyle, setTempVisualStyle] = useState<string>("cinematic")

  // 初始化状态
  useEffect(() => {
    if (project) {
      // 优先使用 URL 参数中的分集 ID，否则使用第一集
      if (!activeEpisodeId) {
        const urlEpisodeId = searchParams.get("episodeId")
        const targetEpisode = urlEpisodeId && project.episodes.find(ep => ep.id === urlEpisodeId)
        setActiveEpisodeId(targetEpisode ? urlEpisodeId : project.episodes[0]?.id || "")
      }
      const director = directors.find(d => d.id === project.selectedDirector) || directors[0]
      setSelectedDirector(director)
      setDirectorTab(director?.category || "narrative")
      setTempSelectedDirector(director)
      setTempVisualStyle(project.visualStyle)
    }
  }, [project, activeEpisodeId, searchParams])

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

  // 加载中状态
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  // 错误状态
  if (error || !project) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{error || "项目不存在"}</p>
          <Button onClick={() => router.push("/")}>返回首页</Button>
        </div>
      </div>
    )
  }

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
          {/* Tab 导航 */}
          <div className="flex items-center gap-1 ml-6">
            <Button
              variant="secondary"
              size="sm"
              className="h-7 gap-1.5 text-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              剧本
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => router.push(`/editor/assets?id=${project.id}&episodeId=${activeEpisodeId}`)}
            >
              <Package className="w-3.5 h-3.5" />
              资产
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => router.push(`/editor/shots?id=${project.id}&episodeId=${activeEpisodeId}`)}
            >
              <Film className="w-3.5 h-3.5" />
              分镜
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* 导入TXT按钮 */}
          <input
            type="file"
            accept=".txt"
            id="import-txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                const reader = new FileReader()
                reader.onload = (event) => {
                  const text = event.target?.result as string
                  if (activeEpisode && text) {
                    setProject((p) => ({
                      ...p,
                      isScriptImported: true,
                      episodes: p.episodes.map((ep) =>
                        ep.id === activeEpisodeId ? { ...ep, plotInput: text } : ep
                      ),
                    }))
                  }
                }
                reader.readAsText(file)
              }
              e.target.value = ""
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => document.getElementById("import-txt")?.click()}
          >
            <Upload className="w-3.5 h-3.5" />
            导入TXT
          </Button>

          {/* 分析提取资产按钮 */}
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={handleExtractAssets}
            disabled={isExtractingAssets || !activeEpisode?.plotInput.trim()}
          >
            {isExtractingAssets ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            {isExtractingAssets ? "提取中..." : "提取资产"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {isSaving ? "保存中..." : "保存"}
          </Button>

          {/* 生成分镜按钮 */}
          <Button
            size="sm"
            className="h-7 gap-1.5 text-xs bg-amber-600 hover:bg-amber-700"
            onClick={handleGenerate}
            disabled={isGenerating || !activeEpisode?.plotInput.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Video className="w-3.5 h-3.5" />
                生成分镜
              </>
            )}
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
        <main className="flex-1 flex min-w-0 overflow-hidden">
          {/* 左右双栏布局 */}
          <div className="flex-1 flex flex-col md:flex-row min-w-0">

            {/* 左侧区域 (50%) */}
            <div className="w-full md:w-1/2 flex flex-col min-w-0 border-r border-border">
              {/* 剧本文本区 (2/3高度) */}
              <div className="flex-[2] flex flex-col min-h-0 p-4 overflow-hidden">
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
                  className="flex-1 resize-none text-sm min-h-0"
                />
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>支持导入 .txt 剧本文件</span>
                  <span>{stats.charCount} 字</span>
                </div>
              </div>

              {/* 分析统计区 (1/3高度) */}
              <div className="flex-1 border-t border-border p-4 min-h-0">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">分析统计</span>
                </div>
                {/* 2x2 网格 */}
                <div className="grid grid-cols-2 gap-3 h-[calc(100%-2.5rem)]">
                  <div className="p-3 rounded-lg bg-muted/50 flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold">{stats.charCount}</div>
                    <div className="text-xs text-muted-foreground">字数</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold">{stats.estimatedScenes}</div>
                    <div className="text-xs text-muted-foreground">预估场次</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold">{stats.estimatedShots}</div>
                    <div className="text-xs text-muted-foreground">预估镜头</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold">{project.duration}s</div>
                    <div className="text-xs text-muted-foreground">预估时长</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧区域 (50%) */}
            <div className="w-full md:w-1/2 flex flex-col min-w-0 p-4 gap-4 overflow-y-auto">
              {/* 第一行：核心参数层 */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                {/* 时长控制 */}
                <div className="rounded-lg border border-border bg-card/50 p-4">
                  <div className="text-xs text-muted-foreground mb-2">总时长</div>
                  <div className="text-3xl font-bold text-center mb-3">{project.duration}s</div>
                  <Slider
                    value={[project.duration]}
                    onValueChange={(value) => {
                      const v = Array.isArray(value) ? value[0] : value
                      setProject((p) => ({ ...p, duration: v }))
                    }}
                    max={300}
                    min={10}
                    step={5}
                  />
                  <Select
                    value={project.duration.toString()}
                    onValueChange={(v) => setProject((p) => ({ ...p, duration: parseInt(v) }))}
                  >
                    <SelectTrigger className="h-8 text-xs mt-2">
                      <SelectValue placeholder="快捷选择" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30秒</SelectItem>
                      <SelectItem value="60">1分钟</SelectItem>
                      <SelectItem value="90">1.5分钟</SelectItem>
                      <SelectItem value="120">2分钟</SelectItem>
                      <SelectItem value="180">3分钟</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 镜头数量控制 */}
                <div className="rounded-lg border border-border bg-card/50 p-4">
                  <div className="text-xs text-muted-foreground mb-2">镜头数量</div>
                  <div className="text-3xl font-bold text-center mb-3">
                    {project.shotMode === "custom" ? project.customShotCount : "自动"}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={project.shotMode === "auto" ? "default" : "outline"}
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setProject((p) => ({ ...p, shotMode: "auto" }))}
                    >
                      自动
                    </Button>
                    <Button
                      variant={project.shotMode === "custom" ? "default" : "outline"}
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setProject((p) => ({ ...p, shotMode: "custom" }))}
                    >
                      自定义
                    </Button>
                  </div>
                  {project.shotMode === "custom" && (
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={project.customShotCount}
                      onChange={(e) => setProject((p) => ({ ...p, customShotCount: parseInt(e.target.value) || 1 }))}
                      className="h-8 text-xs mt-2 text-center"
                    />
                  )}
                </div>
              </div>

              {/* 第二行：风格配置层 */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                {/* 导演风格 */}
                <div
                  onClick={() => {
                    setTempSelectedDirector(selectedDirector)
                    setDirectorDialogOpen(true)
                  }}
                  className="rounded-lg border border-border bg-card/50 p-4 cursor-pointer hover:border-amber-500/50 transition-all"
                >
                  <div className="text-xs text-muted-foreground mb-2">导演风格</div>
                  {selectedDirector ? (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{selectedDirector.name}</span>
                        <Badge variant="secondary" className="text-[10px] h-4">
                          {directorCategoryLabels[selectedDirector.category]}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{selectedDirector.style}</div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">点击选择</div>
                  )}
                </div>

                {/* 视觉风格 */}
                <div className="rounded-lg border border-border bg-card/50 p-4 flex flex-col gap-2">
                  {/* 视觉风格 - 横排 */}
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                    <span className="text-xs text-muted-foreground shrink-0">视觉风格</span>
                    <Select
                      value={project.visualStyle}
                      onValueChange={(v) => setProject((p) => ({ ...p, visualStyle: v as Project['visualStyle'] }))}
                    >
                      <SelectTrigger className="h-7 text-xs flex-1">
                        <SelectValue placeholder="选择风格" />
                      </SelectTrigger>
                      <SelectContent>
                        {visualStyles.map((style) => (
                          <SelectItem key={style.id} value={style.id}>
                            {style.icon} {style.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* 画幅比例 - 横排 */}
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                    <span className="text-xs text-muted-foreground shrink-0">画幅比例</span>
                    <Select
                      value={project.aspectRatio}
                      onValueChange={(v) => setProject((p) => ({ ...p, aspectRatio: v as any }))}
                    >
                      <SelectTrigger className="h-7 text-xs flex-1">
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
                  {/* 质量档位 - 横排 */}
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                    <span className="text-xs text-muted-foreground shrink-0">质量档位</span>
                    <Select
                      value={project.quality}
                      onValueChange={(v) => setProject((p) => ({ ...p, quality: v as any }))}
                    >
                      <SelectTrigger className="h-7 text-xs flex-1">
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

              {/* 导演选择浮窗 */}
              <Dialog open={directorDialogOpen} onOpenChange={setDirectorDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      选择导演风格
                    </DialogTitle>
                    <DialogDescription>
                      选择一位导演来定义视频的叙事风格和视觉语言
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 overflow-hidden flex flex-col space-y-4 mt-4">
                    {/* 分类标签 */}
                    <div className="flex gap-2 flex-wrap shrink-0">
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

                    <ScrollArea className="flex-1 min-h-0">
                      <div className="grid grid-cols-3 gap-3 pr-2">
                        {directors.filter(d => d.category === directorTab).map((d) => (
                          <div
                            key={d.id}
                            onClick={() => setTempSelectedDirector(d)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              tempSelectedDirector?.id === d.id
                                ? "border-amber-500 bg-amber-500/10"
                                : "border-border hover:border-amber-500/30 bg-muted/20"
                            }`}
                          >
                            <div className={`h-1.5 rounded-full mb-2 bg-gradient-to-r ${d.color}`} />
                            <div className="text-xs font-medium truncate">{d.name}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{d.nameEn}</div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* 选中导演详情 */}
                    {tempSelectedDirector && (
                      <div className="p-4 rounded-lg bg-muted/30 border border-border shrink-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{tempSelectedDirector.name}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {directorCategoryLabels[tempSelectedDirector.category]}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">{tempSelectedDirector.style}</div>
                        <div className="text-xs mb-1"><span className="text-muted-foreground">运镜技法：</span>{tempSelectedDirector.techniques.join("、")}</div>
                        <div className="text-xs mb-1"><span className="text-muted-foreground">光影风格：</span>{tempSelectedDirector.lighting}</div>
                        <div className="text-xs"><span className="text-muted-foreground">代表作：</span>{tempSelectedDirector.films.join("、")}</div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t shrink-0">
                    <Button variant="outline" onClick={() => setDirectorDialogOpen(false)}>
                      取消
                    </Button>
                    <Button
                      onClick={() => {
                        if (tempSelectedDirector) {
                          setSelectedDirector(tempSelectedDirector)
                          setProject((p) => ({ ...p, selectedDirector: tempSelectedDirector.id }))
                        }
                        setDirectorDialogOpen(false)
                      }}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      确认选择
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* 第三行：开关控制层 */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                {/* 参数卡片 A */}
                <div className="rounded-lg border border-border bg-card/50 p-4 flex flex-col gap-2">
                  <label className="flex items-center justify-between gap-2 cursor-pointer p-2 rounded bg-muted/30">
                    <span className="text-xs">背景音乐</span>
                    <Switch
                      checked={project.enableBGM}
                      onCheckedChange={(v) => setProject((p) => ({ ...p, enableBGM: v }))}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 cursor-pointer p-2 rounded bg-muted/30">
                    <span className="text-xs">字幕</span>
                    <Switch
                      checked={project.enableSubtitle}
                      onCheckedChange={(v) => setProject((p) => ({ ...p, enableSubtitle: v }))}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 cursor-pointer p-2 rounded bg-muted/30">
                    <span className="text-xs">STC节拍</span>
                    <Switch
                      checked={project.stcEnabled}
                      onCheckedChange={(v) => setProject((p) => ({ ...p, stcEnabled: v }))}
                    />
                  </label>
                </div>

                {/* 参数卡片 B */}
                <div className="rounded-lg border border-border bg-card/50 p-4 flex flex-col gap-2">
                  <label className="flex items-center justify-between gap-2 cursor-pointer p-2 rounded bg-muted/30">
                    <span className="text-xs">敏感词过滤</span>
                    <Switch
                      checked={project.enableWordFilter}
                      onCheckedChange={(v) => setProject((p) => ({ ...p, enableWordFilter: v }))}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 cursor-pointer p-2 rounded bg-muted/30">
                    <span className="text-xs">安全预检</span>
                    <Switch
                      checked={project.autoSafetyCheck}
                      onCheckedChange={(v) => setProject((p) => ({ ...p, autoSafetyCheck: v }))}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 cursor-pointer p-2 rounded bg-muted/30">
                    <span className="text-xs">严格模式</span>
                    <Switch
                      checked={project.strictMode}
                      onCheckedChange={(v) => setProject((p) => ({ ...p, strictMode: v }))}
                    />
                  </label>
                </div>
              </div>
            </div>
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

      {/* 开发日志面板 */}
      <DevLogToggle onClick={() => setIsDevLogOpen(true)} />
      <DevLogPanel isOpen={isDevLogOpen} onClose={() => setIsDevLogOpen(false)} />
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
