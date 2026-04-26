'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

export async function createMedia(formData: FormData) {
  const { supabase, user } = await getAuthUser()
  const name = (formData.get('name') as string).trim()
  const type = formData.get('type') as string
  const status = (formData.get('status') as string | null)?.trim() || null
  const cover_url = (formData.get('cover_url') as string | null)?.trim() || null

  if (!name || !type) return { error: 'Name and type are required.' }

  const { error } = await supabase.from('media').insert({
    user_id: user.id,
    name,
    type,
    status,
    cover_url,
    is_public: false,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/media')
}

export async function updateMedia(id: string, formData: FormData) {
  const { supabase, user } = await getAuthUser()
  const name = (formData.get('name') as string).trim()
  const type = formData.get('type') as string
  const status = (formData.get('status') as string | null)?.trim() || null
  const cover_url = (formData.get('cover_url') as string | null)?.trim() || null
  const is_public = formData.get('is_public') === 'true'

  if (!name || !type) return { error: 'Name and type are required.' }

  const { error } = await supabase
    .from('media')
    .update({ name, type, status, cover_url, is_public })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/media')
}

export async function deleteMedia(id: string) {
  const { supabase, user } = await getAuthUser()
  const { error } = await supabase
    .from('media')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/media')
}

export async function toggleMediaPublic(id: string, is_public: boolean) {
  const { supabase, user } = await getAuthUser()
  const { error } = await supabase
    .from('media')
    .update({ is_public })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/media')
}
