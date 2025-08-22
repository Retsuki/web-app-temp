import * as fs from 'node:fs'
import * as path from 'node:path'
import * as readline from 'node:readline'

// アイディアディレクトリのパス
const IDEAS_DIR = '../.ideas'

// readlineインターフェースを作成
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// ユーザーに質問する関数
function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer)
    })
  })
}

// ディレクトリ名を正規化（URLセーフな文字列に変換）
function normalizeDirectoryName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf]+/g, '-')
    .replace(/^-+|-+$/g, '') // 先頭と末尾のハイフンを削除
    .replace(/-+/g, '-') // 連続するハイフンを1つに
}

// 現在の日時を取得
function getCurrentDateTime(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// メイン処理
async function addIdea() {
  try {
    // アイディアディレクトリが存在しない場合は作成
    if (!fs.existsSync(IDEAS_DIR)) {
      fs.mkdirSync(IDEAS_DIR, { recursive: true })
      console.log(`アイディアディレクトリを作成しました: ${IDEAS_DIR}`)
    }

    // タイトルを入力
    const title = await question('アイディアのタイトルを入力してください: ')
    if (!title.trim()) {
      console.log('タイトルが入力されていません。処理を中止します。')
      rl.close()
      return
    }

    // 説明を入力
    const description = await question('アイディアの説明を入力してください（任意）: ')

    // タグを入力
    const tagsInput = await question('タグをカンマ区切りで入力してください（任意）: ')
    const tags = tagsInput
      ? tagsInput
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      : []

    // ディレクトリ名を生成
    const dirName = normalizeDirectoryName(title)
    const ideaDir = path.join(IDEAS_DIR, dirName)

    // 既に同じ名前のディレクトリが存在する場合は番号を付ける
    let finalIdeaDir = ideaDir
    let counter = 1
    while (fs.existsSync(finalIdeaDir)) {
      finalIdeaDir = `${ideaDir}-${counter}`
      counter++
    }

    // アイディアディレクトリを作成
    fs.mkdirSync(finalIdeaDir, { recursive: true })

    // アイディアファイルの内容を作成
    const ideaContent = `# ${title}

## 作成日時
${getCurrentDateTime()}

# コンセプト
<!-- 一言で表現するコンセプト -->

## 概要
${description || '<!-- システム開発するときの世界観・ビジョン -->'}

## ターゲット
<!-- 主なターゲット層 -->

## 機能
<!-- 主要機能のリスト -->
- 

## サービスの流れ
<!-- ユーザーがサービスを使う流れ -->
1. 

## 金額
<!-- 料金プラン -->

## 画面
<!-- 画面構成・遷移 -->
- LP(/)
- サインアップ画面(/signup)
- ログイン画面(/login)
- ダッシュボード(/)

## 技術スタック
- TypeScript
- Next.js(Frontend)
- shadcn/ui
- Tailwind CSS
- orval
- tanstack/react-query
- zod
- Hono.js(Backend)
- Supabase(Auth)
- Supabase(DB)
- Drizzle(ORM)
- Cloud Build
- Cloud Run
- Cloud Tasks
- GitHub
- Stripe
- Biome

`

    // システム設計書ファイルの内容を作成
    const systemDesignContent = `# ${title} システム設計書

## 概要
<!-- サービスの概要 -->

## アーキテクチャ概要

### 技術スタック
- **Frontend**: Next.js 15.3.4 (App Router) + TypeScript
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS v4
- **Backend**: Hono + TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM
- **Authentication**: Supabase Auth (Email or Google OAuth)
- **Payment**: Stripe
- **API Documentation**: OpenAPI + orval
- **Queue/Job**: Cloud Tasks
- **Container**: Cloud Run
- **CI/CD**: Cloud Build
- **Code Quality**: Biome

### システム構成図
\`\`\`
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│   Hono API       │────▶│   Supabase DB   │
│  (Frontend)     │     │  (Backend)       │     │   PostgreSQL    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
\`\`\`

## ディレクトリ構造

### Frontend (\`/web/\`)
<!-- web_app_tempの構造に準拠 -->

### Backend (\`/api/\`)
<!-- web_app_tempの構造に準拠 -->

## データベース設計

### Drizzle ORM スキーマ定義 (\`/api/src/drizzle/db/schema.ts\`)

\`\`\`typescript
import { relations, sql } from 'drizzle-orm'
import { index, integer, jsonb, pgTable, text, timestamp, uuid, varchar, boolean, date } from 'drizzle-orm/pg-core'

// テーブル定義をここに記載

\`\`\`

## API設計

### エンドポイント一覧

#### リソース管理
- \`GET /api/v1/resources\` - 一覧取得
- \`POST /api/v1/resources\` - 作成
- \`GET /api/v1/resources/:id\` - 詳細取得
- \`PUT /api/v1/resources/:id\` - 更新
- \`DELETE /api/v1/resources/:id\` - 削除

### リクエスト/レスポンス例

\`\`\`typescript
// Request
{
  "field": "value"
}

// Response
{
  "id": "uuid",
  "field": "value",
  "createdAt": "2025-01-01T00:00:00Z"
}
\`\`\`

## 開発フェーズ

### Phase 1: 基本機能実装（MVP）
- [ ] 基本CRUD機能
- [ ] 認証機能
- [ ] 基本UI実装

### Phase 2: 追加機能実装
- [ ] 決済機能統合
- [ ] 高度な機能追加

### Phase 3: 最適化・拡張
- [ ] パフォーマンス最適化
- [ ] スケーラビリティ向上

## セキュリティ考慮事項

1. **認証・認可**
   - Supabase Auth利用
   - RLSによるアクセス制御

2. **データ保護**
   - 機密情報の暗号化
   - セキュアな通信

## モニタリング・ログ

1. **アプリケーションモニタリング**
   - エラー率
   - レスポンスタイム
   - 使用状況

2. **インフラモニタリング**
   - リソース使用率
   - コスト管理

`

    // アイディアファイルを作成
    const ideaPath = path.join(finalIdeaDir, 'idea.md')
    fs.writeFileSync(ideaPath, ideaContent, 'utf-8')

    // システム設計書ファイルを作成
    const systemDesignPath = path.join(finalIdeaDir, 'system-design.md')
    fs.writeFileSync(systemDesignPath, systemDesignContent, 'utf-8')

    // 実装計画ディレクトリを作成
    const implementationPlanDir = path.join(finalIdeaDir, 'implementation-plans')
    fs.mkdirSync(implementationPlanDir, { recursive: true })

    // 実装計画ディレクトリのREADMEを作成
    const implementationReadmeContent = `# 実装計画

このディレクトリには、system-design.mdが完成した後に、機能毎の実装計画ファイルを配置します。

## 使い方

1. system-design.mdを完成させる
2. 実装する機能毎に詳細な実装計画ファイルを作成
3. 開発時は、該当する実装計画ファイルをAIに共有して実装を進める

## ファイル命名規則

- \`01-feature-name.md\` - 番号プレフィックスで実装順序を明確化
- 機能名は分かりやすいケバブケースで記述

## 実装計画ファイルの構成例

\`\`\`markdown
# [機能名] 実装計画

## 概要
この機能の概要と目的

## 実装範囲
- 実装する具体的な内容
- 実装しない内容（スコープ外）

## 技術的詳細
- 使用する技術・ライブラリ
- アーキテクチャ上の位置づけ

## 実装手順
1. ステップ1
2. ステップ2
3. ...

## 依存関係
- 事前に必要な実装
- 影響を受ける既存機能

## テスト方針
- ユニットテスト
- 統合テスト
- 動作確認手順

## 注意事項
- セキュリティ考慮事項
- パフォーマンス考慮事項
\`\`\`
`

    const implementationReadmePath = path.join(implementationPlanDir, 'README.md')
    fs.writeFileSync(implementationReadmePath, implementationReadmeContent, 'utf-8')

    console.log('\nアイディアを追加しました！')
    console.log(`場所: ${finalIdeaDir}`)
    console.log(`アイディアファイル: ${ideaPath}`)
    console.log(`システム設計書: ${systemDesignPath}`)
    console.log(`実装計画ディレクトリ: ${implementationPlanDir}`)

    rl.close()
  } catch (error) {
    console.error('エラーが発生しました:', error)
    rl.close()
    process.exit(1)
  }
}

// スクリプトを実行
addIdea()
