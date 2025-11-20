#!/usr/bin/env bash
#
# Example deployment flow for operators or future CI/CD tooling.
# This script is intentionally conservative: it builds the site bundle, verifies
# committed artifacts, then refreshes the docker-compose stack.
#

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE_DIR="$REPO_ROOT/site"
DEPLOY_DIR="$REPO_ROOT/deploy"

echo "==> Repository root: $REPO_ROOT"
echo "==> Current branch: $(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)"

if [[ ! -f "$DEPLOY_DIR/.env" ]]; then
  echo "!! Missing deploy/.env. Copy deploy/.env.example and fill in secrets before deploying." >&2
  exit 1
fi

echo "==> Updating git checkout"
git -C "$REPO_ROOT" fetch --tags --prune
git -C "$REPO_ROOT" status -sb

echo "==> Installing site dependencies"
(cd "$SITE_DIR" && npm ci)

echo "==> Verifying static bundle matches source"
(cd "$SITE_DIR" && npm run verify:bundle)

echo "==> Refreshing docker-compose stack"
(cd "$DEPLOY_DIR" && docker compose pull --ignore-pull-failures)

echo "==> Starting services"
(cd "$DEPLOY_DIR" && docker compose up -d --remove-orphans "$@")

cat <<'EONEXT'

Notes:
- Pass "--profile game" if the multiplayer API is available.
- To target staging, run "npm run build:staging" before "npm run verify:bundle".
- deploy/.env controls host paths (SITE_BUNDLE_PATH, CODEX_PAYLOAD*, CADDY_ADMIN_EMAIL).

EONEXT
