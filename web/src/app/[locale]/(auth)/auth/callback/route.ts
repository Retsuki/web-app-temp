import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Google認証成功後、プロフィールが存在しない場合は作成
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // セッションからアクセストークンを取得
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          try {
            // APIを使用してユーザープロフィールを作成
            await apiClient.POST("/api/v1/users", {
              body: {
                userId: user.id,
                email: user.email!,
                nickname:
                  user.user_metadata.full_name || user.email!.split("@")[0],
              },
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });
          } catch (error) {
            // ユーザーが既に存在する場合はエラーを無視
            console.log("User profile creation skipped:", error);
          }
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // エラーの場合はサインインページへリダイレクト
  return NextResponse.redirect(`${origin}/signin?error=auth_failed`);
}
