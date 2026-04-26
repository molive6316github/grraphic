'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, BookOpen, Bookmark } from 'lucide-react'
import { saveQuoteFromLibrary } from '@/lib/actions/quotes'
import type { Book, QuoteSearchResult } from '@/lib/types'

interface LibraryClientProps {
  books: Pick<Book, 'id' | 'title' | 'author' | 'release_date' | 'cover_url' | 'tags'>[]
  initialQuery: string
  initialResults: QuoteSearchResult[] | null
  isLoggedIn: boolean
}

export default function LibraryClient({ books, initialQuery, initialResults, isLoggedIn }: LibraryClientProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [pending, startTransition] = useTransition()
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<'books' | 'search'>(initialQuery ? 'search' : 'books')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setTab('search')
    router.push(`/library?q=${encodeURIComponent(query.trim())}`)
  }

  function handleSaveQuote(result: QuoteSearchResult) {
    const key = `${result.book_id}:${result.snippet}`
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    setSavedIds(prev => { const s = new Set(prev); s.add(key); return s })
    startTransition(async () => {
      await saveQuoteFromLibrary({
        text: result.snippet.replace(/<\/?mark>/g, ''),
        author: result.book_author,
        book_id: result.book_id,
      })
    })
  }

  return (
    <div className="space-y-8">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search quotes across all books…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#7c6aff]/60 transition-colors"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-3 bg-[#7c6aff] hover:bg-[#6a5ae0] text-white text-sm font-medium rounded-xl transition-colors"
        >
          Search
        </button>
      </form>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/8">
        {[{ key: 'books', label: 'All books' }, { key: 'search', label: 'Search results' }].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'books' | 'search')}
            className={`px-4 py-2 text-sm transition-colors border-b-2 ${tab === t.key ? 'border-[#7c6aff] text-[#7c6aff]' : 'border-transparent text-white/40 hover:text-white/70'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Books grid */}
      {tab === 'books' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {books.map(book => (
            <div key={book.id} className="group">
              <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/5 border border-white/8 mb-2">
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen size={24} className="text-white/15" />
                  </div>
                )}
              </div>
              <p className="text-xs font-medium text-white/80 line-clamp-2 mb-0.5">{book.title}</p>
              <p className="text-xs text-white/35">{book.author}</p>
              {book.release_date && (
                <p className="text-xs text-white/25">{new Date(book.release_date).getFullYear()}</p>
              )}
              {book.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {book.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-[#7c6aff]/10 text-[#7c6aff]/70">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {books.length === 0 && (
            <div className="col-span-full text-center py-16 text-white/30 text-sm">
              No books in the library yet.
            </div>
          )}
        </div>
      )}

      {/* Search results */}
      {tab === 'search' && (
        <div className="space-y-3">
          {initialResults === null ? (
            <div className="text-center py-16 text-white/30 text-sm">
              Enter a search term to find quotes.
            </div>
          ) : initialResults.length === 0 ? (
            <div className="text-center py-16 text-white/30 text-sm">
              No quotes found for &ldquo;{initialQuery}&rdquo;.
            </div>
          ) : (
            <>
              <p className="text-xs text-white/40">{initialResults.length} result{initialResults.length !== 1 ? 's' : ''} for &ldquo;{initialQuery}&rdquo;</p>
              {initialResults.map((result, i) => {
                const key = `${result.book_id}:${result.snippet}`
                const isSaved = savedIds.has(key)
                return (
                  <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/8">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm leading-relaxed text-white/80 mb-2"
                          dangerouslySetInnerHTML={{ __html: result.snippet }}
                        />
                        <div className="flex items-center gap-1.5 text-xs text-white/35">
                          <BookOpen size={11} />
                          <span>{result.book_title}</span>
                          <span>·</span>
                          <span>{result.book_author}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSaveQuote(result)}
                        disabled={isSaved || pending}
                        className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                          isSaved
                            ? 'bg-emerald-500/15 text-emerald-400 cursor-default'
                            : 'bg-[#7c6aff]/10 hover:bg-[#7c6aff]/20 text-[#7c6aff]'
                        }`}
                      >
                        <Bookmark size={11} fill={isSaved ? 'currentColor' : 'none'} />
                        {isSaved ? 'Saved' : 'Save quote'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
