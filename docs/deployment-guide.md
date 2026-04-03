# Deployment Guide

## Quick Start

One-click deployment to production server:

```bash
npm run deploy
```

## Server Information

- **Host**: 82.156.153.243
- **User**: ubuntu
- **OS**: Ubuntu 6.8.0 (x86_64)
- **Deploy Path**: /var/www/kindergarten-learning-app

## Prerequisites

1. SSH access configured (uses ~/.ssh/id_ed25519)
2. Server bootstrapped (run once): `npm run server:bootstrap`

## Deployment Process

The deployment script automatically:
1. Builds production bundle (`npm run build`)
2. Creates timestamped release directory
3. Syncs files via rsync
4. Atomically switches `current` symlink
5. Cleans up old releases (keeps 5 most recent)

## Commands

```bash
# Full deployment (build + deploy)
npm run deploy

# Deploy without rebuilding
npm run deploy -- --skip-build

# Bootstrap server (one-time setup)
npm run server:bootstrap

# Enable HTTPS with Let's Encrypt
npm run server:https
```

## Configuration

Settings are in `.env.deploy.local`:
- `DEPLOY_HOST`: Server IP/hostname
- `DEPLOY_USER`: SSH user
- `DEPLOY_PORT`: SSH port (default 22)
- `DEPLOY_IDENTITY_FILE`: SSH key path
- `DEPLOY_REMOTE_ROOT`: Remote deployment root
- `DEPLOY_SERVER_NAME`: Nginx server_name (use `_` for IP-based)

## Rollback

To rollback to a previous release:

```bash
ssh ubuntu@82.156.153.243
cd /var/www/kindergarten-learning-app
ls -la releases/  # Find previous release
ln -sfn releases/PREVIOUS_RELEASE current
```

## GitHub Actions

Auto-deployment is configured in `.github/workflows/deploy.yml`. Pushes to `main` trigger automatic deployment.
