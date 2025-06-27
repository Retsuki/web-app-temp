# Web App Template Makefile

.PHONY: help
help: ## ヘルプを表示
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

# 開発環境
.PHONY: dev
dev: ## 開発サーバーを起動（web + api）
	@echo "開発サーバーを起動します..."
	@trap 'kill 0' INT; \
	(cd web && npm run dev) & \
	(cd api && npm run dev) & \
	wait

.PHONY: dev-web
dev-web: ## Webアプリの開発サーバーを起動
	cd web && npm run dev

.PHONY: dev-api
dev-api: ## APIサーバーの開発サーバーを起動
	cd api && npm run dev

# Supabase
.PHONY: supabase-start
supabase-start: ## Supabaseローカル環境を起動
	supabase start

.PHONY: supabase-stop
supabase-stop: ## Supabaseローカル環境を停止
	supabase stop

.PHONY: supabase-status
supabase-status: ## Supabaseの状態を確認
	supabase status

# データベース
.PHONY: db-push
db-push: ## データベースマイグレーションを適用
	cd api && npm run db:push

.PHONY: db-seed
db-seed: ## シードデータを投入
	cd api && npm run db:seed

.PHONY: db-studio
db-studio: ## Supabase Studioを開く
	open http://127.0.0.1:54323

# ビルド
.PHONY: build
build: build-web build-api ## 全てをビルド

.PHONY: build-web
build-web: ## Webアプリをビルド
	cd web && npm run build

.PHONY: build-api
build-api: ## APIサーバーをビルド
	cd api && npm run build

# リント・フォーマット
.PHONY: lint
lint: ## リントを実行
	npm run lint

.PHONY: format
format: ## コードをフォーマット
	npm run format

.PHONY: check
check: ## コードチェック（リント + タイプチェック）
	npm run check

# テスト
.PHONY: test
test: ## テストを実行
	@echo "テストは未実装です"

# Google Cloud Platform
.PHONY: setup-gcp
setup-gcp: ## GCPの初期セットアップ（インタラクティブ）
	@./scripts/setup-gcp.sh

.PHONY: deploy-web
deploy-web: ## WebアプリをCloud Runにデプロイ
	@./scripts/deploy.sh web

.PHONY: deploy-api
deploy-api: ## APIサーバーをCloud Runにデプロイ
	@./scripts/deploy.sh api

.PHONY: deploy-all
deploy-all: ## 全てをCloud Runにデプロイ
	@./scripts/deploy.sh all

# Docker
.PHONY: docker-build
docker-build: docker-build-web docker-build-api ## Dockerイメージをビルド

.PHONY: docker-build-web
docker-build-web: ## WebアプリのDockerイメージをビルド
	cd web && docker build -t web-app-web:local .

.PHONY: docker-build-api
docker-build-api: ## APIサーバーのDockerイメージをビルド
	cd api && docker build -t web-app-api:local .

.PHONY: docker-run-web
docker-run-web: ## WebアプリのDockerコンテナを起動
	docker run -p 8080:8080 --env-file .env.local web-app-web:local

.PHONY: docker-run-api
docker-run-api: ## APIサーバーのDockerコンテナを起動
	docker run -p 8081:8080 --env-file .env.local web-app-api:local

# 依存関係
.PHONY: install
install: ## 依存関係をインストール
	npm install
	cd web && npm install
	cd api && npm install

.PHONY: clean
clean: ## ビルド成果物をクリーン
	rm -rf node_modules
	rm -rf web/node_modules web/.next
	rm -rf api/node_modules api/dist

# Git
.PHONY: commit
commit: ## 変更をコミット（Claude Code用）
	@echo "Claude Codeでコミットを作成してください"

# 環境変数
.PHONY: env-copy
env-copy: ## 環境変数ファイルをコピー
	cp .env.example .env
	@echo ".env ファイルを作成しました。必要に応じて編集してください。"

.PHONY: env-prod
env-prod: ## 本番環境用の環境変数ファイルを作成
	@if [ ! -f .env.production ]; then \
		echo "# 本番環境用の環境変数" > .env.production; \
		echo "NEXT_PUBLIC_SUPABASE_URL=" >> .env.production; \
		echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=" >> .env.production; \
		echo "SUPABASE_SERVICE_ROLE_KEY=" >> .env.production; \
		echo "DATABASE_URL=" >> .env.production; \
		echo "" >> .env.production; \
		echo "# Google OAuth" >> .env.production; \
		echo "GOOGLE_CLIENT_ID=" >> .env.production; \
		echo "GOOGLE_CLIENT_SECRET=" >> .env.production; \
		echo "" >> .env.production; \
		echo "# Site URL" >> .env.production; \
		echo "NEXT_PUBLIC_SITE_URL=" >> .env.production; \
		echo "API_URL=" >> .env.production; \
		echo "" >> .env.production; \
		echo ".env.production ファイルを作成しました。本番環境の値を設定してください。"; \
	else \
		echo ".env.production は既に存在します。"; \
	fi