/**
 * 开发模式日志管理器
 * 用于实时显示 API 调用和数据流
 */

export interface LogEntry {
  id: string
  timestamp: string
  type: 'api' | 'sse' | 'parse' | 'error' | 'info' | 'success'
  label: string
  data: unknown
  duration?: number
}

type LogListener = (logs: LogEntry[]) => void

class DevLogger {
  private logs: LogEntry[] = []
  private listeners: Set<LogListener> = new Set()
  private maxLogs = 100
  private enabled = true

  enable() {
    this.enabled = true
  }

  disable() {
    this.enabled = false
  }

  isEnabled() {
    return this.enabled
  }

  clear() {
    this.logs = []
    this.notifyListeners()
  }

  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.logs))
  }

  private addLog(type: LogEntry['type'], label: string, data: unknown, duration?: number) {
    if (!this.enabled) return

    const entry: LogEntry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }) + '.' + String(Date.now()).slice(-3),
      type,
      label,
      data,
      duration,
    }

    this.logs.unshift(entry)

    // 保持最大日志数
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    this.notifyListeners()
  }

  // API 调用日志
  api(label: string, data: unknown, duration?: number) {
    this.addLog('api', label, data, duration)
  }

  // SSE 事件日志
  sse(label: string, data: unknown) {
    this.addLog('sse', label, data)
  }

  // 解析日志
  parse(label: string, data: unknown) {
    this.addLog('parse', label, data)
  }

  // 错误日志
  error(label: string, data: unknown) {
    this.addLog('error', label, data)
  }

  // 信息日志
  info(label: string, data: unknown) {
    this.addLog('info', label, data)
  }

  // 成功日志
  success(label: string, data: unknown) {
    this.addLog('success', label, data)
  }

  // 记录 API 请求
  logApiRequest(endpoint: string, body: unknown) {
    this.api(`→ 请求: ${endpoint.split('/').slice(-2).join('/')}`, {
      endpoint,
      body: this.truncate(body),
    })
  }

  // 记录 API 响应
  logApiResponse(endpoint: string, response: unknown, duration: number) {
    this.api(`← 响应: ${endpoint.split('/').slice(-2).join('/')} (${duration}ms)`, {
      response: this.truncate(response),
    }, duration)
  }

  // 记录 SSE 事件
  logSseEvent(eventType: string, data: unknown) {
    this.sse(`📨 ${eventType}`, data)
  }

  // 记录解析结果
  logParse(label: string, input: unknown, output: unknown) {
    this.parse(label, { input: this.truncate(input), output: this.truncate(output) })
  }

  // 截断过长的数据
  private truncate(data: unknown, maxLength = 1000): unknown {
    if (typeof data === 'string') {
      return data.length > maxLength ? data.slice(0, maxLength) + '...' : data
    }
    if (typeof data === 'object' && data !== null) {
      const str = JSON.stringify(data, null, 2)
      if (str.length > maxLength) {
        return { _truncated: str.slice(0, maxLength) + '...', _originalLength: str.length }
      }
    }
    return data
  }
}

// 全局单例
export const devLogger = new DevLogger()

// 在开发环境自动启用
if (process.env.NODE_ENV === 'development') {
  devLogger.enable()
}
