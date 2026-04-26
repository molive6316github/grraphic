import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LinksManager from '@/components/dashboard/LinksManager'

export const metadata: Metadata = { title: 'Links' }

export default async function LinksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: links } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', user.id)
    .order('order_index', { ascending: true })

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold mb-1">Links</h1>
        <p className="text-white/40 text-sm">Manage your linktree-style links. Toggle public to show them on your profile.</p>
      </div>
      <LinksManager links={links ?? []} />
    </div>
  )
}
