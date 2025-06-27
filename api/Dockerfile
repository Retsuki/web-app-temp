# Hono API用のDockerfile
FROM node:20-alpine AS base

# 依存関係のインストール
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 依存関係ファイルをコピー
COPY package.json package-lock.json ./
RUN npm ci

# ソースコードのビルド
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# TypeScriptをビルド
RUN npm run build

# 本番環境用の依存関係のみインストール
FROM base AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# 本番環境用イメージ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# 非rootユーザーを作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

# ビルド成果物と本番用依存関係をコピー
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder --chown=hono:nodejs /app/dist ./dist
COPY --chown=hono:nodejs package.json ./

USER hono

# Cloud Runはポート8080を期待
EXPOSE 8080
ENV PORT 8080

# APIサーバーを起動
CMD ["node", "dist/index.js"]