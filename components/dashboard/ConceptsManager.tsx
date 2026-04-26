'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Globe, Lock } from 'lucide-react'
import { createConcept, updateConcept, deleteConcept, toggleConceptPublic } from '@/lib/actions/concepts'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Toggle from '@/components/ui/Toggle'
import Badge from '@/components/ui/Badge'
import type { Concept } from '@/lib/types'

export default function ConceptsManager({ concepts: initial }: { concepts: Concept[] }) {
  const [concepts, setConcepts] = useState(initial)
  const [editing, setEditing] = useState<Concept | null>(null)
  const [creating, setCreating] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleToggle(id: string, is_public: boolean) {
    setConcepts(prev => prev.map(c => c.id === id ? { ...c, is_public } : c))
    startTransition(async () => { await toggleConceptPublic(id, is_public) })
  }

  function handleDelete(id: string) {
    setConcepts(prev => prev.filter(c => c.id !== id))
    startTransition(async () => { await deleteConcept(id) })
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await createConcept(fd)
      setCreating(false)
    })
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing) return
    const fd = new FormData(e.currentTarget)
    fd.set('is_public', String(editing.is_public))
    startTransition(async () => {
      await updateConcept(editing.id, fd)
      setEditing(null)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)} size="sm">
          <Plus size={13} /> Add concept
        </Button>
      </div>

      <div className="space-y-2">
        {concepts.map(c => (
          <div key={c.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/8 group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium text-white/90">{c.title}</h3>
                  {c.is_public ? <Globe size={11} className="text-emerald-400" /> : <Lock size={11} className="text-white/25" />}
                </div>
                {c.body && <p className="text-xs text-white/50 line-clamp-2 mb-2">{c.body}</p>}
                <div className="flex flex-wrap gap-1">
                  {c.tags.map(tag => <Badge key={tag} variant="default">{tag}</Badge>)}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <Toggle checked={c.is_public} onChange={(v) => handleToggle(c.id, v)} />
                <button onClick={() => setEditing(c)} className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {concepts.length === 0 && (
        <div className="text-center py-12 text-white/30 text-sm">No concepts yet. Capture an idea.</div>
      )}

      {[{ open: creating, onClose: () => setCreating(false), onSubmit: handleCreate, title: 'Add concept', def: null as Concept | null },
        { open: !!editing, onClose: () => setEditing(null), onSubmit: handleUpdate, title: 'Edit concept', def: editing }
      ].map(({ open, onClose, onSubmit, title, def }, i) => (
        <Modal key={i} open={open} onClose={onClose} title={title}>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input name="title" label="Title" placeholder="Concept title" required defaultValue={def?.title} />
            <Textarea name="body" label="Body" placeholder="Elaborate on the idea…" defaultValue={def?.body ?? ''} rows={5} />
            <Input name="tags" label="Tags (comma-separated)" placeholder="philosophy, tech, etc." defaultValue={def?.tags.join(', ') ?? ''} />
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
