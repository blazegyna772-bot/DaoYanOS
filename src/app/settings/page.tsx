"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Key,
  Database,
  Palette,
  Save,
  Plus,
  Trash2,
  Check,
  ExternalLink,
  Bot,
  Eye,
  ChevronRight,
  AlertCircle,
  TestTube,
  FileText,
  RefreshCw,
  Code,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  platformDefinitions,
  getPlatformDefinition,
  getPlatformModels,
  getPlatformHeaders,
} from "@/lib/platforms"
import type { PlatformConfig } from "@/types"

// 提示词文件中文描述映射
const PROMPT_FILE_DESCRIPTIONS: Record<string, string> = {
  "directors.yaml": "39位导演数据（风格/技法/光影）",
  "categoryGuides.yaml": "5种分类人格（叙事/意境/悬疑/动漫/自由）",
  "shotRules.yaml": "五维铁律、表格格式",
  "durationRules.yaml": "时长路由规则（burst/mini/full）",
  "faithfulMode.yaml": "保真模式约束",
  "visualStyles.yaml": "18种视觉风格",
  "shotEdit.yaml": "单镜修改提示词",
  "platforms.yaml": "10个AI平台配置",
  "safetyFilter.yaml": "敏感词过滤配置（替换词表+四区禁词）",
  "scene_generation.yaml": "场景生成模板",
}

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("platform")
  const [platformTab, setPlatformTab] = useState<"text" | "vision">("text")
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>("openai")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [testStatus, setTestStatus] = useState<Record<string, "idle" | "testing" | "success" | "error">>({})

  // 平台配置状态
  const [platformConfigs, setPlatformConfigs] = useState<Record<string, PlatformConfig>>(() => {
    const configs: Record<string, PlatformConfig> = {}
    platformDefinitions.forEach((def) => {
      // 确定平台的 API 模式
      let mode = def.id
      // 这些平台使用 OpenAI 兼容模式
      if (["qwen", "doubao", "deepseek", "moonshot", "siliconflow", "openrouter", "custom"].includes(def.id)) {
        mode = "openai"
      }

      configs[def.id] = {
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        color: def.color,
        textEndpoint: def.defaultTextEndpoint,
        textModel: def.textModels[0] || "",
        textApiKey: "",
        visionEndpoint: def.defaultVisionEndpoint,
        visionModel: def.visionModels[0] || "",
        visionApiKey: "",
        mode: mode as any,
        enabled: def.id === "openai",
      }
    })
    return configs
  })

  const [currentPlatformId, setCurrentPlatformId] = useState<string>("openai")

  // 存储设置
  const [storagePath, setStoragePath] = useState("~/Documents/DaoYanOSProjects/")

  // 界面设置
  const [uiSettings, setUiSettings] = useState({
    defaultTheme: "dark",
    autoSave: true,
    showTooltips: true,
    compactMode: false,
    fontSize: 16,
  })

  // 提示词设置
  const [prompts, setPrompts] = useState<Record<string, string>>({})
  const [selectedPromptFile, setSelectedPromptFile] = useState<string>("")
  const [promptContent, setPromptContent] = useState<string>("")
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false)
  const [isSavingPrompt, setIsSavingPrompt] = useState(false)

  // 提示词编辑保护
  const [promptEditEnabled, setPromptEditEnabled] = useState(false)
  const [defaultPrompts, setDefaultPrompts] = useState<Record<string, string>>({})

  // 全局字体大小
  const handleFontSizeChange = (size: number) => {
    setUiSettings((s) => ({ ...s, fontSize: size }))
    document.documentElement.style.fontSize = `${size}px`
  }

  // 更新平台配置
  const updatePlatformConfig = (id: string, updates: Partial<PlatformConfig>) => {
    setPlatformConfigs((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }))
    setSaveStatus("idle")
  }

  // 切换启用状态
  const togglePlatform = (id: string) => {
    const isEnabled = !platformConfigs[id].enabled
    updatePlatformConfig(id, { enabled: isEnabled })
    if (isEnabled) {
      setCurrentPlatformId(id)
    }
  }

  // 设为当前平台
  const setAsCurrent = (id: string) => {
    setCurrentPlatformId(id)
    // 启用该平台
    if (!platformConfigs[id].enabled) {
      updatePlatformConfig(id, { enabled: true })
    }
  }

  // 测试连接
  const testConnection = async (platformId: string, type: "text" | "vision") => {
    const config = platformConfigs[platformId]
    const key = type === "text" ? config.textApiKey : config.visionApiKey

    if (!key) {
      setTestStatus((prev) => ({ ...prev, [`${platformId}_${type}`]: "error" }))
      return
    }

    setTestStatus((prev) => ({ ...prev, [`${platformId}_${type}`]: "testing" }))

    // 模拟测试延迟
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // 实际项目中这里应该调用真实的 API 测试
    // 现在只是模拟成功
    setTestStatus((prev) => ({ ...prev, [`${platformId}_${type}`]: "success" }))

    // 3秒后重置状态
    setTimeout(() => {
      setTestStatus((prev) => ({ ...prev, [`${platformId}_${type}`]: "idle" }))
    }, 3000)
  }

  // 保存设置
  const saveSettings = async () => {
    setSaveStatus("saving")

    try {
      // 保存到服务器（全局配置文件）
      const response = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms: platformConfigs,
          currentPlatform: currentPlatformId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save config")
      }

      // 同时保存其他设置到 localStorage
      localStorage.setItem("daoyanos_ui_settings", JSON.stringify(uiSettings))

      await new Promise((resolve) => setTimeout(resolve, 300))
      setSaveStatus("saved")

      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch (error) {
      console.error("Failed to save settings:", error)
      setSaveStatus("error")
    }
  }

  // 加载全局配置
  const loadGlobalConfig = async () => {
    try {
      const response = await fetch("/api/config")
      if (response.ok) {
        const config = await response.json()
        if (config.platforms && Object.keys(config.platforms).length > 0) {
          // 合并已保存的配置和默认配置
          const mergedConfigs: Record<string, PlatformConfig> = {}
          platformDefinitions.forEach((def) => {
            mergedConfigs[def.id] = {
              id: def.id,
              name: def.name,
              description: def.description,
              icon: def.icon,
              color: def.color,
              textEndpoint: def.defaultTextEndpoint,
              textModel: def.textModels[0] || "",
              textApiKey: "",
              visionEndpoint: def.defaultVisionEndpoint,
              visionModel: def.visionModels[0] || "",
              visionApiKey: "",
              mode: def.id as any,
              enabled: def.id === "openai",
              // 覆盖已保存的值
              ...(config.platforms[def.id] || {}),
            }
          })
          setPlatformConfigs(mergedConfigs)
          if (config.currentPlatform) {
            setCurrentPlatformId(config.currentPlatform)
            setSelectedPlatformId(config.currentPlatform)
          }
        }
      }
    } catch (error) {
      console.error("Failed to load global config:", error)
    }
  }

  // 加载提示词
  const loadPrompts = async () => {
    setIsLoadingPrompts(true)
    try {
      const response = await fetch("/api/prompts")
      if (response.ok) {
        const data = await response.json()
        setPrompts(data.prompts)
        const files = Object.keys(data.prompts)
        if (files.length > 0 && !selectedPromptFile) {
          setSelectedPromptFile(files[0])
          setPromptContent(data.prompts[files[0]])
        }
      }
    } catch (error) {
      console.error("Failed to load prompts:", error)
    } finally {
      setIsLoadingPrompts(false)
    }
  }

  // 保存提示词
  const savePrompt = async () => {
    if (!selectedPromptFile || !promptContent) return
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
      if (response.ok) {
        setPrompts((prev) => ({ ...prev, [selectedPromptFile]: promptContent }))
        alert("提示词已保存")
      } else {
        const error = await response.json()
        alert(`保存失败: ${error.error}`)
      }
    } catch (error) {
      alert(`保存失败: ${(error as Error).message}`)
    } finally {
      setIsSavingPrompt(false)
    }
  }

  // 重新加载提示词
  const reloadPrompts = async () => {
    try {
      await fetch("/api/prompts", { method: "POST" })
      await loadPrompts()
      alert("提示词已重新加载")
    } catch (error) {
      alert(`重新加载失败: ${(error as Error).message}`)
    }
  }

  // 当选择文件变化时更新内容
  useEffect(() => {
    if (selectedPromptFile && prompts[selectedPromptFile]) {
      setPromptContent(prompts[selectedPromptFile])
    }
  }, [selectedPromptFile, prompts])

  // 加载提示词（仅在prompts tab被访问时）
  useEffect(() => {
    if (activeTab === "prompts" && Object.keys(prompts).length === 0) {
      loadPrompts()
    }
  }, [activeTab, prompts])

  // 加载设置
  useEffect(() => {
    // 从服务器加载全局配置
    loadGlobalConfig()

    // 从 localStorage 加载其他设置
    try {
      const savedUI = localStorage.getItem("daoyanos_ui_settings")

      if (savedUI) {
        setUiSettings(JSON.parse(savedUI))
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    }
  }, [])

  const currentConfig = platformConfigs[selectedPlatformId]
  const currentDef = getPlatformDefinition(selectedPlatformId)

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="border-b border-border">
        <div className="flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg font-semibold">设置</h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={saveSettings}
              disabled={saveStatus === "saving"}
            >
              {saveStatus === "saved" ? (
                <>
                  <Check className="w-4 h-4" />
                  已保存
                </>
              ) : saveStatus === "saving" ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  保存设置
                </>
              )}
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <div className="container mx-auto max-w-6xl py-8 px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl">
            <TabsTrigger value="platform" className="gap-2">
              <Key className="w-4 h-4" />
              AI平台
            </TabsTrigger>
            <TabsTrigger value="prompts" className="gap-2">
              <FileText className="w-4 h-4" />
              提示词
            </TabsTrigger>
            <TabsTrigger value="storage" className="gap-2">
              <Database className="w-4 h-4" />
              存储
            </TabsTrigger>
            <TabsTrigger value="ui" className="gap-2">
              <Palette className="w-4 h-4" />
              界面
            </TabsTrigger>
          </TabsList>

          {/* AI平台设置 */}
          <TabsContent value="platform" className="space-y-6">
            {/* 双模式切换 */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 p-1 rounded-lg bg-muted">
                <button
                  onClick={() => setPlatformTab("text")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    platformTab === "text"
                      ? "bg-amber-500 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  文字生成
                </button>
                <button
                  onClick={() => setPlatformTab("vision")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    platformTab === "vision"
                      ? "bg-amber-500 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  视觉分析
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 平台列表 */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base">
                    {platformTab === "text" ? "文字生成平台" : "视觉分析平台"}
                  </CardTitle>
                  <CardDescription>
                    {platformTab === "text"
                      ? "用于生成分镜提示词、分析剧本"
                      : "用于图片反推、视觉理解"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ScrollArea className="h-[400px]">
                    {platformDefinitions
                      .filter((def) => {
                        // 视觉分析模式只显示支持视觉的平台
                        if (platformTab === "vision") {
                          return def.visionModels.length > 0
                        }
                        return true
                      })
                      .map((def) => {
                        const config = platformConfigs[def.id]
                        const isSelected = selectedPlatformId === def.id
                        const isEnabled = config?.enabled

                        return (
                          <div
                            key={def.id}
                            onClick={() => setSelectedPlatformId(def.id)}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? "bg-amber-500/10 border border-amber-500/30"
                                : "hover:bg-muted border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${def.color} flex items-center justify-center text-sm`}>
                                {def.icon}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{def.name}</span>
                                  {def.recommended && (
                                    <Badge variant="secondary" className="text-[10px]">
                                      推荐
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{def.description}</p>
                              </div>
                            </div>
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={() => togglePlatform(def.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )
                      })}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* 平台配置详情 */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className={`w-6 h-6 rounded bg-gradient-to-br ${currentDef?.color} flex items-center justify-center text-xs`}>
                          {currentDef?.icon}
                        </div>
                        {currentDef?.name} 配置
                      </CardTitle>
                      <CardDescription>
                        {platformTab === "text"
                          ? "配置文字生成模型的 API 参数"
                          : "配置视觉分析模型的 API 参数"}
                      </CardDescription>
                    </div>
                    {currentDef?.keyUrl && (
                      <a
                        href={currentDef.keyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-amber-500 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        获取 Key
                      </a>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {currentConfig && (
                    <>
                      {/* API Key */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Key className="w-3 h-3" />
                          API Key
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            value={platformTab === "text" ? currentConfig.textApiKey : currentConfig.visionApiKey}
                            onChange={(e) =>
                              updatePlatformConfig(
                                currentConfig.id,
                                platformTab === "text"
                                  ? { textApiKey: e.target.value }
                                  : { visionApiKey: e.target.value }
                              )
                            }
                            placeholder={currentDef?.keyPlaceholder || "sk-..."}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testConnection(currentConfig.id, platformTab)}
                            disabled={testStatus[`${currentConfig.id}_${platformTab}`] === "testing"}
                          >
                            {testStatus[`${currentConfig.id}_${platformTab}`] === "testing" ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : testStatus[`${currentConfig.id}_${platformTab}`] === "success" ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : testStatus[`${currentConfig.id}_${platformTab}`] === "error" ? (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <>
                                <TestTube className="w-4 h-4 mr-1" />
                                测试
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* 模型选择 */}
                      <div className="space-y-2">
                        <Label>模型</Label>
                        <Select
                          value={platformTab === "text" ? currentConfig.textModel : currentConfig.visionModel}
                          onValueChange={(v) =>
                            updatePlatformConfig(
                              currentConfig.id,
                              platformTab === "text" ? { textModel: v } : { visionModel: v }
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择模型" />
                          </SelectTrigger>
                          <SelectContent>
                            {getPlatformModels(currentConfig.id, platformTab).map((model) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* API 端点 */}
                      <div className="space-y-2">
                        <Label>API 端点</Label>
                        <Input
                          value={platformTab === "text" ? currentConfig.textEndpoint : currentConfig.visionEndpoint}
                          onChange={(e) =>
                            updatePlatformConfig(
                              currentConfig.id,
                              platformTab === "text"
                                ? { textEndpoint: e.target.value }
                                : { visionEndpoint: e.target.value }
                            )
                          }
                          placeholder="https://api..."
                        />
                        <p className="text-xs text-muted-foreground">
                          一般使用默认端点即可，除非使用自定义代理
                        </p>
                      </div>

                      {/* 当前平台标识 */}
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">设为当前平台</p>
                          <p className="text-xs text-muted-foreground">
                            生成时将使用此平台的配置
                          </p>
                        </div>
                        <Button
                          variant={currentPlatformId === currentConfig.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAsCurrent(currentConfig.id)}
                          disabled={currentPlatformId === currentConfig.id}
                        >
                          {currentPlatformId === currentConfig.id ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              当前使用中
                            </>
                          ) : (
                            "设为默认"
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 提示信息 */}
            <Alert className="bg-muted">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-xs">
                平台配置仅保存在本地浏览器中。如需跨设备同步，请手动导出备份。
                <br />
                视觉分析用于图片反推功能，如果不需要可以不配置。
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* 提示词设置 */}
          <TabsContent value="prompts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* 文件列表 */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>提示词文件</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={reloadPrompts}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                  <CardDescription>选择要编辑的提示词模板</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ScrollArea className="h-[400px]">
                    {isLoadingPrompts ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      Object.keys(prompts).map((file) => (
                        <div
                          key={file}
                          onClick={() => {
                            setSelectedPromptFile(file)
                            setPromptContent(prompts[file])
                          }}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            selectedPromptFile === file
                              ? "bg-amber-500/10 border border-amber-500/30"
                              : "hover:bg-muted border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Code className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium">{file}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 ml-6">
                            {PROMPT_FILE_DESCRIPTIONS[file] || "提示词配置"}
                          </p>
                        </div>
                      ))
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* 编辑器 */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {selectedPromptFile || "选择文件"}
                      </CardTitle>
                      <CardDescription>
                        编辑YAML格式的提示词模板
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={savePrompt}
                        disabled={!selectedPromptFile || isSavingPrompt || !promptEditEnabled}
                        className="gap-2"
                      >
                        {isSavingPrompt ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            保存中...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            保存修改
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* 编辑保护开关 */}
                  <div className="flex items-center justify-between mb-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={promptEditEnabled}
                        onCheckedChange={setPromptEditEnabled}
                      />
                      <Label className="text-sm">启用编辑模式</Label>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      disabled={!selectedPromptFile}
                      onClick={async () => {
                        if (!selectedPromptFile) return
                        if (confirm("确定要重置此提示词文件到默认状态吗？")) {
                          try {
                            // 重新从文件系统加载
                            const response = await fetch("/api/prompts")
                            if (response.ok) {
                              const data = await response.json()
                              if (data.prompts[selectedPromptFile]) {
                                setPromptContent(data.prompts[selectedPromptFile])
                                alert("已重置到默认内容")
                              }
                            }
                          } catch (error) {
                            alert("重置失败")
                          }
                        }
                      }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      重置默认
                    </Button>
                  </div>

                  <Textarea
                    value={promptContent}
                    onChange={(e) => setPromptContent(e.target.value)}
                    placeholder="选择左侧文件查看或编辑提示词..."
                    className="h-[400px] font-mono text-xs"
                    disabled={!promptEditEnabled}
                  />
                </CardContent>
              </Card>
            </div>

            <Alert className="bg-muted">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-xs">
                ⚠️ <strong>提示词编辑需要先开启"启用编辑模式"开关</strong>，修改后点击保存生效。
                <br />
                提示词文件使用YAML格式，错误的格式可能导致生成失败。如需恢复，点击"重置默认"。
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* 存储设置 */}
          <TabsContent value="storage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">本地存储</CardTitle>
                <CardDescription>配置项目数据的本地存储路径</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>存储路径</Label>
                  <div className="flex gap-2">
                    <Input
                      value={storagePath}
                      onChange={(e) => setStoragePath(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline">选择文件夹</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    项目数据将存储在此目录下，包括剧本、分镜表、生成的图片等
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">存储统计</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted">
                      <div className="text-2xl font-bold">3</div>
                      <div className="text-xs text-muted-foreground">项目数量</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <div className="text-2xl font-bold">156</div>
                      <div className="text-xs text-muted-foreground">分镜数量</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <div className="text-2xl font-bold">1.2 GB</div>
                      <div className="text-xs text-muted-foreground">占用空间</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2">
                    <Database className="w-4 h-4" />
                    导出备份
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Database className="w-4 h-4" />
                    导入备份
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 界面设置 */}
          <TabsContent value="ui" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">界面偏好</CardTitle>
                <CardDescription>自定义界面行为和外观</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">默认主题</Label>
                    <p className="text-sm text-muted-foreground">
                      设置启动时的默认主题模式
                    </p>
                  </div>
                  <Select
                    value={uiSettings.defaultTheme}
                    onValueChange={(v) =>
                      setUiSettings((s) => ({ ...s, defaultTheme: v }))
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">浅色</SelectItem>
                      <SelectItem value="dark">深色</SelectItem>
                      <SelectItem value="system">跟随系统</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">字体大小</Label>
                    <p className="text-sm text-muted-foreground">
                      调整全局字体大小（{uiSettings.fontSize}px）
                    </p>
                  </div>
                  <div className="flex items-center gap-3 w-48">
                    <span className="text-xs text-muted-foreground">小</span>
                    <Slider
                      value={[uiSettings.fontSize]}
                      onValueChange={(value) =>
                        handleFontSizeChange(value[0])
                      }
                      min={12}
                      max={20}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground">大</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">自动保存</Label>
                    <p className="text-sm text-muted-foreground">
                      编辑时自动保存项目数据
                    </p>
                  </div>
                  <Switch
                    checked={uiSettings.autoSave}
                    onCheckedChange={(v) =>
                      setUiSettings((s) => ({ ...s, autoSave: v }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">显示提示</Label>
                    <p className="text-sm text-muted-foreground">
                      鼠标悬停时显示功能提示
                    </p>
                  </div>
                  <Switch
                    checked={uiSettings.showTooltips}
                    onCheckedChange={(v) =>
                      setUiSettings((s) => ({ ...s, showTooltips: v }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">紧凑模式</Label>
                    <p className="text-sm text-muted-foreground">
                      减小间距以显示更多内容
                    </p>
                  </div>
                  <Switch
                    checked={uiSettings.compactMode}
                    onCheckedChange={(v) =>
                      setUiSettings((s) => ({ ...s, compactMode: v }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
