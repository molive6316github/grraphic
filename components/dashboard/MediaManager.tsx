'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Globe, Lock, Gamepad2, BookOpen, Tv, Music } from 'lucide-react'
import { createMedia, updateMedia, deleteMedia, toggleMediaPublic } from '@/lib/actions/media'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Toggle from '@/components/ui/Toggle'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import type { MediaItem } from '@/lib/types'

const TYPE_OPTIONS = [
  { value: 'game', label: 'Game' },
  { value: 'book', label: 'Book' },
  { value: 'show', label: 'Show / Film' },
  { value: 'music', label: 'Music' },
]

const TypeIcon = ({ type }: { type: string }) => {
  const icons = { game: Gamepad2, book: BookOpen, show: Tv, music: Music }
  const Icon = icons[type as keyof typeof icons] ?? Tv
  return <Icon size={13} className="text-white/40" />
}

export default function MediaManager({ media: initial }: { media: MediaItem[] }) {
  const [media, setMedia] = useState(initial)
  const [editing, setEditing] = useState<MediaItem | null>(null)
  const [creating, setCreating] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [pending, startTransition] = useTransition()

  const filtered = filterType === 'all' ? media : media.filter(m => m.type === filterType)

  function handleToggle(id: string, is_public: boolean) {
    setMedia(prev => prev.map(m => m.id === id ? { ...m, is_public } : m))
    startTransition(async () => { await toggleMediaPublic(id, is_public) })
  }

  function handleDelete(id: string) {
    setMedia(prev => prev.filter(m => m.id !== id))
    startTransition(async () => { await deleteMedia(id) })
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await createMedia(fd)
      setCreating(false)
    })
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing) return
    const fd = new FormData(e.currentTarget)
    fd.set('is_public', String(editing.is_public))
    startTransition(async () => {
      await updateMedia(editing.id, fd)
      setEditing(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {['all', 'game', 'book', 'show', 'music'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-lg text-xs transition-colors ${filterType === t ? 'bg-[#7c6aff]/20 text-[#7c6aff]' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <Button onClick={() => setCreating(true)} size="sm">
          <Plus size={13} /> Add
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {filtered.map(m => (
          <div key={m.id} className="rounded-xl overflow-hidden bg-white/[0.03] border border-white/8 group relative">
            {m.cover_url ? (
              <div className="aspect-[3/4] relative overflow-hidden">
                <img src={m.cover_url} alt={m.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              </div>
            ) : (
              <div className="aspect-[3/4] bg-white/5 flex items-center justify-center">
                <TypeIcon type={m.type} />
              </div>
            )}
            <div className="p-3">
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/90 truncate">{m.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <TypeIcon type={m.type} />
                    {m.status && <Badge variant="default">{m.status}</Badge>}
                    {m.is_public ? <Globe size={10} className="text-emerald-400" /> : <Lock size={10} className="text-white/25" />}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Toggle checked={m.is_public} onChange={(v) => handleToggle(m.id, v)} />
              <button onClick={() => setEditing(m)} className="p-1 rounded bg-black/60 text-white/60 hover:text-white transition-colors">
                <Pencil size={11} />
              </button>
              <button onClick={() => handleDelete(m.id)} className="p-1 rounded bg-black/60 text-white/60 hover:text-red-400 transition-colors">
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-white/30 text-sm">Nothing here yet.</div>
      )}

      {[{ open: creating, onClose: () => setCreating(false), onSubmit: handleCreate, title: 'Add media', def: null as MediaItem | null },
        { open: !!editing, onClose: () => setEditing(null), onSubmit: handleUpdate, title: 'Edit media', def: editing }
      ].map(({ open, onClose, onSubmit, title, def }, i) => (
        <Modal key={i} open={open} onClose={onClose} title={title}>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input name="name" label="Name" placeholder="Title" required defaultValue={def?.name} />
            <Select name="type" label="Type" options={TYPE_OPTIONS} defaultValue={def?.type ?? 'game'} />
            <Input name="status" label="Status" placeholder="Playing, Finished, Dropped…" defaultValue={def?.status ?? ''} />
            <Input name="cover_url" label="Cover image URL" placeholder="https://…" defaultValue={def?.cover_url ?? ''} />
            <div className="flex items-center justify-between pt-1">
              {def ? (
                <Toggle
                  checked={editing?.is_public ?? false}
                  onChange={(v) => editing && setEditing({ ...editing, is_public: v })}
                  label="Public"
                />
              ) : <div />}
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit" loading={pending}>Save</Button>
              </div>
            </div>
          </form>
        </Modal>
      ))}
    </div>
  )
}
