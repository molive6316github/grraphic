'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

export async function createConcept(formData: FormData) {
  const { supabase, user } = await getAuthUser()
  const title = (formData.get('title') as string).trim()
  const body = (formData.get('body') as string | null)?.trim() || null
  const rawTags = formData.get('tags') as string | null
  const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : []

  if (!title) return { error: 'Title is required.' }

  const { error } = await supabase.from('concepts').insert({
    user_id: user.id,
    title,
    body,
    tags,
    is_public: false,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/concepts')
}

export async function updateConcept(id: string, formData: FormData) {
  const { supabase, user } = await getAuthUser()
  const title = (formData.get('title') as string).trim()
  const body = (formData.get('body') as string | null)?.trim() || null
  const rawTags = formData.get('tags') as string | null
  const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : []
  const is_public = formData.get('is_public') === 'true'

  if (!title) return { error: 'Title is required.' }

  const { error } = await supabase
    .from('concepts')
    .update({ title, body, tags, is_public })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/concepts')
}

export async function deleteConcept(id: string) {
  const { supabase, user } = await getAuthUser()
  const { error } = await supabase
    .from('concepts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/concepts')
}

export async function toggleConceptPublic(id: string, is_public: boolean) {
  const { supabase, user } = await getAuthUser()
  const { error } = await supabase
    .from('concepts')
    .update({ is_public })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/concepts')
}
