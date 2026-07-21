# Fachliche Use Cases für GroomingManager

Dieses Dokument sammelt fachliche Regeln, Rollen und Use Cases für GroomingManager. Es ist bewusst produktfachlich formuliert. Technische Stack-Entscheidungen stehen nicht hier: GroomingManager bleibt bei Angular, Spring Boot, Keycloak/OIDC, PostgreSQL, Flyway, Nginx und Docker Compose.

Die fachlichen Features wurden aus `docs/FEATURES.md` extrahiert und auf die neue GroomingManager-Architektur übertragen. Alte technische Angaben aus der importierten Datei, insbesondere ASP.NET/.NET/Identity-spezifische Notizen, gelten **nicht** für dieses Projekt.

## Leitentscheidungen

### Benutzerverwaltung: öffentliche Kund:innen-Registrierung plus interne Anlage

Kund:innen dürfen sich öffentlich über Keycloak registrieren. Keycloak nutzt dabei die E-Mail-Adresse als Benutzername und verlangt eine E-Mail-Verifizierung.

Admins und Groomer werden weiterhin nicht öffentlich registriert, sondern durch Admins oder Provisioning-Prozesse angelegt. Für die initiale Betriebs-/Admin-Einrichtung gilt:

```text
Kundeninstanz wird bereitgestellt
  -> initialer Admin wird angelegt
  -> Admin loggt sich über Keycloak ein
  -> Admin richtet Organisation, Rollen und Groomer-Zugänge ein
  -> Groomer erhalten Zugang und loggen sich über Keycloak ein
  -> Kund:innen können sich öffentlich registrieren und verifizieren ihre E-Mail
```

Keycloak ist damit das zentrale Login- und Identitätssystem. Für Kund:innen ist öffentliche Registrierung möglich; für Admins und Groomer bleibt die Anlage kontrolliert über Admin-/Provisioning-Prozesse.

### Keycloak ist Login-System, nicht Fachsystem

Keycloak verwaltet:

- Login,
- Passwort/Reset,
- Sessions,
- Rollen/Gruppen für Autorisierung,
- optional MFA/2FA.

Die GroomingManager-Datenbank verwaltet:

- Kund:innenprofile,
- Tierprofile,
- Leistungskatalog,
- Termine und Terminstatus,
- Kalender-/Verfügbarkeitsregeln,
- Zahlungen/Anzahlungen,
- Branding-/Theme-Einstellungen,
- fachliche Notizen und Grooming-Historie.

Ein Keycloak-User allein ist noch kein vollständiges fachliches GroomingManager-Profil.

## Rollen

### Admin

Ein Admin verwaltet die Kundeninstanz aus fachlicher Sicht.

Admins können perspektivisch:

- weitere Admins anlegen,
- Führungskräfte anlegen,
- Angestellte anlegen,
- Kund:innen anlegen oder verwalten,
- Nutzer:innen aktivieren/deaktivieren,
- Rollen vergeben,
- Leistungskatalog pflegen,
- Kalender-/Verfügbarkeitsregeln verwalten,
- Termine einsehen und administrieren,
- Branding/Theme der Instanz pflegen,
- Zahlungs-/Checkout-Einstellungen verwalten.

### Führungskraft

Eine Führungskraft steuert operative Abläufe und Auslastung der Grooming-Organisation.

Führungskräfte können perspektivisch:

- aktuelle und kommende Termine überblicken,
- Auslastung und Kapazitäten einsehen,
- Kalenderblöcke oder Schließzeiten verwalten, wenn berechtigt,
- Leistungskatalog prüfen oder vorbereiten,
- Angestellte unterstützen und Tagesplanung koordinieren,
- Berichte/Übersichten für Buchungen und Umsätze sehen.

### Angestellte:r

Angestellte sind Groomer:innen oder operative Mitarbeitende der Kundeninstanz.

Angestellte können perspektivisch:

- eigene Termine und Tagesplanung einsehen,
- Kund:innen- und Tierinformationen einsehen, sofern berechtigt,
- Grooming-Notizen lesen und ergänzen,
- Terminstatus dokumentieren,
- neue Kund:innen/Tiere im Rahmen eines Termins erfassen, wenn die Instanz das erlaubt.

