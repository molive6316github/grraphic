'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

export async function createLink(formData: FormData) {
  const { supabase, user } = await getAuthUser()
  const label = (formData.get('label') as string).trim()
  const url = (formData.get('url') as string).trim()
  const icon = (formData.get('icon') as string | null)?.trim() || null

  if (!label || !url) return { error: 'Label and URL are required.' }

  const { error } = await supabase.from('links').insert({
    user_id: user.id,
    label,
    url,
    icon,
    is_public: false,
    order_index: 0,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/links')
}

export async function updateLink(id: string, formData: FormData) {
  const { supabase, user } = await getAuthUser()
  const label = (formData.get('label') as string).trim()
  const url = (formData.get('url') as string).trim()
  const icon = (formData.get('icon') as string | null)?.trim() || null
  const is_public = formData.get('is_public') === 'true'

  if (!label || !url) return { error: 'Label and URL are required.' }

  const { error } = await supabase
    .from('links')
    .update({ label, url, icon, is_public })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/links')
}

export async function deleteLink(id: string) {
  const { supabase, user } = await getAuthUser()
  const { error } = await supabase
    .from('links')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/links')
}

export async function reorderLinks(ids: string[]) {
  const { supabase, user } = await getAuthUser()
  const updates = ids.map((id, i) => ({ id, user_id: user.id, order_index: i }))
  for (const u of updates) {
    await supabase
      .from('links')
      .update({ order_index: u.order_index })
      .eq('id', u.id)
      .eq('user_id', user.id)
  }
  revalidatePath('/dashboard/links')
}

export async function toggleLinkPublic(id: string, is_public: boolean) {
  const { supabase, user } = await getAuthUser()
  const { error } = await supabase
    .from('links')
    .update({ is_public })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/links')
}
