import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProjectsManager from '@/components/dashboard/ProjectsManager'

export const metadata: Metadata = { title: 'Projects' }

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold mb-1">Projects</h1>
        <p className="text-white/40 text-sm">Track your active, completed, and paused projects.</p>
      </div>
      <ProjectsManager projects={projects ?? []} />
    </div>
  )
}
