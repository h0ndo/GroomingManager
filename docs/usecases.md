# Fachliche Use Cases

Dieses Dokument sammelt fachliche Regeln, Rollen und Use Cases für GroomingManager. Es ist bewusst fachlich formuliert und soll Entscheidungen festhalten, bevor sie technisch in Backend, Frontend, Keycloak oder Datenbankmodell umgesetzt werden.

## Leitentscheidung: Benutzerverwaltung über Einladung/Anlage, keine Selbstregistrierung

Benutzer:innen registrieren sich **nicht selbstständig über Keycloak**.

Stattdessen gilt:

```text
Kundeninstanz wird bereitgestellt
  -> initialer Standard-Admin wird angelegt
  -> Standard-Admin loggt sich über Keycloak ein
  -> Admin legt weitere Nutzer:innen an
  -> angelegte Nutzer:innen loggen sich über Keycloak ein
```

Keycloak ist damit weiterhin die zentrale Login-Komponente, aber nicht die öffentliche Registrierungsstelle.

## Rollen

### Admin

Ein Admin verwaltet die Kundeninstanz aus fachlicher Sicht.

Admins können:

- Apps/Angestellte anlegen,
- weitere Admins anlegen,
- Kund:innen anlegen,
- Nutzer:innen aktivieren/deaktivieren,
- Rollen vergeben,
- Stammdaten der Kundenorganisation/Kundeninstanz pflegen.

Admins melden sich über Keycloak an.

### App / Angestellte:r

Apps sind fachliche Nutzer:innen der Kundeninstanz.

Apps können perspektivisch:

- eigene Termine und Verfügbarkeiten einsehen,
- eigene Kapazität/Auslastung pflegen,
- Kund:innen-/Rezeptinformationen einsehen, sofern berechtigt,
- Vorgangen oder Termine dokumentieren.

Apps werden von Admins angelegt und melden sich danach über Keycloak an.

### Kund:in

Kund:innen sind Personen, die behandelt werden oder Anfragen stellen.

Kund:innen können:

- von Admins angelegt werden,
- von Apps angelegt werden, wenn der fachliche Prozess das erlaubt,
- sich nach Anlage über Keycloak anmelden, wenn ein Kundenbereich aktiv ist.

Kund:innen registrieren sich nicht selbst über Keycloak.

## Initiale Kundeninstanz

Wenn ein neuer potentieller Kunde / eine neue Kundenorganisation startet, erhält diese Kundeninstanz initial immer einen Standard-Admin-Account.

Dieser initiale Account dient nur zum Start:

```text
Kunde erhält Zugangsdaten für Standard-Admin
  -> Kunde loggt sich ein
  -> Kunde richtet Kundenorganisation/Kundeninstanz ein
  -> Kunde legt echte Admins, Apps und Kund:innen an
  -> Standard-Admin wird optional umbenannt, deaktiviert oder ersetzt
```

Der Standard-Admin sollte sicher übermittelt und möglichst beim ersten Login geändert/abgesichert werden.

## Use Case: Admin legt App an

### Akteur

Admin

### Ziel

Ein neuer App/Angestellter kann sich in der Kundeninstanz anmelden und später fachliche Funktionen nutzen.

### Vorbedingungen

- Admin ist über Keycloak angemeldet.
- Admin besitzt die Rolle `admin` oder eine gleichwertige Verwaltungsrolle.
- Kundeninstanz ist aktiv.

### Ablauf

1. Admin öffnet die Nutzerverwaltung.
2. Admin wählt „App anlegen“.
3. Admin erfasst mindestens:
   - Name,
   - E-Mail,
   - Rolle `app` / `angestellter`,
   - optional Spezialisierungen, Arbeitszeiten, Standort/Kundenorganisationbereich.
4. System legt den Nutzer in Keycloak an.
5. System legt/verknüpft das fachliche App-Profil in der App-Datenbank.
6. System sendet optional eine Einladungs-/Passwortsetz-Mail oder erzeugt einen sicheren Initialzugang.
7. App meldet sich über Keycloak an.

### Ergebnis

- Keycloak-User existiert.
- App-Profil für App existiert.
- Rollen-/Gruppenzuordnung ist gesetzt.
- App kann sich anmelden.

## Use Case: Admin legt Kund:in an

### Akteur

Admin

### Ziel

Ein:e Kund:in wird angelegt und kann fachlich verwaltet werden. Optional kann die Person später Zugang zum Kundenbereich erhalten.

### Vorbedingungen

- Admin ist angemeldet.
- Admin hat Berechtigung zur Kund:innenverwaltung.

### Ablauf

