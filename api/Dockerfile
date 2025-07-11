# Hono API用のDockerfile
FROM node:20-alpine AS base

FROM base AS builder

RUN apk add --no-cache gcompat
WORKDIR /app

# npmのインストール
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src

# ビルド時は開発依存関係を含めてインストール
ENV NODE_ENV=development

RUN npm ci && \
    npm run build && \
    npm prune --production

# 実行ステージ
FROM base AS runner

RUN apk add --no-cache gcompat && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 hono

WORKDIR /app
RUN chown hono:nodejs /app

# 必要なファイルをコピー
COPY --from=builder --chown=hono:nodejs /app/package.json ./
COPY --from=builder --chown=hono:nodejs /app/node_modules ./node_modules/
COPY --from=builder --chown=hono:nodejs /app/dist ./dist/

USER hono
EXPOSE 8080

# 実行時の環境変数設定
ENV NODE_ENV=production
ENV PORT=8080

# アプリケーションの起動
CMD ["node", "dist/index.js"]
