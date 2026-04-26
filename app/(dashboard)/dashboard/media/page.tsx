import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MediaManager from '@/components/dashboard/MediaManager'

export const metadata: Metadata = { title: 'Media' }

export default async function MediaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: media } = await supabase
    .from('media')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold mb-1">Media</h1>
        <p className="text-white/40 text-sm">Games, books, shows, and music you want to track or share.</p>
      </div>
      <MediaManager media={media ?? []} />
    </div>
  )
}
