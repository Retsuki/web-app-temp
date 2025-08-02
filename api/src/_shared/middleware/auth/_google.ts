/**
 * Google IDトークンの検証モジュール
 */

/**
 * Google IDトークンのペイロード型
 */
export interface GoogleIDTokenPayload {
  iss: string
  sub: string
  azp: string
  aud: string
  iat: number
  exp: number
  email?: string
  email_verified?: boolean
}

/**
 * Google IDトークンを検証する
 * @param token IDトークン
 * @returns 検証されたペイロード、または無効な場合はnull
 */
export async function verifyGoogleIdToken(token: string): Promise<GoogleIDTokenPayload | null> {
  try {
    // Google Token Verify APIを使用
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`)

    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as GoogleIDTokenPayload

    // トークンの有効期限を確認
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) {
      return null
    }

    // Cloud Run環境の場合、audienceを確認
    if (process.env.K_SERVICE) {
      const expectedAudience = getExpectedAudience()
      if (payload.aud !== expectedAudience) {
        console.error(`Invalid audience: expected ${expectedAudience}, got ${payload.aud}`)
        return null
      }
    }

    return payload
  } catch (error) {
    console.error('Error verifying Google ID token:', error)
    return null
  }
}

/**
 * Cloud Run環境かどうかを判定する
 */
export function isCloudRunEnvironment(): boolean {
  return !!process.env.K_SERVICE
}

/**
 * 期待されるaudienceを取得する
 */
function getExpectedAudience(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  const service = process.env.K_SERVICE
  const revision = process.env.K_REVISION || ''
  return `https://${service}-${revision}.a.run.app`
}
