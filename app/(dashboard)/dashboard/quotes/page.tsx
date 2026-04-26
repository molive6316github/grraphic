import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QuotesManager from '@/components/dashboard/QuotesManager'

export const metadata: Metadata = { title: 'Quotes' }

export default async function QuotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: quotes } = await supabase
    .from('quotes')
    .select('*, book:books(title, author)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: books } = await supabase
    .from('books')
    .select('id, title, author')
    .order('title')

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold mb-1">Quotes</h1>
        <p className="text-white/40 text-sm">Your saved quotes. Link to books from the library or add standalone quotes.</p>
      </div>
      <QuotesManager quotes={quotes ?? []} books={books ?? []} />
    </div>
  )
}
