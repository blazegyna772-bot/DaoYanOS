import Link from "next/link"

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
      <h2 className="text-2xl font-bold">404</h2>
      <p className="text-muted-foreground">页面未找到</p>
      <Link href="/" className="text-sm text-amber-600 hover:underline">
        返回首页
      </Link>
    </div>
  )
}