1. Admin öffnet die Kund:innenverwaltung.
2. Admin wählt „Kund:in anlegen“.
3. Admin erfasst Stammdaten, z. B.:
   - Name,
   - Geburtsdatum,
   - Kontaktdaten,
   - Versicherungs-/Rezeptinformationen, soweit fachlich nötig.
4. System legt den fachlichen Kund:innen-Datensatz in der App-Datenbank an.
5. Falls ein Login für diese Person gewünscht ist, legt das System zusätzlich einen Keycloak-User mit Rolle `kunde` an.
6. System informiert die Person optional über den Zugang.

### Ergebnis

- Kund:innen-Datensatz existiert in der App.
- Optional existiert ein Keycloak-Login.
- Keine Selbstregistrierung war nötig.

## Use Case: App legt Kund:in an

### Akteur

App / Angestellte:r

### Ziel

Ein App kann im Rahmen der Vorgang oder Terminaufnahme eine:n neue:n Kund:in erfassen.

### Vorbedingungen

- App ist angemeldet.
- App besitzt die fachliche Berechtigung zum Anlegen von Kund:innen.
- Die Kundeninstanz erlaubt diese Funktion.

### Ablauf

1. App öffnet Kund:innenverwaltung oder Termin-/Anfrageprozess.
2. App erfasst die notwendigen Stammdaten.
3. System prüft Dubletten, Pflichtfelder und Berechtigungen.
4. System legt den Kund:innen-Datensatz in der App-Datenbank an.
5. Optional kann ein Admin später entscheiden, ob ein Keycloak-Zugang für den Kunden erzeugt wird.

### Ergebnis

- Kund:in existiert fachlich in der App.
- Ein Keycloak-Login wird nicht zwingend automatisch erzeugt.

## Use Case: Nutzer:in meldet sich über Keycloak an

### Akteure

- Admin,
- App,
- Kund:in mit bestehendem Zugang.

### Ziel

Nutzer:in erhält Zugriff auf die App entsprechend der eigenen Rolle.

### Vorbedingungen

- Nutzer:in wurde zuvor durch Admin/System angelegt.
- Keycloak-User ist aktiv.
- Rolle/Gruppe ist korrekt gesetzt.

### Ablauf

1. Nutzer:in öffnet die App.
2. App erkennt: kein gültiger Token vorhanden.
3. App leitet zu Keycloak weiter.
4. Nutzer:in meldet sich an.
5. Keycloak leitet mit gültigem Token zurück zur App.
6. Backend validiert Token und Rollen.
7. App zeigt rollenspezifische Startseite/Funktionen.

### Ergebnis

- Nutzer:in ist authentifiziert.
- App kennt Rolle/Berechtigungen.
- Zugriff ist auf erlaubte Funktionen begrenzt.

## Lokale Testnutzer für E2E-Tests

Für lokale Entwicklung und Playwright E2E-Tests können per Terraform einfache Testnutzer angelegt werden.

Diese Nutzer sind nur für lokale/dev/test-Umgebungen gedacht:

```text
Admin:          admin@example.de          / 123
Führungskraft:  fuehrungskraft@example.de / 123
Angestellter:      angestellter@example.de      / 123
Customer:        kunde@example.de        / 123
```

In produktiven Kundeninstanzen dürfen diese Testnutzer nicht aktiviert werden.

Technische Steuerung:

```hcl
test_users_enabled = true   # nur lokal/dev/test
```

## Fachliche Regel: Keycloak ist Login-System, nicht Fachsystem

Keycloak verwaltet:

- Login,
- Passwort/Reset,
- Sessions,
- Rollen/Gruppen für Autorisierung,
- optional MFA/2FA.

Die App-Datenbank verwaltet:

- fachliche Profile,
- Kund:innenstammdaten,
- App-spezifische Daten,
- Termine,
- Rezepte,
- Auslastung,
- kundenspezifische Fachprozesse.

Ein Keycloak-User allein ist noch kein vollständiges fachliches Profil.

## Offene fachliche Fragen

- Die Rollenbezeichnung für behandelte Personen ist fachlich `kunde`.
- Dürfen Apps immer Kund:innen anlegen oder nur bei bestimmten Berechtigungen?
- Sollen neu angelegte Apps/Kund:innen automatisch E-Mails erhalten?
- Muss der initiale Standard-Admin beim ersten Login sein Passwort ändern?
- Soll der Standard-Admin nach Anlage echter Admins deaktiviert werden?
- Brauchen Kund:innen überhaupt in MVP 1 einen eigenen Login oder werden sie zunächst nur intern verwaltet?
