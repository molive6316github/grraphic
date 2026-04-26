'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Not authorized')
  return { user, supabase }
}

export async function setUserRole(userId: string, role: 'user' | 'admin') {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/admin/users')
}

export async function deleteUserContent(userId: string, table: string) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const allowedTables = ['links', 'quotes', 'concepts', 'projects', 'media']
  if (!allowedTables.includes(table)) return { error: 'Invalid table.' }

  const { error } = await supabase.from(table).delete().eq('user_id', userId)
  if (error) return { error: error.message }
  revalidatePath('/admin/users')
}
