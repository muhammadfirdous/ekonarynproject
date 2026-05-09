#!/usr/bin/env bash
# Eko Naryn backup. Run from /srv/ekonaryn via cron (DEPLOYMENT.md §5.1).
# Outputs: /srv/ekonaryn/backups/<UTC-iso>/{db.sql.gz,uploads.tar.gz}
set -euo pipefail

cd "$(dirname "$0")/../.."   # → /srv/ekonaryn

STAMP=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
DEST="backups/${STAMP}"
mkdir -p "${DEST}"

# 1. Database (SQL dump, gzipped)
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-ekonaryn}" "${POSTGRES_DB:-ekonaryn}" \
  | gzip -9 > "${DEST}/db.sql.gz"

# 2. Uploads (tar.gz of the named volume)
docker run --rm \
  -v ekonaryn_api_uploads:/uploads:ro \
  -v "$(pwd)/${DEST}":/out \
  alpine \
  sh -c "cd /uploads && tar czf /out/uploads.tar.gz ."

# 3. Optional: push off-VPS via rclone
if [ -n "${BACKUP_REMOTE:-}" ] && [ -n "${BACKUP_BUCKET:-}" ]; then
  rclone copy "${DEST}" "${BACKUP_REMOTE}:${BACKUP_BUCKET}/${STAMP}/" \
    --transfers 4 --checkers 8
fi

# 4. Local retention: keep last 7 days
find backups -mindepth 1 -maxdepth 1 -type d -mtime +7 \
  -exec rm -rf {} +

echo "Backup complete: ${DEST}"
