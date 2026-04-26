import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import AdminBooksClient from '@/components/admin/AdminBooksClient'

export const metadata: Metadata = { title: 'Admin · Books' }

export default async function AdminBooksPage() {
  const supabase = await createClient()

  const { data: books } = await supabase
    .from('books')
    .select('id, title, author, release_date, cover_url, tags, created_at, updated_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold mb-1">Books</h1>
        <p className="text-white/40 text-sm">Upload and manage books in the sitewide library. Full text is never shown to users.</p>
      </div>
      <AdminBooksClient books={books ?? []} />
    </div>
  )
}
