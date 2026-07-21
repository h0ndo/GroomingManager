# Requirements: Tagesplanung-API und Terminstatus

Stand: 2026-07-20
Quelle: Kanban `t_0b848fd3`, UX-Spec `docs/ux-circular-work-page.md`, Backend-Inventur `docs/requirements/backend-endpoints-kanban-handoff.md`.

## Entscheidung

Der erste Kalender-Anwendungsfall bleibt `Tagesplanung` als Agenda in der runden Work-Page.

Begründung:

- Eine Tagesagenda passt fachlich zu Groomer:innen und Admins, die den operativen Tag überblicken müssen.
- Die vertikale Agenda ist in der runden Work-Page besser testbar als Monats-/Wochenkalender oder Ressourcenplanung.
- Der aktuelle Endpoint `GET /api/admin/appointments/recent` liefert nur die zuletzt angelegten Termine und ist deshalb höchstens ein technischer Übergang für Demo-/Placeholder-Daten, aber kein ausreichender fachlicher MVP-Vertrag für Tagesplanung.

## User Story

Als Groomer oder Admin möchte ich im Arbeitsgraphen den Knoten `Tagesplanung` öffnen und die Termine eines ausgewählten Tages als Agenda sehen, damit ich ohne klassischen Kalenderwechsel erkenne, welche Kund:innen, Hunde und Leistungen heute anstehen.

Nutzen:

- schneller Tagesüberblick im graphbasierten Arbeitsraum,
- weniger Kontextwechsel zwischen Termin-, Kund:innen- und Hundedaten,
- klare Grundlage für spätere Statusbearbeitung und Termin-Detailknoten.

## Fachlicher MVP-Scope

### Zeitraum

- Die Tagesplanung zeigt genau einen Kalendertag.
- Initialer Tag ist `heute` aus Client-Sicht, fachlich bezogen auf die Salon-/Instanz-Zeitzone.
- Die Work-Page darf einfache Navigation `Vorheriger Tag`, `Heute`, `Nächster Tag` anbieten.
- Wochen-, Monats-, Ressourcen- und Drag-and-Drop-Ansichten sind Nicht-Ziele.

### Benötigte Terminstatus im MVP

Für den ersten Tagesagenda-Slice gelten diese fachlichen Statuswerte:

| Status | Bedeutung | Anzeigename |
| --- | --- | --- |
| `REQUESTED` | Kund:in hat einen Termin angefragt/gebucht, Salon hat ihn noch nicht verbindlich bestätigt. | Angefragt |
| `CONFIRMED` | Termin ist vom Salon bestätigt und geplant. | Bestätigt |
| `IN_PROGRESS` | Grooming-Termin läuft gerade. | In Bearbeitung |
| `COMPLETED` | Termin wurde durchgeführt und abgeschlossen. | Abgeschlossen |
| `CANCELLED` | Termin wurde storniert und soll in der Tagesagenda als nicht mehr aktiv erkennbar sein. | Storniert |
| `NO_SHOW` | Kund:in/Tier ist nicht erschienen. | Nicht erschienen |

Bewusst zurückgestellt:

- `PAID`, `DEPOSIT_PAID` oder ähnliche Zahlungszustände werden nicht als Terminstatus modelliert. Zahlung/Anzahlung ist ein eigener späterer Zahlungs-Slice.
- Schließzeiten, Arbeitszeitregeln, Slot-Konfliktbearbeitung und Ressourcenbelegung werden nicht über diese Statusliste gelöst.
- Status-Historie/Audit-Log ist nicht Teil des ersten Tagesagenda-Slice.

Default-Regel:

- Neue Buchungen/Anfragen durch Kund:innen starten mit `REQUESTED`, solange keine andere Salon-Regel spezifiziert ist.

## API-Entscheidung

`GET /api/admin/appointments/recent` reicht für die fachliche Tagesplanung nicht aus.

Benötigt wird ein eigener API-Slice mit Datumsfilter und rollenabhängigem Ergebnis. Empfohlener erster Vertrag:

```text
GET /api/admin/appointments/day?date=YYYY-MM-DD
Rollen: admin, groomer
```

Parameter:

- `date` ist Pflicht, Format ISO-LocalDate `YYYY-MM-DD`.
- Ohne oder mit ungültigem `date` antwortet das Backend mit `400 BAD_REQUEST`.
- Sortierung: aufsteigend nach Uhrzeit/Slot, bei gleicher Uhrzeit stabil nach `id`.

Response-Mindestform für Termin-Karten:

```json
[
  {
    "id": 123,
    "appointmentDate": "2026-07-20",
    "timeSlot": "10:00",
    "customerDisplayName": "Maja Beispiel",
    "petName": "Bello",
    "serviceOfferingId": 1,
    "serviceName": "Waschen & Schneiden",
    "status": "CONFIRMED",
    "assignedGroomerSubject": "groomer-1",
    "assignedGroomerDisplayName": "Alex Groomer"
  }
]
```

Mindestfelder für die Work-Page-Termin-Karte:

