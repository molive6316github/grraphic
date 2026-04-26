'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Pencil, BookOpen } from 'lucide-react'
import { createBook, deleteBook, updateBook } from '@/lib/actions/books'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import type { Book } from '@/lib/types'

type BookMeta = Omit<Book, 'created_by'>

export default function AdminBooksClient({ books: initial }: { books: BookMeta[] }) {
  const [books, setBooks] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<BookMeta | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleDelete(id: string) {
    if (!confirm('Delete this book and all its content? This cannot be undone.')) return
    setBooks(prev => prev.filter(b => b.id !== id))
    startTransition(async () => { await deleteBook(id) })
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createBook(fd)
      if (res?.error) {
        setError(res.error)
      } else {
        setCreating(false)
      }
    })
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing) return
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateBook(editing.id, fd)
      if (res?.error) {
        setError(res.error)
      } else {
        setEditing(null)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)} size="sm">
          <Plus size={13} /> Upload book
        </Button>
      </div>

      <div className="space-y-2">
        {books.map(book => (
          <div key={book.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/8 group">
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="w-10 h-14 rounded object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-14 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
                <BookOpen size={14} className="text-white/20" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90 truncate">{book.title}</p>
              <p className="text-xs text-white/40">{book.author}</p>
              <p className="text-xs text-white/25">{book.release_date ? new Date(book.release_date).getFullYear() : ''}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {book.tags.map(tag => (
                  <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-[#7c6aff]/10 text-[#7c6aff]/60">{tag}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setEditing(book)} className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors">
                <Pencil size={13} />
              </button>
              <button onClick={() => handleDelete(book.id)} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {books.length === 0 && (
        <div className="text-center py-16 text-white/30 text-sm">No books yet. Upload the first one.</div>
      )}

      {/* Create modal */}
      <Modal open={creating} onClose={() => { setCreating(false); setError('') }} title="Upload book" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input name="title" label="Title" placeholder="Book title" required />
            <Input name="author" label="Author" placeholder="Author name" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input name="release_date" label="Release date" type="date" />
            <Input name="cover_url" label="Cover image URL" placeholder="https://…" />
          </div>
          <Input name="tags" label="Tags (comma-separated)" placeholder="fiction, philosophy, etc." />
          <Textarea
            name="content"
            label="Full text content"
            placeholder="Paste the full text here…"
            rows={10}
            required
            className="font-mono text-xs"
          />
          {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => { setCreating(false); setError('') }}>Cancel</Button>
            <Button type="submit" loading={pending}>Upload book</Button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => { setEditing(null); setError('') }} title="Edit book" size="lg">
        {editing && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input name="title" label="Title" defaultValue={editing.title} required />
              <Input name="author" label="Author" defaultValue={editing.author} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input name="release_date" label="Release date" type="date" defaultValue={editing.release_date ?? ''} />
              <Input name="cover_url" label="Cover image URL" defaultValue={editing.cover_url ?? ''} />
            </div>
            <Input name="tags" label="Tags (comma-separated)" defaultValue={editing.tags.join(', ')} />
            <Textarea
              name="content"
              label="Update full text (leave blank to keep existing)"
              placeholder="Paste updated text to replace…"
              rows={6}
              className="font-mono text-xs"
            />
            {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="secondary" onClick={() => { setEditing(null); setError('') }}>Cancel</Button>
              <Button type="submit" loading={pending}>Save changes</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
