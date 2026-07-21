# Handoff an Requirements-Profil: Backend-Endpunkte → Kanban-Stories

Stand: 2026-07-20
Quelle: Backend-Controller in `backend/src/main/java/de/groomingmanager/backend/api` plus Security-Konfiguration.

## Ergebnis der Backend-Inventur

Aktuell sind 25 API-Endpunkte ausprogrammiert.

### Öffentlich / Basis

- `GET /api/status` — öffentlicher Backend-Status mit `status=ok` und Timestamp.
- `GET /api/services` — öffentlicher aktiver Service-Katalog.
- `GET /api/ai/status` — authentifiziert, liefert LLM/AI-Konfiguration: `enabled`, `model`, `visionEnabled`.

Security explizit öffentlich:

- `/actuator/health/**`
- `/api/status`
- `/api/services`

Alles andere ist authentifiziert.

### Auth / Rollen / User-Kontext

- `GET /api/me` — authentifizierter User-Kontext: Subject/Username und Rollen.
- `GET /api/admin/me` — nur Rolle `admin`.
- `GET /api/groomer/me` — nur Rolle `groomer`.
- `GET /api/kunde/me` — nur Rolle `kunde`.

### Workspace / Graph Bootstrap

- `GET /api/workspace/bootstrap` — Rollen `admin`, `groomer`, `kunde`.

Liefert je nach Rolle Domains und Instanzen für die graphbasierte Workspace-UI.

Admin-Domains u.a.:

- Administration
- Kund:innen
- Hunde
- Termine
- Leistungen
- Kalender

Groomer-Domains u.a.:

- Termine
- Kund:innen
- Hunde
- Grooming-Notizen
- Leistungen

Kunden-Domains u.a.:

- Mein Profil
- Meine Hunde
- Meine Termine
- Leistungen

### Kunden / Customer API

- `GET /api/customers?query=&limit=` — Rollen `admin`, `groomer`; Kunden suchen/listen, Limit max. 100.
- `POST /api/customers` — Rolle `admin`; Kunde anlegen.
- `GET /api/customers/{id}` — Rollen `admin`, `groomer`, `kunde`; Kunde darf nur eigenen Datensatz sehen.
- `PUT /api/customers/{id}` — Rollen `admin`, `groomer`, `kunde`; Kunde darf nur eigenen Datensatz ändern.
- `GET /api/customer/me` — Rolle `kunde`; eigenes Kundenprofil anhand Keycloak Subject laden.
- `PUT /api/customer/me` — Rolle `kunde`; eigenes Kundenprofil ändern.

Request `UpsertCustomerRequest`:

```json
{
  "keycloakSubject": "string",
  "displayName": "string",
  "email": "name@example.com",
  "phone": "string",
  "communicationNotes": "string",
  "profileImageBase64": "..."
}
```

Validierung:

- `displayName` ist Pflicht.
- `email` muss valide sein, wenn gesetzt.
- `profileImageBase64` wird decodiert, wenn gesetzt.
- ungültiges `profileImageBase64` gibt `400 BAD_REQUEST`.
- Fremdzugriff für `kunde` wird als `404 NOT_FOUND` versteckt.

### Hunde / Pets API

- `GET /api/pets` — authentifiziert; eigene Hunde listen.
- `POST /api/pets` — authentifiziert; eigenen Hund anlegen.
- `PUT /api/pets/{id}` — authentifiziert; eigenen Hund ändern.
- `DELETE /api/pets/{id}` — authentifiziert; eigenen Hund löschen.

Request `UpsertPetRequest`:

```json
{
  "name": "Bello",
  "breed": "Pudel",
  "size": "mittel",
  "groomingNotes": "mag keinen Föhn",
  "imageBase64": "..."
}
```

Validierung/Logik:

- `name` ist Pflicht.
- `imageBase64` wird decodiert.
- ungültiges Base64 gibt `400 BAD_REQUEST`.
- Zugriff ist owner-basiert über `ownerSubject = authentication.getName()`.

### Termine / Appointments API

- `POST /api/appointments` — Rolle `kunde`; Termin buchen.
- `GET /api/appointments` — Rolle `kunde`; eigene Termine listen.
- `GET /api/admin/appointments/recent` — Rollen `admin`, `groomer`; letzte 10 Termine anzeigen.

Request `BookAppointmentRequest`:

```json
{
  "appointmentDate": "2026-07-20",
  "timeSlot": "10:00",
  "serviceOfferingId": 1
}
```

Validierung/Logik:

