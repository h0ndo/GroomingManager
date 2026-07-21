#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_FILE="${REPO_ROOT}/deploy/.env.local"
if [[ ! -f "$ENV_FILE" ]]; then
  ENV_FILE="${REPO_ROOT}/deploy/.env.local.example"
fi

COMPOSE_FILE="${REPO_ROOT}/deploy/docker-compose.local-dev.yml"
SEED_SQL="${SCRIPT_DIR}/customers.sql"

[[ -f "$SEED_SQL" ]] || { echo "Missing seed SQL: ${SEED_SQL}" >&2; exit 1; }

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T db \
  sh -lc 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < "$SEED_SQL"

"${SCRIPT_DIR}/check-customer-seed.sh"
