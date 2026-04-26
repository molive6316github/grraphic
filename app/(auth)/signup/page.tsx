import type { Metadata } from 'next'
import Link from 'next/link'
import { signUp } from '@/lib/actions/auth'
import AuthForm from '@/components/auth/AuthForm'

export const metadata: Metadata = { title: 'Create account' }

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Create your brain</h1>
      <p className="text-white/40 text-sm mb-8">A personal hub, just for you.</p>
      <AuthForm action={signUp} submitLabel="Get started" showUsername error={searchParams.error} />
      <p className="text-center text-white/40 text-sm mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-[#7c6aff] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
