# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際のClaude Code（claude.ai/code）へのガイダンスを提供します。

## プロジェクト概要

これはプロジェクトのアイデアを管理するためのTypeScript CLIツールです。開発者がカテゴリ、ステータス、優先度などのメタデータとともにアイデアを素早く記録・整理できるようにします。

## 開発コマンド

```bash
# ツールの実行
npm run idea          # 対話型プロンプトで新しいアイデアを追加
npm run idea:random   # 保存されたアイデアからランダムに表示

# 開発
npm run dev           # ts-nodeで実行
npm run build         # TypeScriptをJavaScriptにコンパイル
npm start            # コンパイル済みJavaScriptを実行

# コード品質
npm run lint          # ESLintチェック
npm run format        # Prettierフォーマット
npm run test         # テスト実行（実装時）
```

## アーキテクチャ

### ディレクトリ構造
```
ideas/
├── src/
│   ├── index.ts         # メインエントリポイント - CLIロジック
│   ├── idea.ts          # Ideaモデルと型定義
│   ├── storage.ts       # ファイルベースのストレージロジック
│   └── utils.ts         # ユーティリティ関数
├── data/
│   └── ideas.json       # JSONストレージファイル（初回使用時に作成）
├── package.json         # プロジェクト設定
└── tsconfig.json        # TypeScript設定
```

### 主要コンポーネント

1. **CLIインターフェース** (`src/index.ts`)
   - 対話型プロンプトに`inquirer`を使用
   - ユーザー入力の検証を処理
   - アイデアの追加と閲覧のフローを管理

2. **データモデル** (`src/idea.ts`)
   - title、description、category、status、priority、tagsを持つ`Idea`インターフェース
   - ステータス列挙型: "New", "In Progress", "Completed", "Archived"
   - 優先度レベル: "Low", "Medium", "High"

3. **ストレージレイヤー** (`src/storage.ts`)
   - `data/ideas.json`のファイルベースJSONストレージ
   - エラーハンドリング付き非同期ファイル操作
   - 必要に応じて自動的にディレクトリを作成

4. **ユーティリティ** (`src/utils.ts`)
   - 共通ヘルパー関数
   - 日付フォーマット
   - 文字列操作

### データフォーマット

アイデアは以下の構造でJSONとして保存されます：
```json
{
  "id": "uuid-v4",
  "title": "文字列",
  "description": "文字列",
  "category": "文字列",
  "status": "New|In Progress|Completed|Archived",
  "priority": "Low|Medium|High",
  "tags": ["文字列"],
  "createdAt": "ISO 8601形式の日付",
  "updatedAt": "ISO 8601形式の日付"
}
```

## 実装ガイドライン

### 新機能の追加
1. 厳密な型付けでTypeScriptのベストプラクティスに従う
2. 既存のモジュラー構造を維持する
3. 必要に応じて`package.json`のスクリプトに新しいコマンドを追加
4. 新しいワークフローのために`src/index.ts`のCLIプロンプトを更新

### 一般的な変更

**アイデアに新しいフィールドを追加する場合：**
1. `src/idea.ts`の`Idea`インターフェースを更新
2. `src/index.ts`にプロンプトを追加
3. 既存データのマイグレーションロジックを検討

**新しいコマンドを追加する場合：**
1. `src/index.ts`のメインメニューを拡張
2. 新しい操作のためのハンドラー関数を作成
3. 新しいデータ操作が必要な場合は`storage.ts`を更新

**ストレージフォーマットを変更する場合：**
1. `src/storage.ts`にマイグレーションロジックを実装
2. 破壊的変更の場合はデータフォーマットにバージョンを付ける
3. 後方互換性を処理

### コードスタイル
- TypeScriptのstrictモードを使用
- すべてのファイル操作でasync/awaitを使用
- try/catchで適切なエラーハンドリング
- 明確で説明的な変数名
- 複雑なロジックのみコメントを付ける

## テストアプローチ

テストを実装する際：
1. ユニットテストにJestを使用
2. ファイルシステム操作をモック化
3. ストレージ操作のエッジケースをテスト
4. CLI入力処理を検証

## 依存関係

コア依存関係：
- `inquirer`: 対話型CLIプロンプト
- `uuid`: ユニークID生成
- `chalk`: ターミナル文字列スタイリング（必要な場合）
- TypeScriptツールチェーン

軽量なツールを維持するため、依存関係は最小限に保つ。