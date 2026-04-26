'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'

interface AuthFormProps {
  action: (formData: FormData) => Promise<{ error: string } | undefined>
  submitLabel: string
  showUsername?: boolean
  error?: string
}

export default function AuthForm({ action, submitLabel, showUsername, error: initialError }: AuthFormProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(initialError ?? '')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await action(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showUsername && (
        <div>
          <label className="block text-sm text-white/60 mb-1.5">Username</label>
          <input
            name="username"
            type="text"
            placeholder="yourname"
            required
            autoComplete="username"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#7c6aff]/60 transition-colors"
          />
        </div>
      )}
      <div>
        <label className="block text-sm text-white/60 mb-1.5">Email</label>
        <input
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#7c6aff]/60 transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm text-white/60 mb-1.5">Password</label>
        <input
          name="password"
          type="password"
          placeholder="••••••••"
          required
          minLength={8}
          autoComplete={showUsername ? 'new-password' : 'current-password'}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#7c6aff]/60 transition-colors"
        />
      </div>

      {error && (
        <p className="text-red-400/90 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3.5 py-2.5">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-[#7c6aff] hover:bg-[#6a5ae0] disabled:opacity-60 text-white font-semibold text-sm rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2"
      >
        {pending && <Loader2 size={14} className="animate-spin" />}
        {submitLabel}
      </button>
    </form>
  )
}
