# ADR 0002: Datenbankmigrationen mit Flyway

## Status

Vorgeschlagen / vorläufig angenommen für die Zielarchitektur.

## Kontext

GroomingManager soll pro Kund:in als eigene Docker-Compose-Instanz betrieben werden. Die App-Datenbank muss reproduzierbar erstellt und aktualisiert werden können. Manuelle SQL-Ausführung auf Kundenservern wäre fehleranfällig und bei mehreren Instanzen nicht wartbar.

## Entscheidung

Wir verwenden **Flyway** für Datenbankmigrationen der App-Manager-App-Datenbank.

Flyway läuft als eigener **One-shot Docker-Container** im Compose-Stack:

```text
db startet und wird healthy
  -> migrate Container läuft einmal
  -> Flyway führt SQL-Migrationen aus deploy/migrations aus
  -> migrate beendet sich erfolgreich
  -> app startet erst danach
```

Der Container ist kein dauerhaft laufender Dienst. Er ist eher ein Deployment-Schritt innerhalb von Docker Compose.

## Abgrenzung

- Flyway verwaltet die **App-Datenbank**.
- Keycloak verwaltet sein eigenes Datenbankschema selbst.
- Keycloak-Realm, Rollen, Gruppen und OIDC-Client werden separat mit Terraform verwaltet.

## Migrationsverzeichnis

Migrationen liegen unter:

```text
deploy/migrations/
```

Namensschema:

```text
V1__baseline.sql
V2__create_customers.sql
V3__create_employees.sql
V4__create_requests.sql
V5__create_appointments.sql
```

## Konsequenzen

### Positiv

- Jede Kundeninstanz bekommt reproduzierbare DB-Updates.
- Die App startet erst nach erfolgreichen Migrationen.
- Deployment bleibt einfach: `docker compose up -d` reicht grundsätzlich aus.
- Migrationen sind versioniert und reviewbar.

### Negativ / Achtung

- Fehlgeschlagene Migrationen verhindern den App-Start, was gewollt, aber im Betrieb sichtbar ist.
- Migrationen müssen vor Releases sauber getestet werden.
- Rollbacks sind bei Flyway Community nicht automatisch; Änderungen sollten vorwärtskompatibel geplant werden.
- Backups vor produktiven Migrationen sind Pflicht.

## Betriebsregel

Vor jedem produktiven Update:

1. Datenbank-Backup erstellen oder Snapshot sicherstellen.
2. Neues App-Image und neue Migrationen deployen.
3. Flyway-Migrationen laufen lassen.
4. App startet nur, wenn Migrationen erfolgreich waren.
5. Logs prüfen:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml logs migrate
```
