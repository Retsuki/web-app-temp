#!/bin/bash

# Google Cloud Platform セットアップスクリプト
# Cloud Run デプロイとSecret Manager設定を含む

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# 質問関数
ask_question() {
    local prompt="$1"
    local var_name="$2"
    local default="$3"
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " value
        value="${value:-$default}"
    else
        read -p "$prompt: " value
    fi
    
    eval "$var_name='$value'"
}

# 確認関数
confirm() {
    local prompt="$1"
    local default="$2"
    
    if [ "$default" = "y" ]; then
        read -p "$prompt [Y/n]: " -n 1 -r
        echo
        [[ ! $REPLY =~ ^[Nn]$ ]]
    else
        read -p "$prompt [y/N]: " -n 1 -r
        echo
        [[ $REPLY =~ ^[Yy]$ ]]
    fi
}

# メイン関数
main() {
    log_info "Google Cloud Platform セットアップを開始します"
    echo ""
    
    # 前提条件の確認
    check_prerequisites
    
    # Google Cloud 認証
    setup_gcloud_auth
    
    # プロジェクトの設定
    setup_project
    
    # APIの有効化
    enable_apis
    
    # Artifact Registry の設定
    setup_artifact_registry
    
    log_success "セットアップが完了しました！"
    echo ""
    print_next_steps
}

# 前提条件の確認
check_prerequisites() {
    log_info "前提条件を確認しています..."
    
    local missing_tools=()
    
    # gcloud CLIの確認
    if ! command -v gcloud &> /dev/null; then
        missing_tools+=("gcloud")
    fi
    
    # Docker の確認
    if ! command -v docker &> /dev/null; then
        missing_tools+=("docker")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "以下のツールがインストールされていません:"
        for tool in "${missing_tools[@]}"; do
            echo "  - $tool"
        done
        echo ""
        echo "インストール方法:"
        echo "  - gcloud: https://cloud.google.com/sdk/docs/install"
        echo "  - docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    log_success "前提条件を満たしています"
}

# Google Cloud 認証
setup_gcloud_auth() {
    log_info "Google Cloud 認証を確認しています..."
    
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_warning "Google Cloud にログインしていません"
        if confirm "ログインしますか？" "y"; then
            gcloud auth login
        else
            log_error "認証が必要です"
            exit 1
        fi
    else
        local account=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
        log_success "認証済み: $account"
    fi
}

# プロジェクトの設定
setup_project() {
    log_info "プロジェクトを設定します"
    
    # 既存のプロジェクト一覧を表示
    echo ""
    echo "利用可能なプロジェクト:"
    gcloud projects list --format="table(projectId, name)" 2>/dev/null || true
    echo ""
    
    ask_question "使用するプロジェクトID" PROJECT_ID
    
    # プロジェクトの存在確認
    if ! gcloud projects describe "$PROJECT_ID" &>/dev/null; then
        log_error "プロジェクト '$PROJECT_ID' が見つかりません"
        if confirm "新しいプロジェクトを作成しますか？" "y"; then
            ask_question "プロジェクト名" PROJECT_NAME "$PROJECT_ID"
            gcloud projects create "$PROJECT_ID" --name="$PROJECT_NAME"
            log_success "プロジェクトを作成しました"
        else
            exit 1
        fi
    fi
    
    # プロジェクトを設定
    gcloud config set project "$PROJECT_ID"
    log_success "プロジェクトを設定しました: $PROJECT_ID"
    
    # リージョンの設定
    ask_question "使用するリージョン" REGION "asia-northeast1"
    gcloud config set run/region "$REGION"
}

# APIの有効化
enable_apis() {
    log_info "必要なAPIを有効化しています..."
    
    local apis=(
        "run.googleapis.com"
        "artifactregistry.googleapis.com"
        "cloudbuild.googleapis.com"
        "secretmanager.googleapis.com"
        "cloudresourcemanager.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        echo -n "  $api を有効化中..."
        if gcloud services enable "$api" --quiet 2>/dev/null; then
            echo " ✓"
        else
            echo " (既に有効)"
        fi
    done
    
    log_success "APIの有効化が完了しました"
}


# Artifact Registry の設定
setup_artifact_registry() {
    log_info "Artifact Registry を設定します"
    
    local repo_name="web-app-temp"
    
    # リポジトリの存在確認
    if gcloud artifacts repositories describe "$repo_name" --location="$REGION" &>/dev/null; then
        log_info "Artifact Registry リポジトリは既に存在します"
    else
        if confirm "Artifact Registry リポジトリを作成しますか？" "y"; then
            gcloud artifacts repositories create "$repo_name" \
                --repository-format=docker \
                --location="$REGION" \
                --description="Web App Template Docker images" \
                --quiet
            log_success "リポジトリを作成しました"
        fi
    fi
    
    # Docker 認証の設定
    log_info "Docker 認証を設定しています..."
    gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet
    log_success "Docker 認証を設定しました"
}



# 次のステップを表示
print_next_steps() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 次のステップ:"
    echo ""
    echo "1. 環境変数の準備:"
    echo "   - API用: /api/.env.production"
    echo "   - Web用: /web/.env.production"
    echo ""
    echo "2. Secret Manager への環境変数の登録:"
    echo "   ./scripts/api/env-update.sh production"
    echo "   ./scripts/web/env-update.sh production"
    echo ""
    echo "3. デプロイの実行:"
    echo "   ./scripts/gcp/deploy-full-stack.sh"
    echo ""
    echo "4. デプロイ後のURL確認:"
    echo "   - API: gcloud run services describe api --region=$REGION --format='value(status.url)'"
    echo "   - Web: gcloud run services describe web --region=$REGION --format='value(status.url)'"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# スクリプトを実行
main "$@"