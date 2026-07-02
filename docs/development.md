# Lokale Entwicklung

Für lokale Entwicklung gibt es zwei sinnvolle Modi.

## 1. Alles als Container starten

Das ist der produktionsähnliche Modus:

```bash
docker compose --env-file deploy/.env.example -f deploy/docker-compose.yml up --build
```

Dabei laufen:

```text
Nginx Reverse Proxy -> Angular Frontend Container
                    -> Spring Boot Backend Container
                    -> Keycloak
                    -> PostgreSQL
                    -> Flyway Migration Container
```

Dieser Modus ist gut, um das spätere Kundeninstanz-Deployment zu testen.

## 2. Frontend und Backend lokal starten, Infrastruktur in Docker

Das ist der bequemere Entwicklungsmodus mit Hot Reload.

Startet nur PostgreSQL, Flyway, Keycloak und einen lokalen Nginx-Proxy:

```bash
docker compose --env-file deploy/.env.local.example -f deploy/docker-compose.local-dev.yml up -d
```

Dann Backend lokal starten:

```bash
cd backend
SERVER_PORT=8080 \
DB_HOST=localhost \
DB_PORT=5432 \
DB_NAME=grooming_manager \
DB_USER=grooming_manager \
DB_PASSWORD=local_postgres_password \
SPRING_FLYWAY_ENABLED=false \
OIDC_JWK_SET_URI=http://localhost:3000/auth/realms/grooming-manager/protocol/openid-connect/certs \
APP_CORS_ALLOWED_ORIGINS=http://localhost:3000 \
./mvnw spring-boot:run
```

Dann Frontend lokal starten:

```bash
cd frontend
npm install
npm start
```

Danach die App über den lokalen Proxy öffnen:

```text
http://localhost:3000
```

Der lokale Proxy routet:

```text
/        -> Angular Dev Server auf host.docker.internal:4200
/api     -> lokales Spring Boot Backend auf host.docker.internal:8080
/auth    -> Keycloak Container
```

Dadurch nutzt der Browser dieselben relativen Pfade wie später im Deployment:

```text
/api
/auth
```

und wir vermeiden CORS-/Redirect-Unterschiede zwischen Entwicklung und Deployment.

## Warum zwei Nginx-Konfigurationen?

Es gibt zwei unterschiedliche Zwecke:

```text
deploy/nginx/templates/default.conf.template
```

ist der produktionsähnliche Reverse Proxy für die komplette Kundeninstanz.

```text
deploy/nginx/local-dev/templates/default.conf.template
```

ist der lokale Entwicklungsproxy, wenn Angular und Spring Boot direkt auf dem Host laufen.

Zusätzlich gibt es im Frontend-Image:

```text
frontend/docker/nginx/default.conf
```

Diese Datei ist kein Reverse Proxy für die Gesamtplattform, sondern nur die interne Nginx-Konfiguration des Frontend-Containers zum Ausliefern der statischen Angular-Dateien inklusive SPA-Fallback.

Zusätzlich gibt es einen E2E-/App-Container-Modus, bei dem Frontend und Backend ebenfalls als Compose-Services laufen:

```bash
docker compose --env-file deploy/.env.local \
  -f deploy/docker-compose.local-dev.yml \
  -f deploy/docker-compose.e2e.yml \
  --profile app \
  up -d --build
```

In diesem Modus verwendet der lokale Proxy die Docker-DNS-Service-Namen `frontend` und `backend`. Das ist robuster als manuell gestartete Container-Namen wie `grooming-manager-local_backend`, weil Nginx beim Start sofort abbrechen würde, wenn der Upstream-Name im Docker-Netz noch nicht existiert.

## Optionaler lokaler LLM-Service

Für KI-Funktionen kann zusätzlich der optionale LLM-Service gestartet werden:

```bash
docker compose --env-file deploy/.env.local \
  -f deploy/docker-compose.local-dev.yml \
  -f deploy/docker-compose.llm.yml \
  --profile llm \
  up -d
```

Wenn das Backend lokal auf dem Host läuft, nutzt es:

```text
LLM_BASE_URL=http://localhost:8081
```

Details siehe [`docs/llm.md`](llm.md).

Eine kompakte Übersicht der Modi und Env-Dateien steht in [`docs/env-matrix.md`](env-matrix.md).
