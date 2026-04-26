'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  if (!email || !password || !username) {
    return { error: 'All fields are required.' }
  }

  if (username.length < 3 || !/^[a-z0-9_-]+$/i.test(username)) {
    return { error: 'Username must be 3+ characters and contain only letters, numbers, _ or -.' }
  }

  // Check username availability
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .maybeSingle()

  if (existing) {
    return { error: 'Username is already taken.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username: username.toLowerCase() },
    },
  })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
