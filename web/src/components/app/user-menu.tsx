'use client'

import { useAuth } from '@/contexts/auth-context'
import { useCurrentUser } from '@/hooks/use-current-user'

export function UserMenu() {
  const { signOut } = useAuth()
  const { user, isLoading } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-primary-700">
            {user.nickname?.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="text-sm font-medium text-gray-700">
          {user.nickname}
        </span>
      </div>
      
      <button
        onClick={() => signOut()}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ログアウト
      </button>
    </div>
  )
}