### Kund:in

Kund:innen sind Tierhalter:innen, die Leistungen anfragen oder buchen.

Kund:innen können perspektivisch:

- ihr Profil verwalten,
- eigene Tiere/Hunde verwalten,
- Leistungen ansehen,
- Termine buchen oder anfragen,
- eigene Termine einsehen,
- Zahlungen/Anzahlungen durchführen,
- optional Bilder oder Hinweise zum Tier hinterlegen.

Kund:innen werden von Admins oder berechtigten Angestellten angelegt. Ein Login kann optional freigeschaltet werden.

## Fachliche Domänenobjekte

### Kund:innenprofil

Ein Kund:innenprofil enthält fachliche Stammdaten zur Tierhalter:in.

Mögliche Daten:

- Name,
- E-Mail,
- Telefonnummer,
- Adresse,
- bevorzugte Kontaktart,
- Hinweise zur Kommunikation,
- optional Profilbild,
- verknüpfter Keycloak-User, falls Login aktiv ist.

### Tierprofil / Hund

Ein Tierprofil beschreibt ein zu pflegendes Tier.

Mögliche Daten:

- Name,
- Tierart, im MVP vor allem Hund,
- Rasse,
- Größe,
- Gewicht, falls relevant,
- Felltyp,
- Alter/Geburtsdatum,
- Grooming-Notizen,
- Verhaltenshinweise,
- Allergien oder medizinische Hinweise,
- Foto/Bild,
- Besitzer:in.

### Leistungskatalog

Der Leistungskatalog beschreibt buchbare Grooming-Leistungen.

Mögliche Daten:

- Leistungsname,
- Beschreibung,
- Preis,
- Dauer,
- Aktiv/Inaktiv,
- optionale Kategorie,
- optionale Größen-/Rasseabhängigkeit.

Beispiele:

- Baden & Föhnen,
- Schneiden klein,
- Schneiden mittel,
- Schneiden groß,
- Trimmen,
- Krallen kürzen,
- Ohrenpflege,
- Komplettpaket.

### Termin

Ein Termin verbindet Kund:in, Tier, Leistung, Zeitfenster und Status.

Mögliche Daten:

- Datum,
- Uhrzeit/Slot,
- Kund:in,
- Tier,
- gebuchte Leistung,
- Preis-Snapshot,
- Status,
- Notizen,
- Zahlung/Anzahlung,
- zuständige:r Angestellte:r.

Mögliche Statuswerte:

- angefragt,
- bestätigt,
- bezahlt/angezahlt,
- in Bearbeitung,
- abgeschlossen,
- storniert,
- nicht erschienen.

## Use Case: Initiale Kundeninstanz einrichten

### Akteur

Admin

### Ziel

Eine neue GroomingManager-Kundeninstanz wird erstmalig fachlich eingerichtet.

### Vorbedingungen

- Kundeninstanz wurde technisch bereitgestellt.
- Initialer Admin existiert in Keycloak.
- Admin kann sich anmelden.

### Ablauf

1. Admin öffnet GroomingManager.
2. App leitet zu Keycloak weiter.
3. Admin meldet sich an.
4. Admin prüft Organisationsdaten.
5. Admin legt echte Admins, Führungskräfte und Angestellte an.
6. Admin pflegt erste Leistungen im Leistungskatalog.
7. Admin pflegt erste Kalender-/Verfügbarkeitsregeln.
8. Admin passt optional Branding/Theme an.
9. Initialer Standard-Admin wird optional umbenannt, deaktiviert oder ersetzt.

### Ergebnis

- Kundeninstanz ist fachlich nutzbar.
- Erste Nutzer:innen und Leistungen existieren.
- Öffentliche/rollenspezifische Bereiche können genutzt werden.

## Use Case: Nutzer:in meldet sich über Keycloak an

### Akteure

- Admin,
- Führungskraft,
- Angestellte:r,
- Kund:in mit aktivem Zugang.

### Ziel

Nutzer:in erhält Zugriff auf GroomingManager entsprechend der eigenen Rolle.

### Vorbedingungen

- Nutzer:in wurde zuvor angelegt.
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

## Use Case: Admin legt Angestellte:n an

### Akteur

