'use client'

import { useMemo } from 'react'
import type { FC, CSSProperties } from 'react'
import { buildProfileStyles, buildCardStyles, getFontClass, getAnimationVariants } from '@/lib/utils'
import type { Theme, Link, Quote, Concept, Project, MediaItem } from '@/lib/types'
import AnimatedSection from './AnimatedSection'
import LinksSection from './sections/LinksSection'
import QuotesSection from './sections/QuotesSection'
import ConceptsSection from './sections/ConceptsSection'
import ProjectsSection from './sections/ProjectsSection'
import MediaSection from './sections/MediaSection'

interface ProfileRendererProps {
  profile: {
    username: string
    avatar_url: string | null
    bio: string | null
    theme: Theme
  }
  links: Link[]
  quotes: Quote[]
  concepts: Concept[]
  projects: Project[]
  media: MediaItem[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SectionFC = FC<any>

const SECTION_COMPONENTS: Record<string, SectionFC> = {
  links: LinksSection,
  quotes: QuotesSection,
  concepts: ConceptsSection,
  projects: ProjectsSection,
  media: MediaSection,
}

const SECTION_DATA_KEYS: Record<string, string> = {
  links: 'links',
  quotes: 'quotes',
  concepts: 'concepts',
  projects: 'projects',
  media: 'media',
}

export default function ProfileRenderer({ profile, links, quotes, concepts, projects, media }: ProfileRendererProps) {
  const { theme } = profile
  const pageStyle = useMemo(() => buildProfileStyles(theme), [theme])
  const cardStyle = useMemo(() => buildCardStyles(theme), [theme])
  const fontClass = useMemo(() => getFontClass(theme.font), [theme.font])
  const globalVariants = useMemo(
    () => getAnimationVariants(theme.animationStyle, theme.animationSpeed),
    [theme.animationStyle, theme.animationSpeed]
  )

  const sectionData: Record<string, unknown> = { links, quotes, concepts, projects, media }

  const sectionOrder = theme.sectionOrder.length > 0
    ? theme.sectionOrder
    : ['links', 'quotes', 'projects', 'media', 'concepts']

  const activeSections = sectionOrder.filter(key => {
    const data = sectionData[SECTION_DATA_KEYS[key]] as unknown[]
    return Array.isArray(data) && data.length > 0
  })

  return (
    <div
      className={`my-brain-profile min-h-screen ${fontClass}`}
      style={{ ...pageStyle, '--accent': theme.accentColor } as CSSProperties}
    >
      {/* Custom CSS injection */}
      {theme.customCSS && (
        <style
          dangerouslySetInnerHTML={{
            __html: theme.customCSS
              .replace(/<script/gi, '')
              .replace(/javascript:/gi, ''),
          }}
        />
      )}

      <div className="max-w-2xl mx-auto px-5 py-14">
        {/* Profile header */}
        <AnimatedSection variants={globalVariants} delay={0}>
          <div className="flex flex-col items-center text-center mb-10">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-20 h-20 rounded-full object-cover mb-4 ring-2 ring-white/10"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full mb-4 flex items-center justify-center text-2xl font-bold ring-2 ring-white/10"
                style={{ backgroundColor: `${theme.accentColor}22`, color: theme.accentColor }}
              >
                {profile.username[0]?.toUpperCase()}
              </div>
            )}
            <h1 className="text-2xl font-bold mb-2" style={{ color: theme.textColor }}>
              @{profile.username}
            </h1>
            {profile.bio && (
              <p
                className="text-sm leading-relaxed max-w-sm opacity-70"
                style={{ color: theme.textColor }}
              >
                {profile.bio}
              </p>
            )}
          </div>
        </AnimatedSection>

        {/* Content sections */}
        <div className="space-y-8">
          {activeSections.map((key, i) => {
            const SectionComponent = SECTION_COMPONENTS[key]
            if (!SectionComponent) return null
            const perSectionStyle = theme.perSectionAnimations[key]
            const variants = perSectionStyle
              ? getAnimationVariants(perSectionStyle as Theme['animationStyle'], theme.animationSpeed)
              : globalVariants

            return (
              <AnimatedSection key={key} variants={variants} delay={i * 0.08}>
                <SectionComponent
                  theme={theme}
                  cardStyle={cardStyle}
                  {...{ [SECTION_DATA_KEYS[key]]: sectionData[SECTION_DATA_KEYS[key]] }}
                />
              </AnimatedSection>
            )
          })}
        </div>

        {activeSections.length === 0 && (
          <p className="text-center opacity-30 text-sm" style={{ color: theme.textColor }}>
            Nothing public here yet.
          </p>
        )}

        <div className="mt-16 text-center">
          <a
            href="/"
            className="text-xs opacity-20 hover:opacity-40 transition-opacity"
            style={{ color: theme.textColor }}
          >
            Made with MyBrain
          </a>
        </div>
      </div>
    </div>
  )
}
