'use client'

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
import { GripVertical } from 'lucide-react'

const SECTION_LABELS: Record<string, string> = {
  links: '🔗 Links',
  quotes: '💬 Quotes',
  concepts: '💡 Concepts',
  projects: '📁 Projects',
  media: '🎮 Media',
}

const ALL_SECTIONS = ['links', 'quotes', 'concepts', 'projects', 'media']

function SortableSection({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.04] border border-white/8 cursor-default"
    >
      <button {...attributes} {...listeners} className="text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing">
        <GripVertical size={14} />
      </button>
      <span className="text-sm text-white/70">{SECTION_LABELS[id] ?? id}</span>
    </div>
  )
}

export default function SectionOrder({
  order,
  onChange,
}: {
  order: string[]
  onChange: (order: string[]) => void
}) {
  const normalizedOrder = [
    ...order.filter(s => ALL_SECTIONS.includes(s)),
    ...ALL_SECTIONS.filter(s => !order.includes(s)),
  ]

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = normalizedOrder.indexOf(active.id as string)
    const newIdx = normalizedOrder.indexOf(over.id as string)
    onChange(arrayMove(normalizedOrder, oldIdx, newIdx))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={normalizedOrder} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5">
          {normalizedOrder.map(id => (
            <SortableSection key={id} id={id} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
