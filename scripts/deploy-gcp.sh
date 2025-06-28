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
