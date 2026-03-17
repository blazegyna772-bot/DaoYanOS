"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Clock, Film, MoreVertical, Copy, Trash2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { mockProjects, createEmptyProject } from "@/mock/projects"
import type { Project } from "@/types"

export default function HomePage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>(mockProjects)

  // 获取导演显示名称
  const getDirectorName = (directorId: string) => {
    const directorMap: Record<string, string> = {
      wong: "王家卫",
      nolan: "诺兰",
      zhang: "张艺谋",
      cameron: "卡梅隆",
      villeneuve: "维伦纽瓦",
      spielberg: "斯皮尔伯格",
      scorsese: "斯科塞斯",
      fincher: "芬奇",
      hitchcock: "希区柯克",
      tarantino: "昆汀",
      wook: "朴赞郁",
      lee: "李安",
      kurosawa: "黑泽明",
      miyazaki: "宫崎骏",
      shinkai: "新海诚",
      hosoda: "细田守",
      kon: "今敏",
      anno: "庵野秀明",
      takahata: "高畑勋",
      chow: "周星驰",
      generic: "标准电影感",
    }
    return directorMap[directorId] || directorId
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  // 新建项目
  const handleNewProject = () => {
    const newProject = createEmptyProject()
    newProject.name = `新项目 ${projects.length + 1}`
    setProjects([newProject, ...projects])
    router.push(`/editor?id=${newProject.id}`)
  }

  // 打开项目
  const handleOpenProject = (projectId: string) => {
    router.push(`/editor?id=${projectId}`)
  }

  // 删除项目
  const handleDeleteProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setProjects(projects.filter((p) => p.id !== projectId))
  }

  // 复制项目
  const handleDuplicateProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      const duplicated: Project = {
        ...project,
        id: `proj_${Date.now()}`,
        name: `${project.name} (副本)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setProjects([duplicated, ...projects])
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航栏 */}
      <header className="border-b border-border">
        <div className="flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold">DaoYanOS</h1>
            <span className="text-xs text-muted-foreground ml-2">导演制作中台</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-6 py-8">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">项目管理</h2>
            <p className="text-sm text-muted-foreground mt-1">
              管理您的 AI 视频项目，本地存储路径：~/Documents/DaoYanOSProjects/
            </p>
          </div>

          <Button onClick={handleNewProject} className="gap-2">
            <Plus className="w-4 h-4" />
            新建项目
          </Button>
        </div>

        {/* 项目网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* 新建项目卡片 */}
          <button
            onClick={handleNewProject}
            className="group relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all min-h-[200px]"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-amber-500/10 group-hover:scale-110 transition-all">
              <Plus className="w-6 h-6 text-muted-foreground group-hover:text-amber-500" />
            </div>
            <span className="mt-4 text-sm font-medium text-muted-foreground group-hover:text-foreground">
              新建项目
            </span>
          </button>

          {/* 项目卡片列表 */}
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleOpenProject(project.id)}
              className="group relative flex flex-col p-5 rounded-xl border border-border bg-card hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all cursor-pointer"
            >
              {/* 卡片头部 */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center border border-zinc-600">
                  <Film className="w-5 h-5 text-zinc-400" />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-md hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => handleDuplicateProject(project.id, e as unknown as React.MouseEvent)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      复制项目
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => handleDeleteProject(project.id, e as unknown as React.MouseEvent)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      删除项目
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* 项目信息 */}
              <h3 className="font-semibold text-foreground truncate mb-1" title={project.name}>
                {project.name}
              </h3>

              <p className="text-xs text-muted-foreground line-clamp-2 mb-4 h-8">
                {project.plotInput || "暂无剧情描述"}
              </p>

              {/* 元信息 */}
              <div className="mt-auto space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">导演风格</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px]">
                    {getDirectorName(project.selectedDirector)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">时长</span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{project.duration}秒</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">分集数</span>
                  <span className="text-muted-foreground">
                    {project.episodes?.length || 0} 集
                  </span>
                </div>

                <div className="pt-2 border-t border-border">
                  <span className="text-[10px] text-muted-foreground">
                    更新于 {formatDate(project.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 空状态提示 */}
        {projects.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Film className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">暂无项目</h3>
            <p className="text-sm text-muted-foreground mb-6">
              点击上方"新建项目"按钮开始创作
            </p>
            <Button onClick={handleNewProject}>
              <Plus className="w-4 h-4 mr-2" />
              新建项目
            </Button>
          </div>
        )}
      </main>

      {/* 底部信息 */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-6">
          <p className="text-xs text-muted-foreground text-center">
            DaoYanOS - SoulLens V5.1 Refactor | 本地优先 · 数据存储于 ~/Documents/DaoYanOSProjects/
          </p>
        </div>
      </footer>
    </div>
  )
}