Admin

### Ziel

Ein:e neue:r Angestellte:r kann sich anmelden und operative Grooming-Funktionen nutzen.

### Vorbedingungen

- Admin ist angemeldet.
- Admin besitzt die Rolle `admin`.
- Kundeninstanz ist aktiv.

### Ablauf

1. Admin öffnet die Nutzerverwaltung.
2. Admin wählt „Angestellte:n anlegen“.
3. Admin erfasst mindestens Name und E-Mail.
4. Admin ordnet Rolle `groomer` zu.
5. Optional erfasst Admin Spezialisierungen, Arbeitszeiten oder Standort.
6. System legt den Nutzer in Keycloak an.
7. System legt/verknüpft das fachliche Angestelltenprofil in der App-Datenbank.
8. System sendet optional eine Einladungs-/Passwortsetz-Mail oder erzeugt einen sicheren Initialzugang.
9. Angestellte:r meldet sich über Keycloak an.

### Ergebnis

- Keycloak-User existiert.
- Fachliches Angestelltenprofil existiert.
- Rollen-/Gruppenzuordnung ist gesetzt.
- Angestellte:r kann sich anmelden.

## Use Case: Admin legt Kund:in an

### Akteur

Admin

### Ziel

Ein:e Kund:in wird angelegt und kann fachlich verwaltet werden. Optional kann die Person Zugang zum Kundenbereich erhalten.

### Vorbedingungen

- Admin ist angemeldet.
- Admin hat Berechtigung zur Kund:innenverwaltung.

### Ablauf

1. Admin öffnet die Kund:innenverwaltung.
2. Admin wählt „Kund:in anlegen“.
3. Admin erfasst Stammdaten wie Name, E-Mail und Telefonnummer.
4. System prüft Pflichtfelder und mögliche Dubletten.
5. System legt den fachlichen Kund:innen-Datensatz an.
6. Falls Login gewünscht ist, legt das System zusätzlich einen Keycloak-User mit Rolle `kunde` an.
7. System informiert die Person optional über den Zugang.

### Ergebnis

- Kund:innen-Datensatz existiert in GroomingManager.
- Optional existiert ein Keycloak-Login.
- Keine öffentliche Selbstregistrierung war nötig.

## Use Case: Kund:in verwaltet eigenes Profil

### Akteur

Kund:in

### Ziel

Kund:in hält eigene Kontakt- und Profildaten aktuell.

### Vorbedingungen

- Kund:in ist angemeldet.
- Kundenbereich ist für die Instanz aktiv.

### Ablauf

1. Kund:in öffnet den Profilbereich.
2. System zeigt gespeicherte Profildaten.
3. Kund:in ändert Kontaktdaten, Profilbild oder Kommunikationspräferenzen.
4. System validiert Pflichtfelder und Formate.
5. System speichert Änderungen.

### Ergebnis

- Profil ist aktualisiert.
- Künftige Termin- und Kommunikationsprozesse nutzen aktuelle Daten.

## Use Case: Kund:in verwaltet Tierprofile

### Akteur

Kund:in

### Ziel

Kund:in legt eigene Tiere/Hunde an und hält relevante Grooming-Informationen aktuell.

### Vorbedingungen

- Kund:in ist angemeldet.
- Kund:in hat Zugriff auf eigene Tierprofile.

### Ablauf

1. Kund:in öffnet „Meine Tiere“.
2. Kund:in legt ein neues Tier an oder bearbeitet ein bestehendes Tier.
3. Kund:in erfasst Name, Rasse, Größe und Grooming-Notizen.
4. Optional lädt Kund:in ein Bild hoch.
5. System speichert das Tierprofil und verknüpft es mit der Kund:in.

### Ergebnis

- Tierprofil existiert oder ist aktualisiert.
- Grooming-Team kann relevante Hinweise später beim Termin sehen.

## Use Case: Angestellte:r legt Kund:in oder Tier im Terminprozess an

### Akteur

Angestellte:r

### Ziel

Neue Kund:innen oder Tiere können während Anfrage, Telefonat oder Terminaufnahme erfasst werden.

### Vorbedingungen

- Angestellte:r ist angemeldet.
- Instanz erlaubt diese Funktion.
- Angestellte:r besitzt die nötige Berechtigung.

