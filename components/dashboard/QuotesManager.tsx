'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Globe, Lock, BookOpen } from 'lucide-react'
import { createQuote, updateQuote, deleteQuote, toggleQuotePublic } from '@/lib/actions/quotes'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Toggle from '@/components/ui/Toggle'
import Badge from '@/components/ui/Badge'
import type { Quote } from '@/lib/types'

interface QuotesManagerProps {
  quotes: Quote[]
  books: { id: string; title: string; author: string }[]
}

export default function QuotesManager({ quotes: initial, books }: QuotesManagerProps) {
  const [quotes, setQuotes] = useState(initial)
  const [editing, setEditing] = useState<Quote | null>(null)
  const [creating, setCreating] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleToggle(id: string, is_public: boolean) {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, is_public } : q))
    startTransition(async () => { await toggleQuotePublic(id, is_public) })
  }

  function handleDelete(id: string) {
    setQuotes(prev => prev.filter(q => q.id !== id))
    startTransition(async () => { await deleteQuote(id) })
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await createQuote(fd)
      setCreating(false)
    })
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing) return
    const fd = new FormData(e.currentTarget)
    fd.set('is_public', String(editing.is_public))
    startTransition(async () => {
      await updateQuote(editing.id, fd)
      setEditing(null)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)} size="sm">
          <Plus size={13} /> Add quote
        </Button>
      </div>

      <div className="space-y-2">
        {quotes.map(q => (
          <div key={q.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/8 group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 leading-relaxed mb-2 line-clamp-3">"{q.text}"</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {q.author && <span className="text-xs text-white/45">— {q.author}</span>}
                  {q.book && (
                    <span className="flex items-center gap-1 text-xs text-[#7c6aff]/70">
                      <BookOpen size={10} />
                      {q.book.title}
                    </span>
                  )}
                  {q.tags.map(tag => (
                    <Badge key={tag} variant="default">{tag}</Badge>
                  ))}
                  {q.is_public
                    ? <Globe size={11} className="text-emerald-400" />
                    : <Lock size={11} className="text-white/25" />}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <Toggle checked={q.is_public} onChange={(v) => handleToggle(q.id, v)} />
                <button onClick={() => setEditing(q)} className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDelete(q.id)} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {quotes.length === 0 && (
        <div className="text-center py-12 text-white/30 text-sm">No quotes yet. Save one from the library or add your own.</div>
      )}

      <QuoteFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={handleCreate}
        books={books}
        pending={pending}
        title="Add quote"
      />

      <QuoteFormModal
        open={!!editing}
        onClose={() => setEditing(null)}
        onSubmit={handleUpdate}
        books={books}
        pending={pending}
        title="Edit quote"
        defaultValues={editing}
        isPublic={editing?.is_public}
        onPublicChange={(v) => editing && setEditing({ ...editing, is_public: v })}
      />
    </div>
  )
}

function QuoteFormModal({
  open, onClose, onSubmit, books, pending, title, defaultValues, isPublic, onPublicChange,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  books: { id: string; title: string; author: string }[]
  pending: boolean
  title: string
  defaultValues?: Quote | null
  isPublic?: boolean
  onPublicChange?: (v: boolean) => void
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Textarea name="text" label="Quote text" placeholder="Enter the quote…" required defaultValue={defaultValues?.text} rows={4} />
        <Input name="author" label="Author" placeholder="Author name" defaultValue={defaultValues?.author ?? ''} />
        <div>
          <label className="text-xs text-white/50 mb-1.5 block">Book (optional)</label>
          <select
            name="book_id"
            defaultValue={defaultValues?.book_id ?? ''}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#7c6aff]/60 transition-colors"
          >
            <option value="" className="bg-[#18181f]">None</option>
            {books.map(b => (
              <option key={b.id} value={b.id} className="bg-[#18181f]">
                {b.title} — {b.author}
              </option>
            ))}
          </select>
        </div>
        <Input name="tags" label="Tags (comma-separated)" placeholder="philosophy, life, etc." defaultValue={defaultValues?.tags.join(', ') ?? ''} />
        <div className="flex items-center justify-between pt-1">
          {onPublicChange ? (
            <Toggle checked={isPublic ?? false} onChange={onPublicChange} label="Public" />
          ) : <div />}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={pending}>Save</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
