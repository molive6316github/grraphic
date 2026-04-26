'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

export async function createProject(formData: FormData) {
  const { supabase, user } = await getAuthUser()
  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  const status = (formData.get('status') as string) || 'active'
  const url = (formData.get('url') as string | null)?.trim() || null

  if (!title) return { error: 'Title is required.' }

  const { error } = await supabase.from('projects').insert({
    user_id: user.id,
    title,
    description,
    status,
    url,
    is_public: false,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/projects')
}

export async function updateProject(id: string, formData: FormData) {
  const { supabase, user } = await getAuthUser()
  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  const status = formData.get('status') as string
  const url = (formData.get('url') as string | null)?.trim() || null
  const is_public = formData.get('is_public') === 'true'

  if (!title) return { error: 'Title is required.' }

  const { error } = await supabase
    .from('projects')
    .update({ title, description, status, url, is_public })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/projects')
}

export async function deleteProject(id: string) {
  const { supabase, user } = await getAuthUser()
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/projects')
}

export async function toggleProjectPublic(id: string, is_public: boolean) {
  const { supabase, user } = await getAuthUser()
  const { error } = await supabase
    .from('projects')
    .update({ is_public })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/projects')
}
