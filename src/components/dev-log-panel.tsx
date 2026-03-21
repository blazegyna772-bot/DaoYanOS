"use client"

import { useState, useEffect, useRef } from "react"
import { Terminal, X, Trash2, ChevronDown, ChevronUp, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { devLogger, type LogEntry } from "@/lib/devLogger"
import { cn } from "@/lib/utils"

interface DevLogPanelProps {
  isOpen: boolean
  onClose: () => void
}

const typeColors: Record<LogEntry['type'], string> = {
  api: 'text-blue-400',
  sse: 'text-green-400',
  parse: 'text-yellow-400',
  error: 'text-red-400',
  info: 'text-gray-400',
  success: 'text-emerald-400',
}

const typeLabels: Record<LogEntry['type'], string> = {
  api: 'API',
  sse: 'SSE',
  parse: '解析',
  error: '错误',
  info: '信息',
  success: '成功',
}

const typeBgColors: Record<LogEntry['type'], string> = {
  api: 'bg-blue-500/20',
  sse: 'bg-green-500/20',
  parse: 'bg-yellow-500/20',
  error: 'bg-red-500/20',
  info: 'bg-gray-500/20',
  success: 'bg-emerald-500/20',
}

export function DevLogPanel({ isOpen, onClose }: DevLogPanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [filter, setFilter] = useState<LogEntry['type'] | 'all'>('all')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = devLogger.subscribe((newLogs) => {
      if (!isPaused) {
        setLogs(newLogs)
      }
    })
    return unsubscribe
  }, [isPaused])

  const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.type === filter)

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleClear = () => {
    devLogger.clear()
    setLogs([])
  }

  const renderData = (data: unknown, isExpanded: boolean) => {
    if (typeof data === 'string') {
      return (
        <pre className="text-xs whitespace-pre-wrap break-all">
          {isExpanded ? data : data.slice(0, 200) + (data.length > 200 ? '...' : '')}
        </pre>
      )
    }
    try {
      const str = JSON.stringify(data, null, 2)
      return (
        <pre className="text-xs whitespace-pre-wrap break-all">
          {isExpanded ? str : str.slice(0, 200) + (str.length > 200 ? '...' : '')}
        </pre>
      )
    } catch {
      return <span className="text-xs text-muted-foreground">[无法序列化]</span>
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-0 right-0 w-[600px] h-[400px] bg-gray-900 border border-gray-700 rounded-tl-lg shadow-2xl z-[9999] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-white">开发日志</span>
          <span className="text-xs text-gray-500">({logs.length})</span>
        </div>
        <div className="flex items-center gap-1">
          {/* 过滤器 */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as LogEntry['type'] | 'all')}
            className="text-xs bg-gray-700 text-white border border-gray-600 rounded px-2 py-1"
          >
            <option value="all">全部</option>
            <option value="api">API</option>
            <option value="sse">SSE</option>
            <option value="parse">解析</option>
            <option value="error">错误</option>
            <option value="success">成功</option>
          </select>
          {/* 暂停 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-white"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </Button>
          {/* 清空 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-white"
            onClick={handleClear}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          {/* 关闭 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Logs */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-2 space-y-1">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-500 text-xs py-8">
              暂无日志，点击按钮开始操作
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedIds.has(log.id)
              return (
                <div
                  key={log.id}
                  className={cn(
                    "rounded border border-gray-700 overflow-hidden",
                    typeBgColors[log.type]
                  )}
                >
                  {/* Header */}
                  <div
                    className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-white/5"
                    onClick={() => toggleExpand(log.id)}
                  >
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", typeColors[log.type], "bg-gray-800")}>
                      {typeLabels[log.type]}
                    </span>
                    <span className="text-[10px] text-gray-500">{log.timestamp}</span>
                    <span className="text-xs text-white flex-1 truncate">{log.label}</span>
                    {log.duration && (
                      <span className="text-[10px] text-gray-400">{log.duration}ms</span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    )}
                  </div>
                  {/* Content */}
                  {isExpanded && (
                    <div className="px-2 py-2 border-t border-gray-700 bg-black/30">
                      {renderData(log.data, isExpanded)}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {isPaused && (
        <div className="px-3 py-1.5 border-t border-gray-700 bg-amber-500/20">
          <span className="text-xs text-amber-400">⏸ 已暂停 - 点击播放按钮继续</span>
        </div>
      )}
    </div>
  )
}

// 浮动按钮组件
export function DevLogToggle({ onClick }: { onClick: () => void }) {
  if (process.env.NODE_ENV !== 'development') return null

  return (
    <Button
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 z-[9998] h-8 gap-1.5 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
      onClick={onClick}
    >
      <Terminal className="w-3.5 h-3.5 text-amber-500" />
      日志
    </Button>
  )
}