### Ablauf

1. Angestellte:r öffnet Kund:innenverwaltung oder Terminprozess.
2. Angestellte:r erfasst notwendige Stammdaten.
3. System prüft Dubletten, Pflichtfelder und Berechtigungen.
4. System legt Kund:in und optional Tierprofil an.
5. Optional kann später ein Admin entscheiden, ob ein Keycloak-Zugang erzeugt wird.

### Ergebnis

- Kund:in und/oder Tier existieren fachlich in der App.
- Ein Keycloak-Login wird nicht zwingend automatisch erzeugt.

## Use Case: Admin pflegt Leistungskatalog

### Akteur

Admin

### Ziel

Buchbare Grooming-Leistungen werden aktuell gehalten.

### Vorbedingungen

- Admin ist angemeldet.
- Admin hat Berechtigung zur Leistungspflege.

### Ablauf

1. Admin öffnet den Leistungskatalog.
2. Admin legt eine neue Leistung an oder bearbeitet eine bestehende.
3. Admin erfasst Name, Preis, optional Beschreibung, Dauer und Kategorie.
4. Admin aktiviert oder deaktiviert die Leistung.
5. System validiert Pflichtfelder und Preis.
6. System speichert die Leistung.

### Ergebnis

- Leistung ist im Katalog verfügbar oder deaktiviert.
- Aktive Leistungen können von Kund:innen gesehen und gebucht werden.

## Use Case: Kund:in sieht aktive Leistungen

### Akteur

Kund:in oder Besucher:in

### Ziel

Eine Person kann verfügbare Grooming-Leistungen vor einer Buchung ansehen.

### Vorbedingungen

- Es gibt aktive Leistungen im Leistungskatalog.

### Ablauf

1. Person öffnet die Leistungsübersicht.
2. System zeigt aktive Leistungen mit Name, Beschreibung, Preis und optional Dauer.
3. Person wählt optional eine Leistung für eine Terminbuchung aus.

### Ergebnis

- Person kennt verfügbare Leistungen.
- Buchungsprozess kann mit ausgewählter Leistung fortgesetzt werden.

## Use Case: Kund:in bucht oder fragt Termin an

### Akteur

Kund:in

### Ziel

Kund:in bucht einen Grooming-Termin oder stellt eine Terminanfrage.

### Vorbedingungen

- Kund:in ist angemeldet oder die Instanz erlaubt öffentliche Anfrageformulare.
- Mindestens eine aktive Leistung existiert.
- Kalender/Slots sind verfügbar.

### Ablauf

1. Kund:in öffnet Terminbuchung.
2. Kund:in wählt Tier, Leistung, Datum und Zeitfenster.
3. System prüft Slot-Verfügbarkeit.
4. System zeigt Preis und ggf. Anzahlung.
5. Kund:in bestätigt Anfrage/Buchung.
6. System speichert Termin mit Status `angefragt` oder `bestätigt`.
7. Falls Zahlung erforderlich ist, leitet System in den Checkout.

### Ergebnis

- Termin existiert.
- Leistung und Preis sind als Snapshot gespeichert.
- Slot ist nicht mehr doppelt buchbar.
- Optional wurde ein Zahlungsprozess gestartet.

## Use Case: Admin oder Führungskraft verwaltet Kalender

### Akteure

- Admin,
- Führungskraft.

### Ziel

Verfügbarkeiten, Schließzeiten und Buchungsübersicht werden gepflegt.

### Vorbedingungen

- Nutzer:in ist angemeldet.
- Nutzer:in besitzt Rolle `admin` oder `groomer`.

### Ablauf

1. Nutzer:in öffnet Kalenderverwaltung.
2. System zeigt Termine, Slots, Schließzeiten und Auslastung.
3. Nutzer:in blockt einzelne Slots, Tage oder Zeiträume.
4. Nutzer:in passt Arbeits-/Öffnungszeiten an.
5. System speichert Kalenderregeln.
6. Buchungsprozess berücksichtigt die Änderungen sofort.

### Ergebnis

- Kalender bildet reale Verfügbarkeiten ab.
- Kund:innen können keine gesperrten Slots buchen.
- Team sieht aktuelle Planung.

