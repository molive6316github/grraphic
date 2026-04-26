import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Link2, Quote, Lightbulb, FolderKanban, Tv, Settings } from 'lucide-react'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { count: linksCount },
    { count: quotesCount },
    { count: conceptsCount },
    { count: projectsCount },
    { count: mediaCount },
    { data: profile },
  ] = await Promise.all([
    supabase.from('links').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('concepts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('media').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('profiles').select('username, avatar_url, bio').eq('id', user.id).single(),
  ])

  const stats = [
    { label: 'Links', count: linksCount ?? 0, href: '/dashboard/links', icon: Link2 },
    { label: 'Quotes', count: quotesCount ?? 0, href: '/dashboard/quotes', icon: Quote },
    { label: 'Concepts', count: conceptsCount ?? 0, href: '/dashboard/concepts', icon: Lightbulb },
    { label: 'Projects', count: projectsCount ?? 0, href: '/dashboard/projects', icon: FolderKanban },
    { label: 'Media', count: mediaCount ?? 0, href: '/dashboard/media', icon: Tv },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            Hey, {profile?.username ?? 'there'} 👋
          </h1>
          <p className="text-white/40 text-sm">
            {profile?.bio ?? 'Your private brain. Manage everything below.'}
          </p>
        </div>
        <div className="flex gap-2">
          {profile?.username && (
            <Link
              href={`/${profile.username}`}
              target="_blank"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-colors"
            >
              <ExternalLink size={12} />
              View profile
            </Link>
          )}
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-colors"
          >
            <Settings size={12} />
            Settings
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map(({ label, count, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="p-4 rounded-xl bg-white/[0.03] border border-white/8 hover:border-white/15 hover:bg-white/[0.05] transition-all group"
          >
            <Icon size={16} className="text-white/30 group-hover:text-[#7c6aff] mb-2 transition-colors" />
            <div className="text-2xl font-bold text-white">{count}</div>
            <div className="text-xs text-white/40 mt-0.5">{label}</div>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-medium text-white/50 mb-3">Quick access</h2>
        <div className="grid grid-cols-2 gap-2">
          {stats.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/6 hover:border-white/12 hover:bg-white/[0.04] transition-all text-sm text-white/60 hover:text-white/90"
            >
              <Icon size={14} />
              Manage {label}
            </Link>
          ))}
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/6 hover:border-white/12 hover:bg-white/[0.04] transition-all text-sm text-white/60 hover:text-white/90"
          >
            <Settings size={14} />
            Customize profile
          </Link>
        </div>
      </div>
    </div>
  )
}
