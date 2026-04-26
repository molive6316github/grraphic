import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConceptsManager from '@/components/dashboard/ConceptsManager'

export const metadata: Metadata = { title: 'Concepts' }

export default async function ConceptsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: concepts } = await supabase
    .from('concepts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold mb-1">Concepts</h1>
        <p className="text-white/40 text-sm">Ideas, theories, notes — your thinking space. Tag and share what you want.</p>
      </div>
      <ConceptsManager concepts={concepts ?? []} />
    </div>
  )
}
