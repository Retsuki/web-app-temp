'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useGetApiV1Health } from '@/lib/api/generated/system/system'
import { useGetApiV1UsersMe } from '@/lib/api/generated/users/users'

export default function TestApiPage() {
  const [testResults, setTestResults] = useState<string[]>([])

  // ヘルスチェックAPI（認証不要）
  const { data: healthData, isLoading: healthLoading, error: healthError } = useGetApiV1Health()

  // プロフィール取得API（認証必要）
  const { 
    data: profileData, 
    isLoading: profileLoading, 
    error: profileError,
    refetch: refetchProfile 
  } = useGetApiV1UsersMe({
    query: {
      enabled: false // 手動で実行するため無効化
    }
  })

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testHealthCheck = () => {
    if (healthLoading) {
      addResult('ヘルスチェック実行中...')
      return
    }
    
    if (healthError) {
      addResult(`❌ ヘルスチェック失敗: ${healthError.message}`)
      return
    }
    
    if (healthData) {
      addResult(`✅ ヘルスチェック成功: ${JSON.stringify(healthData)}`)
    }
  }

  const testProfileFetch = async () => {
    addResult('プロフィール取得開始...')
    try {
      const result = await refetchProfile()
      if (result.error) {
        addResult(`❌ プロフィール取得失敗: ${result.error.message}`)
      } else if (result.data) {
        addResult(`✅ プロフィール取得成功: ${JSON.stringify(result.data)}`)
      }
    } catch (error) {
      addResult(`❌ プロフィール取得エラー: ${error}`)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>API Client Test Page</CardTitle>
          <CardDescription>
            Orvalで生成されたAPIクライアントの動作確認
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">1. ヘルスチェック（認証不要）</h3>
            <Button onClick={testHealthCheck}>
              ヘルスチェック実行
            </Button>
            {healthData && (
              <pre className="p-2 bg-muted rounded text-sm">
                {JSON.stringify(healthData, null, 2)}
              </pre>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">2. プロフィール取得（認証必要）</h3>
            <Button onClick={testProfileFetch}>
              プロフィール取得
            </Button>
            {profileData && (
              <pre className="p-2 bg-muted rounded text-sm">
                {JSON.stringify(profileData, null, 2)}
              </pre>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">実行ログ</h3>
            <div className="border rounded p-4 h-64 overflow-y-auto bg-muted/50">
              {testResults.length === 0 ? (
                <p className="text-muted-foreground">まだテストを実行していません</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}