'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Theme } from '@/lib/types'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await getAuthUser()
  const bio = (formData.get('bio') as string | null)?.trim() || null
  const avatar_url = (formData.get('avatar_url') as string | null)?.trim() || null

  const { error } = await supabase
    .from('profiles')
    .update({ bio, avatar_url })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
}

export async function updateUsername(formData: FormData) {
  const { supabase, user } = await getAuthUser()
  const username = (formData.get('username') as string).trim().toLowerCase()

  if (!username || username.length < 3) return { error: 'Username must be at least 3 characters.' }
  if (!/^[a-z0-9_-]+$/.test(username)) return { error: 'Username can only contain letters, numbers, _ or -.' }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user.id)
    .maybeSingle()

  if (existing) return { error: 'Username is already taken.' }

  const { error } = await supabase
    .from('profiles')
    .update({ username })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/settings')
}

export async function updateTheme(theme: Partial<Theme>) {
  const { supabase, user } = await getAuthUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('theme')
    .eq('id', user.id)
    .single()

  const merged = { ...(profile?.theme ?? {}), ...theme }

  const { error } = await supabase
    .from('profiles')
    .update({ theme: merged })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/settings')
}

export async function updateSectionOrder(sectionOrder: string[]) {
  const { supabase, user } = await getAuthUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('theme')
    .eq('id', user.id)
    .single()

  const merged = { ...(profile?.theme ?? {}), sectionOrder }

  const { error } = await supabase
    .from('profiles')
    .update({ theme: merged })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/settings')
}
