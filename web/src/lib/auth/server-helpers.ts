import { redirect } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import type { paths } from "@/lib/api/schema";
import { createClient } from "@/lib/supabase/server";

/**
 * 認証済みユーザーを取得（Server Component用）
 * 未認証の場合はサインインページへリダイレクト
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  return user;
}

/**
 * 認証付きAPIクライアントを作成（Server Component用）
 */
export async function getAuthenticatedApiClient() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("認証トークンが見つかりません");
  }

  // 認証ヘッダー付きのAPIクライアントを返す
  return {
    GET: <P extends keyof paths>(
      path: P,
      options?: Parameters<typeof apiClient.GET<P>>[1]
    ) => {
      return apiClient.GET(path, {
        ...options,
        headers: {
          ...options?.headers,
          Authorization: `Bearer ${session.access_token}`,
        },
      });
    },
    POST: <P extends keyof paths>(
      path: P,
      options?: Parameters<typeof apiClient.POST<P>>[1]
    ) => {
      return apiClient.POST(path, {
        ...options,
        headers: {
          ...options?.headers,
          Authorization: `Bearer ${session.access_token}`,
        },
      });
    },
    PUT: <P extends keyof paths>(
      path: P,
      options?: Parameters<typeof apiClient.PUT<P>>[1]
    ) => {
      return apiClient.PUT(path, {
        ...options,
        headers: {
          ...options?.headers,
          Authorization: `Bearer ${session.access_token}`,
        },
      });
    },
    DELETE: <P extends keyof paths>(
      path: P,
      options?: Parameters<typeof apiClient.DELETE<P>>[1]
    ) => {
      return apiClient.DELETE(path, {
        ...options,
        headers: {
          ...options?.headers,
          Authorization: `Bearer ${session.access_token}`,
        },
      });
    },
  };
}

/**
 * 認証必須ページのラッパー（Server Component用）
 * ユーザー情報とプロフィールを取得して返す
 */
export async function requireAuth() {
  const user = await getAuthenticatedUser();
  const apiClient = await getAuthenticatedApiClient();

  const { data: profileResponse, error } = await apiClient.GET(
    "/api/v1/users/me"
  );

  if (error) {
    console.error("プロフィール取得エラー:", error);
    return { user, profile: null, error };
  }

  return {
    user,
    profile: profileResponse.data,
    error: null,
  };
}
