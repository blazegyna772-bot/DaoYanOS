import fs from "fs/promises"
import path from "path"
import os from "os"

// 默认本地存储路径
const DEFAULT_STORAGE_PATH = path.join(os.homedir(), "Documents", "DaoYanOSProjects")

// 获取存储路径（后续可从环境变量或配置读取）
export function getLocalStoragePath(): string {
  return process.env.DAOYANOS_STORAGE_PATH || DEFAULT_STORAGE_PATH
}

// 确保目录存在
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

// 获取项目完整路径
export function getProjectPath(projectId: string): string {
  return path.join(getLocalStoragePath(), projectId)
}

// 获取资产路径
export function getAssetPath(projectId: string, assetType: "characters" | "scenes" | "props", fileName: string): string {
  return path.join(getLocalStoragePath(), projectId, "assets", assetType, fileName)
}

// 获取输出路径
export function getOutputPath(projectId: string, outputType: "images" | "videos", fileName: string): string {
  return path.join(getLocalStoragePath(), projectId, "outputs", outputType, fileName)
}
