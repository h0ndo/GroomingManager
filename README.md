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
- **Führungskraft**: sieht operative Übersichten, Team-/Kapazitätssteuerung und Eskalationen.
- **Angestellte:r**: bearbeitet Termine, Grooming-Aufgaben und Kund:innen-/Tierkontexte.
- **Kund:in**: nutzt optional ein Portal für eigene Tiere, Terminanfragen und Kommunikation.

Technische Rollen:

```text
admin           -> ROLE_admin
fuehrungskraft -> ROLE_fuehrungskraft
angestellter   -> ROLE_angestellter
kunde          -> ROLE_kunde
```

## Lokale Entwicklung

```bash
docker compose --env-file deploy/.env.local.example -f deploy/docker-compose.local-dev.yml up -d
```

Browser-URL:

http://localhost:3000

Frontend und Backend können lokal auf dem Host laufen, während PostgreSQL, Keycloak, Flyway und der lokale Nginx-Proxy in Docker laufen.

## E2E

```bash
docker compose \
  --env-file deploy/.env.local.example \
  -f deploy/docker-compose.local-dev.yml \
  -f deploy/docker-compose.e2e.yml \
  --profile app \
  up -d --build

cd playwright
npm test
```

## Dokumentation

- `docs/fachkonzept.md` — Grooming-Fachkonzept und Rollenmodell
- `docs/mvp.md` — erstes MVP für GroomingManager
- `docs/cloud-deployment.md` — Kundeninstanz-/Deployment-Modell
- `docs/security.md` — OIDC/Rollen/Backend-Absicherung
- `infra/keycloak/README.md` — Keycloak Terraform Setup
