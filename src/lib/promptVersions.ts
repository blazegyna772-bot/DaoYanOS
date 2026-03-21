import fs from "fs/promises"
import path from "path"

const PROMPTS_DIR = path.join(process.cwd(), "prompts")
const PROMPT_VERSIONS_DIR = path.join(PROMPTS_DIR, "_versions")

export interface PromptVersionMeta {
  filename: string
  versionName: string
  updatedAt: string
  size: number
}

function getPromptVersionDir(filename: string) {
  return path.join(PROMPT_VERSIONS_DIR, filename)
}

function getPromptVersionPath(filename: string, versionName: string) {
  return path.join(getPromptVersionDir(filename), `${versionName}.yaml`)
}

export async function ensurePromptVersionDir(filename: string) {
  await fs.mkdir(getPromptVersionDir(filename), { recursive: true })
}

export async function listPromptVersions(filename: string): Promise<PromptVersionMeta[]> {
  try {
    const versionDir = getPromptVersionDir(filename)
    const entries = await fs.readdir(versionDir, { withFileTypes: true })
    const metas = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".yaml"))
        .map(async (entry) => {
          const filePath = path.join(versionDir, entry.name)
          const stats = await fs.stat(filePath)
          return {
            filename,
            versionName: entry.name.replace(/\.yaml$/, ""),
            updatedAt: stats.mtime.toISOString(),
            size: stats.size,
          } satisfies PromptVersionMeta
        })
    )

    return metas.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  } catch {
    return []
  }
}

export async function readPromptVersion(filename: string, versionName: string) {
  const filePath = getPromptVersionPath(filename, versionName)
  const [content, stats] = await Promise.all([
    fs.readFile(filePath, "utf-8"),
    fs.stat(filePath),
  ])

  return {
    content,
    meta: {
      filename,
      versionName,
      updatedAt: stats.mtime.toISOString(),
      size: stats.size,
    } satisfies PromptVersionMeta,
  }
}

export async function writePromptVersion(filename: string, versionName: string, content: string) {
  await ensurePromptVersionDir(filename)
  const filePath = getPromptVersionPath(filename, versionName)
  await fs.writeFile(filePath, content, "utf-8")
  return readPromptVersion(filename, versionName)
}

export async function deletePromptVersion(filename: string, versionName: string) {
  const filePath = getPromptVersionPath(filename, versionName)
  await fs.unlink(filePath)
}
