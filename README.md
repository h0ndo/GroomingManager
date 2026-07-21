# GroomingManager

Cloud-ready Basis-App für Grooming-/Tierpflegebetriebe: Termin- und Kundenmanagement, Rollen, Login, Docker-Compose-Deployment und reproduzierbare lokale Entwicklung.

> Lokaler Pfad: `C:\projekte\grooming-manager`
> Produktname: **GroomingManager**

## Ziel

GroomingManager ist eine konkrete App auf Basis des `app-template` Repositories. Sie startet mit der wiederverwendbaren technischen Grundlage und einem fachlichen Fokus auf Tierpflege-/Grooming-Betriebe.

Technische Grundlage:

- Angular Frontend mit PrimeNG,
- Java Spring Boot Backend,
- PostgreSQL als App-Datenbank,
- separate Flyway-Migrationen als One-Shot-Container,
- Keycloak/OIDC für Login und Rollen,
- Terraform für Keycloak Realm/Client/Rollen/Testnutzer,
- Nginx Reverse Proxy,
- Docker Compose für lokale Entwicklung, E2E und produktionsnahe Kundeninstanzen,
- GitHub Actions für CI, SBOM, Security Scan und echte Compose-E2E-Tests.

## Rollenmodell

- **Admin**: verwaltet Standort/Kundeninstanz, Einstellungen und Nutzer:innen.
- **Groomer**: bearbeitet Termine, Grooming-Aufgaben und Kund:innen-/Tierkontexte.
- **Kund:in**: nutzt optional ein Portal für eigene Tiere, Terminanfragen und Kommunikation.

Technische Rollen:

```text
admin   -> ROLE_admin
groomer -> ROLE_groomer
kunde   -> ROLE_kunde
```

## Lokale Entwicklung

```bash
cp deploy/.env.local.example deploy/.env.local
docker compose --env-file deploy/.env.local -f deploy/docker-compose.local-dev.yml up -d
```

Browser-URL:

http://localhost:3000

Frontend und Backend können lokal auf dem Host laufen, während PostgreSQL, Keycloak, Flyway und der lokale Nginx-Proxy in Docker laufen.

### Lokale Testkund:innen seed-en

Für reproduzierbare lokale Kund:innen-Daten gibt es einen dev-only Seed außerhalb der produktiven Flyway-Migrationen:

```bash
./deploy/dev-seed/run-customer-seed.sh
```

Der Seed legt mindestens 12 lokale Kund:innen an, darunter 8 Einträge mit dem Suchmuster `Testfamilie`, und ist idempotent. Erzeugte Seed-Daten können bei Bedarf wieder entfernt werden:

```bash
./deploy/dev-seed/reset-customer-seed.sh
```

Nur die Seed-Datei statisch prüfen:

```bash
./deploy/dev-seed/check-customer-seed.sh --static
```

Schneller Stack-Check ohne Secrets auszugeben:

```bash
scripts/local-e2e-loop.sh --check-only
```

## E2E

```bash
scripts/local-e2e-loop.sh --terraform --playwright
```

Der Script-Loop startet Frontend, Backend, PostgreSQL, Flyway, Keycloak und Nginx über Compose, wartet auf Healthchecks und führt optional Terraform/Playwright aus. Falls Terraform lokal nicht installiert ist, nutzt der Loop `hashicorp/terraform:1.9.8` im Docker-Container. Für ein eigenes `deploy/.env.local` muss `TF_VAR_keycloak_admin_password` vor `--terraform` in der Shell gesetzt werden; das Script liest oder druckt keine Secrets aus Env-Dateien.

## Dokumentation

- `docs/fachkonzept.md` — Grooming-Fachkonzept und Rollenmodell
- `docs/mvp.md` — erstes MVP für GroomingManager
- `docs/cloud-deployment.md` — Kundeninstanz-/Deployment-Modell
- `docs/security.md` — OIDC/Rollen/Backend-Absicherung
- `infra/keycloak/README.md` — Keycloak Terraform Setup
