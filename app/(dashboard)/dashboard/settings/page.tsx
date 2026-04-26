import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DEFAULT_THEME } from '@/lib/types'
import ThemeSettings from '@/components/dashboard/settings/ThemeSettings'
import ProfileSettings from '@/components/dashboard/settings/ProfileSettings'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, bio, theme')
    .eq('id', user.id)
    .single()

  const theme = { ...DEFAULT_THEME, ...(profile?.theme ?? {}) }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-white/40 text-sm">Customize your profile and public page appearance.</p>
      </div>

      <ProfileSettings
        username={profile?.username ?? ''}
        avatarUrl={profile?.avatar_url ?? ''}
        bio={profile?.bio ?? ''}
      />

      <ThemeSettings theme={theme} username={profile?.username ?? ''} />
    </div>
  )
}
