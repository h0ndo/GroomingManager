# Flyway Migration Conventions

GroomingManager verwaltet ausschließlich die App-Datenbank mit Flyway. Keycloak verwaltet sein eigenes Datenbankschema selbst; Realm, Rollen, Gruppen und OIDC-Client werden per Terraform gepflegt.

## Ort

Alle App-Migrationen liegen unter:

```text
deploy/migrations/
```

Der Docker-Compose-Stack mountet dieses Verzeichnis read-only in den Flyway-Container:

```text
filesystem:/flyway/sql
```

## Namensschema

```text
V<fortlaufende-nummer>__<beschreibung>.sql
```

Beispiele:

```text
V1__baseline.sql
V2__create_customers.sql
V3__create_employees.sql
V4__create_appointments.sql
V5__add_kunde_contact_fields.sql
```

Regeln:

- Nummern starten bei `V1`.
- Nummern sind fortlaufend ohne Lücken.
- Eine Versionsnummer darf nur einmal vorkommen.
- Beschreibung ist lowercase snake_case: `create_customers`, nicht `CreateCustomers`.
- Nur `.sql` Dateien im Migrationsverzeichnis.
- Keine Leerzeichen, Umlaute oder Sonderzeichen im Dateinamen.

## Unveränderlichkeit

Bereits auf einer geteilten oder produktiven Instanz gelaufene Migrationen dürfen nicht mehr verändert werden.

Stattdessen immer eine neue Migration anlegen:

```text
falsch: V2__create_customers.sql nachträglich ändern
richtig: V6__add_kunde_status.sql neu hinzufügen
```

Warum:

- Flyway speichert Checksums der ausgeführten Migrationen.
- Geänderte Alt-Migrationen führen auf bestehenden Instanzen zu Checksum-Fehlern.
- Jede Kundeninstanz muss denselben nachvollziehbaren Migrationspfad haben.

## Inhaltliche Regeln

- Migrationen sollen vorwärtsgerichtet sein.
- Destruktive Änderungen vermeiden oder in mehreren Releases ausrollen:
  1. neue Spalte/Tabelle hinzufügen,
  2. Anwendung migrieren,
  3. Daten backfillen,
  4. alte Spalte/Tabelle in späterem Release entfernen.
- Produktive Migrationen müssen idempotent im Sinne des Flyway-Laufs sein: einmal erfolgreich ausführbar, danach nicht manuell erneut ausführen.
- Große Datenmigrationen vorab in einer Kopie der Kundeninstanz testen.
- Vor produktiven Migrationen Backup erstellen, siehe [`docs/backup-restore.md`](backup-restore.md).

## Compose-Verhalten

Flyway läuft als eigener one-shot Container `migrate`:

```text
db healthy
  -> migrate läuft
  -> backend startet nur nach service_completed_successfully
```

Das Backend führt in produktionsähnlichen Umgebungen keine automatischen Migrationen aus:

```env
SPRING_FLYWAY_ENABLED=false
```

## Lokale Prüfung

GitHub Actions prüft:

- `docs/migrations.md` existiert,
- `deploy/migrations/V1__baseline.sql` existiert,
- alle Migrationen folgen dem Namensschema,
- Versionsnummern sind eindeutig,
- Versionen sind fortlaufend.

Lokal kann die gleiche Prüfung sinngemäß mit Python laufen:

```bash
python - <<'PY'
from pathlib import Path
import re
migration_dir = Path('deploy/migrations')
files = sorted(migration_dir.glob('*.sql'))
pattern = re.compile(r'^V([1-9][0-9]*)__[a-z0-9_]+\.sql$')
versions = []
for file in files:
    match = pattern.match(file.name)
    assert match, f'invalid migration name: {file.name}'
    versions.append(int(match.group(1)))
assert versions == list(range(1, len(versions) + 1)), versions
PY
```

## Review-Checkliste

Bei jeder neuen Migration prüfen:

- [ ] Dateiname folgt `Vn__description.sql`.
- [ ] Nächste freie Versionsnummer verwendet.
- [ ] Keine bestehende Migration geändert.
- [ ] Migration läuft lokal gegen frische Datenbank.
- [ ] Migration läuft gegen Datenbank mit vorherigem Release-Stand.
- [ ] Backup-/Restore-Auswirkung bedacht.
