#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -f "${PROJECT_ROOT}/.env.deploy.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${PROJECT_ROOT}/.env.deploy.local"
  set +a
fi

DEPLOY_HOST="${DEPLOY_HOST:-82.156.153.243}"
DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_IDENTITY_FILE="${DEPLOY_IDENTITY_FILE:-$HOME/.ssh/id_ed25519}"
DEPLOY_APP_NAME="${DEPLOY_APP_NAME:-kindergarten-learning-app}"
DEPLOY_REMOTE_ROOT="${DEPLOY_REMOTE_ROOT:-/var/www/${DEPLOY_APP_NAME}}"
DEPLOY_SERVER_NAME="${DEPLOY_SERVER_NAME:-_}"

SSH_TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"
SSH_OPTS=(
  -p "${DEPLOY_PORT}"
  -o BatchMode=yes
  -o StrictHostKeyChecking=accept-new
  -i "${DEPLOY_IDENTITY_FILE}"
)

ssh "${SSH_OPTS[@]}" "${SSH_TARGET}" \
  DEPLOY_APP_NAME="${DEPLOY_APP_NAME}" \
  DEPLOY_REMOTE_ROOT="${DEPLOY_REMOTE_ROOT}" \
  DEPLOY_SERVER_NAME="${DEPLOY_SERVER_NAME}" \
  'bash -s' <<'REMOTE'
set -euo pipefail

sudo apt-get update
sudo apt-get install -y nginx rsync

sudo mkdir -p "${DEPLOY_REMOTE_ROOT}/releases"
sudo chown -R "${USER}:${USER}" "${DEPLOY_REMOTE_ROOT}"

TMP_CONF="$(mktemp)"
cat > "${TMP_CONF}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DEPLOY_SERVER_NAME};

    root ${DEPLOY_REMOTE_ROOT}/current;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /assets/ {
        try_files \$uri =404;
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
    }

    location = /favicon.ico {
        log_not_found off;
        access_log off;
    }

    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
}
EOF

sudo mv "${TMP_CONF}" "/etc/nginx/sites-available/${DEPLOY_APP_NAME}.conf"
sudo ln -sfn "/etc/nginx/sites-available/${DEPLOY_APP_NAME}.conf" "/etc/nginx/sites-enabled/${DEPLOY_APP_NAME}.conf"
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
REMOTE

echo "Server bootstrap complete for http://${DEPLOY_HOST}"
