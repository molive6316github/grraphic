import type { Theme, Link } from '@/lib/types'

interface LinksSectionProps {
  links: Link[]
  theme: Theme
  cardStyle: React.CSSProperties
}

export default function LinksSection({ links, theme, cardStyle }: LinksSectionProps) {
  if (!links || links.length === 0) return null

  return (
    <div className="space-y-2">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3.5 w-full text-left hover:opacity-80 transition-opacity"
          style={cardStyle}
        >
          {link.icon && (
            <span className="text-xl flex-shrink-0" aria-hidden>
              {link.icon.startsWith('http') ? (
                <img src={link.icon} alt="" className="w-5 h-5 object-contain" />
              ) : (
                link.icon
              )}
            </span>
          )}
          <span className="text-sm font-medium flex-1" style={{ color: theme.textColor }}>
            {link.label}
          </span>
          <span className="text-xs opacity-30" style={{ color: theme.textColor }}>↗</span>
        </a>
      ))}
    </div>
  )
}
