"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>出错了</h2>
          <p style={{ color: "#888" }}>{error.message}</p>
          <button onClick={reset} style={{ color: "#d97706", cursor: "pointer" }}>
            重试
          </button>
        </div>
      </body>
    </html>
  )
}
