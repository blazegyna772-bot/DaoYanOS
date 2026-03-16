import { PromptTemplate } from "@/types"
import fs from "fs/promises"
import path from "path"
import yaml from "yaml"
import chokidar from "chokidar"

const PROMPTS_DIR = path.join(process.cwd(), "prompts")

class PromptManager {
  private templates: Map<string, PromptTemplate> = new Map()
  private watcher: chokidar.FSWatcher | null = null

  constructor() {
    this.loadTemplates()
    this.watchFiles()
  }

  // 加载所有YAML提示词文件
  private async loadTemplates() {
    try {
      const files = await fs.readdir(PROMPTS_DIR)
      const yamlFiles = files.filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))

      for (const file of yamlFiles) {
        await this.loadTemplateFile(file)
      }

      console.log(`[PromptManager] Loaded ${this.templates.size} templates`)
    } catch (error) {
      console.error("[PromptManager] Failed to load templates:", error)
    }
  }

  // 加载单个模板文件
  private async loadTemplateFile(fileName: string) {
    try {
      const filePath = path.join(PROMPTS_DIR, fileName)
      const content = await fs.readFile(filePath, "utf-8")
      const data = yaml.parse(content)

      if (Array.isArray(data.prompts)) {
        for (const prompt of data.prompts) {
          this.templates.set(prompt.id, {
            id: prompt.id,
            name: prompt.name,
            description: prompt.description,
            content: prompt.content,
            variables: prompt.variables || [],
            category: prompt.category || "system",
          })
        }
      }
    } catch (error) {
      console.error(`[PromptManager] Failed to load ${fileName}:`, error)
    }
  }

  // 监听文件变化（热重载）
  private watchFiles() {
    this.watcher = chokidar.watch(PROMPTS_DIR, {
      persistent: true,
      ignoreInitial: true,
    })

    this.watcher.on("change", (filePath) => {
      console.log(`[PromptManager] File changed: ${path.basename(filePath)}`)
      this.loadTemplates()
    })

    this.watcher.on("add", (filePath) => {
      console.log(`[PromptManager] File added: ${path.basename(filePath)}`)
      this.loadTemplates()
    })
  }

  // 获取所有模板
  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values())
  }

  // 获取单个模板
  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id)
  }

  // 渲染模板（替换变量）
  renderTemplate(id: string, variables: Record<string, string>): string {
    const template = this.templates.get(id)
    if (!template) {
      throw new Error(`Template not found: ${id}`)
    }

    let rendered = template.content
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), value)
    }

    return rendered
  }

  // 手动重载
  reload() {
    this.templates.clear()
    this.loadTemplates()
  }

  // 停止监听
  stopWatching() {
    if (this.watcher) {
      this.watcher.close()
    }
  }
}

// 单例实例
let instance: PromptManager | null = null

export function getPromptManager(): PromptManager {
  if (!instance) {
    instance = new PromptManager()
  }
  return instance
}