## Use Case: Angestellte:r sieht eigene Tagesplanung

### Akteur

Angestellte:r

### Ziel

Angestellte:r weiß, welche Tiere und Leistungen heute geplant sind.

### Vorbedingungen

- Angestellte:r ist angemeldet.
- Termine sind Angestellten oder Teams zugeordnet.

### Ablauf

1. Angestellte:r öffnet Dashboard oder Tagesplanung.
2. System zeigt kommende Termine.
3. Angestellte:r öffnet Termin Details.
4. System zeigt Kund:in, Tier, Leistung, Grooming-Notizen und Status.
5. Angestellte:r aktualisiert optional Status oder Notizen.

### Ergebnis

- Angestellte:r hat operative Übersicht.
- Terminstatus und Notizen bleiben aktuell.

## Use Case: Admin/Führungskraft sieht aktuelle Termine

### Akteure

- Admin,
- Führungskraft.

### Ziel

Leitung sieht die letzten und kommenden Buchungen für operative Steuerung.

### Vorbedingungen

- Nutzer:in ist angemeldet.
- Nutzer:in besitzt Rolle `admin` oder `groomer`.

### Ablauf

1. Nutzer:in öffnet Dashboard oder Terminübersicht.
2. System zeigt zuletzt erstellte Termine.
3. Nutzer:in filtert optional nach Datum, Status, Leistung oder Angestellte:r.
4. Nutzer:in öffnet Details oder nimmt administrative Änderungen vor.

### Ergebnis

- Leitung hat Überblick über Nachfrage und Auslastung.
- Operative Entscheidungen können vorbereitet werden.

## Use Case: Kund:in bezahlt Anzahlung oder Termin über PayPal

### Akteur

Kund:in

### Ziel

Kund:in bezahlt eine Buchung oder Anzahlung digital.

### Vorbedingungen

- Termin wurde erstellt.
- Für die Leistung oder Instanz ist Zahlung/Anzahlung erforderlich.
- Zahlungsanbieter ist konfiguriert.

### Ablauf

1. System leitet nach Buchung in Checkout.
2. Kund:in sieht Betrag, Leistung und Terminbezug.
3. Kund:in startet PayPal-Zahlung.
4. Zahlungsanbieter bestätigt Erfolg, Abbruch oder ausstehende Zahlung.
5. System speichert Zahlungsstatus am Termin.
6. System zeigt Erfolgs-, Abbruch- oder Pending-Seite.

### Ergebnis

- Zahlung ist erfasst.
- Terminstatus kann abhängig vom Zahlungsergebnis aktualisiert werden.
- Admin/Führungskraft kann Zahlungsstatus sehen.

## Use Case: Admin passt Branding und Theme an

### Akteur

Admin

### Ziel

Eine Kundeninstanz kann optisch an die Grooming-Organisation angepasst werden.

### Vorbedingungen

- Admin ist angemeldet.
- Admin hat Berechtigung zur Instanzkonfiguration.

### Ablauf

1. Admin öffnet Theme-/Branding-Einstellungen.
2. Admin pflegt Logo, Farben, öffentliche Startseitenbilder oder Texte.
3. System validiert Werte und Dateigrößen.
4. System speichert Theme-Einstellungen.
5. Frontend übernimmt Änderungen für öffentliche und interne Bereiche.

### Ergebnis

- Instanz wirkt gebrandet.
- Änderungen sind ohne Codeänderung möglich.

## Use Case: Rollenspezifische Dashboards

### Akteure

- Admin,
- Führungskraft,
- Angestellte:r,
- Kund:in.

### Ziel

Jede Rolle sieht direkt die relevantesten Funktionen.

### Vorbedingungen

- Nutzer:in ist angemeldet.
- Rolle ist im Token enthalten.

### Ablauf

1. Nutzer:in meldet sich an.
2. App liest Rolle/Berechtigungen.
3. App zeigt rollenabhängige Navigation und Dashboard-Kacheln.
4. Nicht erlaubte Funktionen werden ausgeblendet und serverseitig geschützt.

### Ergebnis

- Nutzer:innen sehen nur passende Funktionen.
- Backend erzwingt Berechtigungen unabhängig vom Frontend.

