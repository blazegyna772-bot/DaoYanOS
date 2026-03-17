"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Key,
  Database,
  Shield,
  Palette,
  Globe,
  Save,
  Plus,
  Trash2,
  Check,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("platform")

  // 平台配置
  const [platforms, setPlatforms] = useState([
    {
      id: "platform_default",
      name: "默认平台",
      endpoint: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4",
      mode: "openai",
      apiKey: "",
      isDefault: true,
    },
  ])
  const [selectedPlatform, setSelectedPlatform] = useState("platform_default")

  // 存储设置
  const [storagePath, setStoragePath] = useState("~/Documents/DaoYanOSProjects/")

  // 安全设置
  const [safetySettings, setSafetySettings] = useState({
    enableWordFilter: true,
    autoSafetyCheck: true,
    strictMode: false,
  })

  // 界面设置
  const [uiSettings, setUiSettings] = useState({
    defaultTheme: "dark",
    autoSave: true,
    showTooltips: true,
    compactMode: false,
    fontSize: 16,
  })

  // 全局字体大小
  const handleFontSizeChange = (size: number) => {
    setUiSettings((s) => ({ ...s, fontSize: size }))
    document.documentElement.style.fontSize = `${size}px`
  }

  // 添加新平台
  const handleAddPlatform = () => {
    const newId = `platform_${Date.now()}`
    setPlatforms([
      ...platforms,
      {
        id: newId,
        name: "新平台",
        endpoint: "",
        model: "",
        mode: "openai",
        apiKey: "",
        isDefault: false,
      },
    ])
    setSelectedPlatform(newId)
  }

  // 删除平台
  const handleDeletePlatform = (id: string) => {
    setPlatforms(platforms.filter((p) => p.id !== id))
    if (selectedPlatform === id) {
      setSelectedPlatform("platform_default")
    }
  }

  // 更新平台
  const updatePlatform = (id: string, updates: any) => {
    setPlatforms(
      platforms.map((p) => (p.id === id ? { ...p, ...updates } : p))
    )
  }

  // 设为默认
  const setDefaultPlatform = (id: string) => {
    setPlatforms(
      platforms.map((p) => ({ ...p, isDefault: p.id === id }))
    )
  }

  const currentPlatform = platforms.find((p) => p.id === selectedPlatform)

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
            <Button variant="outline" size="sm" className="gap-2">
              <Save className="w-4 h-4" />
              保存设置
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <div className="container mx-auto max-w-6xl py-8 px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="platform" className="gap-2">
              <Key className="w-4 h-4" />
              AI平台
            </TabsTrigger>
            <TabsTrigger value="storage" className="gap-2">
              <Database className="w-4 h-4" />
              存储
            </TabsTrigger>
            <TabsTrigger value="safety" className="gap-2">
              <Shield className="w-4 h-4" />
              安全
            </TabsTrigger>
            <TabsTrigger value="ui" className="gap-2">
              <Palette className="w-4 h-4" />
              界面
            </TabsTrigger>
          </TabsList>

          {/* AI平台设置 */}
          <TabsContent value="platform" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 平台列表 */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base">平台列表</CardTitle>
                  <CardDescription>管理您的 AI 服务平台</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {platforms.map((platform) => (
                    <div
                      key={platform.id}
                      onClick={() => setSelectedPlatform(platform.id)}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedPlatform === platform.id
                          ? "bg-amber-500/10 border border-amber-500/30"
                          : "hover:bg-muted border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{platform.name}</span>
                        {platform.isDefault && (
                          <Badge variant="secondary" className="text-[10px]">
                            默认
                          </Badge>
                        )}
                      </div>
                      {platform.id !== "platform_default" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePlatform(platform.id)
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full gap-2 mt-2"
                    onClick={handleAddPlatform}
                  >
                    <Plus className="w-4 h-4" />
                    添加平台
                  </Button>
                </CardContent>
              </Card>

              {/* 平台详情 */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">平台配置</CardTitle>
                  <CardDescription>配置选中的 AI 平台参数</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentPlatform && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>平台名称</Label>
                          <Input
                            value={currentPlatform.name}
                            onChange={(e) =>
                              updatePlatform(currentPlatform.id, { name: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>协议模式</Label>
                          <Select
                            value={currentPlatform.mode}
                            onValueChange={(v) =>
                              updatePlatform(currentPlatform.id, { mode: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="openai">OpenAI</SelectItem>
                              <SelectItem value="gemini">Gemini</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>API 地址</Label>
                        <Input
                          value={currentPlatform.endpoint}
                          onChange={(e) =>
                            updatePlatform(currentPlatform.id, { endpoint: e.target.value })
                          }
                          placeholder="https://api.openai.com/v1/chat/completions"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>模型名称</Label>
                        <Input
                          value={currentPlatform.model}
                          onChange={(e) =>
                            updatePlatform(currentPlatform.id, { model: e.target.value })
                          }
                          placeholder="gpt-4"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>API 密钥</Label>
                        <Input
                          type="password"
                          value={currentPlatform.apiKey}
                          onChange={(e) =>
                            updatePlatform(currentPlatform.id, { apiKey: e.target.value })
                          }
                          placeholder="sk-..."
                        />
                      </div>

                      <div className="flex items-center justify-between pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDefaultPlatform(currentPlatform.id)}
                          disabled={currentPlatform.isDefault}
                        >
                          {currentPlatform.isDefault ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              已是默认
                            </>
                          ) : (
                            "设为默认"
                          )}
                        </Button>
                        <Button size="sm">测试连接</Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
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

          {/* 安全设置 */}
          <TabsContent value="safety" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">内容安全</CardTitle>
                <CardDescription>配置敏感内容检测和过滤选项</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">敏感词过滤</Label>
                    <p className="text-sm text-muted-foreground">
                      自动替换剧本中的敏感词汇
                    </p>
                  </div>
                  <Switch
                    checked={safetySettings.enableWordFilter}
                    onCheckedChange={(v) =>
                      setSafetySettings((s) => ({ ...s, enableWordFilter: v }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">生成前安全预检</Label>
                    <p className="text-sm text-muted-foreground">
                      在生成前自动检测潜在风险内容
                    </p>
                  </div>
                  <Switch
                    checked={safetySettings.autoSafetyCheck}
                    onCheckedChange={(v) =>
                      setSafetySettings((s) => ({ ...s, autoSafetyCheck: v }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">严格模式</Label>
                    <p className="text-sm text-muted-foreground">
                      启用更严格的检测规则
                    </p>
                  </div>
                  <Switch
                    checked={safetySettings.strictMode}
                    onCheckedChange={(v) =>
                      setSafetySettings((s) => ({ ...s, strictMode: v }))
                    }
                  />
                </div>

                <Separator />

                <div className="p-4 rounded-lg bg-muted">
                  <h4 className="text-sm font-medium mb-2">检测区域说明</h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• 红区：绝对禁止内容（如色情、暴力、政治敏感等）</li>
                    <li>• 黄区：版权/品牌/IP风险（如迪士尼、漫威等）</li>
                    <li>• 名人区：真实人物肖像风险</li>
                    <li>• IP区：知名角色/IP形象风险</li>
                  </ul>
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
                      setUiSettings((s) => ({ ...s, defaultTheme: v || "dark" }))
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
                      onValueChange={(value) => handleFontSizeChange(Array.isArray(value) ? value[0] : value)}
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
