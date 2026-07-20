#!/usr/bin/env bash
# Syncs VITE_BASE_URL in Frontend/.env to this EC2 instance's current public
# hostname/IP, then rebuilds + restarts the frontend container so the new
# value gets baked into the Vite build (VITE_BASE_URL is a build-time arg).
#
# Run manually after a reboot, or install as a systemd unit
# (see frontend-ip-sync.service in this folder) to run automatically on boot.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$FRONTEND_DIR/.env"
SERVICE_NAME="frontend"
LOG_FILE="${LOG_FILE:-/var/log/frontend-ip-sync.log}"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

if [ ! -f "$ENV_FILE" ]; then
  log "ERROR: $ENV_FILE not found. Aborting."
  exit 1
fi

log "Starting frontend IP sync"

TOKEN="$(curl -s --max-time 5 -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")"

NEW_HOST="$(curl -s --max-time 5 -H "X-aws-ec2-metadata-token: $TOKEN" \
  http://169.254.169.254/latest/meta-data/public-hostname)"

if [ -z "$NEW_HOST" ]; then
  NEW_HOST="$(curl -s --max-time 5 -H "X-aws-ec2-metadata-token: $TOKEN" \
    http://169.254.169.254/latest/meta-data/public-ipv4)"
fi

if [ -z "$NEW_HOST" ]; then
  log "ERROR: could not resolve public hostname/IP from EC2 metadata. Aborting."
  exit 1
fi

log "Detected public host: $NEW_HOST"

CURRENT_URL="$(grep -E '^VITE_BASE_URL=' "$ENV_FILE" | head -n1 | cut -d '=' -f2-)"

if [ -z "$CURRENT_URL" ]; then
  log "ERROR: VITE_BASE_URL not set in $ENV_FILE. Aborting."
  exit 1
fi

SCHEME="$(echo "$CURRENT_URL" | sed -E 's#^(https?)://.*#\1#')"
URL_PATH="$(echo "$CURRENT_URL" | sed -E 's#^https?://[^/]+(/.*)?$#\1#')"
NEW_URL="${SCHEME}://${NEW_HOST}${URL_PATH}"

if [ "$CURRENT_URL" = "$NEW_URL" ]; then
  log "IP/hostname unchanged ($NEW_URL). Skipping rebuild."
  exit 0
fi

log "Updating VITE_BASE_URL: $CURRENT_URL -> $NEW_URL"
sed -i.bak -E "s#^VITE_BASE_URL=.*#VITE_BASE_URL=${NEW_URL}#" "$ENV_FILE"
rm -f "${ENV_FILE}.bak"

cd "$FRONTEND_DIR"
docker compose up -d --build "$SERVICE_NAME" 2>&1 | tee -a "$LOG_FILE"

log "Frontend rebuilt and restarted with new host: $NEW_HOST"
