# Cloud-Deployment-Konzept

## Ziel

GroomingManager soll so vorbereitet werden, dass für neue Kund:innen schnell eine eigene Instanz bereitgestellt werden kann:

```text
Kunde A -> eigene Domain/Subdomain -> eigene App -> eigene Datenbank
Kunde B -> eigene Domain/Subdomain -> eigene App -> eigene Datenbank
```

Das Ziel ist ein **cloud-ready Deployment**, bei dem auf einem Server im Idealfall nur noch Kundendaten in einer `.env` gesetzt werden und dann gestartet wird:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d
```

## Bevorzugte Betriebsart

Für Gesundheits-/Kundendaten ist zunächst **Instanz pro Kunde** sinnvoller als eine große gemeinsame Multi-Tenant-Datenbank.

Vorteile:

- klare Datentrennung,
- einfachere DSGVO-Argumentation,
- Kund:innen können separat gesichert, migriert oder gelöscht werden,
- Fehler oder Last eines Kunden beeinflussen andere weniger,
- spätere Enterprise-Kunden können eine eigene VM bekommen.

## Zielarchitektur pro Kundeninstanz

```text
Internet
  |
  v
Nginx Reverse Proxy
  |
  +--> /        Angular Frontend
  +--> /api     Spring Boot Backend
  +--> /auth    Keycloak

Flyway Migration Container (one-shot vor Backend-Start)
  |
  v
PostgreSQL Datenbank
  |-- App-Datenbank
  |-- Keycloak-Datenbank
```

Im Repository liegt dafür ein erster Deployment-Entwurf unter `deploy/`:

- `deploy/docker-compose.yml` — Angular Frontend, Spring Boot Backend, PostgreSQL, Keycloak, Flyway, Nginx Reverse Proxy.
- `deploy/nginx/templates/default.conf.template` — Nginx Reverse Proxy: `/` zum Frontend, `/api` zum Backend und `/auth` zu Keycloak.
- `deploy/.env.example` — Vorlage für kundenspezifische Konfiguration.
- `deploy/db-init/01-create-keycloak-db.sh` — legt die separate Keycloak-Datenbank beim ersten DB-Start an.
- `deploy/migrations/` — Flyway-SQL-Migrationen für die App-Datenbank.

## Server-Anbieter

Für den Start ist **Hetzner Cloud** besonders passend:

- deutscher/europäischer Anbieter,
- gutes Preis-Leistungs-Verhältnis,
- einfache VMs,
- Snapshots, Backups, Firewalls,
- gut mit Docker Compose, Ansible und Terraform nutzbar.

Alternativen:

- IONOS Cloud, wenn ein stärker klassischer deutscher Business-Anbieter gewünscht ist.
- DigitalOcean, wenn Developer Experience wichtiger ist als deutscher Anbieter.
- Render/Fly.io, wenn weniger Serverbetrieb gewünscht ist.
- AWS/Azure/GCP später, wenn Enterprise-Compliance und Skalierung wichtiger werden.

## Deployment-Ablauf für eine neue Kundeninstanz

1. Server oder Verzeichnis für Kund:in vorbereiten.
2. Domain/Subdomain setzen, z. B. `kunde-demo.app.example.de`.
3. DNS A/AAAA Record auf Server-IP zeigen lassen.
4. Repository oder Release-Dateien auf Server ablegen.
5. `.env` aus Vorlage erstellen:

```bash
cp deploy/.env.example deploy/.env
```

6. Kundenspezifische Werte setzen:

```env
COMPOSE_PROJECT_NAME=grooming-manager-kunde-demo
APP_DOMAIN=kunde-demo.app.example.de
POSTGRES_PASSWORD=<starkes-passwort>
SESSION_SECRET=<starkes-secret>
INITIAL_ADMIN_EMAIL=admin@kunde-demo.de
INITIAL_ADMIN_PASSWORD=<initiales-passwort>
```

7. Container starten:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d
```

