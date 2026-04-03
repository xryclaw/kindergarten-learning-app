# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

幼儿园综合学习互动应用 - A Vue 3 + Vite kindergarten learning web app with 4 interactive modules: 汉字学习 (Character Learning), 拼音练习 (Pinyin Practice), 互动测验 (Interactive Quiz), and 学习卡片 (Learning Cards).

## Development Commands

```bash
# Start dev server (port 3000)
npm run dev

# Build for production
npm run build

# Run tests (Node.js native test runner)
npm test

# Preview production build locally
npm run preview
```

## Architecture

### Navigation Pattern
The app uses **tab-based navigation** without vue-router. Despite vue-router being in package.json, it's not actually used. Navigation is handled via `currentTab` ref in `App.vue` with conditional rendering (`v-if`) of view components.

### View Components
- `src/views/CharacterLearning.vue` - 汉字学习
- `src/views/PinyinPractice.vue` - 拼音练习
- `src/views/InteractiveQuiz.vue` - 互动测验
- `src/views/LearningCards.vue` - 学习卡片

All views are imported and conditionally rendered in `App.vue` based on `currentTab` state.

### Build Metadata System
The app injects build version and timestamp at build time:
- `scripts/build-meta.mjs` - Generates `__APP_VERSION__` and `__BUILD_TIME__` defines
- `vite.config.js` - Calls `createBuildDefines()` to inject metadata
- `App.vue` - Displays version in footer

## Deployment Architecture

### Atomic Release System
Deployment uses an **atomic release pattern** with symlinks:

```
/var/www/kindergarten-learning-app/
├── releases/
│   ├── 20260403T010000Z-abcdef1/
│   └── 20260403T013000Z-1234567/
└── current -> releases/20260403T013000Z-1234567
```

Benefits:
- Zero-downtime deployments (atomic symlink switch)
- Easy rollbacks (repoint `current` to previous release)
- No Node.js runtime needed on server

### Deployment Commands

```bash
# One-time server setup (installs nginx, creates directories)
npm run server:bootstrap

# Enable HTTPS with Let's Encrypt (for IP-based deployments)
npm run server:https

# Deploy to server
npm run deploy

# Deploy without rebuilding (use existing dist/)
npm run deploy -- --skip-build
```

### Deployment Configuration
Copy `.env.deploy.example` to `.env.deploy.local` and configure:
- `DEPLOY_HOST` - Server IP/hostname
- `DEPLOY_USER` - SSH user
- `DEPLOY_PORT` - SSH port (default 22)
- `DEPLOY_IDENTITY_FILE` - SSH key path
- `DEPLOY_REMOTE_ROOT` - Remote deployment root
- `DEPLOY_SERVER_NAME` - Nginx server_name
- `DEPLOY_CERTBOT_EMAIL` - Email for Let's Encrypt (optional)

### Deployment Scripts
- `scripts/deploy.mjs` - Main deployment orchestration
- `scripts/deploy-lib.mjs` - Shared deployment utilities
- `scripts/bootstrap-server.sh` - Server initialization
- `scripts/enable-https.sh` - HTTPS setup with certbot

### GitHub Actions
`.github/workflows/deploy.yml` auto-deploys on push to `main`:
1. Runs tests
2. Builds production bundle
3. Deploys to Tencent Cloud server via rsync

Required GitHub Secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PORT`, `DEPLOY_REMOTE_ROOT`, `DEPLOY_SERVER_NAME`, `DEPLOY_SSH_KEY`

## Testing

Tests use Node.js native test runner (`node --test`). Test files should follow Node.js test conventions.
