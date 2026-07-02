# Backup und Restore

Diese Basis beschreibt, wie App-Datenbank, Keycloak-Datenbank und Keycloak-Realm in einer Docker-Compose-Kundeninstanz gesichert und wiederhergestellt werden können.

> Wichtig: Backups enthalten Gesundheits-/Kundendaten und Auth-Daten. Sie müssen verschlüsselt, zugriffsbeschränkt und regelmäßig auf Restore-Fähigkeit getestet werden.

## Umfang

Pro Kundeninstanz sichern:

```text
1. App-Datenbank:      POSTGRES_DB
2. Keycloak-Datenbank: KEYCLOAK_DB
3. Keycloak-Realm:     KEYCLOAK_REALM Export
4. deploy/.env:        separat und sicher im Secret-/Passwortmanager
```

Nicht als Klartext in Git sichern:

```text
deploy/.env
deploy/.env.local
*.dump
*.sql
*.tar
*.zip
```

## Backup-Verzeichnis

Beispiel lokal auf dem Server:

```bash
mkdir -p backups/$(date +%Y-%m-%d)
chmod 700 backups
```

## PostgreSQL Backup

App-Datenbank als Custom-Format-Dump:

```bash
set -a
. deploy/.env
set +a

BACKUP_DIR="backups/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

docker compose --env-file deploy/.env -f deploy/docker-compose.yml exec -T db \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc \
  > "$BACKUP_DIR/app-db.dump"
```

Keycloak-Datenbank:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml exec -T db \
  pg_dump -U "$KEYCLOAK_DB_USER" -d "$KEYCLOAK_DB" -Fc \
  > "$BACKUP_DIR/keycloak-db.dump"
```

Prüfen:

```bash
ls -lh "$BACKUP_DIR"/*.dump
pg_restore --list "$BACKUP_DIR/app-db.dump" >/dev/null
pg_restore --list "$BACKUP_DIR/keycloak-db.dump" >/dev/null
```

Falls `pg_restore` auf dem Host fehlt, kann die Prüfung in einem Postgres-Container laufen:

```bash
docker run --rm -v "$PWD/$BACKUP_DIR:/backup:ro" postgres:16-alpine \
  pg_restore --list /backup/app-db.dump >/dev/null
```

## PostgreSQL Restore

Restore immer zuerst in einer Test-/Staging-Instanz üben.

1. Stack stoppen, damit keine App schreibt:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml stop backend keycloak
```

2. App-Datenbank neu aufbauen:

```bash
cat "$BACKUP_DIR/app-db.dump" | docker compose --env-file deploy/.env -f deploy/docker-compose.yml exec -T db \
  pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner
```

3. Keycloak-Datenbank neu aufbauen:

```bash
cat "$BACKUP_DIR/keycloak-db.dump" | docker compose --env-file deploy/.env -f deploy/docker-compose.yml exec -T db \
  pg_restore -U "$KEYCLOAK_DB_USER" -d "$KEYCLOAK_DB" --clean --if-exists --no-owner
```

4. Stack wieder starten:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d
```

5. Healthchecks prüfen:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml ps
curl -fsS "$APP_PUBLIC_URL/actuator/health/readiness" || true
curl -fsS "$APP_PUBLIC_URL/api/status"
```

## Keycloak Realm Export

Der Datenbank-Dump ist die primäre produktive Sicherung. Ein Realm-Export ist zusätzlich hilfreich für Audit, Migration und Wiederaufbau von Realm-Konfiguration.

Export in temporäres Container-Verzeichnis:

```bash
set -a
. deploy/.env
set +a

BACKUP_DIR="backups/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

docker compose --env-file deploy/.env -f deploy/docker-compose.yml exec -T keycloak \
  /opt/keycloak/bin/kc.sh export \
  --realm "$KEYCLOAK_REALM" \
  --file /tmp/keycloak-realm.json

docker compose --env-file deploy/.env -f deploy/docker-compose.yml cp \
  keycloak:/tmp/keycloak-realm.json "$BACKUP_DIR/keycloak-realm.json"
```

Prüfen:

```bash
test -s "$BACKUP_DIR/keycloak-realm.json"
```

## Keycloak Realm Import

Für eine neue/leere Instanz kann der Realm-Export importiert werden.

Variante A: Import beim Start über Volume und `--import-realm` vorbereiten.

Variante B: Import in laufendem Keycloak:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml cp \
  "$BACKUP_DIR/keycloak-realm.json" keycloak:/tmp/keycloak-realm.json

docker compose --env-file deploy/.env -f deploy/docker-compose.yml exec -T keycloak \
  /opt/keycloak/bin/kc.sh import \
  --file /tmp/keycloak-realm.json \
  --override true
```

Nach Import Keycloak neu starten:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml restart keycloak
```

## Mindest-Backup-Rhythmus

Für produktive Kundeninstanzen als Startpunkt:

```text
Täglich:     App-DB + Keycloak-DB Dump
Wöchentlich: zusätzlicher Realm-Export
Monatlich:   Restore-Test auf separater Testinstanz
Vor Release: Backup direkt vor Migration/Deployment
```

Aufbewahrung als Startpunkt:

```text
7 tägliche Backups
4 wöchentliche Backups
3 monatliche Backups
```

## Sicherheitsregeln

- Backups verschlüsseln, bevor sie den Server verlassen.
- Zugriff nur für Admin-/Betriebsrolle.
- Restore-Prozess dokumentiert testen, nicht nur Backup-Erstellung.
- Backup-Dateien nie ins Repository committen.
- Secrets aus `deploy/.env` separat im Passwortmanager sichern.
- Bei Kundendaten Lösch-/Aufbewahrungsfristen mit Datenschutzkonzept abstimmen.

## Offene Automatisierung

Später sinnvoll:

```text
scripts/backup-instance.sh
scripts/restore-instance.sh
S3-kompatibles verschlüsseltes Backup-Ziel
Cron/Systemd Timer pro Kundeninstanz
Restore-Test-Runbook pro Release
```
