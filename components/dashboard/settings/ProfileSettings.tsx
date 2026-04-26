'use client'

import { useState, useTransition } from 'react'
import { updateProfile, updateUsername } from '@/lib/actions/profile'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'

interface ProfileSettingsProps {
  username: string
  avatarUrl: string
  bio: string
}

export default function ProfileSettings({ username: initialUsername, avatarUrl: initialAvatar, bio: initialBio }: ProfileSettingsProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setSuccess('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateProfile(fd)
      if (res?.error) setError(res.error)
      else setSuccess('Profile updated.')
    })
  }

  async function handleUsername(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setSuccess('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateUsername(fd)
      if (res?.error) setError(res.error)
      else setSuccess('Username updated.')
    })
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Profile</h2>
      <div className="p-5 rounded-xl bg-white/[0.03] border border-white/8 space-y-5">
        <form onSubmit={handleProfile} className="space-y-4">
          <Input name="avatar_url" label="Avatar URL" placeholder="https://…" defaultValue={initialAvatar} />
          <Textarea name="bio" label="Bio" placeholder="Tell the world about yourself…" defaultValue={initialBio} rows={3} />
          <Button type="submit" loading={pending} size="sm">Save profile</Button>
        </form>

        <div className="border-t border-white/6 pt-5">
          <form onSubmit={handleUsername} className="space-y-4">
            <Input name="username" label="Username" placeholder="yourname" defaultValue={initialUsername} />
            <Button type="submit" loading={pending} size="sm" variant="secondary">Change username</Button>
          </form>
        </div>

        {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
        {success && <p className="text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2">{success}</p>}
      </div>
    </section>
  )
}
