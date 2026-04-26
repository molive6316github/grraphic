import { Brain } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f0f13] flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white mb-10 transition-colors">
        <Brain size={20} className="text-[#7c6aff]" />
        <span className="font-semibold tracking-tight">MyBrain</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
