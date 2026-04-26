import type { Theme, Quote } from '@/lib/types'
import { BookOpen } from 'lucide-react'

interface QuotesSectionProps {
  quotes: Quote[]
  theme: Theme
  cardStyle: React.CSSProperties
}

export default function QuotesSection({ quotes, theme, cardStyle }: QuotesSectionProps) {
  if (!quotes || quotes.length === 0) return null

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest opacity-40" style={{ color: theme.textColor }}>
        Quotes
      </h2>
      {quotes.map((quote) => (
        <blockquote
          key={quote.id}
          className="p-4"
          style={cardStyle}
        >
          <p
            className="text-sm leading-relaxed mb-3 italic"
            style={{ color: theme.textColor }}
          >
            &ldquo;{quote.text}&rdquo;
          </p>
          {(quote.author || quote.book) && (
            <footer className="flex items-center gap-2 flex-wrap">
              {quote.author && (
                <span className="text-xs opacity-50" style={{ color: theme.textColor }}>
                  — {quote.author}
                </span>
              )}
              {quote.book && (
                <span
                  className="flex items-center gap-1 text-xs opacity-40"
                  style={{ color: theme.accentColor }}
                >
                  <BookOpen size={10} />
                  {quote.book.title}
                </span>
              )}
            </footer>
          )}
          {quote.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {quote.tags.map(tag => (
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
        </blockquote>
      ))}
    </div>
  )
}
