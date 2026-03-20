/**
 * 分镜生成状态管理
 * 用于跨页面共享生成进度（剧本页 → 分镜页）
 */

import type { Shot } from "@/types"

export interface GenerationProgress {
  isGenerating: boolean
  projectId: string | null
  episodeId: string | null
  stage: "idle" | "splitting" | "generating" | "complete" | "error"
  currentScene: number
  totalScenes: number
  sceneName: string
  output: string
  error: string | null
  shots: Shot[]
}

type GenerationListener = (state: GenerationProgress) => void

class GenerationStore {
  private state: GenerationProgress = {
    isGenerating: false,
    projectId: null,
    episodeId: null,
    stage: "idle",
    currentScene: 0,
    totalScenes: 0,
    sceneName: "",
    output: "",
    error: null,
    shots: [],
  }

  private listeners: Set<GenerationListener> = new Set()
  private abortController: AbortController | null = null

  subscribe(listener: GenerationListener): () => void {
    this.listeners.add(listener)
    // 立即通知当前状态
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  getState(): GenerationProgress {
    return { ...this.state }
  }

  startGeneration(projectId: string, episodeId: string) {
    this.state = {
      isGenerating: true,
      projectId,
      episodeId,
      stage: "splitting",
      currentScene: 0,
      totalScenes: 0,
      sceneName: "",
      output: "",
      error: null,
      shots: [],
    }
    this.abortController = new AbortController()
    this.notifyListeners()
  }

  updateProgress(updates: Partial<GenerationProgress>) {
    this.state = { ...this.state, ...updates }
    this.notifyListeners()
  }

  completeGeneration(output: string, shots: Shot[]) {
    this.state = {
      ...this.state,
      isGenerating: false,
      stage: "complete",
      output,
      shots,
    }
    this.abortController = null
    this.notifyListeners()
  }

  errorGeneration(error: string) {
    this.state = {
      ...this.state,
      isGenerating: false,
      stage: "error",
      error,
    }
    this.abortController = null
    this.notifyListeners()
  }

  cancelGeneration() {
    if (this.abortController) {
      this.abortController.abort()
    }
    this.state = {
      isGenerating: false,
      projectId: null,
      episodeId: null,
      stage: "idle",
      currentScene: 0,
      totalScenes: 0,
      sceneName: "",
      output: "",
      error: null,
      shots: [],
    }
    this.abortController = null
    this.notifyListeners()
  }

  getAbortController(): AbortController | null {
    return this.abortController
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state))
  }
}

// 全局单例
export const generationStore = new GenerationStore()