#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXPORT_DIR="${ROOT_DIR}/exports"
mkdir -p "${EXPORT_DIR}"

DATE_PREFIX="$(date +%F)"
OUTPUT_FILE="${EXPORT_DIR}/emails-${DATE_PREFIX}.csv"

# Auto-detect volume name (NixOS service vs Manual compose)
VOLUME_CANDIDATES=("caddy-stack_enlist_data" "deploy_enlist_data")
VOLUME_NAME=""
for candidate in "${VOLUME_CANDIDATES[@]}"; do
  if docker volume inspect "$candidate" >/dev/null 2>&1; then
    VOLUME_NAME="$candidate"
    break
  fi
done

if [[ -z "${VOLUME_NAME}" ]]; then
  echo "Error: could not find email volume. Checked: ${VOLUME_CANDIDATES[*]}" >&2
  exit 1
fi

echo "Exporting from volume: $VOLUME_NAME"
docker run --rm -v "${VOLUME_NAME}:/data:ro" alpine /bin/sh -c \
  "apk add --no-cache sqlite >/dev/null && sqlite3 -header -csv /data/emails.db \"SELECT id, email, created_at FROM emails ORDER BY id DESC;\"" \
  > "${OUTPUT_FILE}"
echo "✅ Exported to ${OUTPUT_FILE}"