8. Prüfen:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml ps
docker compose --env-file deploy/.env -f deploy/docker-compose.yml logs -f backend
```

## Wichtige Produktanforderungen daraus

Damit die App wirklich cloud-ready wird, sollte sie von Anfang an diese Regeln erfüllen:

1. **Konfiguration nur über Umgebungsvariablen**  
   Keine hart codierten Domains, Passwörter oder Datenbankverbindungen.

2. **Healthcheck-Endpunkt**  
   Die App sollte z. B. `GET /health` anbieten. Keycloak Health/Metrics sind im Compose-Entwurf aktiviert.

3. **Authentifizierung über OIDC**  
   Die App soll Keycloak als OpenID-Connect Provider nutzen. Passwörter, MFA, Benutzer und grobe Rollen gehören nach Keycloak; fachliche Profile bleiben in der App.

4. **Migrationen mit Flyway**
   Datenbankschema muss reproduzierbar erstellt/aktualisiert werden können. Dafür läuft im Compose-Stack ein eigener `migrate` One-shot-Container mit Flyway vor dem App-Start. Keycloak verwaltet sein eigenes Schema selbst.

5. **Initialer Admin automatisierbar**  
   Neue Instanz soll per `INITIAL_ADMIN_EMAIL` und `INITIAL_ADMIN_PASSWORD` eingerichtet werden können. Keycloak-Realm und OIDC-Client sollten später per Realm-Import oder Setup-Script angelegt werden.

6. **Keine lokalen Dateiabhängigkeiten**  
   Uploads später entweder in ein Volume oder besser S3-kompatiblen Speicher auslagern.

7. **Logs nach stdout/stderr**  
   Container sollen Logs nicht nur in lokale Dateien schreiben.

8. **Backup-Konzept**  
   Mindestens App-Datenbank, Keycloak-Datenbank und Server-Snapshot. Bei Gesundheitsdaten regelmäßig testen, ob Restore funktioniert.

9. **Versionierbare Releases**  
   App-Image und Keycloak-Image sollten später nicht nur `latest`, sondern konkrete Versionen nutzen, z. B. `grooming-manager:1.0.3`.

## Sicherheitsanforderungen

- HTTPS immer aktiv. Im aktuellen Nginx-Entwurf terminiert TLS entweder vor dem Container, z. B. durch Load Balancer/Host-Nginx, oder wird später durch einen Certbot-/ACME-Begleitcontainer ergänzt.
- Starke Secrets pro Kunde.
- PostgreSQL nicht öffentlich ins Internet exponieren.
- Interner Docker-Network-Bereich für App und DB.
- Regelmäßige Updates für Host und Images.
- Rollen- und Rechteprüfung in der App.
- Audit-Log für sensible Änderungen.
- Auftragsverarbeitungsvertrag mit Hoster prüfen.
- Hosting idealerweise EU/Deutschland.

## Spätere Automatisierung

Wenn die manuelle Variante funktioniert, kann daraus ein Provisioning-Prozess entstehen:

```text
Kunde anlegen
  -> Subdomain erzeugen
  -> Server/Verzeichnis erstellen
  -> .env generieren
  -> docker compose starten
  -> Flyway migriert App-Datenbank
  -> Keycloak per Terraform konfigurieren
  -> Initial-Admin erzeugen
  -> Zugangsdaten sicher übermitteln
```

Mögliche Tools:

- Ansible für Server-Setup und Deployment,
- Terraform für Hetzner-Server, Firewall, DNS und Keycloak-Realm/-Client/-Rollen,
- GitHub Actions für Image-Builds,
- eigenes Admin-Panel für Kundeninstanzen.

## Offene Entscheidungen

1. Eine VM pro Kunde oder mehrere Kundeninstanzen pro VM?
2. PostgreSQL im Compose-Stack oder Managed PostgreSQL?
3. Uploads lokal per Docker Volume oder S3-kompatibel?
4. Backup zuerst über Hetzner Snapshots oder eigener Backup-Container?
5. Soll die App später echtes Multi-Tenant können oder bleibt Instanz-pro-Kunde das Standardmodell?
