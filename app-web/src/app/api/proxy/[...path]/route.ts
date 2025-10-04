import { type NextRequest, NextResponse } from 'next/server'
import { API_URL, getAuthHeaders } from '@/lib/auth-helpers'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handleRequest(request, path, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handleRequest(request, path, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handleRequest(request, path, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handleRequest(request, path, 'DELETE')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handleRequest(request, path, 'PATCH')
}

async function handleRequest(request: NextRequest, path: string[], method: string) {
  try {
    // パスを構築
    const apiPath = path.join('/')
    const searchParams = request.nextUrl.searchParams.toString()
    const url = `${API_URL}/${apiPath}${searchParams ? `?${searchParams}` : ''}`

    // Supabaseトークンを取得
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const supabaseToken = session?.access_token

    // ヘッダーを構築
    const headers = await getAuthHeaders(supabaseToken)

    // リクエストボディを取得
    let body: string | undefined
    if (method !== 'GET' && method !== 'HEAD') {
      const contentType = request.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        body = await request.text()
      }
    }

    // APIにリクエストを転送
    const response = await fetch(url, {
      method,
      headers,
      body,
    })

    // レスポンスを返す
    const responseText = await response.text()

    // レスポンスヘッダーをコピー（必要なものだけ）
    const responseHeaders = new Headers()
    responseHeaders.set('content-type', response.headers.get('content-type') || 'application/json')

    return new NextResponse(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('API proxy error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
