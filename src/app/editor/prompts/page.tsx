"use client"

import { useCallback, useEffect, useMemo, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Check,
  Code,
  FileText,
  Film,
  Loader2,
  Package,
  RefreshCw,
  Save,
  Settings,
  Sparkles,
  Trash2,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Project } from "@/types"

type PromptFeedback = {
  type: "success" | "error" | "info"
  text: string
}

type PromptVersionMeta = {
  filename: string
  versionName: string
  updatedAt: string
  size: number
}

const PROMPT_FILE_DESCRIPTIONS: Record<string, string> = {
  "systemPrompts.yaml": "主系统提示词骨架，优先放在这里反复迭代",
  "shotEdit.yaml": "单镜修改主提示词与返回约束",
  "shotRules.yaml": "五维铁律、表格格式、SEEDANCE格式",
  "faithfulMode.yaml": "保真模式、faithfulHeader / faithfulSuffix",
  "durationRules.yaml": "burst / mini / full 时长路由",
  "categoryGuides.yaml": "分类人格、叙事方法论",
  "directors.yaml": "导演风格、技法、光影语汇",
  "visualStyles.yaml": "视觉风格描述",
}

const PROMPT_FILE_ORDER = [
  "systemPrompts.yaml",
  "shotEdit.yaml",
  "shotRules.yaml",
  "faithfulMode.yaml",
  "durationRules.yaml",
  "categoryGuides.yaml",
  "directors.yaml",
  "visualStyles.yaml",
]

function formatVersionTime(value: string) {
  try {
    return new Date(value).toLocaleString("zh-CN", { hour12: false })
  } catch {
    return value
  }
}

function sortPromptFiles(files: string[]) {
  return [...files].sort((left, right) => {
    const leftIndex = PROMPT_FILE_ORDER.indexOf(left)
    const rightIndex = PROMPT_FILE_ORDER.indexOf(right)

    if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right)
    if (leftIndex === -1) return 1
    if (rightIndex === -1) return -1
    return leftIndex - rightIndex
  })
}

function PromptWorkspacePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get("id")
  const episodeId = searchParams.get("episodeId")

  const [project, setProject] = useState<Project | null>(null)
  const [prompts, setPrompts] = useState<Record<string, string>>({})
  const [defaultPrompts, setDefaultPrompts] = useState<Record<string, string>>({})
  const [selectedPromptFile, setSelectedPromptFile] = useState("")
  const [promptContent, setPromptContent] = useState("")
  const [versions, setVersions] = useState<PromptVersionMeta[]>([])
  const [selectedVersionName, setSelectedVersionName] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<PromptFeedback | null>(null)
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true)
  const [isLoadingVersions, setIsLoadingVersions] = useState(false)
  const [isSavingPrompt, setIsSavingPrompt] = useState(false)
  const [isCreatingVersion, setIsCreatingVersion] = useState(false)
  const [isApplyingVersion, setIsApplyingVersion] = useState(false)
  const [isRestoringDefault, setIsRestoringDefault] = useState(false)
  const [editingEnabled, setEditingEnabled] = useState(true)
  const [isCreateVersionOpen, setIsCreateVersionOpen] = useState(false)
  const [versionNameInput, setVersionNameInput] = useState("")

  const currentFileDescription = selectedPromptFile
    ? PROMPT_FILE_DESCRIPTIONS[selectedPromptFile] || "提示词配置文件"
    : "选择一个提示词文件开始迭代"

  const sortedFiles = useMemo(() => sortPromptFiles(Object.keys(prompts)), [prompts])

  const showFeedback = useCallback((type: PromptFeedback["type"], text: string) => {
    setFeedback({ type, text })
  }, [])

  const buildTabUrl = useCallback((pathname: string) => {
    const params = new URLSearchParams()
    if (projectId) params.set("id", projectId)
    if (episodeId) params.set("episodeId", episodeId)
    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }, [episodeId, projectId])

  const loadProject = useCallback(async () => {
    if (!projectId) return

    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) return
      const data = await response.json()
      setProject(data.project)
    } catch {
      // 提示词页不阻断使用
    }
  }, [projectId])

  const loadVersions = useCallback(async (filename: string, preferredVersionName?: string | null) => {
    if (!filename) {
      setVersions([])
      setSelectedVersionName(null)
      return
    }

    setIsLoadingVersions(true)
    try {
      const response = await fetch(`/api/prompts/versions?filename=${encodeURIComponent(filename)}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "加载版本失败")
      }

      const nextVersions = (data.versions || []) as PromptVersionMeta[]
      setVersions(nextVersions)

      if (preferredVersionName && nextVersions.some((version) => version.versionName === preferredVersionName)) {
        setSelectedVersionName(preferredVersionName)
      } else {
        setSelectedVersionName(nextVersions[0]?.versionName || null)
      }
    } catch (error) {
      setVersions([])
      setSelectedVersionName(null)
      showFeedback("error", `加载版本失败: ${(error as Error).message}`)
    } finally {
      setIsLoadingVersions(false)
    }
  }, [showFeedback])

  const loadPrompts = useCallback(async (preferredFile?: string) => {
    setIsLoadingPrompts(true)
    try {
      const response = await fetch("/api/prompts")
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "加载提示词失败")
      }

      const nextPrompts = data.prompts as Record<string, string>
      const orderedFiles = sortPromptFiles(Object.keys(nextPrompts))
      const nextSelectedFile = preferredFile && nextPrompts[preferredFile]
        ? preferredFile
        : orderedFiles[0] || ""

      setPrompts(nextPrompts)
      setDefaultPrompts(nextPrompts)
      setSelectedPromptFile(nextSelectedFile)
      setPromptContent(nextSelectedFile ? nextPrompts[nextSelectedFile] : "")
    } catch (error) {
      showFeedback("error", `加载提示词失败: ${(error as Error).message}`)
    } finally {
      setIsLoadingPrompts(false)
    }
  }, [showFeedback])

  const savePrompt = useCallback(async () => {
    if (!selectedPromptFile) return

    setIsSavingPrompt(true)
    try {
      const response = await fetch("/api/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: selectedPromptFile,
          content: promptContent,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "保存失败")
      }

      setPrompts((current) => ({ ...current, [selectedPromptFile]: promptContent }))
      setDefaultPrompts((current) => ({ ...current, [selectedPromptFile]: promptContent }))
      showFeedback("success", "提示词已保存并重新载入内存配置")
    } catch (error) {
      showFeedback("error", `保存失败: ${(error as Error).message}`)
    } finally {
      setIsSavingPrompt(false)
    }
  }, [promptContent, selectedPromptFile, showFeedback])

  const reloadPrompts = useCallback(async () => {
    try {
      const response = await fetch("/api/prompts", { method: "POST" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "重新加载失败")
      }

      await loadPrompts(selectedPromptFile)
      if (selectedPromptFile) {
        await loadVersions(selectedPromptFile, selectedVersionName)
      }
      showFeedback("success", "提示词文件与内存配置已重新加载")
    } catch (error) {
      showFeedback("error", `重新加载失败: ${(error as Error).message}`)
    }
  }, [loadPrompts, loadVersions, selectedPromptFile, selectedVersionName, showFeedback])

  const createVersion = useCallback(async () => {
    if (!selectedPromptFile || !versionNameInput.trim()) return

    setIsCreatingVersion(true)
    try {
      const response = await fetch("/api/prompts/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: selectedPromptFile,
          versionName: versionNameInput.trim(),
          content: promptContent,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "创建版本失败")
      }

      await loadVersions(selectedPromptFile, versionNameInput.trim())
      setIsCreateVersionOpen(false)
      setVersionNameInput("")
      showFeedback("success", `已创建版本 ${data.meta?.versionName || versionNameInput.trim()}`)
    } catch (error) {
      showFeedback("error", `创建版本失败: ${(error as Error).message}`)
    } finally {
      setIsCreatingVersion(false)
    }
  }, [loadVersions, promptContent, selectedPromptFile, showFeedback, versionNameInput])

  const loadVersionIntoEditor = useCallback(async (versionName: string) => {
    if (!selectedPromptFile) return

    try {
      const response = await fetch(
        `/api/prompts/versions?filename=${encodeURIComponent(selectedPromptFile)}&versionName=${encodeURIComponent(versionName)}`
      )
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "读取版本失败")
      }

      setPromptContent(data.content || "")
      setSelectedVersionName(versionName)
      showFeedback("info", `已载入 ${versionName} 到编辑器，保存后才会成为当前运行版本`)
    } catch (error) {
      showFeedback("error", `读取版本失败: ${(error as Error).message}`)
    }
  }, [selectedPromptFile, showFeedback])

  const applyVersion = useCallback(async (versionName: string) => {
    if (!selectedPromptFile) return

    setIsApplyingVersion(true)
    try {
      const response = await fetch("/api/prompts/versions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: selectedPromptFile,
          versionName,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "应用版本失败")
      }

      setPromptContent(data.content || "")
      setPrompts((current) => ({ ...current, [selectedPromptFile]: data.content || "" }))
      setDefaultPrompts((current) => ({ ...current, [selectedPromptFile]: data.content || "" }))
      setSelectedVersionName(versionName)
      showFeedback("success", data.message || `已应用版本 ${versionName}`)
    } catch (error) {
      showFeedback("error", `应用版本失败: ${(error as Error).message}`)
    } finally {
      setIsApplyingVersion(false)
    }
  }, [selectedPromptFile, showFeedback])

  const deleteVersion = useCallback(async (versionName: string) => {
    if (!selectedPromptFile) return
    if (!window.confirm(`确定删除版本 ${versionName} 吗？`)) return

    try {
      const response = await fetch("/api/prompts/versions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: selectedPromptFile,
          versionName,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "删除版本失败")
      }

      await loadVersions(selectedPromptFile)
      showFeedback("success", `已删除版本 ${versionName}`)
    } catch (error) {
      showFeedback("error", `删除版本失败: ${(error as Error).message}`)
    }
  }, [loadVersions, selectedPromptFile, showFeedback])

  const restoreOfficialDefault = useCallback(async () => {
    if (!selectedPromptFile) return
    if (!window.confirm(`确定把 ${selectedPromptFile} 恢复为官方默认版本吗？当前内容会先自动备份。`)) {
      return
    }

    setIsRestoringDefault(true)
    try {
      const response = await fetch("/api/prompts/defaults", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: selectedPromptFile }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "恢复官方默认失败")
      }

      setPromptContent(data.content || "")
      setPrompts((current) => ({ ...current, [selectedPromptFile]: data.content || "" }))
      setDefaultPrompts((current) => ({ ...current, [selectedPromptFile]: data.content || "" }))
      await loadVersions(selectedPromptFile, data.backupVersionName || selectedVersionName)
      showFeedback("success", data.message || "已恢复官方默认")
    } catch (error) {
      showFeedback("error", `恢复官方默认失败: ${(error as Error).message}`)
    } finally {
      setIsRestoringDefault(false)
    }
  }, [loadVersions, selectedPromptFile, selectedVersionName, showFeedback])

  useEffect(() => {
    void loadProject()
    void loadPrompts()
  }, [loadProject, loadPrompts])

  useEffect(() => {
    if (!selectedPromptFile) return
    setPromptContent(prompts[selectedPromptFile] || "")
    void loadVersions(selectedPromptFile)
  }, [loadVersions, prompts, selectedPromptFile])

  useEffect(() => {
    if (!feedback) return
    const timer = window.setTimeout(() => setFeedback(null), 4500)
    return () => window.clearTimeout(timer)
  }, [feedback])

  const selectedVersionMeta = versions.find((version) => version.versionName === selectedVersionName) || null

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium">{project?.name || "提示词工坊"}</span>
          </div>
          <div className="flex items-center gap-1 ml-6">
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => router.push(buildTabUrl("/editor"))}>
              <FileText className="w-3.5 h-3.5" />
              剧本
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => router.push(buildTabUrl("/editor/assets"))}>
              <Package className="w-3.5 h-3.5" />
              资产
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => router.push(buildTabUrl("/editor/shots"))}>
              <Film className="w-3.5 h-3.5" />
              分镜
            </Button>
            <Button variant="secondary" size="sm" className="h-7 gap-1.5 text-xs">
              <Code className="w-3.5 h-3.5" />
              提示词
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={reloadPrompts}>
            <RefreshCw className="w-3.5 h-3.5" />
            重载
          </Button>
          <Button
            size="sm"
            className="h-7 gap-1.5 text-xs bg-amber-600 hover:bg-amber-700"
            onClick={savePrompt}
            disabled={!selectedPromptFile || isSavingPrompt || !editingEnabled}
          >
            {isSavingPrompt ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                保存当前
              </>
            )}
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/settings")}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {feedback && (
        <div className="px-4 pt-3">
          <Alert
            className={
              feedback.type === "error"
                ? "border-destructive/30 bg-destructive/5 text-destructive"
                : feedback.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                  : "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300"
            }
          >
            {feedback.type === "error" ? <Sparkles className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            <AlertDescription className="text-xs whitespace-pre-wrap">{feedback.text}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex-1 overflow-hidden p-4">
        <div className="grid h-full gap-4 xl:grid-cols-[280px_320px_minmax(0,1fr)]">
          <Card className="min-h-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">提示词文件</CardTitle>
              <CardDescription>主工作区入口，优先从 `systemPrompts.yaml` 和 `shotEdit.yaml` 开始迭代。</CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-5.5rem)]">
              <ScrollArea className="h-full pr-2">
                <div className="space-y-2">
                  {isLoadingPrompts ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    sortedFiles.map((file) => (
                      <button
                        key={file}
                        type="button"
                        onClick={() => setSelectedPromptFile(file)}
                        className={`w-full rounded-xl border p-3 text-left transition-all ${
                          selectedPromptFile === file
                            ? "border-amber-500/40 bg-amber-500/10"
                            : "border-border hover:bg-muted/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Code className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{file}</span>
                            </div>
                            <p className="text-xs leading-5 text-muted-foreground">
                              {PROMPT_FILE_DESCRIPTIONS[file] || "提示词配置文件"}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="min-h-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">版本管理</CardTitle>
                  <CardDescription>给每个提示词文件维护 `V1 / V2 / V3` 快照，便于反复回退和对比。</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  disabled={!selectedPromptFile}
                  onClick={() => {
                    setVersionNameInput(`V${versions.length + 1}`)
                    setIsCreateVersionOpen(true)
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  新建版本
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-[calc(100%-5.5rem)]">
              <ScrollArea className="h-full pr-2">
                <div className="space-y-2">
                  {isLoadingVersions ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : versions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                      当前文件还没有版本快照。建议先保存一个 `V1`，后面做提示词实验会更稳。
                    </div>
                  ) : (
                    versions.map((version) => (
                      <div
                        key={version.versionName}
                        className={`rounded-xl border p-3 ${
                          selectedVersionName === version.versionName
                            ? "border-amber-500/40 bg-amber-500/10"
                            : "border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={selectedVersionName === version.versionName ? "default" : "secondary"}>
                                {version.versionName}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground">{(version.size / 1024).toFixed(1)} KB</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {formatVersionTime(version.updatedAt)}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void deleteVersion(version.versionName)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => void loadVersionIntoEditor(version.versionName)}>
                            载入编辑器
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-amber-600 hover:bg-amber-700"
                            disabled={isApplyingVersion}
                            onClick={() => void applyVersion(version.versionName)}
                          >
                            应用为当前
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="min-h-0">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{selectedPromptFile || "选择提示词文件"}</CardTitle>
                    {selectedVersionMeta && (
                      <Badge variant="secondary">当前选中版本：{selectedVersionMeta.versionName}</Badge>
                    )}
                  </div>
                  <CardDescription>{currentFileDescription}</CardDescription>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2">
                  <Switch checked={editingEnabled} onCheckedChange={setEditingEnabled} />
                  <Label className="text-sm">编辑模式</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    disabled={!selectedPromptFile || isRestoringDefault}
                    onClick={() => void restoreOfficialDefault()}
                  >
                    {isRestoringDefault ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        恢复中...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        恢复官方默认
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    disabled={!selectedPromptFile}
                    onClick={() => {
                      if (!selectedPromptFile) return
                      const savedContent = defaultPrompts[selectedPromptFile]
                      if (savedContent === undefined) return
                      setPromptContent(savedContent)
                      showFeedback("success", "已恢复到当前已保存版本")
                    }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    恢复已保存
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex h-[calc(100%-5.5rem)] flex-col gap-3">
              <Alert className="bg-muted/50">
                <Sparkles className="w-4 h-4" />
                <AlertDescription className="text-xs leading-5">
                  这里是独立于设置页的提示词工作台。下一阶段可以只在这里改 `systemPrompts.yaml`、`shotEdit.yaml`
                  和相关规则文件，不需要再来回切 UI 设置页。恢复官方默认时，系统会先自动备份当前内容。
                </AlertDescription>
              </Alert>

              <Textarea
                value={promptContent}
                onChange={(event) => setPromptContent(event.target.value)}
                placeholder="选择左侧提示词文件后开始编辑..."
                className="min-h-0 flex-1 resize-none font-mono text-[12px] leading-6"
                disabled={!editingEnabled || !selectedPromptFile}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isCreateVersionOpen} onOpenChange={setIsCreateVersionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新建提示词版本</DialogTitle>
            <DialogDescription>
              为 `{selectedPromptFile || "当前文件"}` 保存一个可回退的快照，例如 `V1`、`V2`、`实验A`。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="version-name">版本名</Label>
            <Input
              id="version-name"
              value={versionNameInput}
              onChange={(event) => setVersionNameInput(event.target.value)}
              placeholder="例如：V1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateVersionOpen(false)}>取消</Button>
            <Button onClick={() => void createVersion()} disabled={!versionNameInput.trim() || isCreatingVersion}>
              {isCreatingVersion ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  创建中...
                </>
              ) : (
                "创建版本"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function PromptWorkspacePageWrapper() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-muted-foreground">加载中...</div>}>
      <PromptWorkspacePage />
    </Suspense>
  )
}
