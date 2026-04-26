import type { Metadata } from 'next'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import AdminUsersClient from '@/components/admin/AdminUsersClient'

export const metadata: Metadata = { title: 'Admin · Users' }

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  const adminSupabase = await createAdminClient()
  const { data: profiles } = await adminSupabase
    .from('profiles')
    .select('id, username, avatar_url, role, created_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold mb-1">Users</h1>
        <p className="text-white/40 text-sm">All registered users. Promote or demote admin status.</p>
      </div>
      <AdminUsersClient users={profiles ?? []} currentUserId={currentUser?.id ?? ''} />
    </div>
  )
}