- `appointmentDate` ist Pflicht.
- `timeSlot` ist Pflicht.
- Slot-Konflikt auf Datum + TimeSlot gibt `409 CONFLICT`.
- optionaler Service muss aktiv sein, sonst `400 BAD_REQUEST`.
- bei Buchung werden Service-Name und Service-Preis snapshot-mäßig am Termin gespeichert.

### Leistungen / Service Offerings

Öffentlicher Service-Katalog:

- `GET /api/services` — öffentlich; aktive Leistungen anzeigen.

Admin-Verwaltung:

- `GET /api/admin/services` — Rolle `admin`; alle Leistungen anzeigen, auch inaktive.
- `POST /api/admin/services` — Rolle `admin`; Leistung anlegen.
- `PUT /api/admin/services/{id}` — Rolle `admin`; Leistung ändern.
- `DELETE /api/admin/services/{id}` — Rolle `admin`; Leistung löschen.

Request `UpsertServiceOfferingRequest`:

```json
{
  "name": "Waschen & Schneiden",
  "price": 49.90,
  "active": true
}
```

Validierung:

- `name` ist Pflicht.
- `price >= 0.01`.

## Testdaten-Status

Live geprüft gegen laufenden lokalen Docker-Postgres-Container `grooming-manager-local_db`:

```text
customers|0
pets|0
appointments|0
service_offerings|0
```

Auch in den Flyway-Migrationen `deploy/migrations/V1__baseline.sql`, `V2__grooming_domain.sql`, `V3__customer_profiles_for_workspace_graph.sql`, `V4__customer_profile_images.sql` sind nur Schema-Änderungen vorhanden, keine Seed-/Demo-INSERTs.

Fazit: Aktuell haben wir keine Test-/Demo-Daten in der lokalen App-DB.

## Kanban-Story-Vorschläge für Requirements

### Story: API-Inventur in Produkt-Backlog übernehmen

Als Product Owner möchte ich die vorhandenen Backend-Endpunkte als fachliche Fähigkeiten im Kanban-Board sehen, damit Frontend, QA und Backend auf denselben API-Vertrag schauen.

Akzeptanzkriterien:

- Alle oben genannten Endpunkte sind als vorhandene Backend-Capabilities erfasst.
- Pro Capability ist sichtbar: Endpoint, Methode, Rolle/Zugriff, fachlicher Zweck.
- Offene Lücken sind als separate Backlog-Kandidaten markiert.

### Story: Demo-/Seed-Daten für lokale Entwicklung bereitstellen

Als Entwickler:in möchte ich reproduzierbare Demo-Daten für Kunden, Hunde, Leistungen und Termine haben, damit Workspace, Listen, Buchung und Rollenansichten sofort sinnvoll testbar sind.

Akzeptanzkriterien:

- Es gibt einen reproduzierbaren Weg, lokale Demo-Daten einzuspielen.
- Demo-Daten enthalten mindestens:
  - 3 Kund:innen mit unterschiedlichen Keycloak Subjects,
  - Kund:innen-Profilbilder, damit Profile/Workspace visuell getestet werden können,
  - je Kund:in mindestens 1 Hund,
  - Hundebilder für mehrere Hunde,
  - mindestens 5 Service-Angebote, davon mindestens 1 inaktiv,
  - mehrere Termine auf verschiedenen Tagen/Slots,
  - mindestens 1 Slot-Konflikt-Szenario für Tests.
- Demo-Daten sind klar als lokal/dev/test gekennzeichnet und werden nicht ungewollt in Produktion eingespielt.
- Der Mechanismus respektiert die Projektkonvention: Flyway läuft als separater One-Shot-Container; Produktionsmigrationen dürfen keine Demo-Daten erzwingen.
- README/Dev-Doku beschreibt, wie Demo-Daten geladen/zurückgesetzt werden.

Hinweis Backend-Umsetzung offen entscheiden:

- Option A: separater dev-only SQL-Seed unter `deploy/dev-seed/`, manuell per Compose/Script ausführbar.
- Option B: Flyway-Repeatable-Migration nur in lokalem/dev Flyway-Location-Pfad.
- Option C: eigener Seed-One-Shot-Container/Script nach Migration.

Empfehlung: nicht in die normalen Produktionsmigrationen legen, sondern dev-only ausführbar machen.

### Story: Terminstatus und Kalenderfähigkeit ergänzen

Als Groomer/Admin möchte ich Termine fachlich bearbeiten können, damit aus einer Kundenbuchung ein echter Salon-Terminprozess wird.

Konkretisierung für den ersten Tagesagenda-Slice: siehe `docs/requirements/day-agenda-api-contract.md`.

Akzeptanzkriterien:

