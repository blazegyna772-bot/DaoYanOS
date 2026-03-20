"use client"

import { useState, useMemo, Suspense, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Play,
  Save,
  Settings,
  Film,
  FileText,
  Image,
  Package,
  Users,
  Archive,
  Plus,
  CheckSquare,
  Square,
  RefreshCw,
  Trash2,
  Wand2,
  Check,
  Loader2,
  Download,
  Copy,
  Layers,
  Sparkles,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Project, Shot, Episode, Asset, AssetType } from "@/types"
import { DevLogToggle, DevLogPanel } from "@/components/dev-log-panel"
import { generationStore, type GenerationProgress } from "@/lib/generationStore"
import { devLogger } from "@/lib/devLogger"

// 修改范围选项
const editScopeOptions = [
  { id: "all", label: "整体修改", desc: "应用于全部分镜" },
  { id: "selected", label: "部分修改", desc: "应用于勾选的分镜" },
  { id: "single", label: "单个分镜", desc: "仅应用于当前选中的分镜" },
] as const

// 资产分类 Tab
type AssetTab = "all" | "character" | "image" | "props"
const assetTabs: { id: AssetTab; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "全部", icon: Package },
  { id: "character", label: "角色", icon: Users },
  { id: "image", label: "场景", icon: Image },
  { id: "props", label: "道具", icon: Archive },
]

// 工具区 Tab
type ToolTab = "functions" | "assets"
const toolTabs: { id: ToolTab; label: string; icon: React.ElementType }[] = [
  { id: "functions", label: "功能", icon: Settings },
  { id: "assets", label: "资产", icon: Package },
]

function ShotsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get("id")

  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDevLogOpen, setIsDevLogOpen] = useState(false)

  // 生成状态
  const [generationState, setGenerationState] = useState<GenerationProgress>(generationStore.getState())
  const abortControllerRef = useRef<AbortController | null>(null)
  const hasStartedGenerationRef = useRef(false)

  // 从 API 加载项目
  useEffect(() => {
    if (projectId) {
      loadProject(projectId)
    } else {
      setError("未指定项目ID")
      setIsLoading(false)
    }
  }, [projectId])

  // 监听生成状态变化
  useEffect(() => {
    const unsubscribe = generationStore.subscribe((state) => {
      setGenerationState(state)

      // 如果有新的分镜输出，更新项目
      if (state.shots.length > 0) {
        setProject((p) => {
          if (!p) return p
          return {
            ...p,
            episodes: p.episodes.map((ep) =>
              ep.id === state.episodeId
                ? { ...ep, shots: state.shots }
                : ep
            ),
          }
        })
      }
    })
    return unsubscribe
  }, [])

  // 检测是否需要开始生成
  const isGeneratingFromUrl = searchParams.get("generating") === "true"
  const episodeIdFromUrl = searchParams.get("episodeId")

  useEffect(() => {
    // 只在 URL 有 generating=true 且未开始过时触发
    if (isGeneratingFromUrl && project && episodeIdFromUrl && !hasStartedGenerationRef.current) {
      hasStartedGenerationRef.current = true
      startGeneration()
    }
  }, [isGeneratingFromUrl, project, episodeIdFromUrl])

  // 解析 Markdown 表格为镜头数组
  const parseShotsFromMarkdown = (markdown: string) => {
    if (!markdown || typeof markdown !== "string") return []

    const lines = markdown.split("\n")
    const shots: any[] = []

    for (const line of lines) {
      if (line.startsWith("|") && !line.includes("时间段") && !line.includes("---")) {
        const cells = line.split("|").filter((c) => c.trim())
        if (cells.length >= 6) {
          const hasDramaColumn = cells.length >= 7
          const shotIndex = shots.length + 1

          shots.push({
            id: `shot_${shotIndex}`,
            sceneId: "S1",
            index: shotIndex,
            globalIndex: shotIndex,
            type: cells[1]?.trim() || "中景",
            duration: parseInt(cells[0]?.match(/\d+/)?.[0] || "5"),
            timeRange: "", // 先留空，后面统一计算
            env: cells[3]?.trim() || "",
            action: cells[3]?.trim() || "",
            light: cells[4]?.trim() || "",
            tension: hasDramaColumn ? cells[5]?.trim() : "",
            seedancePrompt: hasDramaColumn ? cells[6]?.trim() : cells[5]?.trim() || "",
            camera: cells[2]?.trim() || "",
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

    return shots
  }

  // 开始生成
  const startGeneration = async () => {
    if (!project || !episodeIdFromUrl) return

    generationStore.startGeneration(project.id, episodeIdFromUrl)
    abortControllerRef.current = new AbortController()

    const requestBody = {
      projectId: project.id,
      episodeId: episodeIdFromUrl,
      stage: "full",
    }

    devLogger.info("🎬 开始生成分镜", requestBody)

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const error = await response.json()
        if (error.safetyCheck) {
          throw new Error(`内容安全检测未通过:\n${error.safetyCheck.report || error.detectedRedZone?.join(", ")}`)
        }
        throw new Error(error.error || "生成失败")
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("无法读取响应流")

      const decoder = new TextDecoder()
      let buffer = ""
      let currentEventType = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEventType = line.slice(7).trim()
            continue
          }

          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            if (!data) continue

            try {
              const eventData = JSON.parse(data)
              const eventType = eventData.event || eventData.type || currentEventType

              devLogger.sse(`📨 ${eventType}`, eventData)

              switch (eventType) {
                case "scene_start":
                  generationStore.updateProgress({
                    stage: "generating",
                    currentScene: eventData.index + 1,
                    totalScenes: eventData.total,
                    sceneName: eventData.sceneName,
                  })
                  break

                case "scene_progress":
                  generationStore.updateProgress({
                    output: eventData.content,
                  })
                  // 实时解析并更新分镜列表（流式显示）
                  const progressShots = parseShotsFromMarkdown(eventData.content)
                  if (progressShots.length > 0) {
                    generationStore.updateProgress({ shots: progressShots })
                  }
                  break

                case "output":
                  const parsedShots = parseShotsFromMarkdown(eventData.content)
                  generationStore.completeGeneration(eventData.content, parsedShots)

                  // 保存项目
                  setProject((p) => {
                    if (!p) return p
                    return {
                      ...p,
                      episodes: p.episodes.map((ep) =>
                        ep.id === episodeIdFromUrl
                          ? { ...ep, shots: parsedShots, generatedMarkdown: eventData.content }
                          : ep
                      ),
                    }
                  })

                  // 保存到服务器
                  fetch(`/api/projects/${project.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ project: { ...project, episodes: project.episodes.map((ep) => ep.id === episodeIdFromUrl ? { ...ep, shots: parsedShots } : ep) } }),
                  })
                  break

                case "error":
                  generationStore.errorGeneration(eventData.message || "生成失败")
                  break
              }
            } catch (parseError) {
              if (parseError instanceof SyntaxError) continue
              throw parseError
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        generationStore.cancelGeneration()
      } else {
        generationStore.errorGeneration((error as Error).message)
      }
    }
  }

  // 取消生成
  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    generationStore.cancelGeneration()
  }

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

  const [activeEpisodeId, setActiveEpisodeId] = useState<string>("")
  const activeEpisode = project?.episodes.find((ep) => ep.id === activeEpisodeId)

  // 初始化当前分集
  useEffect(() => {
    if (project && project.episodes.length > 0) {
      // 优先使用 URL 参数中的分集 ID
      const urlEpisodeId = searchParams.get("episodeId")
      const targetEpisode = urlEpisodeId && project.episodes.find(ep => ep.id === urlEpisodeId)
      setActiveEpisodeId(targetEpisode ? urlEpisodeId : project.episodes[0].id)
    }
  }, [project, searchParams])

  // 选中的分镜
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null)
  const [selectedShotIds, setSelectedShotIds] = useState<Set<string>>(new Set())

  // 修改意见
  const [editNote, setEditNote] = useState("")
  const [editScope, setEditScope] = useState<"all" | "selected" | "single">("single")

  // 修改状态
  const [isApplyingEdit, setIsApplyingEdit] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  // 单镜修改对话框
  const [singleEditShotId, setSingleEditShotId] = useState<string | null>(null)
  const [singleEditNote, setSingleEditNote] = useState("")
  const [isSingleEditOpen, setIsSingleEditOpen] = useState(false)
  const [isSingleEditLoading, setIsSingleEditLoading] = useState(false)

  // 本集资产库 Tab
  const [assetTab, setAssetTab] = useState<AssetTab>("all")

  // 工具区 Tab
  const [toolTab, setToolTab] = useState<ToolTab>("functions")

  const selectedShot = useMemo(() => {
    return activeEpisode?.shots.find((s) => s.id === selectedShotId) || null
  }, [activeEpisode, selectedShotId])

  // 从项目资产库获取所有资产
  const episodeAssets = useMemo(() => {
    if (!project?.assets) return []

    const assets: Asset[] = []

    // 添加角色资产
    project.assets.character?.forEach((asset) => {
      assets.push({ ...asset, type: "character" as const })
    })

    // 添加场景资产
    project.assets.image?.forEach((asset) => {
      assets.push({ ...asset, type: "image" as const })
    })

    // 添加道具资产
    project.assets.props?.forEach((asset) => {
      assets.push({ ...asset, type: "props" as const })
    })

    return assets
  }, [project?.assets])

  // 过滤本集资产
  const filteredAssets = useMemo(() => {
    if (assetTab === "all") return episodeAssets
    return episodeAssets.filter((a) => a.type === assetTab)
  }, [episodeAssets, assetTab])

  // 获取资产标签
  const getAssetTag = (asset: Asset) => {
    if (!project?.assets?.[asset.type]) return `@${asset.name}`
    const index = project.assets[asset.type].findIndex((a) => a.id === asset.id)
    if (index === -1) return `@${asset.name}`
    const typePrefix = asset.type === "character" ? "人物" : asset.type === "image" ? "图片" : "道具"
    return `@${typePrefix}${index + 1}`
  }

  // 切换分镜选择（单选）
  const handleShotClick = (shotId: string) => {
    setSelectedShotId(shotId)
    setEditScope("single")
  }

  // 切换复选框选择（多选）
  const handleCheckboxToggle = (shotId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newSet = new Set(selectedShotIds)
    if (newSet.has(shotId)) {
      newSet.delete(shotId)
    } else {
      newSet.add(shotId)
    }
    setSelectedShotIds(newSet)
    if (newSet.size > 0) {
      setEditScope("selected")
    }
  }

  // 全选/取消全选
  const handleSelectAll = () => {
    if (activeEpisode) {
      if (selectedShotIds.size === activeEpisode.shots.length) {
        setSelectedShotIds(new Set())
      } else {
        setSelectedShotIds(new Set(activeEpisode.shots.map((s) => s.id)))
        setEditScope("selected")
      }
    }
  }

  // 应用修改
  const handleApplyEdit = async () => {
    if (!project || !activeEpisode || !editNote.trim()) return

    let targetShotIds: string[] = []
    if (editScope === "single" && selectedShotId) {
      targetShotIds = [selectedShotId]
    } else if (editScope === "selected") {
      targetShotIds = Array.from(selectedShotIds)
    } else if (editScope === "all") {
      targetShotIds = activeEpisode.shots?.map((s) => s.id) || []
    }

    if (targetShotIds.length === 0) {
      alert("请选择要修改的分镜")
      return
    }

    setIsApplyingEdit(true)
    try {
      const response = await fetch("/api/shots/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          episodeId: activeEpisode.id,
          shotIds: targetShotIds,
          editNote: editNote.trim(),
          mode: "single",
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.safetyCheck) {
          alert(`内容安全检测未通过:\n${result.safetyCheck.report}`)
        } else {
          alert(`修改失败: ${result.error}`)
        }
        return
      }

      // 更新本地状态
      setProject((p) => {
        if (!p) return p
        return {
          ...p,
          episodes: p.episodes.map((ep) =>
            ep.id === activeEpisode.id
              ? {
                  ...ep,
                  shots: ep.shots?.map((s) => {
                    const updated = result.shots.find((us: Shot) => us.id === s.id)
                    return updated || s
                  }),
                }
              : ep
          ),
        }
      })

      // 清空修改意见
      setEditNote("")
      alert(result.message)
    } catch (error) {
      alert(`修改失败: ${(error as Error).message}`)
    } finally {
      setIsApplyingEdit(false)
    }
  }

  // 重新生成
  const handleRegenerate = async () => {
    if (!project || !activeEpisode || !selectedShotId) return

    const targetShot = activeEpisode.shots?.find((s) => s.id === selectedShotId)
    if (!targetShot) return

    setIsRegenerating(true)
    try {
      const response = await fetch("/api/shots/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          episodeId: activeEpisode.id,
          shotIds: [selectedShotId],
          editNote: "请重新生成这个分镜，保持原有的叙事风格和视觉语言",
          mode: "regenerate",
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        alert(`重新生成失败: ${result.error}`)
        return
      }

      // 更新本地状态
      setProject((p) => {
        if (!p) return p
        return {
          ...p,
          episodes: p.episodes.map((ep) =>
            ep.id === activeEpisode.id
              ? {
                  ...ep,
                  shots: ep.shots?.map((s) => {
                    const updated = result.shots.find((us: Shot) => us.id === s.id)
                    return updated || s
                  }),
                }
              : ep
          ),
        }
      })

      alert(result.message)
    } catch (error) {
      alert(`重新生成失败: ${(error as Error).message}`)
    } finally {
      setIsRegenerating(false)
    }
  }

  // 导出分镜
  const handleExport = async (format: "json" | "csv" | "markdown") => {
    if (!project) return

    try {
      const response = await fetch(
        `/api/export?projectId=${project.id}&format=${format}&type=shots`
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        alert(`导出失败: ${errorData.error || response.statusText}`)
        return
      }

      // 获取文件名
      const disposition = response.headers.get("Content-Disposition")
      const filename = disposition
        ? disposition.split("filename=")[1]?.replace(/"/g, "")
        : `${project.name}_shots.${format}`

      // 下载文件
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert(`导出失败: ${(error as Error).message}`)
    }
  }

  // 复制全部提示词
  const handleCopyAllPrompts = () => {
    if (!activeEpisode?.shots?.length) {
      alert("当前分集没有分镜")
      return
    }

    const prompts = activeEpisode.shots
      .map((shot, index) => `【镜${index + 1}】\n${shot.seedancePrompt || shot.action || ""}`)
      .join("\n\n")

    navigator.clipboard.writeText(prompts).then(() => {
      alert("已复制全部提示词到剪贴板")
    }).catch(() => {
      alert("复制失败")
    })
  }

  // 整合提示词
  const handleMergePrompts = () => {
    if (!activeEpisode?.shots?.length) {
      alert("当前分集没有分镜")
      return
    }

    const merged = activeEpisode.shots
      .map((shot) => shot.seedancePrompt || shot.action || "")
      .filter(Boolean)
      .join(" ")

    navigator.clipboard.writeText(merged).then(() => {
      alert("已整合提示词并复制到剪贴板")
    }).catch(() => {
      alert("复制失败")
    })
  }

  // 保存项目
  const handleSave = async () => {
    if (!project) return
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project }),
      })
    } catch (error) {
      console.error("保存失败:", error)
    }
  }

  // 开始生成（从分镜页触发）
  const handleStartGeneration = async () => {
    if (!project || !activeEpisodeId) return
    if (!activeEpisode?.plotInput?.trim()) {
      alert("当前分集没有剧本内容，请先在剧本页输入剧本")
      return
    }

    // 先保存
    await handleSave()

    // 设置生成状态
    hasStartedGenerationRef.current = true
    startGeneration()
  }

  // 打开单镜修改对话框
  const handleOpenSingleEdit = (shotId: string) => {
    setSelectedShotId(shotId)
    setSingleEditShotId(shotId)
    setSingleEditNote("")
    setIsSingleEditOpen(true)
  }

  // 确认单镜修改
  const handleConfirmSingleEdit = async () => {
    if (!project || !activeEpisode || !singleEditShotId || !singleEditNote.trim()) return

    setIsSingleEditLoading(true)
    devLogger.info("🔧 单镜修改开始", { shotId: singleEditShotId, editNote: singleEditNote })

    try {
      const requestBody = {
        projectId: project.id,
        episodeId: activeEpisode.id,
        shotIds: [singleEditShotId],
        editNote: singleEditNote.trim(),
      }
      devLogger.api("POST /api/shots/edit", requestBody)

      const response = await fetch("/api/shots/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()
      devLogger.api("响应", result)

      console.log("[单镜修改] API 响应:", result)
      console.log("[单镜修改] response.ok:", response.ok)
      console.log("[单镜修改] result.success:", result.success)
      console.log("[单镜修改] result.shots:", result.shots)
      console.log("[单镜修改] result.error:", result.error)

      if (!response.ok) {
        devLogger.error("修改失败", result)
        if (result.safetyCheck) {
          alert(`内容安全检测未通过:\n${result.safetyCheck.report}`)
        } else {
          alert(`修改失败: ${result.error}`)
        }
        return
      }

      // 检查是否有解析错误
      if (result.error) {
        devLogger.error("解析错误", result)
        alert(`修改失败: ${result.error}\n\nAI 原始响应:\n${result.rawResponse || "无"}`)
        return
      }

      // 检查是否有返回的分镜数据
      if (!result.shots || result.shots.length === 0) {
        devLogger.error("AI 未返回有效数据", result)
        alert("修改失败: AI 未返回有效的分镜数据")
        return
      }

      // 打印详细调试信息
      console.log("[单镜修改] API 返回的完整结果:", result)
      console.log("[单镜修改] 调试信息:", result.debug)
      console.log("[单镜修改] 返回的分镜数据:", result.shots)
      console.log("[单镜修改] 准备更新分镜, 原始ID:", singleEditShotId)

      // 打印每个分镜的 duration 变化
      result.shots.forEach((s: Shot) => {
        const original = activeEpisode?.shots?.find(os => os.id === s.id)
        console.log(`[单镜修改] 分镜 ${s.id} duration: ${original?.duration} -> ${s.duration}`)
        devLogger.info(`分镜 ${s.id} 更新`, {
          duration: `${original?.duration}s -> ${s.duration}s`,
          type: `${original?.type} -> ${s.type}`,
          light: `${original?.light?.slice(0,20)}... -> ${s.light?.slice(0,20)}...`
        })
      })

      // 更新本地状态，并重新计算 timeRange
      setProject((p) => {
        if (!p) return p
        const updatedEpisodes = p.episodes.map((ep) => {
          if (ep.id !== activeEpisode.id) return ep

          // 更新分镜
          const updatedShots = ep.shots?.map((s) => {
            const updated = result.shots.find((us: Shot) => us.id === s.id)
            console.log(`[单镜修改] 分镜 ${s.id}: 更新=${!!updated}`)
            return updated || s
          })

          // 重新计算所有分镜的 timeRange
          let offset = 0
          const recalculatedShots = updatedShots?.map((s) => {
            const newTimeRange = `${offset}-${offset + s.duration}s`
            offset += s.duration
            return { ...s, timeRange: newTimeRange }
          })

          return { ...ep, shots: recalculatedShots }
        })
        console.log("[单镜修改] 状态更新完成，已重新计算 timeRange")
        return { ...p, episodes: updatedEpisodes }
      })

      devLogger.success("✅ 单镜修改完成", { shotCount: result.shots.length })

      // 保存到服务器
      setProject((p) => {
        if (!p) return p
        fetch(`/api/projects/${p.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p),
        })
        return p
      })

      // 关闭对话框
      setIsSingleEditOpen(false)
      setSingleEditShotId(null)
      setSingleEditNote("")
      console.log("[单镜修改] 完成")
    } catch (error) {
      devLogger.error("修改异常", error)
      alert(`修改失败: ${(error as Error).message}`)
    } finally {
      setIsSingleEditLoading(false)
    }
  }

  // 新增分镜（在选中分镜下方插入）
  const handleAddShot = async () => {
    if (!project || !activeEpisode) return

    const newShotId = `shot_${Date.now()}`
    const currentShots = activeEpisode.shots || []

    // 找到插入位置（选中分镜下方，如果没有选中则添加到末尾）
    const insertIndex = selectedShotId
      ? currentShots.findIndex((s) => s.id === selectedShotId) + 1
      : currentShots.length

    // 创建新分镜
    const newShot: Shot = {
      id: newShotId,
      sceneId: `S${Math.ceil((insertIndex + 1) / 5)}`,
      index: insertIndex + 1,
      globalIndex: insertIndex + 1,
      type: "中景",
      duration: 5,
      timeRange: "",
      env: "",
      action: "",
      light: "",
      tension: "",
      seedancePrompt: "",
      camera: "",
    }

    // 插入并重新计算序号
    const newShots = [...currentShots]
    newShots.splice(insertIndex, 0, newShot)

    // 动态重排序号
    const reindexedShots = newShots.map((shot, idx) => ({
      ...shot,
      index: idx + 1,
      globalIndex: idx + 1,
    }))

    const newProject = {
      ...project,
      episodes: project.episodes.map((ep) =>
        ep.id === activeEpisode.id ? { ...ep, shots: reindexedShots } : ep
      ),
    }

    setProject(newProject)
    setSelectedShotId(newShotId)

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

  // 删除分镜
  const handleDeleteShot = async (shotId: string) => {
    if (!project || !activeEpisode) return
    if (!confirm("确定删除这个分镜吗？")) return

    const currentShots = activeEpisode.shots || []
    const filteredShots = currentShots.filter((s) => s.id !== shotId)

    // 动态重排序号
    const reindexedShots = filteredShots.map((shot, idx) => ({
      ...shot,
      index: idx + 1,
      globalIndex: idx + 1,
    }))

    const newProject = {
      ...project,
      episodes: project.episodes.map((ep) =>
        ep.id === activeEpisode.id ? { ...ep, shots: reindexedShots } : ep
      ),
    }

    setProject(newProject)

    // 清除选中状态
    if (selectedShotId === shotId) {
      setSelectedShotId(null)
    }
    setSelectedShotIds((prev) => {
      const newSet = new Set(prev)
      newSet.delete(shotId)
      return newSet
    })

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

  // 批量删除选中的分镜
  const handleDeleteSelectedShots = async () => {
    if (!project || !activeEpisode || selectedShotIds.size === 0) return
    if (!confirm(`确定删除选中的 ${selectedShotIds.size} 个分镜吗？`)) return

    const currentShots = activeEpisode.shots || []
    const filteredShots = currentShots.filter((s) => !selectedShotIds.has(s.id))

    // 动态重排序号
    const reindexedShots = filteredShots.map((shot, idx) => ({
      ...shot,
      index: idx + 1,
      globalIndex: idx + 1,
    }))

    const newProject = {
      ...project,
      episodes: project.episodes.map((ep) =>
        ep.id === activeEpisode.id ? { ...ep, shots: reindexedShots } : ep
      ),
    }

    setProject(newProject)
    setSelectedShotIds(new Set())
    setSelectedShotId(null)

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

  // 编辑分镜字段
  const handleUpdateShotField = async (field: keyof Shot, value: string | number) => {
    if (!project || !activeEpisode || !selectedShotId) return

    // duration 字段需要转换为数字
    const processedValue = field === "duration" ? Number(value) : value

    const newProject = {
      ...project,
      episodes: project.episodes.map((ep) => {
        if (ep.id !== activeEpisode.id) return ep

        // 更新分镜字段
        const updatedShots = ep.shots?.map((s) =>
          s.id === selectedShotId ? { ...s, [field]: processedValue } : s
        )

        // 如果更新了 duration，重新计算所有分镜的 timeRange
        if (field === "duration" && updatedShots) {
          let offset = 0
          const recalculatedShots = updatedShots.map((s) => {
            const newTimeRange = `${offset}-${offset + s.duration}s`
            offset += s.duration
            return { ...s, timeRange: newTimeRange }
          })
          return { ...ep, shots: recalculatedShots }
        }

        return { ...ep, shots: updatedShots }
      }),
    }

    setProject(newProject)
  }

  // 自动保存
  useEffect(() => {
    if (!project) return
    const timer = setTimeout(() => {
      handleSave()
    }, 2000)
    return () => clearTimeout(timer)
  }, [project])

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
              onClick={() => router.push(`/editor?id=${project.id}&episodeId=${activeEpisodeId}`)}
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
              variant="secondary"
              size="sm"
              className="h-7 gap-1.5 text-xs"
            >
              <Film className="w-3.5 h-3.5" />
              分镜
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleSave}>
            <Save className="w-3.5 h-3.5" />
            保存
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => handleExport("json")}
          >
            <Download className="w-3.5 h-3.5" />
            导出
          </Button>
          <Button
            size="sm"
            className="h-7 gap-1.5 text-xs bg-amber-600 hover:bg-amber-700"
            onClick={handleStartGeneration}
            disabled={generationState.isGenerating}
          >
            {generationState.isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                生成
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
              <Film className="w-4 h-4 text-amber-500" />
              分集
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {project.episodes.map((ep) => (
                <div
                  key={ep.id}
                  onClick={() => {
                    setActiveEpisodeId(ep.id)
                    setSelectedShotId(null)
                    setSelectedShotIds(new Set())
                  }}
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
                    {ep.shots?.length || 0} 镜
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* ===== 中间主区域 - 分镜编辑区（约55%） ===== */}
        <main className="flex-[3] flex flex-col min-w-0 overflow-hidden">
          {/* 分镜列表区域 */}
          <div className="flex-1 flex flex-col min-h-0 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">分镜列表</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={handleAddShot}
                >
                  <Plus className="w-3.5 h-3.5" />
                  新增
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={handleSelectAll}
                >
                  {selectedShotIds.size === (activeEpisode?.shots?.length || 0) ? (
                    <CheckSquare className="w-3.5 h-3.5" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                  全选
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive"
                  onClick={handleDeleteSelectedShots}
                  disabled={selectedShotIds.size === 0}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  删除所选
                </Button>
              </div>
            </div>

            {/* 生成进度显示 */}
            {generationState.isGenerating && (
              <div className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      {generationState.stage === "splitting" ? "正在分析剧本..." :
                       generationState.stage === "generating" ? `生成第 ${generationState.currentScene}/${generationState.totalScenes} 场：${generationState.sceneName}` :
                       "生成中..."}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground hover:text-destructive"
                    onClick={handleCancelGeneration}
                  >
                    取消
                  </Button>
                </div>
                {generationState.totalScenes > 0 && (
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${(generationState.currentScene / generationState.totalScenes) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 生成完成提示 */}
            {generationState.stage === "complete" && (
              <div className="mb-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    生成完成！共 {generationState.shots.length} 个镜头
                  </span>
                </div>
              </div>
            )}

            {/* 生成错误提示 */}
            {generationState.stage === "error" && (
              <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    生成失败：{generationState.error}
                  </span>
                </div>
              </div>
            )}

            {/* 分镜卡片列表 */}
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {activeEpisode?.shots?.map((shot, index) => {
                  const isSelected = selectedShotId === shot.id
                  return (
                    <div
                      key={shot.id}
                      className={`rounded-lg border transition-all ${
                        isSelected
                          ? "border-amber-500 bg-amber-500/5"
                          : "border-border bg-card/50 hover:border-amber-500/30"
                      }`}
                      onClick={() => setSelectedShotId(shot.id)}
                    >
                      {/* 头部：基本信息 + 操作按钮 */}
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
                        {/* 选择框 */}
                        <button
                          onClick={(e) => handleCheckboxToggle(shot.id, e)}
                          className="flex items-center justify-center shrink-0"
                        >
                          {selectedShotIds.has(shot.id) ? (
                            <CheckSquare className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>

                        {/* 镜号 */}
                        <Badge variant="secondary" className="text-[10px] h-5 shrink-0">
                          #{shot.globalIndex || index + 1}
                        </Badge>

                        {/* 时间段 */}
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {shot.timeRange || `${shot.duration || 5}s`}
                        </span>

                        {/* 景别 */}
                        <select
                          className="text-[10px] bg-muted border border-border rounded px-1.5 py-0.5 h-5"
                          value={shot.type || "中景"}
                          onChange={(e) => {
                            e.stopPropagation()
                            setSelectedShotId(shot.id)
                            handleUpdateShotField("type", e.target.value)
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="特写">特写</option>
                          <option value="近景">近景</option>
                          <option value="中景">中景</option>
                          <option value="全景">全景</option>
                          <option value="远景">远景</option>
                          <option value="大远景">大远景</option>
                        </select>

                        {/* 运镜 */}
                        <input
                          type="text"
                          className="w-20 text-[10px] bg-muted border border-border rounded px-2 py-0.5 h-5"
                          value={shot.camera || ""}
                          onChange={(e) => {
                            setSelectedShotId(shot.id)
                            handleUpdateShotField("camera", e.target.value)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="运镜"
                        />

                        {/* 光影氛围 */}
                        <input
                          type="text"
                          className="flex-1 min-w-0 text-[10px] bg-muted border border-border rounded px-2 py-0.5 h-5"
                          value={shot.light || ""}
                          onChange={(e) => {
                            setSelectedShotId(shot.id)
                            handleUpdateShotField("light", e.target.value)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="光影氛围"
                        />

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] gap-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenSingleEdit(shot.id)
                            }}
                          >
                            <Wand2 className="w-3 h-3" />
                            单镜修改
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] gap-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (shot.seedancePrompt) {
                                navigator.clipboard.writeText(shot.seedancePrompt)
                              }
                            }}
                          >
                            <Copy className="w-3 h-3" />
                            复制提示词
                          </Button>
                        </div>
                      </div>

                      {/* 中间：画面描述 */}
                      <div className="px-3 py-2">
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] text-muted-foreground shrink-0 pt-1">画面</span>
                          <Textarea
                            className="flex-1 text-xs bg-muted/50 resize-none min-h-[36px]"
                            value={shot.action || ""}
                            onChange={(e) => {
                              setSelectedShotId(shot.id)
                              handleUpdateShotField("action", e.target.value)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="画面描述..."
                            rows={1}
                          />
                        </div>
                      </div>

                      {/* 底部：提示词 */}
                      <div className="px-3 pb-2">
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] text-muted-foreground shrink-0 pt-1">提示词</span>
                          <Textarea
                            className="flex-1 text-[10px] bg-muted/50 font-mono resize-none"
                            value={shot.seedancePrompt || ""}
                            onChange={(e) => {
                              setSelectedShotId(shot.id)
                              handleUpdateShotField("seedancePrompt", e.target.value)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="SEEDANCE提示词..."
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* 空状态 */}
                {!activeEpisode?.shots?.length && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Film className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">暂无分镜</p>
                    <p className="text-xs mt-1">请在剧本页面点击"生成"</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* 统计区（占位） */}
          <div className="h-24 border-t border-border bg-muted/30 p-4 shrink-0">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Layers className="w-4 h-4" />
              <span className="text-xs">统计区（占位）</span>
            </div>
            <div className="mt-2 flex items-center gap-6 text-xs text-muted-foreground">
              <span>总镜头数: {activeEpisode?.shots?.length || 0}</span>
              <span>总时长: {activeEpisode?.shots?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0}s</span>
            </div>
          </div>
        </main>

        {/* ===== 右侧栏 - 工具区（约25%） ===== */}
        <aside className="w-72 border-l border-border bg-card/50 flex flex-col shrink-0">
          {/* 工具区 Tab 切换 */}
          <div className="p-2 border-b border-border">
            <div className="flex gap-1">
              {toolTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setToolTab(tab.id)}
                  className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                    toolTab === tab.id
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <tab.icon className="w-3 h-3 inline mr-1" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 功能 Tab 内容 */}
          {toolTab === "functions" && (
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">
                {/* 功能按钮区 */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">快捷操作</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs justify-start"
                      onClick={handleCopyAllPrompts}
                    >
                      <Copy className="w-3 h-3 mr-1.5" />
                      复制全部
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs justify-start"
                      onClick={handleMergePrompts}
                    >
                      <Sparkles className="w-3 h-3 mr-1.5" />
                      整合提示词
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs justify-start"
                      onClick={() => handleExport("json")}
                    >
                      <Download className="w-3 h-3 mr-1.5" />
                      导出JSON
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs justify-start"
                      onClick={() => handleExport("markdown")}
                    >
                      <FileText className="w-3 h-3 mr-1.5" />
                      导出MD
                    </Button>
                  </div>
                </div>

                {/* 参数调整区（占位） */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">参数调整</h4>
                  <div className="p-4 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                    参数调整功能
                    <br />
                    （占位）
                  </div>
                </div>

                {/* 修改意见区 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium text-muted-foreground">修改意见</h4>
                    {selectedShot && (
                      <Badge variant="outline" className="text-[10px]">
                        镜号 {selectedShot.globalIndex || selectedShot.id}
                      </Badge>
                    )}
                  </div>
                  <Textarea
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="描述修改内容..."
                    className="min-h-[100px] resize-none text-xs"
                  />
                </div>

                {/* 修改范围 */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">修改范围</h4>
                  <RadioGroup
                    value={editScope}
                    onValueChange={(v) => setEditScope(v as typeof editScope)}
                    className="space-y-1"
                  >
                    {editScopeOptions.map((option) => (
                      <div key={option.id} className="flex items-start space-x-2">
                        <RadioGroupItem value={option.id} id={option.id} className="mt-0.5" />
                        <div className="flex-1">
                          <Label htmlFor={option.id} className="text-xs cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* 执行按钮 */}
                <div className="space-y-2 pt-2">
                  <Button
                    onClick={handleApplyEdit}
                    className="w-full h-8 text-xs bg-amber-600 hover:bg-amber-700"
                    disabled={!editNote.trim() || isApplyingEdit}
                  >
                    {isApplyingEdit ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        修改中...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1" />
                        应用修改
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleRegenerate}
                    variant="outline"
                    className="w-full h-8 text-xs"
                    disabled={!selectedShotId || isRegenerating}
                  >
                    {isRegenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        重新生成中...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />
                        重新生成
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}

          {/* 资产 Tab 内容 */}
          {toolTab === "assets" && (
            <>
              {/* 资产分类 Tab */}
              <div className="px-3 py-2 border-b border-border">
                <div className="flex gap-1">
                  {assetTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setAssetTab(tab.id)}
                      className={`flex-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${
                        assetTab === tab.id
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                  {filteredAssets.length > 0 ? (
                    filteredAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 text-lg">
                            {asset.url ? (
                              <img src={asset.url} alt={asset.name} className="w-full h-full object-cover rounded" />
                            ) : (
                              asset.type === "character" ? "👤" : asset.type === "image" ? "🖼️" : "📦"
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs">{asset.name}</div>
                            <div className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                              {asset.desc}
                            </div>
                            <code className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground mt-1 inline-block">
                              {getAssetTag(asset)}
                            </code>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">暂无资产</p>
                      <p className="text-[10px] text-muted-foreground mt-1">在分镜中使用@标签引用资产</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </aside>
      </div>

      {/* 单镜修改对话框 */}
      <Dialog open={isSingleEditOpen} onOpenChange={setIsSingleEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              单镜修改
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              请输入修改意见，AI 将根据您的要求调整该分镜的内容。
            </p>
            <Textarea
              placeholder="例如：把镜头改为特写，强调角色表情的变化..."
              value={singleEditNote}
              onChange={(e) => setSingleEditNote(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSingleEditOpen(false)}
              disabled={isSingleEditLoading}
            >
              取消
            </Button>
            <Button
              onClick={handleConfirmSingleEdit}
              disabled={!singleEditNote.trim() || isSingleEditLoading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSingleEditLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  修改中...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  确认修改
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 开发日志 */}
      <DevLogToggle onClick={() => setIsDevLogOpen(true)} />
      <DevLogPanel isOpen={isDevLogOpen} onClose={() => setIsDevLogOpen(false)} />
    </div>
  )
}

// 主页面导出，带 Suspense 边界
export default function ShotsPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-background text-muted-foreground">加载中...</div>}>
      <ShotsPageInner />
    </Suspense>
  )
}
