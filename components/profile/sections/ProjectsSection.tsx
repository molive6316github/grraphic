import type { Theme, Project } from '@/lib/types'
import { ExternalLink } from 'lucide-react'

interface ProjectsSectionProps {
  projects: Project[]
  theme: Theme
  cardStyle: React.CSSProperties
}

const STATUS_COLORS: Record<string, string> = {
  active: '#4ade80',
  complete: '#a3a3a3',
  paused: '#fb923c',
}

export default function ProjectsSection({ projects, theme, cardStyle }: ProjectsSectionProps) {
  if (!projects || projects.length === 0) return null

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest opacity-40" style={{ color: theme.textColor }}>
        Projects
      </h2>
      {projects.map((project) => (
        <div key={project.id} className="p-4" style={cardStyle}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-sm font-semibold" style={{ color: theme.textColor }}>
                  {project.title}
                </h3>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full capitalize"
                  style={{
                    backgroundColor: `${STATUS_COLORS[project.status] ?? theme.accentColor}20`,
                    color: STATUS_COLORS[project.status] ?? theme.accentColor,
                  }}
                >
                  {project.status}
                </span>
              </div>
              {project.description && (
                <p className="text-sm leading-relaxed opacity-60" style={{ color: theme.textColor }}>
                  {project.description}
                </p>
              )}
            </div>
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 opacity-40 hover:opacity-80 transition-opacity"
                style={{ color: theme.accentColor }}
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
