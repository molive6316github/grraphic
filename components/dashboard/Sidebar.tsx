'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/actions/auth'
import {
  Brain, LayoutDashboard, Link2, Quote, Lightbulb,
  FolderKanban, Tv, Settings, BookOpen, LogOut, Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  profile: {
    username: string
    avatar_url: string | null
    role: string
  } | null
}

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/links', label: 'Links', icon: Link2 },
  { href: '/dashboard/quotes', label: 'Quotes', icon: Quote },
  { href: '/dashboard/concepts', label: 'Concepts', icon: Lightbulb },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
  { href: '/dashboard/media', label: 'Media', icon: Tv },
]

export default function DashboardSidebar({ profile }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-[#0d0d12] border-r border-white/6 flex flex-col z-20">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/6">
        <Link href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
          <Brain size={18} className="text-[#7c6aff]" />
          <span className="font-semibold text-sm tracking-tight">MyBrain</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive(href, exact)
                ? 'bg-[#7c6aff]/15 text-[#7c6aff]'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            )}
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}

        <div className="pt-4 mt-4 border-t border-white/6 space-y-0.5">
          <Link
            href="/library"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
          >
            <BookOpen size={15} />
            Library
          </Link>
          {profile?.role === 'admin' && (
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                pathname.startsWith('/admin')
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              )}
            >
              <Shield size={15} />
              Admin
            </Link>
          )}
          <Link
            href="/dashboard/settings"
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname.startsWith('/dashboard/settings')
                ? 'bg-[#7c6aff]/15 text-[#7c6aff]'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            )}
          >
            <Settings size={15} />
            Settings
          </Link>
        </div>
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-white/6">
        {profile && (
          <Link
            href={`/${profile.username}`}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors mb-1"
            target="_blank"
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#7c6aff]/30 flex items-center justify-center text-[10px] text-[#7c6aff] font-bold">
                {profile.username[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-sm text-white/70 truncate">@{profile.username}</span>
          </Link>
        )}
        <form action={signOut}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
