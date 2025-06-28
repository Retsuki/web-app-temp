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
    
    # Secret Manager の設定
    setup_secret_manager
    
    # サービスアカウントの作成
    setup_service_accounts
    
    # 環境変数ファイルの生成
    generate_env_files
    
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

# Secret Manager の設定
setup_secret_manager() {
    log_info "Secret Manager を設定します"
    
    if ! confirm "Secret Manager に環境変数を設定しますか？" "y"; then
        log_info "Secret Manager 設定をスキップしました"
        return
    fi
    
    log_info "環境変数の管理方法を選択してください："
    echo "1) 個別のシークレット（各環境変数を個別に管理）"
    echo "2) 統合シークレット（.envファイル形式で一括管理）"
    echo ""
    ask_question "選択（1 or 2）" SECRET_MANAGEMENT_TYPE "2"
    
    if [ "$SECRET_MANAGEMENT_TYPE" = "2" ]; then
        setup_unified_secrets
    else
        setup_individual_secrets
    fi
    
    log_success "Secret Manager の設定が完了しました"
}

# 統合シークレット管理（推奨）
setup_unified_secrets() {
    log_info ".envファイル形式で環境変数を一括管理します"
    
    # APIとWeb用の統合シークレット
    local env_secrets=(
        "api-env-production:APIサーバー用環境変数"
        "web-env-production:Webアプリ用環境変数"
    )
    
    for secret_spec in "${env_secrets[@]}"; do
        local secret_id="${secret_spec%%:*}"
        local description="${secret_spec#*:}"
        
        log_info "$description を設定します"
        
        # シークレットが既に存在するか確認
        if gcloud secrets describe "$secret_id" --project="$PROJECT_ID" &>/dev/null; then
            if confirm "  $secret_id は既に存在します。更新しますか？" "n"; then
                create_env_content "$secret_id"
            fi
        else
            # シークレットを作成
            gcloud secrets create "$secret_id" \
                --replication-policy="automatic" \
                --project="$PROJECT_ID" \
                --labels="app=web-app-temp,env=production"
            
            create_env_content "$secret_id"
        fi
    done
}

# .env形式のコンテンツを作成
create_env_content() {
    local secret_id=$1
    local temp_file=$(mktemp)
    
    if [ "$secret_id" = "api-env-production" ]; then
        cat > "$temp_file" << 'EOF'
# APIサーバー環境変数
NODE_ENV=production
PORT=8080

# Database
DATABASE_URL=

# Supabase
SUPABASE_SERVICE_ROLE_KEY=

# その他の環境変数をここに追加
EOF
    elif [ "$secret_id" = "web-env-production" ]; then
        cat > "$temp_file" << 'EOF'
# Webアプリ環境変数
NODE_ENV=production

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# API
NEXT_PUBLIC_API_URL=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# その他の環境変数をここに追加
EOF
    fi
    
    echo ""
    echo "以下の内容でシークレットを作成します："
    echo "----------------------------------------"
    cat "$temp_file"
    echo "----------------------------------------"
    
    if confirm "この内容で保存しますか？（後で編集可能）" "y"; then
        echo ""
        log_info "環境変数の値を入力してください（空欄のままにすると後で設定できます）"
        
        # エディタで編集
        ${EDITOR:-nano} "$temp_file"
        
        # Secret Managerに保存
        gcloud secrets versions add "$secret_id" --data-file="$temp_file"
        log_success "$secret_id を保存しました"
    fi
    
    rm -f "$temp_file"
}

