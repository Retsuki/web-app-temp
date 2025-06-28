#!/bin/bash

# 開発サーバー一括起動スクリプト

set -e

echo "🚀 開発環境を起動しています..."

# Supabase が起動しているか確認
if ! supabase status >/dev/null 2>&1; then
    echo "🗄️  Supabase を起動しています..."
    supabase start
fi

# プロセスのクリーンアップ
cleanup() {
    echo "🛑 開発サーバーを停止しています..."
    kill $API_PID $WEB_PID 2>/dev/null || true
    exit
}
trap cleanup EXIT

# APIサーバーを起動
echo "🔧 APIサーバーを起動しています (http://localhost:8080)..."
cd api && npm run dev &
API_PID=$!
cd ..

# フロントエンドサーバーを起動
echo "🌐 フロントエンドサーバーを起動しています (http://localhost:3000)..."
cd web && npm run dev &
WEB_PID=$!
cd ..

echo "✅ すべてのサーバーが起動しました！"
echo ""
echo "📍 アクセス先:"
echo "   - フロントエンド: http://localhost:3000"
echo "   - API: http://localhost:8080"
echo "   - API ドキュメント: http://localhost:8080/api/v1/doc"
echo "   - Supabase Studio: http://localhost:54323"
echo ""
echo "🛑 停止するには Ctrl+C を押してください"

# プロセスが終了するまで待機
wait