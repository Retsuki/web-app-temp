'use client'

import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

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
        router.push('/signin')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
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

  return {
    user,
    loading,
    signOut,
    refreshSession,
  }
}