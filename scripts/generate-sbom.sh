#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SBOM_DIR="${ROOT_DIR}/sbom"
mkdir -p "${SBOM_DIR}"

printf 'Generating frontend npm SBOM...\n'
(
  cd "${ROOT_DIR}/frontend"
  npm ci
  npx -y @cyclonedx/cyclonedx-npm@5.0.0 \
    --package-lock-only \
    --output-reproducible \
    --output-format JSON \
    --output-file "${SBOM_DIR}/frontend-npm.cdx.json"
)

printf 'Generating backend Maven SBOM...\n'
if command -v java >/dev/null 2>&1 && [ -n "${JAVA_HOME:-}" ]; then
  (
    cd "${ROOT_DIR}/backend"
    ./mvnw -B org.cyclonedx:cyclonedx-maven-plugin:2.9.1:makeAggregateBom \
      -DschemaVersion=1.6 \
      -DoutputFormat=json \
      -DoutputName=backend-maven \
      -DoutputDirectory="${SBOM_DIR}"
  )
else
  MSYS_NO_PATHCONV=1 docker run --rm \
    -v "${ROOT_DIR}:/repo" \
    -w /repo/backend \
    maven:3.9.11-eclipse-temurin-21 \
    mvn -B org.cyclonedx:cyclonedx-maven-plugin:2.9.1:makeAggregateBom \
      -DschemaVersion=1.6 \
      -DoutputFormat=json \
      -DoutputName=backend-maven \
      -DoutputDirectory=/repo/sbom
fi

printf '\nGenerated SBOM files:\n'
ls -lh "${SBOM_DIR}"/*.cdx.json "${SBOM_DIR}"/backend-maven.json 2>/dev/null || ls -lh "${SBOM_DIR}"
