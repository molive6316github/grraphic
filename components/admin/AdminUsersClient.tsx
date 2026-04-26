'use client'

import { useState, useTransition } from 'react'
import { Shield, User, ExternalLink } from 'lucide-react'
import { setUserRole } from '@/lib/actions/admin'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface UserRow {
  id: string
  username: string
  avatar_url: string | null
  role: string
  created_at: string
}

export default function AdminUsersClient({
  users: initial,
  currentUserId,
}: {
  users: UserRow[]
  currentUserId: string
}) {
  const [users, setUsers] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [search, setSearch] = useState('')

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  function handleRole(userId: string, newRole: 'user' | 'admin') {
    if (userId === currentUserId && newRole !== 'admin') {
      if (!confirm('Demoting yourself will remove your admin access. Proceed?')) return
    }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    startTransition(async () => { await setUserRole(userId, newRole) })
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by username…"
        className="w-full max-w-sm bg-white/5 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#7c6aff]/60 transition-colors"
      />

      <div className="space-y-1.5">
        {filtered.map(user => (
          <div
            key={user.id}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
              user.id === currentUserId
                ? 'bg-[#7c6aff]/5 border-[#7c6aff]/20'
                : 'bg-white/[0.03] border-white/8'
            }`}
          >
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-white/30" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white/90">@{user.username}</span>
                {user.role === 'admin' && <Badge variant="warning"><Shield size={10} className="inline mr-0.5" />admin</Badge>}
                {user.id === currentUserId && <Badge variant="accent">you</Badge>}
              </div>
              <p className="text-xs text-white/30">
                Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`/${user.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/25 hover:text-white/60 transition-colors p-1.5"
              >
                <ExternalLink size={13} />
              </a>
              {user.role === 'admin' ? (
                <Button
                  variant="danger"
                  size="sm"
                  loading={pending}
                  onClick={() => handleRole(user.id, 'user')}
                >
                  Demote
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={pending}
                  onClick={() => handleRole(user.id, 'admin')}
                >
                  <Shield size={12} />
                  Promote
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-white/30 text-sm">No users found.</div>
      )}
    </div>
  )
}
