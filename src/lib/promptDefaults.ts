import fs from "fs/promises"
import path from "path"
import { promptManager } from "@/lib/promptManager"
import { reloadPromptConfig } from "@/lib/promptLoader"
import { writePromptVersion } from "@/lib/promptVersions"

const PROMPTS_DIR = path.join(process.cwd(), "prompts")
const PROMPT_DEFAULTS_DIR = path.join(process.cwd(), "prompt-defaults")

function getPromptPath(filename: string) {
  return path.join(PROMPTS_DIR, filename)
}

function getPromptDefaultPath(filename: string) {
  return path.join(PROMPT_DEFAULTS_DIR, filename)
}

function buildRestoreBackupVersionName() {
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)
  return `AUTO_BEFORE_RESTORE_${timestamp}`
}

export async function readOfficialPromptDefault(filename: string) {
  const filePath = getPromptDefaultPath(filename)
  const [content, stats] = await Promise.all([
    fs.readFile(filePath, "utf-8"),
    fs.stat(filePath),
  ])

  return {
    filename,
    content,
    updatedAt: stats.mtime.toISOString(),
    size: stats.size,
  }
}

export async function restoreOfficialPromptDefault(filename: string) {
  const currentPath = getPromptPath(filename)
  const defaultPrompt = await readOfficialPromptDefault(filename)
  const currentContent = await fs.readFile(currentPath, "utf-8")

  let backupVersionName: string | null = null
  if (currentContent !== defaultPrompt.content) {
    backupVersionName = buildRestoreBackupVersionName()
    await writePromptVersion(filename, backupVersionName, currentContent)
  }

  await fs.writeFile(currentPath, defaultPrompt.content, "utf-8")
  await promptManager.reload()
  reloadPromptConfig()

  return {
    ...defaultPrompt,
    backupVersionName,
  }
}
