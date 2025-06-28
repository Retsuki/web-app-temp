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
    
    # Dockerイメージをビルド（amd64プラットフォーム用）
    docker build --platform linux/amd64 -t "$GCP_ARTIFACT_REGISTRY/api:latest" .
    
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
    
    # Secret Managerから環境変数を取得
    log_info "Secret Managerから環境変数を取得しています..."
    
    # web-env-productionシークレットから環境変数を取得
    if gcloud secrets versions access latest --secret="web-env-production" --project="$PROJECT_ID" > /tmp/web-env.tmp 2>/dev/null; then
        # .env形式のファイルから必要な環境変数を抽出
        NEXT_PUBLIC_SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" /tmp/web-env.tmp | cut -d'=' -f2-)
        NEXT_PUBLIC_SUPABASE_ANON_KEY=$(grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" /tmp/web-env.tmp | cut -d'=' -f2-)
        NEXT_PUBLIC_SITE_URL=$(grep "^NEXT_PUBLIC_SITE_URL=" /tmp/web-env.tmp | cut -d'=' -f2-)
        rm -f /tmp/web-env.tmp
        log_success "Secret Managerから環境変数を取得しました"
    else
        log_warning "Secret Managerから環境変数を取得できませんでした。個別のシークレットを試します..."
        
        # 個別のシークレットから取得を試みる
        NEXT_PUBLIC_SUPABASE_URL=$(gcloud secrets versions access latest --secret="next-public-supabase-url" --project="$PROJECT_ID" 2>/dev/null || echo "")
        NEXT_PUBLIC_SUPABASE_ANON_KEY=$(gcloud secrets versions access latest --secret="next-public-supabase-anon-key" --project="$PROJECT_ID" 2>/dev/null || echo "")
        NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://web-app-web.run.app}"
    fi
    
    # 環境変数が設定されているか確認
    if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
        log_error "必要な環境変数が設定されていません。Secret Managerを確認してください。"
        log_info "以下のコマンドで環境変数を設定してください:"
        log_info "  gcloud secrets versions add web-env-production --data-file=.env.production.web"
        exit 1
    fi
    
    # Dockerイメージをビルド（amd64プラットフォーム用）
    docker build --platform linux/amd64 -t "$GCP_ARTIFACT_REGISTRY/web:latest" \
        --build-arg NEXT_PUBLIC_API_URL="$API_URL" \
        --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
        --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
        --build-arg NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL" .
    
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
