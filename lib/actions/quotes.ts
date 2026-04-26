'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

export async function createQuote(formData: FormData) {
  const { supabase, user } = await getAuthUser()
  const text = (formData.get('text') as string).trim()
  const author = (formData.get('author') as string | null)?.trim() || null
  const book_id = (formData.get('book_id') as string | null)?.trim() || null
  const rawTags = formData.get('tags') as string | null
  const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : []

  if (!text) return { error: 'Quote text is required.' }

  const { error } = await supabase.from('quotes').insert({
    user_id: user.id,
    text,
    author,
    book_id: book_id || null,
    tags,
    is_public: false,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/quotes')
}

export async function saveQuoteFromLibrary(data: {
  text: string
  author: string
  book_id: string
}) {
  const { supabase, user } = await getAuthUser()
  const { error } = await supabase.from('quotes').insert({
    user_id: user.id,
    text: data.text,
    author: data.author,
    book_id: data.book_id,
    tags: [],
    is_public: false,
  })
  if (error) return { error: error.message }
  revalidatePath('/dashboard/quotes')
}

export async function updateQuote(id: string, formData: FormData) {
  const { supabase, user } = await getAuthUser()
  const text = (formData.get('text') as string).trim()
  const author = (formData.get('author') as string | null)?.trim() || null
  const book_id = (formData.get('book_id') as string | null)?.trim() || null
  const rawTags = formData.get('tags') as string | null
  const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : []
  const is_public = formData.get('is_public') === 'true'

  if (!text) return { error: 'Quote text is required.' }

  const { error } = await supabase
    .from('quotes')
    .update({ text, author, book_id: book_id || null, tags, is_public })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/quotes')
}

export async function deleteQuote(id: string) {
  const { supabase, user } = await getAuthUser()
  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/quotes')
}

export async function toggleQuotePublic(id: string, is_public: boolean) {
  const { supabase, user } = await getAuthUser()
  const { error } = await supabase
    .from('quotes')
    .update({ is_public })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/quotes')
}
