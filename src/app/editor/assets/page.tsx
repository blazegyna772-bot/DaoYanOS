"use client"

import { useState, useMemo, Suspense, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Save,
  Settings,
  Film,
  FileText,
  Package,
  Plus,
  Check,
  Image,
  Users,
  Archive,
  Search,
  Edit2,
  Trash2,
  Loader2,
  Upload,
  RefreshCw,
  Star,
  Sparkles,
  X,
  Tag,
  Video,
  Code,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { Project, Asset, AssetType } from "@/types"
import { DevLogToggle, DevLogPanel } from "@/components/dev-log-panel"

type AssetTab = "all" | "character" | "image" | "props"

const assetTabs: { id: AssetTab; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "全部", icon: Package },
  { id: "character", label: "角色", icon: Users },
  { id: "image", label: "场景", icon: Image },
  { id: "props", label: "道具", icon: Archive },
]

const assetTypeLabels: Record<AssetType, string> = {
  character: "角色",
  image: "场景",
  props: "道具",
}

function rebuildAssetNameMap(assets: Project["assets"]) {
  const assetNameMap: Record<string, string> = {}

  assets.character.forEach((asset, index) => {
    const name = asset.name.trim()
    if (name) assetNameMap[name] = `@人物${index + 1}`
  })

  assets.image.forEach((asset, index) => {
    const name = asset.name.trim()
    if (name) assetNameMap[name] = `@图片${index + 1}`
  })

  assets.props.forEach((asset, index) => {
    const name = asset.name.trim()
    if (name) assetNameMap[name] = `@道具${index + 1}`
  })

  return assetNameMap
}

function withUpdatedAssets(project: Project, assets: Project["assets"]): Project {
  return {
    ...project,
    assets: {
      ...assets,
      assetNameMap: rebuildAssetNameMap(assets),
    },
  }
}

function buildAssetTagToIdMap(project: Project | null) {
  const map = new Map<string, string>()
  if (!project) return map

  project.assets.character.forEach((asset, index) => map.set(`@人物${index + 1}`, asset.id))
  project.assets.image.forEach((asset, index) => map.set(`@图片${index + 1}`, asset.id))
  project.assets.props.forEach((asset, index) => map.set(`@道具${index + 1}`, asset.id))

  return map
}

function collectEpisodeAssetIds(project: Project | null, episodeId: string) {
  const emptyResult = {
    characterIds: [] as string[],
    imageIds: [] as string[],
    propIds: [] as string[],
  }

  if (!project) return emptyResult
  const episode = project.episodes.find((item) => item.id === episodeId)
  if (!episode) return emptyResult

  const refs = {
    characterIds: new Set(episode.assetRefs?.characterIds || []),
    imageIds: new Set(episode.assetRefs?.imageIds || []),
    propIds: new Set(episode.assetRefs?.propIds || []),
  }

  if (refs.characterIds.size === 0 && refs.imageIds.size === 0 && refs.propIds.size === 0) {
    const tagToId = buildAssetTagToIdMap(project)
    episode.shots?.forEach((shot) => {
      const tags = ((shot.seedancePrompt || shot.action || "").match(/@(?:人物|图片|道具)\d+/g) || []) as string[]
      tags.forEach((tag) => {
        const assetId = tagToId.get(tag)
        if (!assetId) return
        if (tag.startsWith("@人物")) refs.characterIds.add(assetId)
        if (tag.startsWith("@图片")) refs.imageIds.add(assetId)
        if (tag.startsWith("@道具")) refs.propIds.add(assetId)
      })
    })
  }

  return {
    characterIds: Array.from(refs.characterIds),
    imageIds: Array.from(refs.imageIds),
    propIds: Array.from(refs.propIds),
  }
}

function AssetsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get("id")
  const episodeIdFromUrl = searchParams.get("episodeId")

  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDevLogOpen, setIsDevLogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploadTargetAssetId, setUploadTargetAssetId] = useState<string | null>(null)

  // 从 API 加载项目
  useEffect(() => {
    if (projectId) {
      loadProject(projectId)
    } else {
      setError("未指定项目ID")
      setIsLoading(false)
    }
  }, [projectId])

  const loadProject = async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)
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

  // 保存项目到服务器
  const saveProject = useCallback(async (projectData: Project) => {
    try {
      await fetch(`/api/projects/${projectData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: projectData }),
      })
    } catch (error) {
      console.error("保存失败:", error)
    }
  }, [])

  // 保存项目
  const handleSave = useCallback(async () => {
    if (!project) return
    await saveProject(project)
  }, [project, saveProject])

  // 自动保存（防抖）
  useEffect(() => {
    if (!project) return
    const timer = setTimeout(() => {
      handleSave()
    }, 2000) // 2秒后自动保存
    return () => clearTimeout(timer)
  }, [project, handleSave])

  const [activeTab, setActiveTab] = useState<AssetTab>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null)
  const activeEpisode = useMemo(
    () => project?.episodes.find((episode) => episode.id === selectedEpisodeId) || null,
    [project, selectedEpisodeId]
  )

  // 从 URL 参数初始化选中的分集
  useEffect(() => {
    if (episodeIdFromUrl && project) {
      // 验证分集ID是否存在
      const exists = project.episodes.some((ep) => ep.id === episodeIdFromUrl)
      if (exists) {
        setSelectedEpisodeId(episodeIdFromUrl)
      }
    }
  }, [episodeIdFromUrl, project])

  // 编辑状态
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")

  const handleGenerate = useCallback(() => {
    if (!project || !activeEpisode) return
    router.push(`/editor/shots?id=${project.id}&generating=true&episodeId=${activeEpisode.id}`)
  }, [activeEpisode, project, router])

  // 开始编辑
  const handleStartEdit = (asset: Asset) => {
    setEditingAssetId(asset.id)
    setEditName(asset.name)
    setEditDesc(asset.desc)
  }

  // 保存编辑
  const handleSaveEdit = async (asset: Asset) => {
    if (!project || !asset.type) return

    const nextAssets = {
      ...project.assets,
      [asset.type]: project.assets[asset.type].map((a) =>
        a.id === asset.id ? { ...a, name: editName, desc: editDesc } : a
      ),
    }
    const newProject = withUpdatedAssets(project, nextAssets)

    setProject(newProject)
    setEditingAssetId(null)

    // 保存到服务器
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: newProject }),
      })
    } catch (error) {
      console.error("保存失败:", error)
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingAssetId(null)
    setEditName("")
    setEditDesc("")
  }

  // 总资产（来自 project.assets）
  const totalAssets = useMemo(() => {
    if (!project) return []
    return [
      ...project.assets.character.map((a) => ({ ...a, type: "character" as const, source: "total" })),
      ...project.assets.image.map((a) => ({ ...a, type: "image" as const, source: "total" })),
      ...project.assets.props.map((a) => ({ ...a, type: "props" as const, source: "total" })),
    ]
  }, [project?.assets])

  // 计算每个分集引用的资产数
  const episodeAssetCounts = useMemo(() => {
    if (!project) return []
    return project.episodes.map((ep) => {
      const assetRefs = collectEpisodeAssetIds(project, ep.id)
      const count = assetRefs.characterIds.length + assetRefs.imageIds.length + assetRefs.propIds.length
      return {
        id: ep.id,
        name: ep.name,
        count,
        assetRefs,
      }
    })
  }, [project?.episodes])

  // 获取资产标签
  const getAssetTag = (asset: Asset) => {
    if (!project || !asset.type) return ""
    const assetsOfType = project.assets[asset.type]
    if (!assetsOfType) return ""
    const index = assetsOfType.findIndex((a) => a.id === asset.id)
    if (index === -1) return ""
    const typePrefix = asset.type === "character" ? "人物" : asset.type === "image" ? "图片" : "道具"
    return `@${typePrefix}${index + 1}`
  }

  // 根据选中的分集过滤资产
  const displayedAssets = useMemo(() => {
    if (!project) return []

    // 如果选中了分集，显示该分集引用的资产
    if (selectedEpisodeId) {
      const episode = episodeAssetCounts.find((ep) => ep.id === selectedEpisodeId)
      if (!episode) return []
      const allowedIds = new Set([
        ...episode.assetRefs.characterIds,
        ...episode.assetRefs.imageIds,
        ...episode.assetRefs.propIds,
      ])
      return totalAssets.filter((asset) => allowedIds.has(asset.id))
    }

    // 否则按 tab 过滤
    if (activeTab === "all") {
      return totalAssets
    }
    return project.assets[activeTab] || []
  }, [selectedEpisodeId, activeTab, project, totalAssets, episodeAssetCounts])

  // 过滤资产（搜索）
  const filteredAssets = useMemo(() => {
    let assets = displayedAssets

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      assets = assets.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.desc.toLowerCase().includes(query)
      )
    }
    return assets
  }, [displayedAssets, searchQuery])

  // 过滤资产（搜索）

  // 是否已在总资产库
  const isInTotalLibrary = (asset: Asset) => {
    return totalAssets.some((a) => a.id === asset.id)
  }

  // 添加到总资产库
  const handleAddToLibrary = (asset: Asset) => {
    if (isInTotalLibrary(asset)) return
    if (!project || !asset.type) return

    const nextAssets = {
      ...project.assets,
      [asset.type]: [...project.assets[asset.type], asset],
    }
    const newProject = withUpdatedAssets(project, nextAssets)

    setProject(newProject)
    void saveProject(newProject)
  }

  // 删除资产
  const handleDeleteAsset = async (asset: Asset) => {
    if (!project || !asset.type) return
    if (!confirm(`确定删除资产「${asset.name}」吗？`)) return

    const newAssets = {
      ...project.assets,
      [asset.type]: project.assets[asset.type].filter((a) => a.id !== asset.id),
    }

    const newProject = withUpdatedAssets(project, newAssets)

    setProject(newProject)

    // 保存到服务器
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: newProject }),
      })
    } catch (error) {
      console.error("保存失败:", error)
    }
  }

  const updateAsset = useCallback((assetId: string, assetType: AssetType, updater: (asset: Asset) => Asset) => {
    setProject((currentProject) => {
      if (!currentProject) return currentProject

      const nextAssets = {
        ...currentProject.assets,
        [assetType]: currentProject.assets[assetType].map((asset) =>
          asset.id === assetId ? updater(asset) : asset
        ),
      }
      const nextProject = withUpdatedAssets(currentProject, nextAssets)
      void saveProject(nextProject)
      return nextProject
    })
  }, [saveProject])

  const handleRemoveAssetImage = useCallback((asset: Asset) => {
    if (!asset.type) return
    updateAsset(asset.id, asset.type, (currentAsset) => ({
      ...currentAsset,
      url: undefined,
      fileName: undefined,
    }))
  }, [updateAsset])

  const handleUploadImageClick = useCallback((assetId: string) => {
    setUploadTargetAssetId(assetId)
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    const assetId = uploadTargetAssetId

    if (!file || !assetId || !project) {
      event.target.value = ""
      return
    }

    const asset = totalAssets.find((item) => item.id === assetId)
    if (!asset?.type) {
      event.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      if (!result) return

      updateAsset(asset.id, asset.type!, (currentAsset) => ({
        ...currentAsset,
        url: result,
        fileName: file.name,
      }))
    }
    reader.readAsDataURL(file)

    event.target.value = ""
    setUploadTargetAssetId(null)
  }, [project, totalAssets, updateAsset, uploadTargetAssetId])

  const handleAddAsset = useCallback(() => {
    if (!project) return

    const assetType: AssetType = activeTab === "character" || activeTab === "image" || activeTab === "props"
      ? activeTab
      : "character"
    const nextIndex = project.assets[assetType].length + 1
    const newAsset: Asset = {
      id: `${assetType}_${Date.now()}`,
      type: assetType,
      name: `新${assetTypeLabels[assetType]}${nextIndex}`,
      desc: "",
    }

    const nextAssets = {
      ...project.assets,
      [assetType]: [...project.assets[assetType], newAsset],
    }
    const nextProject = withUpdatedAssets(project, nextAssets)

    setProject(nextProject)
    setActiveTab(assetType)
    setSelectedEpisodeId(null)
    setEditingAssetId(newAsset.id)
    setEditName(newAsset.name)
    setEditDesc(newAsset.desc)
    router.replace(`/editor/assets?id=${project.id}`)
    void saveProject(nextProject)
  }, [activeTab, project, router, saveProject])

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
      {/* 顶部导航栏 */}
      <header className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium">{project.name}</span>
          </div>
          {/* Tab 导航 */}
          <div className="flex items-center gap-1 ml-6">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => router.push(`/editor?id=${project.id}&episodeId=${episodeIdFromUrl || ''}`)}
            >
              <FileText className="w-3.5 h-3.5" />
              剧本
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 gap-1.5 text-xs"
            >
              <Package className="w-3.5 h-3.5" />
              资产
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => router.push(`/editor/shots?id=${project.id}&episodeId=${episodeIdFromUrl || ''}`)}
            >
              <Film className="w-3.5 h-3.5" />
              分镜
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => router.push(`/editor/prompts?id=${project.id}&episodeId=${episodeIdFromUrl || ''}`)}
            >
              <Code className="w-3.5 h-3.5" />
              提示词
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleSave}>
            <Save className="w-3.5 h-3.5" />
            保存
          </Button>
          <Button
            size="sm"
            className="h-7 gap-1.5 text-xs bg-amber-600 hover:bg-amber-700"
            onClick={handleGenerate}
            disabled={!activeEpisode?.plotInput.trim()}
          >
            <Video className="w-3.5 h-3.5" />
            生成分镜
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/settings")}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* ===== 左侧栏 - 资产导航 ===== */}
        <aside className="w-48 border-r border-border bg-card/50 flex flex-col shrink-0">
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Package className="w-4 h-4 text-amber-500" />
              资产库
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {/* 总资产 */}
              <div
                onClick={() => {
                  setActiveTab("all")
                  setSelectedEpisodeId(null)
                  // 清除URL中的分集参数
                  router.replace(`/editor/assets?id=${projectId}`)
                }}
                className={`px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm ${
                  activeTab === "all" && !selectedEpisodeId
                    ? "bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-medium"
                    : "hover:bg-muted border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 shrink-0" />
                  <span>总资产</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 pl-6">
                  {totalAssets.length} 个资产
                </div>
              </div>

              {/* 分隔线 */}
              <div className="my-2 border-t border-border" />

              {/* 标签引用设置 */}
              <div className="px-3 py-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                  <Tag className="w-3.5 h-3.5" />
                  标签引用
                </div>
                <div className="space-y-2">
                  {[
                    { key: "character" as const, label: "角色", icon: Users },
                    { key: "image" as const, label: "场景", icon: Image },
                    { key: "props" as const, label: "道具", icon: Archive },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs">
                        <item.icon className="w-3 h-3 text-muted-foreground" />
                        <span>{item.label}</span>
                      </div>
                      <Switch
                        checked={project?.assets.assetTagEnabled?.[item.key] ?? true}
                        onCheckedChange={(checked) => {
                          if (!project) return
                          const newProject = {
                            ...project,
                            assets: {
                              ...project.assets,
                              assetTagEnabled: {
                                ...project.assets.assetTagEnabled,
                                character: project.assets.assetTagEnabled?.character ?? true,
                                image: project.assets.assetTagEnabled?.image ?? true,
                                props: project.assets.assetTagEnabled?.props ?? true,
                                [item.key]: checked,
                              },
                            },
                          }
                          setProject(newProject)
                          // 保存到服务器
                          fetch(`/api/projects/${project.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ project: newProject }),
                          })
                        }}
                        className="scale-75"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 分隔线 */}
              <div className="my-2 border-t border-border" />

              {/* 分集资产 */}
              <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium">
                分集资产
              </div>
              {episodeAssetCounts.map((ep) => (
                <div
                  key={ep.id}
                  onClick={() => {
                    setSelectedEpisodeId(ep.id)
                    // 更新URL参数
                    router.replace(`/editor/assets?id=${projectId}&episodeId=${ep.id}`)
                  }}
                  className={`px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${
                    selectedEpisodeId === ep.id
                      ? "bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-medium"
                      : "hover:bg-muted border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                    {ep.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 pl-5.5">
                    {ep.count} 个资产
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* ===== 中间主区域 - 资产网格 ===== */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* 分类 Tab 和搜索 */}
          <div className="p-4 border-b border-border flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {assetTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setSelectedEpisodeId(null)
                    // 清除URL中的分集参数
                    router.replace(`/editor/assets?id=${projectId}`)
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    activeTab === tab.id && !selectedEpisodeId
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      : "text-muted-foreground hover:bg-muted border border-transparent"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索资产..."
                  className="w-48 h-8 pl-8 text-xs"
                />
              </div>
              <Button size="sm" className="h-8 gap-1.5 text-xs bg-amber-600 hover:bg-amber-700" onClick={handleAddAsset}>
                <Plus className="w-3.5 h-3.5" />
                添加资产
              </Button>
            </div>
          </div>

          {/* 当前视图标题 */}
          {selectedEpisodeId && (
            <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">
                {episodeAssetCounts.find((ep) => ep.id === selectedEpisodeId)?.name || "分集资产"}
              </span>
              <span className="text-xs text-muted-foreground">
                · {filteredAssets.length} 个资产
              </span>
            </div>
          )}

          {/* 资产列表 */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {filteredAssets.map((asset) => {
                const isEditing = editingAssetId === asset.id
                const hasImage = !!asset.url
                return (
                  <div
                    key={asset.id}
                    className="flex gap-4 p-4 rounded-xl border border-border bg-card/50 hover:border-amber-500/30 transition-all"
                  >
                    {/* 左侧：图片展示区 */}
                    <div className="w-40 h-28 shrink-0 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden relative group">
                      {hasImage ? (
                        <>
                          <img
                            src={asset.url}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-7 gap-1 text-xs"
                              onClick={() => handleRemoveAssetImage(asset)}
                            >
                              <X className="w-3.5 h-3.5" />
                              移除
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-3xl opacity-50">
                          {asset.type === "character" ? "👤" : asset.type === "image" ? "🖼️" : "📦"}
                        </div>
                      )}
                    </div>

                    {/* 右侧：详情区 */}
                    <div className="flex-1 flex flex-col min-w-0">
                      {/* 上部：资产名 + 操作按钮 */}
                      <div className="flex items-center gap-2 mb-2">
                        {isEditing ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 text-sm flex-1 max-w-[200px]"
                            placeholder="资产名称"
                          />
                        ) : (
                          <>
                            <span className="font-medium text-sm">{asset.name}</span>
                            <code className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {getAssetTag(asset)}
                            </code>
                          </>
                        )}
                        <div className="flex items-center gap-1 ml-auto">
                          {/* 收藏入库 */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title={isInTotalLibrary(asset) ? "已在总资产库" : "收藏入库"}
                            onClick={() => handleAddToLibrary(asset)}
                            disabled={isInTotalLibrary(asset)}
                          >
                            <Star className={`w-4 h-4 ${isInTotalLibrary(asset) ? "fill-amber-400 text-amber-400" : ""}`} />
                          </Button>
                          {/* 本地图片 */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            title="上传本地图片"
                            onClick={() => handleUploadImageClick(asset.id)}
                          >
                            <Upload className="w-3.5 h-3.5" />
                            本地图片
                          </Button>
                          {/* AI生图 */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            title="AI生成图片"
                            onClick={() => {
                              // TODO: AI生图
                              // AI生图功能尚未实现，当前仅保留占位入口
                            }}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            AI生图
                          </Button>
                          {/* 移除图片 - 仅当有图片时显示 */}
                          {hasImage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                              title="移除图片"
                              onClick={() => handleRemoveAssetImage(asset)}
                            >
                              <X className="w-3.5 h-3.5" />
                              移除
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* 下部：描述框 */}
                      {isEditing ? (
                        <div className="flex-1 flex flex-col gap-2">
                          <Textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="flex-1 text-sm resize-none"
                            placeholder="资产描述..."
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              className="h-7 text-xs bg-amber-600 hover:bg-amber-700"
                              onClick={() => handleSaveEdit(asset)}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              保存
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={handleCancelEdit}
                            >
                              取消
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col">
                          <Textarea
                            value={asset.desc}
                            className="flex-1 text-sm resize-none bg-muted/30 border-0 focus-visible:ring-1"
                            placeholder="暂无描述"
                            onChange={(e) => {
                              // 直接更新描述
                              if (!project || !asset.type) return
                              const newProject = {
                                ...project,
                                assets: {
                                  ...project.assets,
                                  [asset.type]: project.assets[asset.type].map((a) =>
                                    a.id === asset.id ? { ...a, desc: e.target.value } : a
                                  ),
                                },
                              }
                              setProject(newProject)
                            }}
                            onBlur={() => {
                              // 失焦时保存
                              handleSave()
                            }}
                          />
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleStartEdit(asset)}
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              编辑名称
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-destructive hover:text-destructive"
                              onClick={() => handleDeleteAsset(asset)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              删除资产
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* 空状态 */}
              {filteredAssets.length === 0 && (
                <div className="text-center py-20">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "未找到匹配的资产" : "暂无资产，点击添加"}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </main>
      </div>

      {/* 开发日志 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <DevLogToggle onClick={() => setIsDevLogOpen(true)} />
      <DevLogPanel isOpen={isDevLogOpen} onClose={() => setIsDevLogOpen(false)} />
    </div>
  )
}

// 主页面导出，带 Suspense 边界
export default function AssetsPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-background text-muted-foreground">加载中...</div>}>
      <AssetsPageInner />
    </Suspense>
  )
}
