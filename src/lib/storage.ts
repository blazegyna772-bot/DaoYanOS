import path from "path"
import os from "os"
import fs from "fs/promises"

const STORAGE_DIR_NAME = "DaoYanOSProjects"

export function getLocalStoragePath(): string {
  return path.join(os.homedir(), "Documents", STORAGE_DIR_NAME)
}

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true })
}
