#!/bin/bash

# デプロイスクリプト

set -e

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# プロジェクトルートに移動
cd "$(get_project_root)"

# 引数の処理
SERVICE=${1:-""}
TAG=${2:-"latest"}

# 環境変数の読み込み
load_env ".env.gcp"

# 必須環境変数のチェック
check_required_vars() {
    local required_vars=("GCP_PROJECT_ID" "GCP_REGION")
    local missing=0
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "$var が設定されていません"
            ((missing++))
        fi
    done
    
    if [ $missing -gt 0 ]; then
        log_error ".env.gcp ファイルを確認してください"
        exit 1
    fi
}

# Webアプリのデプロイ
deploy_web() {
    log_info "Web アプリケーションをデプロイします"
    
    cd web
    
    # 環境変数の確認
    local build_args=""
    if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        build_args="$build_args --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
    fi
    if [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
        build_args="$build_args --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY"
    fi
    if [ -n "$NEXT_PUBLIC_SITE_URL" ]; then
        build_args="$build_args --build-arg NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL"
    fi
    if [ -n "$API_SERVICE_URL" ]; then
        build_args="$build_args --build-arg API_URL=$API_SERVICE_URL"
    fi
    
    # イメージのビルド
    local image_tag=$(generate_image_tag "web" "$GCP_REGION" "$GCP_PROJECT_ID" "$TAG")
    log_info "Docker イメージをビルドしています: $image_tag"
    
    docker build $build_args -t "$image_tag" . &
    spinner $!
    
    # イメージのプッシュ
    log_info "イメージをプッシュしています..."
    docker push "$image_tag" &
    spinner $!
    
    # Cloud Run へデプロイ
    log_info "Cloud Run にデプロイしています..."
    
    local service_name="web-app-web"
    gcloud run deploy "$service_name" \
        --image "$image_tag" \
        --platform managed \
        --region "$GCP_REGION" \
        --allow-unauthenticated \
        --port 8080 \
        --memory 512Mi \
        --max-instances 10 \
        --set-env-vars="NODE_ENV=production" \
        --quiet
    
    # サービスURLを取得
    local service_url=$(gcloud run services describe "$service_name" \
        --platform managed \
        --region "$GCP_REGION" \
        --format="value(status.url)")
    
    log_success "Web アプリケーションのデプロイが完了しました"
    log_info "URL: $service_url"
    
    cd ..
}

# APIのデプロイ
deploy_api() {
    log_info "API サーバーをデプロイします"
    
    cd api
    
    # イメージのビルド
    local image_tag=$(generate_image_tag "api" "$GCP_REGION" "$GCP_PROJECT_ID" "$TAG")
    log_info "Docker イメージをビルドしています: $image_tag"
    
    docker build -t "$image_tag" . &
    spinner $!
    
    # イメージのプッシュ
    log_info "イメージをプッシュしています..."
    docker push "$image_tag" &
    spinner $!
    
    # Cloud Run へデプロイ
    log_info "Cloud Run にデプロイしています..."
    
    local service_name="web-app-api"
    local env_vars="NODE_ENV=production"
    
    # 環境変数の追加
    if [ -n "$DATABASE_URL" ]; then
        env_vars="$env_vars,DATABASE_URL=$DATABASE_URL"
    fi
    if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        env_vars="$env_vars,SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY"
    fi
    if [ -n "$WEB_SERVICE_URL" ]; then
        env_vars="$env_vars,ALLOWED_ORIGINS=$WEB_SERVICE_URL"
    fi
    
    gcloud run deploy "$service_name" \
        --image "$image_tag" \
        --platform managed \
        --region "$GCP_REGION" \
        --allow-unauthenticated \
        --port 8080 \
        --memory 512Mi \
        --max-instances 10 \
        --set-env-vars="$env_vars" \
        --quiet
    
    # サービスURLを取得
    local service_url=$(gcloud run services describe "$service_name" \
        --platform managed \
        --region "$GCP_REGION" \
        --format="value(status.url)")
    
    log_success "API サーバーのデプロイが完了しました"
    log_info "URL: $service_url"
    
    cd ..
}

# デプロイの実行
main() {
    log_info "デプロイを開始します"
    
    # 必須環境変数のチェック
    check_required_vars
    
    # 追加の環境変数を読み込み（Supabase設定など）
    if [ -f ".env.production" ]; then
        load_env ".env.production"
    fi
    
    case "$SERVICE" in
        "web")
            measure_time deploy_web
            ;;
        "api")
            measure_time deploy_api
            ;;
        "all")
            measure_time deploy_api
            measure_time deploy_web
            ;;
        *)
            log_error "使用方法: $0 {web|api|all} [tag]"
            echo ""
            echo "例:"
            echo "  $0 web        # Web アプリをデプロイ"
            echo "  $0 api        # API サーバーをデプロイ"
            echo "  $0 all        # 両方をデプロイ"
            echo "  $0 web v1.0.0 # 特定のタグでデプロイ"
            exit 1
            ;;
    esac
}

# スクリプトを実行
main "$@"