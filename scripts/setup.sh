#!/bin/bash

# セットアップスクリプト
# このスクリプトは新規環境でプロジェクトをセットアップするために使用します

set -e

echo "🚀 Web App Template セットアップを開始します..."

# 必要なコマンドの確認
command -v node >/dev/null 2>&1 || { echo "❌ Node.js がインストールされていません。" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm がインストールされていません。" >&2; exit 1; }
command -v supabase >/dev/null 2>&1 || { echo "❌ Supabase CLI がインストールされていません。" >&2; exit 1; }

# Supabaseプロジェクト名の入力
echo ""
read -p "Supabaseプロジェクト名を入力してください (デフォルト: web_app_temp): " project_id
project_id=${project_id:-web_app_temp}
echo "プロジェクト名: $project_id"

# .env ファイルの作成
if [ ! -f .env ]; then
    echo "📝 .env ファイルを作成しています..."
    cp .env.example .env
    echo "⚠️  .env ファイルを編集して、必要な環境変数を設定してください。"
else
    echo "✅ .env ファイルは既に存在します。"
fi

# 依存関係のインストール
echo "📦 依存関係をインストールしています..."
npm install

# web ディレクトリの依存関係
echo "📦 フロントエンドの依存関係をインストールしています..."
cd web && npm install && cd ..

# api ディレクトリの依存関係
echo "📦 APIサーバーの依存関係をインストールしています..."
cd api && npm install && cd ..

# Supabase設定ファイルの更新
echo "📝 Supabase設定ファイルを更新しています..."
if [ -f supabase/config.toml ]; then
    # macOSとLinuxの両方に対応
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/project_id = \".*\"/project_id = \"$project_id\"/" supabase/config.toml
    else
        sed -i "s/project_id = \".*\"/project_id = \"$project_id\"/" supabase/config.toml
    fi
    echo "✅ プロジェクトID を '$project_id' に設定しました。"
fi

# Supabase のセットアップ
echo "🗄️  Supabase をセットアップしています..."
supabase start

# データベースマイグレーション
echo "🗄️  データベースマイグレーションを実行しています..."
cd api && npm run db:push && cd ..

# シードデータの投入（オプション）
read -p "シードデータを投入しますか？ (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 シードデータを投入しています..."
    cd api && npm run db:seed && cd ..
fi

echo "✅ セットアップが完了しました！"
echo ""
echo "次のステップ:"
echo "1. .env ファイルを編集して環境変数を設定"
echo "2. npm run dev で開発サーバーを起動"
echo ""
echo "📚 詳細は CLAUDE.md を参照してください。"