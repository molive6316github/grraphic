import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_THEME } from '@/lib/types'
import ProfileRenderer from '@/components/profile/ProfileRenderer'

interface Props {
  params: { username: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, bio')
    .eq('username', params.username.toLowerCase())
    .maybeSingle()

  if (!profile) return { title: 'Not found' }
  return {
    title: `@${profile.username}`,
    description: profile.bio ?? `${profile.username}'s MyBrain profile`,
  }
}

export default async function ProfilePage({ params }: Props) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bio, theme')
    .eq('username', params.username.toLowerCase())
    .maybeSingle()

  if (!profile) notFound()

  const theme = { ...DEFAULT_THEME, ...(profile.theme ?? {}) }

  // Fetch all public content for this user
  const [
    { data: links },
    { data: quotes },
    { data: concepts },
    { data: projects },
    { data: media },
  ] = await Promise.all([
    supabase
      .from('links')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_public', true)
      .order('order_index', { ascending: true }),
    supabase
      .from('quotes')
      .select('*, book:books(title, author)')
      .eq('user_id', profile.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('concepts')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('media')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false }),
  ])

  return (
    <ProfileRenderer
      profile={{ ...profile, theme }}
      links={links ?? []}
      quotes={quotes ?? []}
      concepts={concepts ?? []}
      projects={projects ?? []}
      media={media ?? []}
    />
  )
}
