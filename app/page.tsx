import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Brain, BookOpen, Users, Sparkles } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#0f0f13] text-[#e8e8f0] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <span className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <Brain size={22} className="text-[#7c6aff]" />
          MyBrain
        </span>
        <div className="flex items-center gap-3">
          <Link href="/library" className="text-sm text-white/50 hover:text-white/80 transition-colors">
            Library
          </Link>
          <Link
            href="/login"
            className="text-sm px-4 py-1.5 rounded-lg border border-white/10 hover:border-white/25 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm px-4 py-1.5 rounded-lg bg-[#7c6aff] hover:bg-[#6a5ae0] text-white font-medium transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border border-[#7c6aff]/30 bg-[#7c6aff]/10 text-[#7c6aff] mb-8">
          <Sparkles size={12} />
          Your personal hub, your rules
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight max-w-3xl mb-6 leading-tight">
          Everything that makes you{' '}
          <span className="text-[#7c6aff]">you</span>, in one place.
        </h1>
        <p className="text-white/50 text-lg max-w-xl mb-10 leading-relaxed">
          Links, projects, quotes, ideas — privately managed, beautifully shared.
          Fully themeable. Yours.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/signup"
            className="px-6 py-3 rounded-xl bg-[#7c6aff] hover:bg-[#6a5ae0] text-white font-semibold text-sm transition-colors"
          >
            Create your brain
          </Link>
          <Link
            href="/library"
            className="px-6 py-3 rounded-xl border border-white/10 hover:border-white/25 text-sm transition-colors"
          >
            Browse the library
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-24 max-w-3xl w-full text-left">
          {[
            {
              icon: Users,
              title: 'Public profile',
              body: 'A page at /username — you control exactly what the world sees.',
            },
            {
              icon: Brain,
              title: 'Private dashboard',
              body: 'Manage links, quotes, projects, concepts, and media — all private by default.',
            },
            {
              icon: BookOpen,
              title: 'Quote library',
              body: 'Full-text search across a curated book library. Save any quote directly to your collection.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="p-5 rounded-xl border border-white/8 bg-white/[0.03] hover:border-white/15 transition-colors"
            >
              <Icon size={18} className="text-[#7c6aff] mb-3" />
              <h3 className="font-semibold text-sm mb-1.5">{title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-white/25 text-xs border-t border-white/5">
        MyBrain — your personal hub
      </footer>
    </div>
  )
}
