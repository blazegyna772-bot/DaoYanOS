// 项目类型定义
export interface Project {
  id: string
  name: string
  script: string
  createdAt: string
  updatedAt: string
  settings: ProjectSettings
  storyboards: Storyboard[]
}

export interface ProjectSettings {
  directorStyle?: string
  visualStyle?: string
  duration?: number
  enableFaithfulMode?: boolean
  enableSTC?: boolean
}

export interface Storyboard {
  id: string
  sceneNumber: number
  startSec: number
  endSec: number
  shots: Shot[]
  bridgeState?: BridgeState
}

export interface Shot {
  id: string
  shotNumber: number
  lens: string
  environment: string
  characterAction: string
  details: string
  lighting: string
  sound: string
  dialogue: string
}

export interface BridgeState {
  charPosition: string
  lightPhase: string
  environment: string
  keyProp: string
}

// 资产类型
export interface Asset {
  id: string
  name: string
  description: string
  type: "character" | "scene" | "prop"
  filePath?: string
  url?: string
}

// 提示词模板类型
export interface PromptTemplate {
  id: string
  name: string
  description: string
  content: string
  variables: string[]
  category: "system" | "scene" | "shot" | "analysis"
}

// 导演风格类型
export interface DirectorStyle {
  id: string
  name: string
  style: string
  techniques: string
  lighting: string
  category: string
  films: string[]
  color: string
}
