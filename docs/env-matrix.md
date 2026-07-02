# Konfigurationsmatrix

Diese Matrix beschreibt die aktuell vorgesehenen Laufzeitumgebungen für GroomingManager. Ziel ist: lokale Entwicklung bleibt bequem, E2E ist reproduzierbar, und Kundeninstanzen sind früh cloud-ready.

## Überblick

| Umgebung | Zweck | Compose-Dateien | Env-Datei | App-URL | Typischer Befehl |
| --- | --- | --- | --- | --- | --- |
| Dev lokal | Hot Reload für Angular/Spring Boot auf dem Host, Infrastruktur in Docker | `deploy/docker-compose.local-dev.yml` | `deploy/.env.local` aus `deploy/.env.local.example` | `http://localhost:3000` | `docker compose --env-file deploy/.env.local -f deploy/docker-compose.local-dev.yml up -d` |
| E2E | Reproduzierbare Browser-Tests mit Frontend/Backend als Container | `deploy/docker-compose.local-dev.yml` + `deploy/docker-compose.e2e.yml` | `deploy/.env.local` | `http://localhost:3000` | `docker compose --env-file deploy/.env.local -f deploy/docker-compose.local-dev.yml -f deploy/docker-compose.e2e.yml --profile app up -d --build` |
| Prod-like | Lokaler oder Server-Test der kompletten Kundeninstanz | `deploy/docker-compose.yml` | `deploy/.env` aus `deploy/.env.example` | `https://<APP_DOMAIN>` oder lokal über `HTTP_PORT` | `docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build` |
| Kundeninstanz | Produktive Instanz pro Kunde/Kundenorganisation | `deploy/docker-compose.yml` | kundenspezifisches `deploy/.env` | `https://<kunden-subdomain>` | `docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d` |

## Dev lokal

Verwenden, wenn Frontend und Backend direkt auf dem Host laufen sollen.

Dienste in Docker:

```text
local-proxy
PostgreSQL
Flyway one-shot migrate
Keycloak
optional LLM-Service
```

Host-Prozesse:

```text
Angular Dev Server: localhost:4200
Spring Boot:        localhost:8080
```

Wichtige Variablen:

```env
APP_PUBLIC_URL=http://localhost:3000
KEYCLOAK_PUBLIC_URL=http://localhost:3000/auth
LOCAL_DEV_HTTP_PORT=3000
LOCAL_DEV_POSTGRES_PORT=5432
LOCAL_FRONTEND_UPSTREAM=host.docker.internal:4200
LOCAL_BACKEND_UPSTREAM=host.docker.internal:8080
SPRING_FLYWAY_ENABLED=false
```

Start:

```bash
docker compose --env-file deploy/.env.local -f deploy/docker-compose.local-dev.yml up -d
```

Danach:

```bash
cd backend
./mvnw spring-boot:run

cd frontend
npm start
```

## E2E

Verwenden, wenn Playwright gegen echte Container für Frontend, Backend, Keycloak und PostgreSQL laufen soll.

Zusätzliche Services durch Overlay:

```text
frontend
backend
```

Der lokale Proxy routet dabei auf Docker-DNS-Namen:

```env
LOCAL_FRONTEND_UPSTREAM=frontend:80
LOCAL_BACKEND_UPSTREAM=backend:8080
```

Start:

```bash
docker compose --env-file deploy/.env.local \
  -f deploy/docker-compose.local-dev.yml \
  -f deploy/docker-compose.e2e.yml \
  --profile app \
  up -d --build
```

Test:

```bash
cd playwright
npm test
```

## Prod-like

Verwenden, um die spätere Kundeninstanz vollständig über Container zu testen.

Dienste:

```text
proxy
frontend
backend
migrate
keycloak
db
optional llm
```

Wichtige Unterschiede zu Dev/E2E:

- Frontend und Backend laufen nicht auf dem Host, sondern als Images/Container.
- Backend wartet auf `migrate` und deaktiviert Spring-Flyway: `SPRING_FLYWAY_ENABLED=false`.
- Der öffentliche Issuer ist `KEYCLOAK_PUBLIC_URL`, die interne JWK-URL geht direkt auf `keycloak:8080`.
- PostgreSQL ist nicht nach außen veröffentlicht.

Start:

```bash
cp deploy/.env.example deploy/.env
# Werte anpassen
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build
```

## Kundeninstanz

Jede Kundenorganisation/Kund:in bekommt eine eigene Compose-Projektinstanz mit eigener Domain, eigenen Secrets und eigener Datenbank.

Mindestens pro Instanz setzen:

```env
COMPOSE_PROJECT_NAME=grooming-manager-kunde-demo
APP_DOMAIN=kunde-demo.example.de
APP_PUBLIC_URL=https://kunde-demo.example.de
KEYCLOAK_PUBLIC_URL=https://kunde-demo.example.de/auth
POSTGRES_PASSWORD=<starkes-passwort>
KEYCLOAK_DB_PASSWORD=<starkes-passwort>
KEYCLOAK_ADMIN_PASSWORD=<starkes-passwort>
SESSION_SECRET=<starkes-secret>
INITIAL_ADMIN_EMAIL=admin@kunde-demo.de
INITIAL_ADMIN_PASSWORD=<initiales-passwort>
```

Betriebsregeln:

- Keine Demo-Secrets aus `deploy/.env.example` produktiv verwenden.
- `FRONTEND_IMAGE`, `BACKEND_IMAGE` und `KEYCLOAK_IMAGE` später auf feste Release-Tags pinnen.
- `POSTGRES_DB` und `KEYCLOAK_DB` bleiben getrennte Datenbanken im gleichen Postgres-Container.
- Flyway läuft als eigener one-shot Container vor Backend-Start.
- Keycloak-Realm/Client/Rollen werden per Terraform verwaltet.

## Optionaler LLM-Service

Der LLM-Service wird nur mit `deploy/docker-compose.llm.yml` und Profil `llm` gestartet.

Dev lokal, Backend auf Host:

```env
LLM_BASE_URL=http://localhost:8081
```

Compose-intern:

```env
LLM_BASE_URL=http://llm:8080
```

## Datei-Konventionen

| Datei | Committen? | Zweck |
| --- | --- | --- |
| `deploy/.env.example` | Ja | Vorlage für prod-like/Kundeninstanz |
| `deploy/.env.local.example` | Ja | Vorlage für lokale Entwicklung/E2E |
| `deploy/.env` | Nein | echte Kunden-/Server-Secrets |
| `deploy/.env.local` | Nein | lokale Entwickler-Secrets/Tokens |

## Verifikation

```bash
python - <<'PY'
from pathlib import Path
for file in ['deploy/.env.example', 'deploy/.env.local.example', 'docs/env-matrix.md']:
    assert Path(file).is_file(), file
PY
```
