import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import os from "os"
import type { PlatformConfig } from "@/types"

const CONFIG_DIR = path.join(os.homedir(), "Documents", "DaoYanOSProjects")
const CONFIG_FILE = path.join(CONFIG_DIR, "global_config.json")

interface GlobalConfig {
  platforms: Record<string, PlatformConfig>
  currentPlatform: string
}

/**
 * 确保配置目录存在
 */
async function ensureConfigDir() {
  await fs.mkdir(CONFIG_DIR, { recursive: true })
}

/**
 * GET /api/config
 * 获取全局配置
 */
export async function GET() {
  try {
    await ensureConfigDir()
    const content = await fs.readFile(CONFIG_FILE, "utf-8")
    const config = JSON.parse(content) as GlobalConfig
    return NextResponse.json(config)
  } catch {
    // 返回默认配置
    return NextResponse.json({
      platforms: {},
      currentPlatform: "",
    })
  }
}

/**
 * PUT /api/config
 * 保存全局配置
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { platforms, currentPlatform } = body as GlobalConfig

    await ensureConfigDir()

    const config: GlobalConfig = {
      platforms: platforms || {},
      currentPlatform: currentPlatform || "",
    }

    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save config:", error)
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 })
  }
}