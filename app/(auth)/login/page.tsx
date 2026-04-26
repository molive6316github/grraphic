import type { Metadata } from 'next'
import Link from 'next/link'
import { signIn } from '@/lib/actions/auth'
import AuthForm from '@/components/auth/AuthForm'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
      <p className="text-white/40 text-sm mb-8">Sign in to your MyBrain account.</p>
      <AuthForm action={signIn} submitLabel="Sign in" error={searchParams.error} />
      <p className="text-center text-white/40 text-sm mt-6">
        No account?{' '}
        <Link href="/signup" className="text-[#7c6aff] hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
