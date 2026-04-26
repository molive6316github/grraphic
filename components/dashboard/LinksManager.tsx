'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, GripVertical, Globe, Lock } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createLink, updateLink, deleteLink, reorderLinks, toggleLinkPublic } from '@/lib/actions/links'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Toggle from '@/components/ui/Toggle'
import type { Link as LinkType } from '@/lib/types'

function SortableLink({
  link,
  onEdit,
  onDelete,
  onToggle,
}: {
  link: LinkType
  onEdit: (l: LinkType) => void
  onDelete: (id: string) => void
  onToggle: (id: string, v: boolean) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/8 group"
    >
      <button {...attributes} {...listeners} className="text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing">
        <GripVertical size={14} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/90 truncate">{link.label}</span>
          {link.is_public
            ? <Globe size={11} className="text-emerald-400 flex-shrink-0" />
            : <Lock size={11} className="text-white/25 flex-shrink-0" />}
        </div>
        <span className="text-xs text-white/35 truncate block">{link.url}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Toggle checked={link.is_public} onChange={(v) => onToggle(link.id, v)} />
        <button onClick={() => onEdit(link)} className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors">
          <Pencil size={13} />
        </button>
        <button onClick={() => onDelete(link.id)} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

export default function LinksManager({ links: initialLinks }: { links: LinkType[] }) {
  const [links, setLinks] = useState(initialLinks)
  const [editing, setEditing] = useState<LinkType | null>(null)
  const [creating, setCreating] = useState(false)
  const [pending, startTransition] = useTransition()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = links.findIndex(l => l.id === active.id)
    const newIdx = links.findIndex(l => l.id === over.id)
    const reordered = arrayMove(links, oldIdx, newIdx)
    setLinks(reordered)
    startTransition(async () => { await reorderLinks(reordered.map(l => l.id)) })
  }

  function handleToggle(id: string, is_public: boolean) {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, is_public } : l))
    startTransition(async () => { await toggleLinkPublic(id, is_public) })
  }

  function handleDelete(id: string) {
    setLinks(prev => prev.filter(l => l.id !== id))
    startTransition(async () => { await deleteLink(id) })
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await createLink(fd)
      setCreating(false)
    })
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing) return
    const fd = new FormData(e.currentTarget)
    fd.set('is_public', String(editing.is_public))
    startTransition(async () => {
      await updateLink(editing.id, fd)
      setEditing(null)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)} size="sm">
          <Plus size={13} /> Add link
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={links.map(l => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {links.map(link => (
              <SortableLink
                key={link.id}
                link={link}
                onEdit={setEditing}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {links.length === 0 && (
        <div className="text-center py-12 text-white/30 text-sm">No links yet. Add your first one.</div>
      )}

      {/* Create modal */}
      <Modal open={creating} onClose={() => setCreating(false)} title="Add link">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input name="label" label="Label" placeholder="My website" required />
          <Input name="url" label="URL" placeholder="https://example.com" type="url" required />
          <Input name="icon" label="Icon (emoji or URL)" placeholder="🌐" />
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
            <Button type="submit" loading={pending}>Add link</Button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit link">
        {editing && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input name="label" label="Label" defaultValue={editing.label} required />
            <Input name="url" label="URL" defaultValue={editing.url} type="url" required />
            <Input name="icon" label="Icon" defaultValue={editing.icon ?? ''} placeholder="🌐" />
            <div className="flex items-center justify-between pt-1">
              <Toggle
                checked={editing.is_public}
                onChange={(v) => setEditing({ ...editing, is_public: v })}
                label="Public"
              />
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit" loading={pending}>Save</Button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
