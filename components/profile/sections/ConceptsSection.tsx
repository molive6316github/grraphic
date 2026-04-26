import type { Theme, Concept } from '@/lib/types'

interface ConceptsSectionProps {
  concepts: Concept[]
  theme: Theme
  cardStyle: React.CSSProperties
}

export default function ConceptsSection({ concepts, theme, cardStyle }: ConceptsSectionProps) {
  if (!concepts || concepts.length === 0) return null

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest opacity-40" style={{ color: theme.textColor }}>
        Concepts
      </h2>
      {concepts.map((concept) => (
        <div key={concept.id} className="p-4" style={cardStyle}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: theme.textColor }}>
            {concept.title}
          </h3>
          {concept.body && (
            <p className="text-sm leading-relaxed opacity-65 mb-3" style={{ color: theme.textColor }}>
              {concept.body}
            </p>
          )}
          {concept.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {concept.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${theme.accentColor}18`, color: theme.accentColor }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
