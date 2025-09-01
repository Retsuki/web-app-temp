'use client'

import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  checkSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()

  useEffect(() => {
    // 初回マウント時に認証状態を確認
    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('認証状態の確認エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      // ログアウト時はサインインページへリダイレクト
      if (event === 'SIGNED_OUT') {
        // 別ユーザーでのサインイン時に前ユーザーのキャッシュが表示されないようにクリア
        queryClient.clear()
        router.push('/signin')
      }

      // サインイン完了時にも一度キャッシュをクリアして整合性を確保
      if (event === 'SIGNED_IN') {
        queryClient.clear()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      // 明示的にQueryキャッシュをクリア（サーバーアクション経由のサインアウト未使用時の安全策）
      queryClient.clear()
    } catch (error) {
      console.error('ログアウトエラー:', error)
      throw error
    }
  }

  const refreshSession = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession()
      if (error) {
        throw error
      }
      setUser(session?.user ?? null)
    } catch (error) {
      console.error('セッション更新エラー:', error)
      throw error
    }
  }

  // セッションを明示的に確認してユーザー状態を更新
  const checkSession = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    } catch (error) {
      console.error('セッション再チェックエラー:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut,
        refreshSession,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// カスタムフック
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
