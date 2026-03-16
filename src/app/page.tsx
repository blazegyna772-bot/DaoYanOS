"use client"

import { useState } from "react"

export default function Home() {
  const [activeTab, setActiveTab] = useState("script")

  return (
    <div className="flex h-screen bg-zinc-950">
      {/* 左侧导航栏 */}
      <nav className="w-16 border-r border-zinc-800 flex flex-col items-center py-4 space-y-6 bg-zinc-950">
        <div className="text-xs font-bold text-zinc-400">DaoYanOS</div>
        {[
          { id: "manage", icon: "□", label: "管理" },
          { id: "script", icon: "◎", label: "剧本" },
          { id: "assets", icon: "○", label: "资产" },
          { id: "storyboard", icon: "◐", label: "分镜" },
          { id: "ai", icon: "◇", label: "AI生成" },
          { id: "post", icon: "△", label: "后期" },
          { id: "settings", icon: "○", label: "配置" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-10 h-10 flex flex-col items-center justify-center rounded-md transition-colors ${
              activeTab === item.id
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
            }`}
          >
            <span className="text-xs">{item.icon}</span>
            <span className="text-[8px] mt-0.5">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* 中部工作区 */}
      <main className="flex-1 flex flex-col bg-zinc-950">
        {/* 标签页 */}
        <div className="h-10 border-b border-zinc-800 flex items-center px-2 bg-zinc-900">
          <div className="flex space-x-1">
            <div className="px-3 py-1.5 bg-zinc-800 rounded-t text-xs text-white border-t border-l border-r border-zinc-700">
              剧本编辑 - 新项目
            </div>
            <div className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer">
              + 新建标签
            </div>
          </div>
        </div>

        {/* 工作区内容 */}
        <div className="flex-1 p-6">
          <div className="h-full bg-zinc-900 rounded-lg border border-zinc-800 p-4">
            <h2 className="text-sm font-medium text-zinc-300 mb-4">
              欢迎使用 AI导演制作中台 (DaoYanOS)
            </h2>
            <p className="text-xs text-zinc-500 mb-2">作者：QiYing</p>
            <p className="text-xs text-zinc-500">
              本地存储路径：~/Documents/DaoYanOSProjects/
            </p>
            <div className="mt-8 p-4 bg-zinc-800/50 rounded border border-zinc-700">
              <p className="text-xs text-zinc-400">
                当前功能：待开发...
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 右侧面板 */}
      <aside className="w-72 border-l border-zinc-800 bg-zinc-950 p-4">
        <h3 className="text-xs font-medium text-zinc-400 mb-4 uppercase tracking-wider">
          配置面板
        </h3>
        <div className="space-y-3">
          <div className="p-3 bg-zinc-900 rounded border border-zinc-800">
            <h4 className="text-xs text-zinc-300 mb-2">项目设置</h4>
            <p className="text-[10px] text-zinc-500">待配置...</p>
          </div>
          <div className="p-3 bg-zinc-900 rounded border border-zinc-800">
            <h4 className="text-xs text-zinc-300 mb-2">导演风格</h4>
            <p className="text-[10px] text-zinc-500">待配置...</p>
          </div>
          <div className="p-3 bg-zinc-900 rounded border border-zinc-800">
            <h4 className="text-xs text-zinc-300 mb-2">生成参数</h4>
            <p className="text-[10px] text-zinc-500">待配置...</p>
          </div>
        </div>
      </aside>
    </div>
  )
}
