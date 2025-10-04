'use client'

import { LogOutIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/hooks/auth-context'

interface SignOutButtonProps {
  label?: string
  variant?: React.ComponentProps<typeof Button>['variant']
  size?: React.ComponentProps<typeof Button>['size']
  className?: string
}

export function SignOutButton({
  label = 'サインアウト',
  variant = 'ghost',
  size = 'sm',
  className,
}: SignOutButtonProps) {
  const { signOut } = useAuth()

  const handleClick = async () => {
    await signOut()
  }

  return (
    <Button variant={variant} size={size} onClick={handleClick} className={className}>
      <LogOutIcon className="h-4 w-4 mr-2" />
      {label}
    </Button>
  )
}

