# Backend-Migration aus `C:/projekte/dev/backend`

Das alte GroomingManager-Backend unter `C:/projekte/dev/backend` war ein ASP.NET/.NET-Backend mit EF Core und ASP.NET Identity. Der neue GroomingManager basiert dagegen auf Spring Boot, Keycloak/OIDC und Flyway.

Darum wurde der alte Code nicht direkt kopiert. Migriert wurden die fachlich wertvollen Domänen-Slices in die neue Architektur.

## Übernommene Domäne

### Leistungskatalog

Altes Modell/API:

- `ServiceOffering`
- `AdminServicesController`

Neu:

- Entity: `ServiceOffering`
- Tabelle: `service_offerings`
- Repository: `ServiceOfferingRepository`
- API:
  - `GET /api/services` — öffentliche aktive Leistungen
  - `GET /api/admin/services` — alle Leistungen für Admins
  - `POST /api/admin/services` — Leistung anlegen
  - `PUT /api/admin/services/{id}` — Leistung ändern
  - `DELETE /api/admin/services/{id}` — Leistung löschen

### Tiere

Altes Modell/API:

- `Dog`
- `DogsController`

Neu:

- Entity: `Pet`
- Tabelle: `pets`
- Repository: `PetRepository`
- API:
  - `GET /api/pets` — eigene Tiere auflisten
  - `POST /api/pets` — eigenes Tier anlegen
  - `PUT /api/pets/{id}` — eigenes Tier ändern
  - `DELETE /api/pets/{id}` — eigenes Tier löschen

Die Zuordnung läuft über das Keycloak/JWT-Subject (`ownerSubject`), nicht über ASP.NET Identity.

### Termine

Altes Modell/API:

- `Appointment`
- `AppointmentsController`
- `AdminAppointmentsController`

Neu:

- Entity: `Appointment`
- Tabelle: `appointments`
- Repository: `AppointmentRepository`
- API:
  - `POST /api/appointments` — Termin buchen
  - `GET /api/appointments` — eigene Termine anzeigen
  - `GET /api/admin/appointments/recent` — letzte Termine für Admin/Führungskraft

Beim Buchen wird der gewählte Leistungseintrag als Snapshot gespeichert (`serviceName`, `servicePrice`), damit spätere Preis-/Namensänderungen alte Buchungen nicht verändern.

## Nicht 1:1 übernommen

Noch nicht migriert wurden:

- ASP.NET Identity/Userverwaltung — ersetzt durch Keycloak
- SignalR-Hubs — später ggf. als SSE/WebSocket-Slice
- Kalender-Sperrzeiten/Working-Day-Settings — später als eigener Scheduling-Slice
- Zahlungs-/Stripe-ähnliche Funktionen, falls im alten Backend vorhanden — später separat prüfen

## Datenbank

Die neuen Tabellen liegen in:

```text
deploy/migrations/V2__grooming_domain.sql
```

Flyway bleibt wie im Projektstandard ein separater one-shot Container vor Backend-Start.
