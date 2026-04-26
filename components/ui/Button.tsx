import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export default function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-[#7c6aff] hover:bg-[#6a5ae0] text-white',
    secondary: 'bg-white/8 hover:bg-white/12 text-white border border-white/10',
    ghost: 'text-white/60 hover:text-white hover:bg-white/6',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-5 py-2.5 text-sm rounded-xl',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={13} className="animate-spin" />}
      {children}
    </button>
  )
}
