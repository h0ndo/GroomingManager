# Playwright E2E Tests

Dieses Verzeichnis enthält End-to-End-Tests für GroomingManager.

## Ziel

Die ersten Tests prüfen den Login über Keycloak für die fachlichen Rollen:

```text
Admin:         admin@grooming-manager.local   / 123
Groomer:        groomer@grooming-manager.local / 123
Kund:in:        kunde@grooming-manager.local   / 123
```

Die Nutzer werden über Terraform in `infra/keycloak` als lokale Testnutzer angelegt, wenn `test_users_enabled = true` gesetzt ist.

## Installation

```bash
cd playwright
npm install
npx playwright install chromium
```

## Voraussetzungen

Für lokale Tests muss die App über den lokalen Dev-Proxy erreichbar sein:

```text
http://localhost:3000
```

Typischer Start:

```bash
docker compose --env-file deploy/.env.local -f deploy/docker-compose.local-dev.yml up -d
```

Zusätzlich müssen laufen:

```text
Angular Dev Server auf localhost:4200
Spring Boot Backend auf localhost:8080
Keycloak Realm/Client/Testnutzer per Terraform angewendet
```

## Test starten

```bash
cd playwright
npm test
```

Optional andere URL:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm test
```

## 3. E2E-Modus: App ebenfalls als Container starten

Für Playwright und reproduzierbare lokale Tests sollen Frontend und Backend ebenfalls in Docker laufen. Dafür gibt es ein Overlay:

```bash
scripts/local-e2e-loop.sh --terraform --playwright
```

Der Loop verwendet `deploy/.env.local`, falls vorhanden, sonst `deploy/.env.local.example`. Er validiert die Compose-Service-Liste, startet den E2E-Stack, wartet auf Keycloak, Backend-Readiness, `/api/status` und die Frontend-/Proxy-Startseite. Mit `--terraform` werden Realm, Client, Rollen und lokale Testnutzer angelegt; wenn Terraform lokal fehlt, wird `hashicorp/terraform:1.9.8` im Docker-Container genutzt. Bei einem eigenen `deploy/.env.local` muss `TF_VAR_keycloak_admin_password` bereits in der Shell gesetzt sein, weil das Script keine Secrets aus Env-Dateien liest oder ausgibt.

Nur prüfen, ohne zu starten:

```bash
scripts/local-e2e-loop.sh --check-only
```

Stack nach dem Lauf wieder entfernen:

```bash
scripts/local-e2e-loop.sh --terraform --playwright --stop-after
```

Wichtig: In diesem Modus zeigt der lokale Proxy nicht auf manuell gestartete Container-Namen, sondern auf Compose-Service-Namen:

```text
/    -> frontend:80
/api -> backend:8080
/auth -> keycloak:8080/auth
```

Das verhindert Nginx-Fehler wie:

```text
host not found in upstream "grooming-manager-local_backend"
```

Danach können die Login-Tests vom Host aus laufen:

```bash
cd playwright
npm test
```

## GitHub Actions E2E

Der GitHub Actions Workflow `.github/workflows/ci.yml` startet denselben E2E-Stack auf `ubuntu-latest`:

```text
docker compose --env-file deploy/.env.local.example \
  -f deploy/docker-compose.local-dev.yml \
  -f deploy/docker-compose.e2e.yml \
  --profile app \
  up -d --build
```

Danach konfiguriert der Job Keycloak per Terraform mit `test_users_enabled = true`, wartet auf Realm-Discovery und führt echte Playwright-Browsertests gegen `http://localhost:3000` aus.

Bei Fehlern gibt der Job Compose-Logs aus und lädt den Playwright-Report als GitHub Actions Artifact hoch.

## Hinweise

- Keycloak-Selbstregistrierung ist deaktiviert.
- Tests nutzen bewusst einfache lokale Testpasswörter. Diese Nutzer sind nur für lokale/dev/test-Umgebungen gedacht.
- Produktionsinstanzen dürfen `test_users_enabled` nicht aktivieren.
