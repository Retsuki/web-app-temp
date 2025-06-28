'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getToken = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setToken(session?.access_token ?? null)
      } catch (error) {
        console.error('トークン取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    getToken()

    // トークンの更新を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setToken(session?.access_token ?? null)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return { token, loading }
}