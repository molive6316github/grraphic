import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Brain } from 'lucide-react'
import Link from 'next/link'
import LibraryClient from '@/components/library/LibraryClient'

export const metadata: Metadata = { title: 'Library' }

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: books } = await supabase
    .from('books')
    .select('id, title, author, release_date, cover_url, tags')
    .order('created_at', { ascending: false })

  let searchResults = null
  if (searchParams.q && searchParams.q.trim().length >= 2) {
    const { data } = await supabase.rpc('search_book_quotes', {
      search_term: searchParams.q.trim(),
    })
    searchResults = data ?? []
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] text-[#e8e8f0]">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
          <Brain size={18} className="text-[#7c6aff]" />
          <span className="font-semibold text-sm tracking-tight">MyBrain</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard" className="text-sm px-4 py-1.5 rounded-lg border border-white/10 hover:border-white/25 transition-colors">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-white/50 hover:text-white/80 transition-colors">Sign in</Link>
              <Link href="/signup" className="text-sm px-4 py-1.5 rounded-lg bg-[#7c6aff] hover:bg-[#6a5ae0] text-white font-medium transition-colors">
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Library</h1>
          <p className="text-white/40 text-sm">
            Browse books and search for quotes. Full text search across all content.
            {!user && ' Sign in to save quotes to your collection.'}
          </p>
        </div>

        <LibraryClient
          books={books ?? []}
          initialQuery={searchParams.q ?? ''}
          initialResults={searchResults}
          isLoggedIn={!!user}
        />
      </main>
    </div>
  )
}
