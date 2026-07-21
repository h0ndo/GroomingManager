# Fachkonzept: GroomingManager

GroomingManager unterstützt Grooming-/Tierpflegebetriebe bei Termin-, Kund:innen- und Tierverwaltung.

## 1. Ausgangslage

Viele Grooming-Betriebe organisieren Termine, Kund:innen, Tiere, Leistungen und interne Auslastung noch mit Kalendern, Tabellen oder Chatverläufen. Das erschwert Überblick, Terminplanung und saubere Kommunikation.

## 2. Zielbild

GroomingManager soll eine cloud-ready, selbst hostbare Business-App sein für:

- Kund:innen- und Tierprofile,
- Terminanfragen und Terminplanung,
- Rollen für Admin, Führungskraft, Angestellte und Kund:innen,
- operative Übersicht über Auslastung und offene Vorgänge,
- sichere Anmeldung per Keycloak/OIDC,
- Kundeninstanz pro Betrieb.

## 3. Rollen

### Admin

Admins verwalten die Betriebsinstanz:

- Nutzer:innen und Rollen anlegen,
- Stammdaten und Einstellungen pflegen,
- Leistungen und Standorte konfigurieren,
- Betriebsstatus prüfen.

### Führungskraft

Führungskräfte steuern den Betrieb:

- Tages-/Wochenübersicht sehen,
- Team- und Kapazitätsplanung prüfen,
- offene Terminanfragen priorisieren,
- Eskalationen und Engpässe erkennen.

### Angestellte:r

Angestellte bearbeiten operative Grooming-Vorgänge:

- eigene Termine sehen,
- Tier-/Kund:innenkontext öffnen,
- Leistungen und Notizen dokumentieren,
- Rückfragen oder Folgetermine vorbereiten.

### Kund:in

Kund:innen können optional über ein Portal eingebunden werden:

- eigene Tiere verwalten,
- Terminanfragen stellen,
- Terminstatus sehen,
- Nachrichten oder Hinweise vorbereiten.

## 4. Erste technische Use Cases

### Login und Rollenweiterleitung

1. Nutzer:in öffnet die App.
2. Frontend leitet zu Keycloak weiter.
3. Nach Login liest das Frontend die Realm-Rollen aus dem JWT.
4. Dashboard zeigt passende Rollenbereiche.
5. Backend schützt Rollen-Endpunkte mit `@PreAuthorize`.

### Demo-Endpunkte

```text
GET /api/admin/me
GET /api/groomer/me
GET /api/kunde/me
```

## 5. Erste spätere Fachobjekte

Die Baseline enthält zunächst nur eine generische Tabelle `customers`. Für GroomingManager naheliegende nächste Migrationen:

- `pets` für Tiere,
- `services` für Grooming-Leistungen,
- `appointments` für Termine,
- `appointment_requests` für Kund:innenanfragen.