- Uhrzeit: aus `timeSlot`, später bevorzugt echte Start-/Endzeit.
- Kund:in: `customerDisplayName`; solange nur `ownerSubject` vorhanden ist, darf Backend/Frontend als Übergang einen sicheren Fallback anzeigen, z. B. `Kund:in <subject gekürzt>` oder `Kund:in ohne Profil`.
- Hund: `petName`; wenn noch keine Hund-Zuordnung existiert, Anzeige `Hund noch nicht zugeordnet`.
- Leistung: `serviceName`; wenn leer, Anzeige `Leistung noch nicht gewählt`.
- Status: `status` mit lokalisiertem Label aus obiger Statusliste.
- Zuständige:r Groomer:in: optional; wenn nicht gesetzt, Anzeige `noch nicht zugewiesen` oder Feld ausblenden, solange keine Zuweisungsfunktion existiert.

Technischer Übergang:

- Für eine reine UI-Demo darf `GET /api/admin/appointments/recent` kurzfristig benutzt werden, wenn die Karte sichtbar als nicht-finaler Datenvertrag markiert bleibt.
- Für die erste fachliche Implementierung der Tagesagenda muss der Datumsfilter-Slice umgesetzt werden, sonst kann der Use Case `ausgewählter Tag` nicht abgenommen werden.

## Rollen- und Rechtevertrag

### Admin

- Darf Tagesagenda für jeden Tag der Kundeninstanz lesen.
- Darf perspektivisch Terminstatus ändern und Groomer zuweisen; Statusänderung ist ein eigener Umsetzungsslice, wenn nicht explizit in den Backend-Slice aufgenommen.
- Sieht alle Termin-Karten inklusive Kund:in, Hund, Leistung, Status und optional zuständigem Groomer.

### Groomer

- Darf im MVP die Tagesagenda der Kundeninstanz lesen, weil noch keine belastbare Groomer-Zuweisung existiert.
- Sobald `assignedGroomerSubject` fachlich/technisch eingeführt ist, muss entschieden werden, ob Groomer nur eigene Termine oder weiterhin alle Tages-Termine sehen dürfen.
- Darf perspektivisch operative Status setzen (`IN_PROGRESS`, `COMPLETED`, `NO_SHOW`), sofern Admin/Requirements das in einem Folgeslice freigeben.

### Kund:in

- Darf nicht auf `GET /api/admin/appointments/day` zugreifen.
- Kund:innen sehen eigene Termine über den Kundenbereich. Der bestehende Endpoint `GET /api/appointments` kann dafür vorerst reichen, ist aber nicht der Tagesplanungs-API-Vertrag für Admin/Groomer.
- Kund:innen dürfen im MVP nicht fremde Tagesagenda-Daten sehen.

## Akzeptanzkriterien für den Backend-Slice

- `GET /api/admin/appointments/day?date=YYYY-MM-DD` existiert und ist für `admin` und `groomer` erlaubt.
- `kunde` erhält für diesen Endpoint keinen Zugriff.
- Ohne gültiges Datum liefert die API `400 BAD_REQUEST`.
- Ergebnis enthält nur Termine des angefragten Datums.
- Ergebnis ist nach Uhrzeit/Slot aufsteigend sortiert.
- Jede Karte liefert mindestens: `id`, `appointmentDate`, `timeSlot`, `customerDisplayName` oder sicheren Fallback, `petName` oder Fallback, `serviceName` oder Fallback, `status`, optional Groomer-Felder.
- Neue Termine haben einen Status; für Kund:innenbuchungen ist Default `REQUESTED`.
- Der bestehende Konfliktschutz für Datum + Slot bleibt erhalten.

## Akzeptanzkriterien für den Frontend-/Work-Page-Slice

- Der Graphknoten `Tagesplanung` öffnet eine runde Work-Page mit Content-Typ `calendar` bzw. Agenda.
- Initial wird der heutige Tag geladen.
- Nutzer:innen können zwischen vorherigem Tag, heute und nächstem Tag wechseln.
- Termin-Karten zeigen Uhrzeit, Kund:in, Hund, Leistung, Status und optional zuständige:n Groomer:in.
- Leerer Zustand lautet: `Für diesen Tag sind keine Termine geplant.`
- Fehlerzustand lautet: `Tagesplanung konnte nicht geladen werden. Erneut versuchen.`
- Nur der Agenda-Content scrollt; Datumsnavigation und Schließen/Rückkehr bleiben erreichbar.
- Keine Monats-/Wochenansicht, keine Ressourcenplanung und kein Drag-and-Drop werden im Slice umgesetzt.

## Offene Entscheidungen / Folgeslices

- Soll Groomer-Sicht mittelfristig alle Tages-Termine oder nur eigene zugewiesene Termine zeigen?
- Braucht die Tagesagenda direkt eine Statusänderungsaktion oder zunächst nur Leserechte?
- Wie werden Termine mit Kund:innenprofil und Hund verknüpft, wenn das aktuelle Datenmodell nur `ownerSubject`, Datum, Slot und Leistungssnapshot enthält?
- Welche Salon-/Instanz-Zeitzone gilt für `heute` und Tagesgrenzen?
- Werden Start-/Endzeiten und Dauer eingeführt oder bleibt `timeSlot` im MVP ausreichend?

## Nicht-Ziele

- Keine Monatsansicht.
- Keine Wochenansicht.
- Keine Ressourcenplanung oder Kapazitätsoptimierung.
- Kein Drag-and-Drop von Terminen.
- Keine Arbeitszeitregel-/Schließzeitenverwaltung.
- Keine Zahlungs-/Anzahlungslogik als Terminstatus.
- Keine Status-Historie/Audit-Ansicht im ersten Slice.
