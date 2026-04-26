import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, Users, Shield } from 'lucide-react'

export const metadata: Metadata = { title: 'Admin' }

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: userCount },
    { count: bookCount },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('books').select('id', { count: 'exact', head: true }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield size={18} className="text-amber-400" />
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
        <p className="text-white/40 text-sm">Sitewide control panel. Only accessible to admins.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/admin/books"
          className="p-6 rounded-xl bg-white/[0.03] border border-white/8 hover:border-white/15 transition-all group"
        >
          <BookOpen size={20} className="text-white/30 group-hover:text-[#7c6aff] mb-3 transition-colors" />
          <div className="text-3xl font-bold mb-1">{bookCount ?? 0}</div>
          <div className="text-sm text-white/50">Books in library</div>
        </Link>
        <Link
          href="/admin/users"
          className="p-6 rounded-xl bg-white/[0.03] border border-white/8 hover:border-white/15 transition-all group"
        >
          <Users size={20} className="text-white/30 group-hover:text-[#7c6aff] mb-3 transition-colors" />
          <div className="text-3xl font-bold mb-1">{userCount ?? 0}</div>
          <div className="text-sm text-white/50">Total users</div>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Link
          href="/admin/books"
          className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/6 hover:border-white/12 transition-all text-sm text-white/60 hover:text-white/90"
        >
          <BookOpen size={15} />
          Manage books — upload, edit, delete
        </Link>
        <Link
          href="/admin/users"
          className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/6 hover:border-white/12 transition-all text-sm text-white/60 hover:text-white/90"
        >
          <Users size={15} />
          Manage users — promote, demote, view
        </Link>
      </div>
    </div>
  )
}
