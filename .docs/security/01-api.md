# API セキュリティドキュメント

## 目次

1. [ローカルでのセキュリティチェック](#ローカルでのセキュリティチェック)
2. [概要](#概要)
3. [セキュリティ機能](#セキュリティ機能)
4. [認証 & 認可](#1-認証--認可)
   - [Supabase JWT 認証](#11-supabase-jwt-認証)
   - [Cloud Run IAM 認証](#12-cloud-run-iam-認証)
5. [CORS（オリジン間資源共有）](#2-corsオリジン間資源共有)
6. [レート制限（Rate Limiting）](#3-レート制限rate-limiting)
7. [セキュリティヘッダー](#4-セキュリティヘッダー)
   - [コンテンツセキュリティポリシー（CSP）](#41-コンテンツセキュリティポリシーcsp)
   - [その他のセキュリティヘッダー](#42-その他のセキュリティヘッダー)
   - [Permissions-Policy](#43-permissions-policyパーミッションポリシー)
8. [入力バリデーション](#5-入力バリデーション)
9. [エラーハンドリング](#6-エラーハンドリング)
10. [ミドルウェアの実行順](#7-ミドルウェアの実行順)
11. [環境変数による制御](#8-環境変数による制御)
12. [セキュリティのベストプラクティス](#9-セキュリティのベストプラクティス)
13. [監視とアラート](#10-監視とアラート)
14. [まとめ](#まとめ)

## ローカルでのセキュリティチェック

### 🚀 クイックスタート

開発環境でセキュリティ機能を有効にしてAPIを起動し、動作確認を行う方法です。

#### 1. セキュリティ機能を有効にしてAPIを起動

```bash
# プロジェクトルートから実行
npm run api:security:dev
```

このコマンドは以下の環境変数を設定してAPIを起動します：
- `SECURITY_HEADERS_ENABLED=true` - セキュリティヘッダーを有効化
- `RATE_LIMIT_ENABLED=true` - レート制限を有効化

#### 2. 自動セキュリティチェックの実行

```bash
# プロジェクトルートから実行
npm run api:security:check
```

このスクリプトは以下の項目を自動的にチェックします：
- セキュリティヘッダーの設定確認
- レート制限の動作確認
- CORS設定の確認
- 認証エンドポイントの保護確認

## 概要

Perfect Marketing Tool API は、複数のレイヤーによるセキュリティ対策を実装し、安全な API サービスを提供します。本ドキュメントでは、実装済みの各セキュリティ機能を説明します。

## セキュリティ機能

### 実装済みセキュリティ対策

| カテゴリ           | 機能            | 説明                                         | 状態     |
| -------------- | ------------- | ------------------------------------------ | ------ |
| **認証**         | JWT 認証        | Supabase / Firebase Admin SDK による認証        | ✅ 実装済み |
| **認証**         | Cloud Run IAM | サービス間認証（Service-to-service）                | ✅ 実装済み |
| **アクセス制御**     | CORS 制御       | 許可されたオリジンのみアクセス可                           | ✅ 実装済み |
| **アクセス制御**     | レート制限         | エンドポイント単位のリクエスト制限                          | ✅ 実装済み |
| **セキュリティヘッダー** | CSP           | Content Security Policy                    | ✅ 実装済み |
| **セキュリティヘッダー** | HSTS          | HTTP Strict Transport Security             | ✅ 実装済み |
| **セキュリティヘッダー** | その他ヘッダー       | X-Frame-Options, X-Content-Type-Options など | ✅ 実装済み |
| **入力検証**       | Zod バリデーション   | すべてのリクエストを自動検証                             | ✅ 実装済み |
| **エラーハンドリング**  | エラー情報の秘匿      | 本番環境で詳細を隠蔽                                 | ✅ 実装済み |

## 1. 認証 & 認可

### 1.1 Supabase JWT 認証

**概要**: ユーザー認証に Supabase Auth を使用し、JWT トークンで認証状態を管理します。

**実装**: `/api/src/_shared/middleware/auth/supabase/index.ts`

**トークン取得の優先順**:

1. `X-Supabase-Token` ヘッダー
2. `Authorization: Bearer <token>` ヘッダー
3. Cookie

**保護対象エンドポイント**:

* `/api/v1/users/*`
* `/api/v1/projects/*`
* `/api/v1/contents/*`
* `/api/v1/posts/*`

**公開エンドポイント**:

* `/api/v1/health`
* `/api/v1/scheduler/*`（Cloud Run IAM 認証で保護）

### 1.2 Cloud Run IAM 認証

**概要**: Google Cloud Run 間のサービス間通信を保護します。

**実装**: `/api/src/_shared/middleware/auth/cloud-run/index.ts`

**対象エンドポイント**:

* `/api/v1/scheduler/*`（スケジューラー専用）
* その他のサービス間通信

## 2. CORS（オリジン間資源共有）

**概要**: オリジンを制御し、許可したドメインからのみクロスオリジンアクセスを許可します。

**実装**: `/api/src/_shared/middleware/cors/index.ts`

**許可オリジン**:

```javascript
// Production
- https://buzzooper.com
- https://www.buzzooper.com
- https://pmt-web-*.run.app

// Development
- http://localhost:3000
- http://localhost:3333
```

**設定**:

* 認証情報送信: 有効（`credentials: true`）
* プリフライトキャッシュ: 24 時間
* 許可メソッド: GET, POST, PATCH, PUT, DELETE, OPTIONS

## 3. レート制限（Rate Limiting）

**概要**: 過剰な API 利用を防止し、DoS 攻撃への耐性を高めます。

**実装**: `/api/src/_shared/middleware/rate-limit/index.ts`

### エンドポイントごとの制限

| エンドポイント                       | 上限        | ウィンドウ |
| ----------------------------- | --------- | ----- |
| `/api/v1/auth/*`              | 5 リクエスト   | 1 分   |
| `/api/v1/contents/generate/*` | 10 リクエスト  | 1 分   |
| その他                           | 100 リクエスト | 1 分   |

### 識別方法

* 認証済みユーザー: ユーザー ID
* 非認証ユーザー: IP アドレス（`X-Forwarded-For`, `X-Real-IP`）

### レート制限時のレスポンス

```json
{
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests, please try again later.",
  "cause": {
    "limit": 100,
    "windowMs": 60000,
    "retryAfter": 45
  }
}
```

**HTTP ヘッダー**:

* `RateLimit-Limit`: 上限回数
* `RateLimit-Remaining`: 残リクエスト数
* `RateLimit-Reset`: リセット時刻

## 4. セキュリティヘッダー

**概要**: Hono の `secureHeaders` ミドルウェアで包括的なセキュリティヘッダーを設定します。

**実装**: `/api/src/_shared/middleware/security-headers/index.ts`

### 4.1 コンテンツセキュリティポリシー（CSP）

**本番設定**:

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self' https:;
frame-ancestors 'none';
```

### 4.2 その他のセキュリティヘッダー

| ヘッダー                        | 値                                              | 説明                      |
| --------------------------- | ---------------------------------------------- | ----------------------- |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | HTTPS を強制（本番のみ）         |
| `X-Frame-Options`           | `DENY`                                         | クリックジャッキング防止            |
| `X-Content-Type-Options`    | `nosniff`                                      | MIME タイプスニッフィング防止       |
| `X-XSS-Protection`          | `0`                                            | 旧来の XSS フィルタ無効化（CSP 推奨） |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`              | リファラー情報の制御              |
| `Cache-Control`             | `no-store, no-cache, must-revalidate, private` | キャッシュ無効化                |

### 4.3 Permissions-Policy（パーミッションポリシー）

以下の機能を無効化:

* カメラ
* マイク
* 位置情報
* Payment
* USB
* 各種センサー（加速度、ジャイロ、磁気）
* フルスクリーン

## 5. 入力バリデーション

**概要**: Zod スキーマを用いた自動検証で、不正な入力を防ぎます。

### 実装例

```typescript
// DTO でスキーマ定義
export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

// OpenAPI ルートで自動バリデーション
export const createProjectRoute = createRoute({
  method: 'post',
  path: '/projects',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createProjectSchema,
        },
      },
    },
  },
  // ...
})
```

**バリデーションエラー時のレスポンス**:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request parameters",
  "errors": [
    {
      "path": ["name"],
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

## 6. エラーハンドリング

**概要**: 環境によってエラー情報の出力を制御し、本番では詳細を隠します。

**実装**: `/api/src/_shared/utils/error/index.ts`

### 環境別のエラー表示

**開発環境**:

```json
{
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Database connection failed",
  "stack": "Error: Connection timeout\n  at Database.connect...",
  "cause": {
    "host": "localhost",
    "port": 5432
  }
}
```

**本番環境**:

```json
{
  "code": "INTERNAL_SERVER_ERROR",
  "message": "An error occurred"
}
```

## 7. ミドルウェアの実行順

最大限の防御効果を得るため、ミドルウェアは以下の順で実行します。

1. **CORS** — プリフライト処理
2. **基本ミドルウェア** — ログ、リクエスト ID 付与
3. **セキュリティヘッダー** — 各種ヘッダー付与
4. **レート制限** — リクエスト回数の制限
5. **認証** — JWT / IAM の検証
6. **ビジネスロジック** — 実際の API 処理

## 8. 環境変数による制御

セキュリティ機能は環境変数で制御可能です。

| 環境変数                      | デフォルト値     | 説明                 |
| ------------------------- | ---------- | ------------------ |
| `ENABLE_SECURITY_HEADERS` | `true`（本番） | セキュリティヘッダーを有効化     |
| `ENABLE_RATE_LIMIT`       | `true`（本番） | レート制限を有効化          |
| `RATE_LIMIT_WINDOW_MS`    | `60000`    | レート制限の時間窓（ミリ秒）     |
| `RATE_LIMIT_MAX_REQUESTS` | `100`      | 通常エンドポイントの最大リクエスト数 |
| `CORS_ALLOWED_ORIGINS`    | -          | 追加許可オリジン（カンマ区切り）   |

## 9. セキュリティのベストプラクティス

### 実装上の注意

1. **環境変数管理**

   * 機密情報は環境変数で管理
   * コードへのハードコード禁止
   * Google Secret Manager の利用推奨

2. **エラーハンドリング**

   * `AppHTTPException` による統一的な例外処理
   * 本番では詳細情報を隠蔽

3. **ログ管理**

   * パスワードやトークンなど機微情報は出力しない
   * 構造化ログ（Pino）を使用

4. **依存関係管理**

   * 依存パッケージの定期更新
   * 脆弱性スキャン（`npm audit`）の実施

## 10. 監視とアラート

### 推奨監視項目

* **レート制限違反**: 429 発生頻度
* **認証失敗**: 401/403 発生頻度
* **異常トラフィック**: 特定 IP からの大量リクエスト
* **エラー率**: 5xx の増加

### ログ分析

```javascript
// Pino による構造化ログ
{
  "level": 30,
  "time": 1234567890,
  "pid": 1234,
  "hostname": "api-server",
  "req": {
    "id": "abc-123",
    "method": "POST",
    "url": "/api/v1/contents/generate",
    "headers": {
      "user-agent": "..."
    }
  },
  "res": {
    "statusCode": 429
  },
  "msg": "Rate limit exceeded"
}
```

## まとめ

Perfect Marketing Tool API は多層防御（Defense in Depth）の原則に基づき、認証・認可、アクセス制御、入力検証、セキュリティヘッダー等を組み合わせて堅牢な API を提供します。セキュリティは継続的な取り組みであり、新たな脅威に対応するための定期的な見直しと更新が不可欠です。
