'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, BookOpen, Users, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/admin', label: 'Overview', icon: Shield, exact: true },
  { href: '/admin/books', label: 'Books', icon: BookOpen },
  { href: '/admin/users', label: 'Users', icon: Users },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 w-56 bg-[#0d0d12] border-r border-white/6 flex flex-col z-20">
      <div className="px-5 py-5 border-b border-white/6">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-amber-400" />
          <span className="font-semibold text-sm tracking-tight text-amber-400">Admin Panel</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                active ? 'bg-amber-500/15 text-amber-400' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
        >
          <LayoutDashboard size={14} />
          Back to dashboard
        </Link>
      </div>
    </aside>
  )
}
