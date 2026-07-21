#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEED_SQL="${SCRIPT_DIR}/customers.sql"

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

[[ -f "$SEED_SQL" ]] || fail "Missing dev customer seed SQL at ${SEED_SQL}"

declare -a required_names=("Katja Gross" "Mila Muster" "Alex Sommer")
for name in "${required_names[@]}"; do
  grep -Fq "$name" "$SEED_SQL" || fail "Missing required customer: ${name}"
done

seed_rows=$(grep -Eo "[[:alnum:]._-]+@grooming-manager\.local" "$SEED_SQL" | sort -u | wc -l | tr -d ' ')
[[ "$seed_rows" -ge 12 ]] || fail "Expected at least 12 seeded customers, found ${seed_rows}"

testfamilie_rows=$(grep -Eo "testfamilie\.[[:alnum:]._-]+@grooming-manager\.local" "$SEED_SQL" | sort -u | wc -l | tr -d ' ')
[[ "$testfamilie_rows" -ge 8 ]] || fail "Expected at least 8 Testfamilie customers, found ${testfamilie_rows}"

for column in display_name email phone communication_notes keycloak_subject; do
  grep -Fq "$column" "$SEED_SQL" || fail "Seed SQL does not mention required column: ${column}"
done

grep -Eq "WHERE[[:space:]]+NOT[[:space:]]+EXISTS|ON[[:space:]]+CONFLICT" "$SEED_SQL" \
  || fail "Seed SQL must be idempotent via WHERE NOT EXISTS or ON CONFLICT"

if [[ "${1:-}" == "--static" ]]; then
  printf 'Static customer seed checks passed: %s rows, %s Testfamilie rows.\n' "$seed_rows" "$testfamilie_rows"
  exit 0
fi

command -v docker >/dev/null 2>&1 || fail "docker is required for the database check"

COMPOSE_FILE="${SCRIPT_DIR}/../docker-compose.local-dev.yml"
ENV_FILE="${SCRIPT_DIR}/../.env.local"
[[ -f "$ENV_FILE" ]] || ENV_FILE="${SCRIPT_DIR}/../.env.local.example"

customer_count=$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T db \
  sh -lc 'psql -t -A -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select count(*) from customers where email like '\''%@grooming-manager.local'\'';"')

testfamilie_count=$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T db \
  sh -lc 'psql -t -A -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select count(*) from customers where display_name like '\''%Testfamilie%'\'';"')

[[ "$customer_count" -ge 12 ]] || fail "Expected at least 12 seeded customers in DB, found ${customer_count}"
[[ "$testfamilie_count" -ge 8 ]] || fail "Expected at least 8 Testfamilie customers in DB, found ${testfamilie_count}"

printf 'Database customer seed checks passed: %s seeded customers, %s Testfamilie customers.\n' "$customer_count" "$testfamilie_count"