# 個別シークレット管理（従来の方法）
setup_individual_secrets() {
    log_info "各環境変数を個別のシークレットとして管理します"
    
    # 必要な環境変数のリスト
    local secrets=(
        "SUPABASE_SERVICE_ROLE_KEY"
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "DATABASE_URL"
        "GOOGLE_CLIENT_ID"
        "GOOGLE_CLIENT_SECRET"
    )
    
    for secret_name in "${secrets[@]}"; do
        # シークレット名を Cloud Run 互換の形式に変換（アンダースコアをハイフンに）
        local secret_id=$(echo "$secret_name" | tr '_' '-' | tr '[:upper:]' '[:lower:]')
        
        # シークレットが既に存在するか確認
        if gcloud secrets describe "$secret_id" --project="$PROJECT_ID" &>/dev/null; then
            if confirm "  $secret_name は既に存在します。更新しますか？" "n"; then
                ask_question "  $secret_name の値" secret_value
                if [ -n "$secret_value" ]; then
                    echo -n "$secret_value" | gcloud secrets versions add "$secret_id" --data-file=-
                    log_success "  $secret_name を更新しました"
                fi
            fi
        else
            if confirm "  $secret_name を作成しますか？" "y"; then
                # シークレットを作成
                gcloud secrets create "$secret_id" --replication-policy="automatic" --project="$PROJECT_ID"
                
                ask_question "  $secret_name の値（空欄で後で設定）" secret_value
                if [ -n "$secret_value" ]; then
                    echo -n "$secret_value" | gcloud secrets versions add "$secret_id" --data-file=-
                    log_success "  $secret_name を作成しました"
                else
                    log_warning "  $secret_name を作成しました（値は未設定）"
                fi
            fi
        fi
    done
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
            "roles/secretmanager.secretAccessor"
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

# Cloud Run サービス名
CLOUD_RUN_SERVICE_NAME_WEB=web-app-web
CLOUD_RUN_SERVICE_NAME_API=web-app-api

# Cloud Run サービス URL（デプロイ後に自動更新される）
WEB_SERVICE_URL=https://web-app-web-xxxxx.a.run.app
API_SERVICE_URL=https://web-app-api-xxxxx.a.run.app
EOF
    
    # Cloud Run デプロイ用スクリプトも生成
    local deploy_script="scripts/deploy-gcp.sh"
    
    cat > "$deploy_script" << 'EOF'
#!/bin/bash

# Cloud Run デプロイスクリプト

set -e

source scripts/setup-gcp.sh

# .env.gcp を読み込む
if [ -f .env.gcp ]; then
    export $(cat .env.gcp | grep -v '^#' | xargs)
fi

# APIをデプロイ
deploy_api() {
    log_info "APIサービスをデプロイしています..."
    
    cd api
    
    # Dockerイメージをビルド
    docker build -t "$GCP_ARTIFACT_REGISTRY/api:latest" .
    
    # イメージをプッシュ
    docker push "$GCP_ARTIFACT_REGISTRY/api:latest"
    
    # Cloud Run にデプロイ（統合シークレットを使用）
    gcloud run deploy $CLOUD_RUN_SERVICE_NAME_API \
        --image="$GCP_ARTIFACT_REGISTRY/api:latest" \
        --platform=managed \
        --region="$GCP_REGION" \
        --allow-unauthenticated \
        --set-env-vars="NODE_ENV=production" \
        --set-secrets="/workspace/.env=api-env-production:latest"
    
    cd ..
    log_success "APIサービスのデプロイが完了しました"
}

# Webアプリをデプロイ
deploy_web() {
    log_info "Webアプリケーションをデプロイしています..."
    
    # APIのURLを取得
    API_URL=$(gcloud run services describe $CLOUD_RUN_SERVICE_NAME_API \
        --platform=managed \
        --region="$GCP_REGION" \
        --format="value(status.url)")
    
    cd web
    
    # Dockerイメージをビルド
    docker build -t "$GCP_ARTIFACT_REGISTRY/web:latest" \
        --build-arg NEXT_PUBLIC_API_URL="$API_URL" .
    
    # イメージをプッシュ
    docker push "$GCP_ARTIFACT_REGISTRY/web:latest"
    
    # Cloud Run にデプロイ（統合シークレットを使用）
    gcloud run deploy $CLOUD_RUN_SERVICE_NAME_WEB \
        --image="$GCP_ARTIFACT_REGISTRY/web:latest" \
        --platform=managed \
        --region="$GCP_REGION" \
        --allow-unauthenticated \
        --set-env-vars="NODE_ENV=production" \
        --set-env-vars="NEXT_PUBLIC_API_URL=$API_URL" \
        --set-secrets="/workspace/.env=web-env-production:latest"
    
    cd ..
    log_success "Webアプリケーションのデプロイが完了しました"
}

# メイン処理
log_info "Cloud Run へのデプロイを開始します"

if confirm "APIサービスをデプロイしますか？" "y"; then
    deploy_api
fi

if confirm "Webアプリケーションをデプロイしますか？" "y"; then
    deploy_web
fi

log_success "デプロイが完了しました！"
EOF
    
    chmod +x "$deploy_script"
    
    log_success "環境変数ファイルを生成しました: $env_file"
    log_success "デプロイスクリプトを生成しました: $deploy_script"
}

# 次のステップを表示
print_next_steps() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 次のステップ:"
    echo ""
    echo "1. Secret Manager で環境変数の値を設定（未設定の場合）:"
    echo "   # 統合シークレットの場合（推奨）"
    echo "   gcloud secrets versions add api-env-production --data-file=.env.production.api"
    echo "   gcloud secrets versions add web-env-production --data-file=.env.production.web"
    echo ""
    echo "   # または、コンソールから編集"
    echo "   https://console.cloud.google.com/security/secret-manager"
    echo ""
    echo "2. Supabase プロジェクトの環境変数を Secret Manager に設定済みか確認"
    echo ""
    echo "3. デプロイを実行:"
    echo "   ./scripts/deploy-gcp.sh"
    echo ""
    echo "4. デプロイ後のURL確認:"
    echo "   - API: gcloud run services describe $CLOUD_RUN_SERVICE_NAME_API --region=$REGION --format='value(status.url)'"
    echo "   - Web: gcloud run services describe $CLOUD_RUN_SERVICE_NAME_WEB --region=$REGION --format='value(status.url)'"
    echo ""
    if [ -f "sa-key.json" ]; then
        echo "5. CI/CD を設定する場合:"
        echo "   - sa-key.json の内容を GitHub Secrets の GCP_SA_KEY に設定"
        echo "   - .env.gcp の内容を GitHub Secrets に設定"
        echo ""
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# スクリプトを実行
main "$@"