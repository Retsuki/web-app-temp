# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際のClaude Code（claude.ai/code）へのガイダンスを提供します。

## プロジェクト概要

これはWeb/モバイルアプリケーション開発のアイデアを管理・設計するためのTypeScript CLIツールです。開発者がアイデアから実装までの全工程を体系的に管理し、AIと協働して効率的に開発を進められるようにします。

### 主な機能
- アイデアの記録と管理（idea.md）
- システム設計書の作成（system-design.md）
- 実装計画の管理（implementation-plans/）
- web_app_tempテンプレートに準拠した技術スタック

## 開発コマンド

```bash
# ツールの実行
npm run idea          # 対話型プロンプトで新しいアイデアを追加（idea.md, system-design.md, implementation-plans/を生成）

# 開発
npm run dev           # ts-nodeで実行
npm run build         # TypeScriptをJavaScriptにコンパイル
npm start            # コンパイル済みJavaScriptを実行

# コード品質（今後実装予定）
npm run format        # コードフォーマット
npm run test         # テスト実行
```

## アーキテクチャ

### ディレクトリ構造
```
ideas/
├── src/
│   ├── add-idea.ts      # アイデア追加スクリプト（メインエントリポイント）
│   └── （その他のユーティリティは今後追加予定）
├── ideas/               # アイデアディレクトリ（自動生成）
│   └── [idea-name]/     # 各アイデアのディレクトリ
│       ├── idea.md                  # アイデアの概要・ビジネス要件
│       ├── system-design.md         # システム設計書
│       └── implementation-plans/    # 実装計画ディレクトリ
│           ├── README.md            # 実装計画の使い方
│           └── 01-feature-name.md   # 機能別実装計画
├── package.json         # プロジェクト設定
├── tsconfig.json        # TypeScript設定
└── CLAUDE.md           # このファイル
```

### 主要コンポーネント

1. **アイデア追加スクリプト** (`src/add-idea.ts`)
   - 対話型プロンプトでアイデア情報を収集
   - 以下の3つの成果物を自動生成：
     - `idea.md`: ビジネス要件とコンセプト
     - `system-design.md`: 技術的な設計書
     - `implementation-plans/`: 実装計画ディレクトリ

2. **生成されるファイル構造**
   - **idea.md**: コンセプト、ターゲット、機能、サービスフロー、画面構成、技術スタック
   - **system-design.md**: アーキテクチャ、ディレクトリ構造、DB設計（Drizzle ORM）、API設計、開発フェーズ
   - **implementation-plans/README.md**: 実装計画の使い方とテンプレート

### 技術スタック（生成されるプロジェクトの標準構成）

web_app_tempテンプレートに準拠した以下の技術スタックを使用：

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

## 開発ワークフロー

### 1. アイデアの作成
```bash
npm run idea
# タイトルと説明を入力
# → ideas/[idea-name]/ディレクトリが生成される
```

### 2. 設計の具体化
1. `idea.md`を編集してビジネス要件を詳細化
2. `system-design.md`を編集して技術設計を詳細化
3. データベース設計はDrizzle ORMの形式で記述

### 3. 実装計画の作成
1. `implementation-plans/`ディレクトリに機能別の実装計画を作成
2. ファイル名は`01-feature-name.md`形式で番号プレフィックスを付ける
3. 各ファイルには実装範囲、手順、依存関係を明記

### 4. AIと協働した実装
1. 実装計画ファイルをAIに共有
2. web_app_tempのディレクトリ構造に従って実装
3. 生成されたコードは標準の技術スタックに準拠

## 実装例：SecAI

`ideas/secai/`ディレクトリには、セキュリティ診断サービスの完全な設計例が含まれています：

- **idea.md**: AIセキュリティ診断サービスのコンセプト
- **system-design.md**: 
  - プロジェクト管理、審査機能、セキュリティAI、GitHub連携の設計
  - Drizzle ORMによるデータベーススキーマ
  - Cloud Tasksを使用した非同期処理フロー
- **implementation-plans/**: 実装計画のテンプレート

## 今後の拡張予定

- アイデアの検索・フィルタリング機能
- アイデア間の関連付け
- 実装進捗の追跡
- GitHub連携による実装状況の同期
- 複数の技術スタックテンプレートのサポート

## コントリビューション

このツールはweb_app_tempプロジェクトの一部として開発されています。改善提案やバグ報告は歓迎します。