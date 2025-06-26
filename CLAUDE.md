# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Goal

このプロジェクトは、新規アプリ開発を爆速化するためのテンプレートアプリケーションです。

### 存在意義
新規アプリ開発時に必要となる基本機能を事前に実装しておくことで、開発者がメイン機能の開発に集中できる環境を提供します。

### 実装予定の基本機能
- 認証システム（サインアップ・サインイン）
- 決済機能
- API連携基盤
- その他、アプリケーションに共通して必要となる最低限の機能

これらの機能が事前に実装されていることで、新しいアプリケーションのアイデアを素早く形にすることが可能になります。

## Project Overview

This is a monorepo structure with:
- `/web/` - Next.js 15.3.4 frontend application
- `/api/` - API backend (to be implemented)

### Web Application
The web directory contains a Next.js application with:
- TypeScript
- Tailwind CSS v4
- App Router
- ESLint
- Turbopack (for development)

## Development Commands

```bash
# Navigate to web directory
cd web

# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Architecture

### Directory Structure
- `/web/` - Frontend Next.js application
  - `/web/src/app/` - App Router pages and layouts
  - `/web/src/app/globals.css` - Global styles with Tailwind CSS
  - `/web/public/` - Static assets
  - `/web/src/` - Source code directory
- `/api/` - Backend API directory (planned)

### Key Configuration Files
- `/web/next.config.ts` - Next.js configuration
- `/web/tsconfig.json` - TypeScript configuration
- `/web/tailwind.config.ts` - Tailwind CSS configuration
- `/web/eslint.config.mjs` - ESLint configuration

### Import Alias
The web project uses `@/*` as an import alias for the `src/` directory.