# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.3.4 application with:
- TypeScript
- Tailwind CSS v4
- App Router
- ESLint
- Turbopack (for development)

## Development Commands

```bash
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
- `/src/app/` - App Router pages and layouts
- `/src/app/globals.css` - Global styles with Tailwind CSS
- `/public/` - Static assets
- `/src/` - Source code directory

### Key Configuration Files
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `eslint.config.mjs` - ESLint configuration

### Import Alias
The project uses `@/*` as an import alias for the `src/` directory.