"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
      <h2 className="text-2xl font-bold">出错了</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <button
        onClick={reset}
        className="text-sm text-amber-600 hover:underline"
      >
        重试
      </button>
    </div>
  )
}
