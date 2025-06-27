#!/bin/bash

# Google Cloud Platform セットアップスクリプト

set -e

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# プロジェクトルートに移動
cd "$(get_project_root)"

# メイン関数
main() {
    log_info "Google Cloud Platform セットアップを開始します"
    echo ""
    
    # 前提条件の確認
    if ! check_prerequisites; then
        exit 1
    fi
    
    # Google Cloud 認証
    setup_gcloud_auth
    
    # プロジェクトの設定
    setup_project
    
    # APIの有効化
    enable_apis
    
    # Artifact Registry の設定
    setup_artifact_registry
    
    # サービスアカウントの作成
    setup_service_accounts
    
    # 環境変数ファイルの生成
    generate_env_files
    
    log_success "セットアップが完了しました！"
    echo ""
    print_next_steps
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

# サービスアカウントの作成（オプション）
setup_service_accounts() {
    log_info "CI/CD設定（オプション）"
    
    if confirm "CI/CD用のサービスアカウントを作成しますか？" "n"; then
        local sa_name="github-actions-sa"
        local sa_email="$sa_name@$PROJECT_ID.iam.gserviceaccount.com"
        
        # サービスアカウントの作成
        if gcloud iam service-accounts describe "$sa_email" &>/dev/null; then
            log_info "サービスアカウントは既に存在します"
        else
            gcloud iam service-accounts create "$sa_name" \
                --display-name="GitHub Actions Service Account" \
                --quiet
            log_success "サービスアカウントを作成しました"
        fi
        
        # 必要な権限を付与
        log_info "権限を付与しています..."
        local roles=(
            "roles/run.admin"
            "roles/artifactregistry.writer"
            "roles/iam.serviceAccountUser"
        )
        
        for role in "${roles[@]}"; do
            gcloud projects add-iam-policy-binding "$PROJECT_ID" \
                --member="serviceAccount:$sa_email" \
                --role="$role" \
                --quiet &>/dev/null
        done
        
        # キーファイルの生成
        if confirm "サービスアカウントキーを生成しますか？" "y"; then
            local key_file="sa-key.json"
            gcloud iam service-accounts keys create "$key_file" \
                --iam-account="$sa_email" \
                --quiet
            log_success "キーファイルを生成しました: $key_file"
            log_warning "このファイルは安全に保管し、Gitにコミットしないでください"
        fi
    else
        log_info "CI/CD設定をスキップしました"
    fi
}

# 環境変数ファイルの生成
generate_env_files() {
    log_info "環境変数ファイルを生成します"
    
    local env_file=".env.gcp"
    
    cat > "$env_file" << EOF
# Google Cloud Platform 設定
GCP_PROJECT_ID=$PROJECT_ID
GCP_REGION=$REGION
GCP_ARTIFACT_REGISTRY=$REGION-docker.pkg.dev/$PROJECT_ID/web-app-temp

# Cloud Run サービス URL（デプロイ後に更新）
WEB_SERVICE_URL=https://web-app-web-xxxxx.a.run.app
API_SERVICE_URL=https://web-app-api-xxxxx.a.run.app
EOF
    
    log_success "環境変数ファイルを生成しました: $env_file"
}

# 次のステップを表示
print_next_steps() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 次のステップ:"
    echo ""
    echo "1. Supabase プロジェクトを作成し、環境変数を設定:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    echo "2. .env.production ファイルを作成して本番環境の設定を追加"
    echo ""
    echo "3. デプロイを実行:"
    echo "   make deploy-all"
    echo ""
    if [ -f "sa-key.json" ]; then
        echo "4. CI/CD を設定する場合:"
        echo "   - sa-key.json の内容を GitHub Secrets の GCP_SA_KEY に設定"
        echo "   - .env.gcp の GCP_PROJECT_ID を secrets に設定"
        echo ""
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# スクリプトを実行
main "$@"