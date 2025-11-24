#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXPORT_DIR="${ROOT_DIR}/exports"
mkdir -p "${EXPORT_DIR}"

DATE_PREFIX="$(date +%F)"
OUTPUT_FILE="${EXPORT_DIR}/emails-${DATE_PREFIX}.csv"

VOLUME_CANDIDATES=("caddy-stack_enlist_data" "deploy_enlist_data")
VOLUME_NAME=""

for candidate in "${VOLUME_CANDIDATES[@]}"; do
  if docker volume inspect "$candidate" >/dev/null 2>&1; then
    VOLUME_NAME="$candidate"
    break
  fi
done

if [[ -z "${VOLUME_NAME}" ]]; then
  AVAILABLE_VOLUMES="$(docker volume ls --format '{{.Name}}' || true)"
  {
    echo "Error: could not find an email data volume (looked for: ${VOLUME_CANDIDATES[*]})." >&2
    echo "Available volumes:" >&2
    if [[ -n "${AVAILABLE_VOLUMES}" ]]; then
      echo "${AVAILABLE_VOLUMES}" >&2
    else
      echo "(none detected)" >&2
    fi
  }
  exit 1
fi

docker run --rm -v "${VOLUME_NAME}:/data:ro" alpine /bin/sh -c \
  "apk add --no-cache sqlite >/dev/null && sqlite3 -header -csv /data/emails.db \"SELECT id, email, created_at FROM emails ORDER BY id DESC;\"" \
  > "${OUTPUT_FILE}"

ROW_COUNT=0
if [[ -s "${OUTPUT_FILE}" ]]; then
  TOTAL_LINES="$(wc -l < "${OUTPUT_FILE}")"
  if [[ "${TOTAL_LINES}" -gt 1 ]]; then
    ROW_COUNT=$((TOTAL_LINES - 1))
  fi
fi

echo "✅ Exported ${ROW_COUNT} rows to ${OUTPUT_FILE}"
