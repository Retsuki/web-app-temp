import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Google認証成功後、プロフィールが存在しない場合は作成
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // プロフィールの存在確認
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        // プロフィールが存在しない場合は作成
        if (profileError && profileError.code === 'PGRST116') {
          await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              email: user.email!,
              nickname: user.user_metadata.full_name || user.email!.split('@')[0],
            })
        }
      }
      
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // エラーの場合はサインインページへリダイレクト
  return NextResponse.redirect(`${origin}/signin?error=auth_failed`)
}