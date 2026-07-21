# Dev-Seed für lokale Kund:innen

Dieser Seed ist nur für lokale Entwicklung gedacht und liegt bewusst außerhalb der produktiven Flyway-Migrationen unter `deploy/migrations/`.

## Voraussetzungen

- Lokaler Compose-Stack läuft mindestens mit `db` und ausgeführten Flyway-Migrationen.
- `deploy/.env.local` existiert oder `deploy/.env.local.example` kann für die Compose-Verbindung genutzt werden.

## Kund:innen laden

```bash
./deploy/dev-seed/run-customer-seed.sh
```

Das Script führt `customers.sql` im lokalen PostgreSQL-Container aus und ruft danach den Check auf. Der Seed ist idempotent: erneutes Ausführen aktualisiert die bekannten Seed-Kund:innen anhand ihrer lokalen E-Mail-Adressen und legt keine Duplikate an.

## Prüfen

Nur statische Seed-Datei prüfen:

```bash
./deploy/dev-seed/check-customer-seed.sh --static
```

Seed in der laufenden DB prüfen:

```bash
./deploy/dev-seed/check-customer-seed.sh
```

Der Check verifiziert mindestens 12 lokale Seed-Kund:innen und mindestens 8 Einträge mit dem Suchmuster `Testfamilie`.

## Zurücksetzen

```bash
./deploy/dev-seed/reset-customer-seed.sh
```

Das Reset-Script entfernt nur Kund:innen mit E-Mail-Adressen unter `@grooming-manager.local`.