## Lokale Testnutzer für E2E-Tests

Für lokale Entwicklung und Playwright E2E-Tests können per Terraform einfache Testnutzer angelegt werden.

Diese Nutzer sind nur für lokale/dev/test-Umgebungen gedacht:

```text
Admin:   admin@grooming-manager.local   / 123
Groomer: groomer@grooming-manager.local / 123
Kund:in: kunde@grooming-manager.local   / 123
```

In produktiven Kundeninstanzen dürfen diese Testnutzer nicht aktiviert werden.

Technische Steuerung:

```hcl
test_users_enabled = true   # nur lokal/dev/test
```

## Aus FEATURES.md extrahierte fachliche Feature-Liste

Diese Features sollen fachlich im GroomingManager-Backlog bleiben. Der Status bezieht sich auf das Zielprodukt, nicht zwingend auf den aktuellen Implementierungsstand nach der Template-Migration.

### GM-F-001 Benutzeranlage, Login und rollenbasierter Zugriff

- Admins, Führungskräfte, Angestellte und Kund:innen melden sich über Keycloak an.
- Keine öffentliche Selbstregistrierung.
- Rollen steuern Frontend-Navigation und Backend-Zugriff.

### GM-F-002 Rollenspezifische Dashboards

- Admin-Dashboard für Verwaltung.
- Führungskraft-Dashboard für Auslastung und Termine.
- Angestellten-Dashboard für Tagesplanung.
- Kund:innen-Dashboard für Profil, Tiere und Termine.

### GM-F-003 Profilverwaltung

- Kund:innen können eigene Profildaten pflegen.
- Profilbild ist perspektivisch möglich.
- Admins/Angestellte können fachliche Kund:innenstammdaten pflegen, wenn berechtigt.

### GM-F-004 Tier-/Hundeverwaltung

- Kund:innen können Hunde/Tiere hinzufügen, bearbeiten und entfernen.
- Tierprofile enthalten Rasse, Größe, Grooming-Notizen und optional Bild.
- Angestellte können Tierinformationen für Termine einsehen.

### GM-F-005 Leistungskatalog

- Admins pflegen buchbare Grooming-Leistungen.
- Leistungen haben mindestens Name, Preis und Aktivstatus.
- Aktive Leistungen sind für Buchung/Anfrage sichtbar.

### GM-F-006 Terminbuchung und Kalenderverwaltung

- Kund:innen können Termin mit Leistung und Slot buchen/anfragen.
- System verhindert Doppelbuchungen desselben Slots.
- Admin/Führungskraft kann aktuelle Termine sehen.
- Kalenderblöcke, Arbeitszeiten und Schließtage sollen ergänzt werden.

### GM-F-007 Zahlungen und PayPal Checkout

- Buchungen können optional mit Zahlung oder Anzahlung verbunden werden.
- Checkout, Erfolg, Abbruch und Pending-Status sollen abgebildet werden.
- Zahlungsstatus soll am Termin sichtbar sein.

### GM-F-008 Theme-/Branding-Anpassung

- Admin kann Logo, Farben und öffentliche Bilder/Texte pflegen.
- Frontend wendet Theme dynamisch auf öffentliche und interne Bereiche an.

## Offene fachliche Fragen

- Soll Kund:innen-Login schon im MVP aktiv sein oder zunächst nur interne Verwaltung?
- Dürfen Angestellte immer Kund:innen/Tiere anlegen oder nur mit Zusatzberechtigung?
- Welche Tierarten außer Hund sollen im MVP unterstützt werden?
- Sind Terminbuchungen direkt verbindlich oder zunächst nur Anfragen?
- Welche Terminstatus brauchen wir im MVP wirklich?
- Brauchen wir Anzahlungen bereits im MVP oder später?
- Welcher Zahlungsanbieter ist gesetzt: PayPal, Stripe oder zunächst keiner?
- Wer darf Kalenderblöcke und Schließtage pflegen: Admin, Führungskraft oder beide?
- Sollen Kund:innen automatische E-Mails/SMS bei Buchung, Änderung und Erinnerung erhalten?
- Soll Grooming-Historie mit Vorher/Nachher-Bildern Teil des MVP sein?
