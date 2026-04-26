import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardSidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen bg-[#0f0f13]">
      <DashboardSidebar profile={profile} />
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-4xl mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  )
}
