'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Globe, Lock, ExternalLink } from 'lucide-react'
import { createProject, updateProject, deleteProject, toggleProjectPublic } from '@/lib/actions/projects'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Toggle from '@/components/ui/Toggle'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import type { Project } from '@/lib/types'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'complete', label: 'Complete' },
  { value: 'paused', label: 'Paused' },
]

function statusVariant(status: string): 'success' | 'default' | 'warning' {
  return status === 'active' ? 'success' : status === 'paused' ? 'warning' : 'default'
}

export default function ProjectsManager({ projects: initial }: { projects: Project[] }) {
  const [projects, setProjects] = useState(initial)
  const [editing, setEditing] = useState<Project | null>(null)
  const [creating, setCreating] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleToggle(id: string, is_public: boolean) {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, is_public } : p))
    startTransition(async () => { await toggleProjectPublic(id, is_public) })
  }

  function handleDelete(id: string) {
    setProjects(prev => prev.filter(p => p.id !== id))
    startTransition(async () => { await deleteProject(id) })
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await createProject(fd)
      setCreating(false)
    })
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing) return
    const fd = new FormData(e.currentTarget)
    fd.set('is_public', String(editing.is_public))
    startTransition(async () => {
      await updateProject(editing.id, fd)
      setEditing(null)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)} size="sm">
          <Plus size={13} /> Add project
        </Button>
      </div>

      <div className="space-y-2">
        {projects.map(p => (
          <div key={p.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/8 group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-sm font-medium text-white/90">{p.title}</h3>
                  <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                  {p.is_public ? <Globe size={11} className="text-emerald-400" /> : <Lock size={11} className="text-white/25" />}
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/60 transition-colors">
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
                {p.description && <p className="text-xs text-white/50 line-clamp-2">{p.description}</p>}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <Toggle checked={p.is_public} onChange={(v) => handleToggle(p.id, v)} />
                <button onClick={() => setEditing(p)} className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12 text-white/30 text-sm">No projects yet.</div>
      )}

      {[{ open: creating, onClose: () => setCreating(false), onSubmit: handleCreate, title: 'Add project', def: null as Project | null },
        { open: !!editing, onClose: () => setEditing(null), onSubmit: handleUpdate, title: 'Edit project', def: editing }
      ].map(({ open, onClose, onSubmit, title, def }, i) => (
        <Modal key={i} open={open} onClose={onClose} title={title}>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input name="title" label="Title" placeholder="Project name" required defaultValue={def?.title} />
            <Textarea name="description" label="Description" placeholder="What is it?" defaultValue={def?.description ?? ''} rows={3} />
            <Select
              name="status"
              label="Status"
              options={STATUS_OPTIONS}
              defaultValue={def?.status ?? 'active'}
            />
            <Input name="url" label="URL (optional)" placeholder="https://…" type="url" defaultValue={def?.url ?? ''} />
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
