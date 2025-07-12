#!/bin/bash

# 環境変数切り替えスクリプト
# 使用方法: ./scripts/env-switch.sh

set -e

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 環境選択メニュー
echo "🔧 環境変数切り替えツール"
echo "=========================="
echo ""
echo "切り替えたい環境を選択してください:"
echo ""
echo "  1) ローカル環境 (.env.test)"
echo "  2) 本番環境 (.env.production)"
echo ""
read -p "選択してください (1 or 2): " choice

case $choice in
    1)
        ENV_TYPE="local"
        echo ""
        echo "→ ローカル環境を選択しました"
        ;;
    2)
        ENV_TYPE="production"
        echo ""
        echo "→ 本番環境を選択しました"
        ;;
    *)
        echo ""
        echo "❌ 無効な選択です。1または2を入力してください。"
        exit 1
        ;;
esac

# 環境切り替え関数
switch_env() {
    local dir=$1
    local env_type=$2
    
    cd "$PROJECT_ROOT/$dir"
    
    case "$env_type" in
        local)
            if [ -f ".env.test" ]; then
                cp .env.test .env
                echo "✅ $dir: ローカル環境（.env.test）に切り替えました"
            else
                echo "❌ $dir: .env.testが見つかりません"
                exit 1
            fi
            ;;
        production)
            if [ -f ".env.production" ]; then
                cp .env.production .env
                echo "✅ $dir: 本番環境（.env.production）に切り替えました"
            else
                echo "❌ $dir: .env.productionが見つかりません"
                exit 1
            fi
            ;;
    esac
}

echo ""
echo "🔄 環境変数を切り替えています..."
echo ""

# webディレクトリの環境変数を切り替え
switch_env "web" "$ENV_TYPE"

# apiディレクトリの環境変数を切り替え
switch_env "api" "$ENV_TYPE"

echo ""
echo "✨ 環境変数の切り替えが完了しました！"
echo ""
echo "現在の環境: $([ "$ENV_TYPE" == "local" ] && echo "ローカル環境" || echo "本番環境")"
echo ""
echo "注意事項:"
echo "- アプリケーションを再起動して変更を反映してください"
echo "- .envファイルはGitにコミットしないでください"