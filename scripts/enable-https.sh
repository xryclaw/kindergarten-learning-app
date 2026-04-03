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
DEPLOY_SERVER_NAME="${DEPLOY_SERVER_NAME:-${DEPLOY_HOST}}"
DEPLOY_CERTBOT_EMAIL="${DEPLOY_CERTBOT_EMAIL:-}"
DEPLOY_ACME_ROOT="${DEPLOY_REMOTE_ROOT}/acme-webroot"

SSH_TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"
SSH_OPTS=(
  -p "${DEPLOY_PORT}"
  -o BatchMode=yes
  -o StrictHostKeyChecking=accept-new
  -i "${DEPLOY_IDENTITY_FILE}"
)

if [[ -n "${DEPLOY_CERTBOT_EMAIL}" ]]; then
  CERTBOT_IDENTITY_ARGS=(--email "${DEPLOY_CERTBOT_EMAIL}")
else
  CERTBOT_IDENTITY_ARGS=(--register-unsafely-without-email)
fi

ssh "${SSH_OPTS[@]}" "${SSH_TARGET}" \
  DEPLOY_HOST="${DEPLOY_HOST}" \
  DEPLOY_REMOTE_ROOT="${DEPLOY_REMOTE_ROOT}" \
  DEPLOY_SERVER_NAME="${DEPLOY_SERVER_NAME}" \
  DEPLOY_ACME_ROOT="${DEPLOY_ACME_ROOT}" \
  CERTBOT_IDENTITY_ARGS="${CERTBOT_IDENTITY_ARGS[*]}" \
  'bash -s' <<'REMOTE'
set -euo pipefail

sudo apt-get update
sudo apt-get install -y curl nginx openssl rsync snapd

sudo mkdir -p "${DEPLOY_REMOTE_ROOT}/releases"
sudo mkdir -p "${DEPLOY_ACME_ROOT}/.well-known/acme-challenge"
sudo chown -R "${USER}:${USER}" "${DEPLOY_REMOTE_ROOT}"

sudo snap install core >/dev/null 2>&1 || true
sudo snap refresh core >/dev/null 2>&1 || true
sudo snap install --classic certbot >/dev/null 2>&1 || true

eval "set -- ${CERTBOT_IDENTITY_ARGS}"
CERTBOT_IDENTITY=("$@")

sudo /snap/bin/certbot certonly \
  --non-interactive \
  --agree-tos \
  --preferred-profile shortlived \
  --key-type ecdsa \
  --ip-address "${DEPLOY_HOST}" \
  --webroot \
  -w "${DEPLOY_ACME_ROOT}" \
  --server https://acme-v02.api.letsencrypt.org/directory \
  --force-renewal \
  "${CERTBOT_IDENTITY[@]}"

TMP_CONF="$(mktemp)"
cat > "${TMP_CONF}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DEPLOY_SERVER_NAME} _;

    location ^~ /.well-known/acme-challenge/ {
        root ${DEPLOY_ACME_ROOT};
        default_type text/plain;
        try_files \$uri =404;
    }

    location / {
        return 301 https://${DEPLOY_HOST}\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DEPLOY_SERVER_NAME} ${DEPLOY_HOST};

    root ${DEPLOY_REMOTE_ROOT}/current;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/${DEPLOY_HOST}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DEPLOY_HOST}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    location ^~ /.well-known/acme-challenge/ {
        root ${DEPLOY_ACME_ROOT};
        default_type text/plain;
        try_files \$uri =404;
    }

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

sudo mv "${TMP_CONF}" "/etc/nginx/sites-available/kindergarten-learning-app.conf"
sudo ln -sfn "/etc/nginx/sites-available/kindergarten-learning-app.conf" "/etc/nginx/sites-enabled/kindergarten-learning-app.conf"
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl reload nginx
REMOTE

echo "HTTPS enabled for https://${DEPLOY_HOST}"
