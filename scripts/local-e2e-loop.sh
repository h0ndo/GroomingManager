#!/usr/bin/env bash
set -euo pipefail

# Reproducible local GroomingManager E2E loop for profile workers.
# Does not print env-file contents. Docker Compose reads deploy/.env.local if it
# exists, otherwise the checked-in deploy/.env.local.example defaults are used.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
ROOT_DIR_NATIVE="$(pwd -W 2>/dev/null || pwd)"

ENV_FILE="${ENV_FILE:-deploy/.env.local}"
if [[ ! -f "$ENV_FILE" ]]; then
  ENV_FILE="deploy/.env.local.example"
fi

COMPOSE=(docker compose --env-file "$ENV_FILE" -f deploy/docker-compose.local-dev.yml -f deploy/docker-compose.e2e.yml --profile app)
BASE_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:3000}"
RUN_TERRAFORM="false"
RUN_PLAYWRIGHT="false"
STOP_AFTER="false"

usage() {
  cat <<'USAGE'
Usage: scripts/local-e2e-loop.sh [--check-only] [--terraform] [--playwright] [--stop-after]

Starts the local E2E Compose stack, waits for proxy/Keycloak/backend health,
and optionally applies the local Keycloak Terraform config and runs Playwright.

Options:
  --check-only   Only validate the Compose service graph and print current status.
  --terraform    Apply infra/keycloak with test_users_enabled=true after Keycloak is ready.
                 For deploy/.env.local, export TF_VAR_keycloak_admin_password yourself;
                 the script never reads or prints secrets from env files.
  --playwright   Run playwright/npm tests after readiness checks.
  --stop-after   Stop the E2E stack with volumes after the checks/tests finish.

Environment:
  ENV_FILE              Compose env file, default deploy/.env.local or example fallback.
  PLAYWRIGHT_BASE_URL   Base URL for checks/tests, default http://localhost:3000.
USAGE
}

wait_for_url() {
  local label="$1"
  local url="$2"
  local attempts="${3:-120}"

  for i in $(seq 1 "$attempts"); do
    if curl -fsS --max-time 5 "$url" >/dev/null; then
      echo "OK $label: $url"
      return 0
    fi
    sleep 2
  done

  echo "ERROR $label did not become ready: $url" >&2
  "${COMPOSE[@]}" ps >&2 || true
  "${COMPOSE[@]}" logs --tail=200 local-proxy keycloak backend >&2 || true
  return 1
}

check_services() {
  local services
  services="$(${COMPOSE[@]} config --services)"
  for service in local-proxy frontend backend migrate keycloak db; do
    if ! grep -qx "$service" <<< "$services"; then
      echo "ERROR missing Compose service: $service" >&2
      return 1
    fi
  done
  echo "OK Compose services: local-proxy frontend backend migrate keycloak db"
}

