import type { Theme, MediaItem } from '@/lib/types'

interface MediaSectionProps {
  media: MediaItem[]
  theme: Theme
  cardStyle: React.CSSProperties
}

const TYPE_EMOJI: Record<string, string> = {
  game: '🎮',
  book: '📚',
  show: '📺',
  music: '🎵',
}

function groupByType(media: MediaItem[]) {
  return media.reduce<Record<string, MediaItem[]>>((acc, item) => {
    acc[item.type] = acc[item.type] ?? []
    acc[item.type].push(item)
    return acc
  }, {})
}

export default function MediaSection({ media, theme, cardStyle }: MediaSectionProps) {
  if (!media || media.length === 0) return null

  const grouped = groupByType(media)

  return (
    <div className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest opacity-40" style={{ color: theme.textColor }}>
        Media
      </h2>
      {Object.entries(grouped).map(([type, items]) => (
        <div key={type}>
          <h3 className="text-xs opacity-50 mb-2 capitalize" style={{ color: theme.textColor }}>
            {TYPE_EMOJI[type]} {type === 'show' ? 'Shows & Films' : `${type}s`}
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {items.map((item) => (
              <div key={item.id} className="group">
                <div
                  className="aspect-[3/4] rounded-lg overflow-hidden mb-1.5"
                  style={{ ...cardStyle, padding: 0 }}
                >
                  {item.cover_url ? (
                    <img
                      src={item.cover_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${theme.accentColor}15` }}
                    >
                      {TYPE_EMOJI[type]}
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium leading-tight line-clamp-2 opacity-80" style={{ color: theme.textColor }}>
                  {item.name}
                </p>
                {item.status && (
                  <p className="text-xs opacity-40 mt-0.5" style={{ color: theme.textColor }}>
                    {item.status}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