- Termin hat für die Tagesagenda mindestens einen Status aus `REQUESTED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `NO_SHOW`.
- Admin/Groomer können Status ändern.
- Kunden können eigene Termine einsehen und ggf. stornieren, falls fachlich erlaubt.
- API verhindert Doppelbuchungen weiterhin zuverlässig.
- Kalender-/Verfügbarkeitsansicht kann aus Termindaten aufgebaut werden; für die MVP-Tagesagenda ist dafür `GET /api/admin/appointments/day?date=YYYY-MM-DD` nötig, weil `GET /api/admin/appointments/recent` keinen Tagesfilter bietet.

### Story: Grooming-Notizen als eigene fachliche Ressource definieren

Als Groomer möchte ich Grooming-Notizen zu Hund/Kund:in/Termin pflegen können, damit salonrelevante Hinweise strukturiert wiederverwendbar sind.

Akzeptanzkriterien:

- Requirements klären, ob Grooming-Notizen am Hund, am Termin oder als Verlauf/Timeline hängen.
- Rollenrechte für Lesen/Schreiben sind definiert.
- Bestehendes Feld `Pet.groomingNotes` wird bewertet: behalten, migrieren oder ergänzen.

### Story: Admin-/Groomer-Sicht auf Hunde klären

Als Admin oder Groomer möchte ich Hunde zu Kund:innen sehen und ggf. pflegen können, damit Beratung und Terminvorbereitung möglich sind.

Akzeptanzkriterien:

- Requirements definieren, ob Admin/Groomer fremde Hunde lesen dürfen.
- Requirements definieren, ob Admin/Groomer Hunde für Kund:innen anlegen/ändern dürfen.
- API-Lücke gegenüber aktuellem `/api/pets` Owner-only Verhalten ist dokumentiert.

### Story: Keycloak-/User-Verwaltung fachlich klären

Als Admin möchte ich Benutzer und Rollen verwalten können, damit Salonmitarbeitende und Kund:innen sauber angelegt werden.

Akzeptanzkriterien:

- Requirements klären, ob die App Keycloak-User direkt erzeugen/verwalten soll oder ob das außerhalb der App passiert.
- Rollen `admin`, `groomer`, `kunde` sind fachlich beschrieben.
- Sonderfall bleibt sichtbar: Admin darf auch Groomer sein.

### Story: Hundebild-Upload verbessern

Als Kund:in möchte ich ein Hundebild komfortabel hochladen, damit mein Hundeprofil visuell erkennbar ist.

Akzeptanzkriterien:

- Requirements klären, ob Base64 im JSON vorerst reicht oder multipart/object storage benötigt wird.
- Größenlimit, erlaubte MIME-Types und Datenschutz-Anforderungen sind definiert.
- Bestehender Base64-Endpoint ist als technische Übergangslösung dokumentiert.

### Story: Mitarbeiter-/Groomer-Profile mit Profilbild modellieren

Als Salon möchte ich Groomer/Mitarbeitende mit Namen, Rollenbezug und Profilbild pflegen können, damit Termin-, Workspace- und Teamansichten menschlich und eindeutig wirken.

Kontext:

- Für `kunde` gibt es jetzt ein fachliches `Customer`-Profil mit optionalem `profileImageBase64`.
- Für Hunde gibt es bereits `Pet.imageBase64`.
- Für Groomer/Mitarbeitende gibt es aktuell noch keine eigene fachliche Entity; nur Keycloak-Rollen/Subjects.

Akzeptanzkriterien:

- Requirements entscheiden, ob Groomer-Profile in der App-Datenbank liegen oder nur aus Keycloak gelesen werden.
- Profil enthält mindestens Keycloak Subject, Anzeigename und optionales Profilbild.
- Rollenmodell bleibt kompatibel: ein Admin kann auch Groomer sein.
- Backend-API für Lesen/Pflegen der Groomer-Profile ist spezifiziert.
- Demo-/Seed-Daten enthalten mindestens 2 Groomer-Profile mit Bildern.

### Story: AI-/LLM-Funktionen fachlich konkretisieren

Als Salon/Admin möchte ich AI-Funktionen gezielt einsetzen können, damit sie echte Arbeitsabläufe unterstützen statt nur Status anzuzeigen.

Akzeptanzkriterien:

- Konkrete erste AI-Use-Cases sind priorisiert, z.B. Kapazitätsfragen, Terminassistenz, Fotoauswertung.
- Datenschutz-/Opt-in-Anforderungen sind definiert.
- API-Vertrag über `/api/ai/status` hinaus ist skizziert.