run_terraform() {
  local tf_password="${TF_VAR_keycloak_admin_password:-}"
  if [[ -z "$tf_password" && "$ENV_FILE" == "deploy/.env.local.example" ]]; then
    tf_password="admin"
  fi
  if [[ -z "$tf_password" ]]; then
    echo "ERROR --terraform requires TF_VAR_keycloak_admin_password for non-example env files." >&2
    echo "The script intentionally does not read secrets from $ENV_FILE." >&2
    return 1
  fi

  local tf_url="${TF_VAR_keycloak_url:-$BASE_URL/auth}"
  local tf_username="${TF_VAR_keycloak_admin_username:-admin}"
  local tf_realm="${TF_VAR_realm:-grooming-manager}"
  local tf_app_url="${TF_VAR_app_url:-$BASE_URL}"
  local tf_client_id="${TF_VAR_oidc_client_id:-grooming-manager-app}"
  local tf_test_users="${TF_VAR_test_users_enabled:-true}"

  if command -v terraform >/dev/null 2>&1; then
    (
      cd infra/keycloak
      TF_VAR_keycloak_url="$tf_url" \
      TF_VAR_keycloak_admin_username="$tf_username" \
      TF_VAR_keycloak_admin_password="$tf_password" \
      TF_VAR_realm="$tf_realm" \
      TF_VAR_app_url="$tf_app_url" \
      TF_VAR_oidc_client_id="$tf_client_id" \
      TF_VAR_test_users_enabled="$tf_test_users" \
        terraform init -input=false

      TF_VAR_keycloak_url="$tf_url" \
      TF_VAR_keycloak_admin_username="$tf_username" \
      TF_VAR_keycloak_admin_password="$tf_password" \
      TF_VAR_realm="$tf_realm" \
      TF_VAR_app_url="$tf_app_url" \
      TF_VAR_oidc_client_id="$tf_client_id" \
      TF_VAR_test_users_enabled="$tf_test_users" \
        terraform apply -input=false -auto-approve
    )
    return 0
  fi

  if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR terraform not found and Docker is unavailable for the Terraform fallback." >&2
    return 1
  fi

  local keycloak_container
  keycloak_container="$(${COMPOSE[@]} ps -q keycloak)"
  if [[ -z "$keycloak_container" ]]; then
    echo "ERROR Keycloak container not found; start the stack before --terraform." >&2
    return 1
  fi

  echo "Terraform CLI not found; using hashicorp/terraform:1.9.8 container."
  MSYS2_ARG_CONV_EXCL='*' docker run --rm \
    --network "container:$keycloak_container" \
    -v "$ROOT_DIR_NATIVE/infra/keycloak:/workspace" \
    -w /workspace \
    -e TF_VAR_keycloak_url="${TF_VAR_keycloak_url:-http://localhost:8080/auth}" \
    -e TF_VAR_keycloak_admin_username="$tf_username" \
    -e TF_VAR_keycloak_admin_password="$tf_password" \
    -e TF_VAR_realm="$tf_realm" \
    -e TF_VAR_app_url="$tf_app_url" \
    -e TF_VAR_oidc_client_id="$tf_client_id" \
    -e TF_VAR_test_users_enabled="$tf_test_users" \
    hashicorp/terraform:1.9.8 init -input=false

  MSYS2_ARG_CONV_EXCL='*' docker run --rm \
    --network "container:$keycloak_container" \
    -v "$ROOT_DIR_NATIVE/infra/keycloak:/workspace" \
    -w /workspace \
    -e TF_VAR_keycloak_url="${TF_VAR_keycloak_url:-http://localhost:8080/auth}" \
    -e TF_VAR_keycloak_admin_username="$tf_username" \
    -e TF_VAR_keycloak_admin_password="$tf_password" \
    -e TF_VAR_realm="$tf_realm" \
    -e TF_VAR_app_url="$tf_app_url" \
    -e TF_VAR_oidc_client_id="$tf_client_id" \
    -e TF_VAR_test_users_enabled="$tf_test_users" \
    hashicorp/terraform:1.9.8 apply -input=false -auto-approve
}

for arg in "$@"; do
  case "$arg" in
    --check-only) check_services; "${COMPOSE[@]}" ps; exit 0 ;;
    --terraform) RUN_TERRAFORM="true" ;;
    --playwright) RUN_PLAYWRIGHT="true" ;;
    --stop-after) STOP_AFTER="true" ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $arg" >&2; usage; exit 2 ;;
  esac
done

cleanup() {
  if [[ "$STOP_AFTER" == "true" ]]; then
    "${COMPOSE[@]}" down -v --remove-orphans
  fi
}
trap cleanup EXIT

echo "Using Compose env file: $ENV_FILE"
check_services
"${COMPOSE[@]}" up -d --build

wait_for_url "Keycloak master realm" "$BASE_URL/auth/realms/master/.well-known/openid-configuration"
wait_for_url "Backend readiness" "$BASE_URL/actuator/health/readiness"
wait_for_url "Backend API status" "$BASE_URL/api/status"
wait_for_url "Frontend/proxy" "$BASE_URL/"

if [[ "$RUN_TERRAFORM" == "true" ]]; then
  run_terraform
  wait_for_url "GroomingManager realm" "$BASE_URL/auth/realms/grooming-manager/.well-known/openid-configuration" 60
fi

if [[ "$RUN_PLAYWRIGHT" == "true" ]]; then
  (cd playwright && npm ci && PLAYWRIGHT_BASE_URL="$BASE_URL" npm test)
fi

"${COMPOSE[@]}" ps
echo "Local E2E loop ready at $BASE_URL"
