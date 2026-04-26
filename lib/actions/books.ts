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

export async function createBook(formData: FormData) {
  const { user } = await requireAdmin()
  const supabase = await createAdminClient()

  const title = (formData.get('title') as string).trim()
  const author = (formData.get('author') as string).trim()
  const release_date = (formData.get('release_date') as string | null)?.trim() || null
  const cover_url = (formData.get('cover_url') as string | null)?.trim() || null
  const content = (formData.get('content') as string).trim()
  const rawTags = formData.get('tags') as string | null
  const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : []

  if (!title || !author || !content) {
    return { error: 'Title, author, and content are required.' }
  }

  const { data: book, error: bookError } = await supabase
    .from('books')
    .insert({ title, author, release_date, cover_url, tags, created_by: user.id })
    .select('id')
    .single()

  if (bookError || !book) return { error: bookError?.message ?? 'Failed to create book.' }

  const { error: contentError } = await supabase
    .from('book_content')
    .insert({ book_id: book.id, content })

  if (contentError) {
    await supabase.from('books').delete().eq('id', book.id)
    return { error: contentError.message }
  }

  revalidatePath('/admin/books')
  revalidatePath('/library')
  return { bookId: book.id }
}

export async function deleteBook(id: string) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const { error } = await supabase.from('books').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/books')
  revalidatePath('/library')
}

export async function updateBook(id: string, formData: FormData) {
  await requireAdmin()
  const supabase = await createAdminClient()

  const title = (formData.get('title') as string).trim()
  const author = (formData.get('author') as string).trim()
  const release_date = (formData.get('release_date') as string | null)?.trim() || null
  const cover_url = (formData.get('cover_url') as string | null)?.trim() || null
  const rawTags = formData.get('tags') as string | null
  const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : []

  if (!title || !author) return { error: 'Title and author are required.' }

  const { error } = await supabase
    .from('books')
    .update({ title, author, release_date, cover_url, tags })
    .eq('id', id)

  if (error) return { error: error.message }

  const content = (formData.get('content') as string | null)?.trim()
  if (content) {
    await supabase
      .from('book_content')
      .upsert({ book_id: id, content }, { onConflict: 'book_id' })
  }

  revalidatePath('/admin/books')
  revalidatePath('/library')
}
