#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
EXPECTED_ROOT="/opt/impious"

echo "==> Verifying repository root"
if [[ ! -d "${EXPECTED_ROOT}" ]]; then
  echo "    ${EXPECTED_ROOT} missing — attempting to create it."
  if ! mkdir -p "${EXPECTED_ROOT}" 2>/dev/null; then
    echo "    Unable to create ${EXPECTED_ROOT}. Run this script with sufficient privileges or create the directory manually."
  fi
fi

if [[ "${REPO_ROOT}" != "${EXPECTED_ROOT}" ]]; then
  cat <<EOF
    WARNING: This clone lives at ${REPO_ROOT}, but operations assume ${EXPECTED_ROOT}.
    Move or re-clone the repository to ${EXPECTED_ROOT} before running docker compose.
EOF
else
  echo "    Repo root confirmed at ${EXPECTED_ROOT}"
fi

echo "==> Ensuring deploy/.env exists"
ENV_TEMPLATE="${SCRIPT_DIR}/.env.example"
ENV_FILE="${SCRIPT_DIR}/.env"
if [[ ! -f "${ENV_TEMPLATE}" ]]; then
  echo "    ERROR: ${ENV_TEMPLATE} is missing. Ensure it is tracked in git."
  exit 1
fi

if [[ -f "${ENV_FILE}" ]]; then
  echo "    deploy/.env already present, leaving it untouched."
else
  cp "${ENV_TEMPLATE}" "${ENV_FILE}"
  echo "    Created deploy/.env from deploy/.env.example."
  echo "    IMPORTANT: Set CADDY_ADMIN_EMAIL to a deliverable address before production."
fi

echo "==> Ensuring codex payload directories exist"
for dir in "${REPO_ROOT}/codex-payload" "${REPO_ROOT}/codex-payload-dev"; do
  if [[ -d "${dir}" ]]; then
    echo "    OK: ${dir}"
  else
    mkdir -p "${dir}"
    echo "    Created ${dir}"
  fi
done

cat <<'EOF'
==> Next steps
- Dev/Staging:  cd deploy && docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
- Production:   cd deploy && docker compose up -d --remove-orphans   # requires real CADDY_ADMIN_EMAIL in deploy/.env

Nothing destructive was run. Adjust deploy/.env as needed, drop artifacts into codex-payload*, then re-run the compose commands.
EOF
