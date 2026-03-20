import fs from "fs/promises"
import path from "path"
import os from "os"
import type { Project } from "@/types"

const STORAGE_DIR_NAME = "DaoYanOSProjects"

/**
 * 获取本地存储路径
 */
export function getLocalStoragePath(): string {
  return path.join(os.homedir(), "Documents", STORAGE_DIR_NAME)
}

/**
 * 确保目录存在
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true })
}

// ============================================
// 项目存储
// ============================================

const PROJECTS_DIR = getLocalStoragePath()

/**
 * 获取/创建项目根目录
 */
export async function getProjectsDir(): Promise<string> {
  await ensureDirectoryExists(PROJECTS_DIR)
  return PROJECTS_DIR
}

/**
 * 列出所有项目
 */
export async function listProjects(): Promise<Project[]> {
  const projects: Project[] = []
  try {
    const dir = await getProjectsDir()
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.isDirectory()) {
        try {
          const metaPath = path.join(dir, entry.name, "meta.json")
          const content = await fs.readFile(metaPath, "utf-8")
          const project = JSON.parse(content) as Project
          projects.push(project)
        } catch {
          // 跳过无效项目目录
        }
      }
    }
  } catch (error) {
    console.error("Error listing projects:", error)
  }

  // 按更新时间排序
  return projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

/**
 * 读取单个项目
 */
export async function readProject(id: string): Promise<Project | null> {
  try {
    const dir = await getProjectsDir()
    const metaPath = path.join(dir, id, "meta.json")
    const content = await fs.readFile(metaPath, "utf-8")
    return JSON.parse(content) as Project
  } catch (error) {
    console.error(`Error reading project ${id}:`, error)
    return null
  }
}

/**
 * 保存项目
 */
export async function writeProject(project: Project): Promise<boolean> {
  try {
    const dir = await getProjectsDir()
    const projectDir = path.join(dir, project.id)
    const metaPath = path.join(projectDir, "meta.json")

    // 确保目录存在
    await ensureDirectoryExists(projectDir)

    // 更新时间戳
    project.updatedAt = new Date().toISOString()

    // 保存元数据
    await fs.writeFile(metaPath, JSON.stringify(project, null, 2), "utf-8")
    return true
  } catch (error) {
    console.error(`Error writing project ${project.id}:`, error)
    return false
  }
}

/**
 * 删除项目
 */
export async function deleteProject(id: string): Promise<boolean> {
  try {
    const dir = await getProjectsDir()
    const projectDir = path.join(dir, id)
    await fs.rm(projectDir, { recursive: true, force: true })
    return true
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error)
    return false
  }
}

/**
 * 创建新项目
 */
export function createEmptyProject(): Project {
  const now = new Date().toISOString()
  return {
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
    scriptFaithfulMode: true,
    enableWordFilter: true,
    autoSafetyCheck: true,
    strictMode: false,
    stcEnabled: true,
    assets: {
      character: [],
      image: [],
      props: [],
      assetNameMap: {},
      assetTagEnabled: {
        character: true,
        image: true,
        props: true,
      },
    },
    currentPlatformId: "platform_default",
    platforms: [
      {
        id: "platform_default",
        name: "默认平台",
        textEndpoint: "https://api.openai.com/v1/chat/completions",
        textModel: "gpt-4",
        textApiKey: "",
        visionEndpoint: "https://api.openai.com/v1/chat/completions",
        visionModel: "gpt-4o",
        visionApiKey: "",
        mode: "openai",
        enabled: true,
      },
    ],
    episodes: [
      {
        id: `ep_${Date.now()}`,
        name: "第一集",
        plotInput: "",
        scenes: [],
        shots: [],
      },
    ],
  }
}
