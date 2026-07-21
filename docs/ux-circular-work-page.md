# Anforderung: Runde Work-Page aus dem Arbeitsgraphen

Status: Requirements-/UX-Slice für den GroomingManager-Arbeitsgraphen.

## Kurzbeschreibung

Wenn Nutzer:innen einen Graphknoten aktivieren, der nicht nur navigiert oder expandiert, sondern fachlichen Inhalt öffnet, soll ausgehend vom kreisförmigen Knoten eine ebenfalls kreisförmige Work-Page zentral im Bildschirm entstehen. Diese Work-Page kann Formulare, Listen, Kalender oder später weitere Content-Varianten enthalten. Beim Speichern, Abbrechen oder Schließen verschwindet die Work-Page wieder mit Rückwärtsanimation in den auslösenden Knoten.

Die runde Work-Page ersetzt perspektivisch das aktuelle rechte Kontextpanel für echte Arbeitsinhalte, ohne den Arbeitsgraphen als primären Navigationsraum aufzugeben.

## Nutzerrollen

- Admin: legt z. B. Kund:innen, Hunde, Groomer oder Leistungen an und bearbeitet Stammdaten.
- Groomer: öffnet z. B. Termin-, Hunde-, Kunden- oder Notizkontexte.
- Kund:in: öffnet z. B. eigene Hunde, Profil, Terminanfragen oder Terminübersichten.

## Begriffe

- **Auslösender Knoten**: Graphknoten, der die Work-Page öffnet, z. B. `Kunde hinzufügen`.
- **Ursprungskoordinaten**: bekannte Bildschirmposition und Größe des auslösenden Knotens zum Zeitpunkt der Aktivierung; dient als Start- und Rückkehrpunkt der Animation.
- **Work-Page**: zentral dargestellte runde Shell über dem Arbeitsgraphen. Sie ist kein eigener Router-Seitenwechsel, sondern ein Arbeitszustand des Graph-Workspace.
- **Content-Bereich**: innerer, fachlicher Bereich der Work-Page. Er nimmt Formular, Liste, Kalender oder Detailansicht auf und darf bei Bedarf scrollen.
- **Content-Renderer**: wiederverwendbarer innerer Renderer, der den konkreten Inhalt des Content-Bereichs bereitstellt.
- **Rückkehraktion**: Speichern, Abbrechen, Schließen oder spätere Workflow-Aktion, die die Work-Page beendet und Fokus/Animation nachvollziehbar zum auslösenden Knoten oder zu einem neu entstandenen Instanzknoten zurückführt.
- **Primäraktion**: fachlich bevorzugte Aktion des geöffneten Inhalts, z. B. `Speichern`, `Anlegen`, `Termin übernehmen`.
- **Sekundäraktion**: sichere Rückkehr- oder Abbruchaktion, z. B. `Abbrechen`, `Schließen`, `Zurück`.

## User Story 1 — Work-Page aus Aktionsknoten öffnen

Als Admin oder Groomer möchte ich auf einen Aktionsknoten wie `Kunde hinzufügen`, `Hund hinzufügen` oder `Groomer hinzufügen` klicken können, damit sich der passende Arbeitsinhalt direkt aus diesem Knoten heraus öffnet und ich den räumlichen Zusammenhang zwischen Aktion und Formular behalte.

### Akzeptanzkriterien

- Aktiviert ein Knoten eine Work-Page, bleibt der auslösende Knoten als fachlicher Ursprung bekannt.
- Die Work-Page öffnet sich zentral über dem Arbeitsgraphen und wirkt optisch rund.
- Die Öffnungsanimation startet sichtbar am auslösenden Knoten und skaliert/transformiert zur zentralen Work-Page.
- Die Work-Page enthält mindestens: Überschrift, optional erklärenden Untertitel, Content-Bereich und Rückkehraktionen.
- Der Arbeitsgraph bleibt im Hintergrund als Kontext erkennbar, konkurriert aber visuell nicht mit der Work-Page.
- Bei `prefers-reduced-motion: reduce` wird die Bewegung stark reduziert oder ohne Flug-/Zoomanimation ersetzt.

### Nicht-Ziele

- Keine Backend-Integration für alle Formulare in diesem Slice.
- Keine komplette Ablösung aller bestehenden Seiten/Routen.
- Keine frei skalierbare Fensterverwaltung oder Multi-Window-UI.

## User Story 2 — Formular in runder Work-Page bedienen

Als Admin möchte ich in der Work-Page ein Formular ausfüllen und speichern oder abbrechen können, damit ich fachliche Objekte anlege, ohne aus dem graphbasierten Arbeitsraum herauszufallen.

### Akzeptanzkriterien

- Der Content-Bereich kann Formularfelder aufnehmen, mindestens Textinput für einen ersten Demo-/MVP-Fall.
- Speichern und Abbrechen sind als runde Buttons rechts unten an bzw. nahe an der runden Work-Page positioniert.
- Die Buttons haben sichtbaren Text oder eindeutig zugängliche Labels; Icon-only ist nur mit Accessible Name erlaubt.
- Speichern löst die fachliche Aktion des konkreten Content-Renderers aus.
- Abbrechen verwirft nicht gespeicherte Eingaben des geöffneten Work-Page-Kontexts.
- Nach Speichern oder Abbrechen schließt die Work-Page mit Rückwärtsanimation in Richtung des auslösenden Knotens.
- Nach dem Schließen ist der Fokus wieder nachvollziehbar: bevorzugt auf dem auslösenden Knoten oder dem neu erzeugten Instanzknoten.

### Nicht-Ziele

- Keine komplexe Validierungsbibliothek als eigene Aufgabe, solange vorhandene Angular-/PrimeNG-Mechanismen reichen.
- Keine finalen fachlichen Pflichtfelder für alle Domänen; diese kommen pro Formular-Slice.

## User Story 3 — Work-Page für verschiedene Content-Typen vorbereiten

Als Produktteam möchte ich dieselbe runde Work-Page für Formular, Liste, Kalender und Detailansicht verwenden können, damit der Graph ein konsistentes Arbeitsmuster bekommt und neue Knoten später klein integriert werden können.

### Akzeptanzkriterien

- Die Work-Page unterscheidet zwischen äußerem Shell-Verhalten und innerem Content.
- Der innere Content kann mindestens als Platzhaltertyp `form`, `list`, `calendar` und `detail` modelliert werden.
- Jeder Content-Typ kann eigene Titel, Beschreibung, Primäraktion und Sekundäraktion definieren.
- Die Work-Page darf bei Listen/Kalendern inhaltlich scrollen, ohne die runde Optik und die Rückkehraktionen zu verlieren.
- Bei kleinen Viewports gibt es eine responsive Alternative: runde Anmutung bleibt, aber Lesbarkeit/Bedienbarkeit haben Vorrang vor perfekter Kreisform.

### Nicht-Ziele

- Kein vollständiger Kalender als Bestandteil dieses Foundation-Slices.
- Keine parallelen geöffneten Work-Pages.

## Geplante Content-Varianten

| Variante | Zweck | Beispielknoten | Mindestinhalt im Foundation-/MVP-Kontext | Abgrenzung |
| --- | --- | --- | --- | --- |
| Formular | Neues Objekt anlegen oder bestehendes Objekt bearbeiten | `Kunde hinzufügen`, `Hund hinzufügen`, `Groomer hinzufügen` | Titel, kurze Beschreibung, mindestens ein Eingabefeld, Primäraktion, Sekundäraktion | Fachliche Pflichtfelder, Validierungsregeln und API-Anbindung kommen pro Domänen-Slice. |
| Liste | Mehrere fachliche Einträge im Graph-Kontext ansehen und auswählen | `Kundenliste`, `Hunde`, `Leistungen` | Titel, optionaler Filter-/Suchplatzhalter, scrollbarer Listenbereich, Schließen/Zurück | Keine vollständige Tabellen-/Massendatenverwaltung im Shell-Slice. |
| Kalender | Zeitliche Einträge im Graph-Kontext ansehen oder auswählen | `Kalender`, `Termine`, `Tagesplanung` | Titel, Datum-/Zeitraum-Kontext, kalenderartiger Platzhalter oder eingebetteter Kalenderbereich, Schließen/Zurück | Kein finaler Terminplaner und keine komplexen Drag-/Drop-Regeln im Shell-Slice. Fachlicher Tagesagenda-Vertrag: `docs/requirements/day-agenda-api-contract.md`. |
| Detail | Ein konkretes Objekt oder einen Kontext lesen und Folgeaktionen erreichen | Kund:innen-Instanz, Hunde-Instanz, Termin-Instanz | Titel mit Objektname, Kerndaten/Status, 1-2 Primär-/Folgeaktionen, Schließen/Zurück | Keine vollständige Objekt-Historie und keine parallelen Detailfenster. |

## Geschnittener Listen- und Kalender-Scope

### Ausgewählter Listen-Anwendungsfall

Für den ersten Listen-Slice wird der Graphknoten `Kundenliste` unter der Domäne `Kund:innen` verwendet.

Nutzerziel:

- Admins und Groomer möchten Kund:innen aus dem Arbeitsgraphen heraus finden und auswählen, ohne in eine klassische Tabellenroute zu wechseln.
- Die Liste dient als Arbeitskontext: Ein Listeneintrag kann später einen Kund:innen-Instanzknoten aktivieren oder anheften.

Mindestinhalt:

- Titel `Kundenliste`.
- Orientierungstext `Wähle eine Kund:in aus, um sie im Arbeitsgraphen weiterzubearbeiten.`
- Such-/Filterfeld als optionaler Platzhalter, initial ohne komplexe Filterlogik.
- Vertikale Liste mit Kund:innenname, optional Kontaktkurzinfo und Status/Beziehung, z. B. `Kund:in`, `3 Hunde`, `letzter Termin` sobald Daten verfügbar sind.
- Leerer Zustand `Noch keine Kund:innen vorhanden. Kund:in hinzufügen.` mit Aktion zum passenden Aktionsknoten oder Formular-Renderer.
- Fehlerzustand `Kund:innen konnten nicht geladen werden. Erneut versuchen.`

Begründung:

- Der Use Case passt zu vorhandenen Backend-Fähigkeiten (`GET /api/customers`) und zum ersten Formular-Slice `Kunde hinzufügen`.
- Er validiert, ob lange vertikale Inhalte in der runden Shell lesbar bleiben, ohne direkt Tabellen-, Massenaktionen oder komplexe Spaltenlogik zu bauen.

Nicht-Ziel für diesen Slice:

- Keine vollwertige DataTable mit Spaltenkonfiguration, Bulk-Aktionen, serverseitigem Paging oder Export.
- Keine finale Kund:innen-Detailbearbeitung innerhalb der Liste; Auswahl darf zunächst nur Kontext/Instanz öffnen.

### Ausgewählter Kalender-Anwendungsfall

Für den ersten Kalender-Slice wird der Graphknoten `Tagesplanung` unter `Termine` bzw. `Kalender` verwendet.

Nutzerziel:

- Groomer möchten die heutigen oder ausgewählten Tages-Termine aus dem Graphen heraus überblicken.
- Admins/Groomer sollen erkennen, welche Zeitfenster belegt sind, ohne dass bereits ein kompletter Terminplaner entsteht.

Mindestinhalt:

- Titel `Tagesplanung`.
- Datumszeile mit aktuellem Tag und einfachen Aktionen `Vorheriger Tag`, `Heute`, `Nächster Tag`.
- Vertikale Zeitachsen- oder Agenda-Darstellung mit Termin-Karten: Uhrzeit, Kund:in, Hund, Leistung, Status.
- Leerer Zustand `Für diesen Tag sind keine Termine geplant.`
- Fehlerzustand `Tagesplanung konnte nicht geladen werden. Erneut versuchen.`
- Primäraktion optional `Termin anfragen/anlegen`, falls ein passender Aktionsknoten vorhanden ist; sonst nur `Schließen`.

Begründung:

- Der Use Case passt zu vorhandenen Termin-Endpunkten (`GET /api/admin/appointments/recent` als Übergang, später Tagesfilter) und zum fachlichen Bedarf von Groomer:innen.
- Eine Agenda ist in der runden Work-Page besser lesbar als ein vollständiger Monats-/Wochenkalender und validiert zuerst Orientierung, Scroll und Fokusführung.

API-/Status-Vertrag:

- Die Tagesplanung ist als erster Kalender-Anwendungsfall fachlich bestätigt.
- `GET /api/admin/appointments/recent` reicht nur als kurzfristiger UI-/Demo-Übergang, nicht als abnahmefähiger Tagesplanungs-Vertrag.
- Für die erste fachliche Implementierung ist ein Tagesfilter-Slice mit `GET /api/admin/appointments/day?date=YYYY-MM-DD` nötig.
- Mindeststatus für die Agenda sind `REQUESTED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `NO_SHOW`; Zahlungszustände bleiben eigener späterer Slice.
- Details zu Kartenfeldern, Rollenrechten und offenen Folgeentscheidungen stehen in `docs/requirements/day-agenda-api-contract.md`.

Nicht-Ziel für diesen Slice:

- Kein vollständiger Kalenderbau mit Monatsansicht, Ressourcenplanung, Drag-and-Drop, Slot-Konfliktbearbeitung oder Arbeitszeitregel-Editor.
- Keine Schließzeitregeln, Ressourcenplanung oder endgültige Zahlungs-/Status-Historie; offene Folgeentscheidungen bleiben sichtbar.

## Scrollverhalten in der runden Work-Page

### Grundregel

Die äußere Work-Page-Shell bleibt stabil und übernimmt Titel, Ursprung, Orientierung und Rückkehraktionen. Nur der innere Content-Bereich scrollt. Primär-/Sekundäraktionen dürfen beim Scrollen nicht verschwinden.

### Verhalten

1. Die Shell ist zentriert und hat eine feste Maximalgröße pro Viewport.
2. Header/Title-Bereich bleibt oben innerhalb der Shell sichtbar oder zumindest außerhalb des scrollenden Bereichs stabil.
3. Der Content-Bereich erhält `overflow: auto`, sobald Inhalt höher als die verfügbare Innenfläche ist.
4. Aktionsbereich bleibt unten rechts an bzw. nahe an der Shell sichtbar. Bei kleinen Viewports wird er als sticky Footer innerhalb der Shell geführt.
5. Listen scrollen vertikal. Horizontales Scrollen ist für den MVP nicht zulässig; Einträge müssen umbrechen oder kompakter werden.
6. Kalender-/Agenda-Inhalte scrollen vertikal entlang der Zeit. Einfache Tagesnavigation bleibt außerhalb des scrollenden Terminbereichs sichtbar.
7. Scroll-Schatten oder Randverläufe dürfen anzeigen, dass weiterer Inhalt folgt, aber nicht einzige Information sein. Zusätzlich ist ein kurzer Status erlaubt, z. B. `Weitere Einträge unten`.
8. Beim Öffnen springt der Scrollstand auf Anfang. Bei Tageswechsel im Kalender springt der Terminbereich ebenfalls auf Anfang bzw. zum ersten Termin, wenn technisch unterstützt.
9. Tastaturfokus folgt der natürlichen Reihenfolge: Titel/Orientierung, Filter oder Tagesnavigation, Einträge, Aktionen. Tab darf nicht in unsichtbare ausgescrollte Bereiche springen, ohne dass der Browser sie sichtbar scrollt.
10. Escape schließt die Work-Page nur, wenn kein inneres Control Escape fachlich benötigt; bei geöffnetem Dropdown/Datepicker schließt zuerst dieses innere Control.

### Zustände

| Zustand | Darstellung | UI-Text/Label | Accessibility-Anforderung |
| --- | --- | --- | --- |
| Content passt vollständig | Keine Scrollsignale nötig. | Kein Zusatztext. | Fokusreihenfolge bleibt sichtbar nachvollziehbar. |
| Content ist scrollbarer | Dezenter innerer Scrollbereich, Header und Aktionen bleiben stabil. | Optional `Weitere Einträge unten`. | Scrollregion braucht einen Accessible Name, z. B. `Kundenliste, scrollbarer Inhalt`. |
| Tastatur scrollt | Browser scrollt fokussierten Eintrag sichtbar in den Content-Bereich. | Keine rein visuelle Änderung. | Fokusindikator darf nicht durch Kreis-Maske oder sticky Footer verdeckt werden. |
| Loading | Skeleton/Spinner im Content-Bereich, Shell bleibt orientierend sichtbar. | `<Inhalt> wird geladen…` | `aria-busy="true"` am Content-Bereich; keine Fokusfalle. |
| Error | Fehlermeldung im Content-Bereich plus Wiederholen-Aktion. | Siehe Use-Case-Fehlertexte. | Fehler wird textlich angezeigt und per Live-Region angekündigt. |

## Responsive Grenze für runde Optik

Die Kreisform ist eine Orientierungshilfe, aber kein Dogma. Lesbarkeit, Zielgröße und verständliches Scrollen gewinnen immer gegen perfekte Rundung.

### Viewport-Regeln

- Desktop/weiter Viewport: Ab `min-width: 1024px` und `min-height: 720px` darf die Shell als deutlicher Kreis bzw. nahezu runde Fläche dargestellt werden. Empfohlene Größe: `min(760px, 82vw, 82vh)`.
- Mittlerer Viewport: Unter `1024px` Breite oder unter `720px` Höhe wechselt die Shell zu einer stark abgerundeten Kartenform mit kreisförmiger Anmutung. Content-Breite und Zeilenlänge haben Vorrang.
- Kleiner Viewport: Unter `640px` Breite oder unter `560px` Höhe wird die Shell zu einer fast vollflächigen Bottom-/Center-Sheet-Variante mit großen Rundungen (`24px` bis `32px`) statt echter Kreisform.
- Sehr kleiner/Zoom-Viewport: Bei 200% Browserzoom oder wenn Zielgrößen/Labels nicht mehr in die runde Fläche passen, muss die lineare Alternative bzw. eine rechteckigere Work-Sheet-Darstellung direkt nutzbar sein.

### Mindestanforderungen bei Anpassung

- Interaktive Ziele bleiben mindestens `44 x 44 CSS-Pixel` groß.
- Listen- und Agenda-Zeilen dürfen nicht durch Kreis-Masking abgeschnitten werden.
- Der sichtbare Content-Bereich soll mindestens `320px` nutzbare Breite haben; darunter wird keine perfekte Kreisform erzwungen.
- Primär-/Sekundäraktionen bleiben sichtbar oder sticky erreichbar.
- Der Screenreader-Name ändert sich nicht durch den visuellen Formwechsel.

## Renderer-Vertrag für Content-Typen

Die runde Work-Page besteht aus äußerer Shell und innerem Renderer. Die Shell kennt den Content-Typ, aber nicht die fachliche Detailimplementierung.

### Gemeinsame Shell-Daten

Jeder Renderer erhält bzw. definiert mindestens:

- `contentType`: `form` | `list` | `calendar` | `detail`.
- `sourceNodeId`: auslösender Graphknoten.
- `title`: sichtbare Überschrift und Accessible Name der Work-Page.
- `description`: optionaler Orientierungstext.
- `primaryAction`: optionale fachliche Hauptaktion mit sichtbarem Label und Accessible Name.
- `secondaryAction`: Rückkehr-/Schließen-/Abbrechen-Aktion.
- `busy`, `error`, `empty`: Zustandsinformationen für Shell und Content-Bereich.
- `originLabel`: menschenlesbarer Ursprung, z. B. `aus Knoten Kund:innen`.

### Varianten

| Content-Typ | Nutzerziel | Renderer-Verhalten | Fokus beim Öffnen | Primäre Zustände |
| --- | --- | --- | --- | --- |
| `form` | Objekt anlegen oder bearbeiten. | Zeigt Felder, Validierung und Speichern/Abbrechen. | Erstes Pflichtfeld oder Überschrift, wenn Kontext zuerst gelesen werden soll. | Normal, dirty, validation error, saving, saved, cancelled. |
| `list` | Einträge ansehen, filtern und auswählen. | Zeigt optional Suche/Filter und scrollbare Eintragsliste. Auswahl aktiviert/öffnet Instanzkontext. | Suchfeld, falls vorhanden; sonst erster Listeneintrag oder Überschrift bei leerer Liste. | Normal, empty, loading, error, item selected. |
| `calendar` | Termine/Zeiten eines begrenzten Zeitraums überblicken. | Zeigt Tagesnavigation und scrollbare Agenda/Zeitachse. | Datumsnavigation oder erster Termin. | Normal, empty day, loading, error, date changed. |
| `detail` | Ein Objekt lesen und Folgeaktionen erreichen. | Zeigt Kerndaten, Beziehungen und 1-2 Aktionen. | Überschrift oder erste sichere Folgeaktion. | Normal, loading, error, readonly, action available. |

### Übergabe zurück an den Graph

- `form` kann nach erfolgreichem Speichern einen neuen oder aktualisierten Instanzknoten melden.
- `list` kann einen vorhandenen Eintrag auswählen und daraus einen Instanzknoten aktivieren/anheften.
- `calendar` kann einen Termin auswählen und später einen Termin-Detailknoten öffnen; im ersten Slice reicht Auswahl ohne komplexe Bearbeitung.
- `detail` kann Folgeaktionen als Aktionsknoten oder Shell-Aktionen anbieten.
- Nach jeder Rückgabe bleibt nachvollziehbar, welcher Ursprungsknoten die Work-Page geöffnet hat.

## Zustands- und Verhaltensregeln

1. Ein aktivierter Seiten-/Aktionsknoten erzeugt genau eine aktive Work-Page-Instanz im Workspace-State.
2. Die Work-Page speichert mindestens `sourceNodeId`, sichtbaren Titel, Content-Typ, optionale Beschreibung, Aktionsdefinitionen und optional die Ursprungskoordinaten.
3. Die Work-Page öffnet ohne Route-Wechsel zentral über dem Graphen. Der Arbeitsgraph bleibt als räumlicher Kontext sichtbar.
4. Wenn Ursprungskoordinaten vorhanden sind, startet die Öffnungsanimation am Kreis des auslösenden Knotens und skaliert/transformiert zur zentralen runden Work-Page.
5. Wenn Ursprungskoordinaten fehlen, nutzt die Shell einen zentrierten Fade-/Scale-Fallback; fachlich bleibt `sourceNodeId` trotzdem erhalten.
6. Rückkehraktionen schließen die Work-Page. Die Schließanimation läuft bevorzugt zum ursprünglichen Aktionsknoten zurück, solange noch keine UX-Entscheidung für Rückkehr zum neu erzeugten Instanzknoten getroffen wurde.
7. Während eine Work-Page aktiv ist, darf keine zweite Work-Page parallel geöffnet werden. Ein anderer auslösender Knoten ersetzt den Zustand nur nach expliziter Entscheidung oder nach vorherigem Schließen.
8. Lesbarkeit und Bedienbarkeit haben Vorrang vor geometrischer Perfektion: Auf kleinen Viewports darf die runde Shell zu einer abgerundeten, nahezu bildschirmfüllenden Fläche werden.

## Use Case — Kunde hinzufügen als erster vertikaler Slice

1. Nutzer:in aktiviert den Graphknoten `Kunden` und sieht dessen Kinder.
2. Nutzer:in aktiviert `Kunde hinzufügen`.
3. Die runde Work-Page öffnet sich aus diesem Knoten heraus.
4. Work-Page zeigt Überschrift `Kunden hinzufügen`, Beschreibung und Namensfeld.
5. Nutzer:in gibt einen Namen ein.
6. Nutzer:in klickt den runden Speichern-Button.
7. Ein neuer Kunden-Instanzknoten wird wie bisher im Graphen angeheftet.
8. Die Work-Page schließt animiert zurück zum Ursprung bzw. fachlich zum neuen/aktiven Knoten.
9. Fokus und Active-State liegen nachvollziehbar auf dem neuen Kundenknoten oder dem auslösenden Aktionsknoten.

## Accessibility- und Bedienanforderungen

- Die Work-Page braucht eine klare Dialog-/Region-Semantik. Die finale technische Semantik ist durch UX/FE zu entscheiden: modaler Dialog, nicht-modaler Arbeitsbereich oder `role="dialog"` mit Fokusmanagement.
- Tastatur: Öffnen per Enter/Space auf dem Knoten; Escape schließt die Work-Page, sofern keine innere Komponente Escape höher priorisiert.
- Fokus darf nicht im Hintergrundgraphen verloren gehen. Wenn die Work-Page modal ist, darf der Tab-Fokus nicht in den ausgegrauten Hintergrund wandern.
- Beim Öffnen wandert der Fokus in die Work-Page: bevorzugt auf die sichtbare Überschrift oder das erste sinnvolle Eingabefeld, abhängig vom Content-Typ.
- Beim Schließen wandert der Fokus nachvollziehbar zurück auf den auslösenden Knoten; nach erfolgreichem Anlegen ist Fokus auf dem neu erzeugten Instanzknoten zulässig, wenn dieser sichtbar und eindeutig benannt ist.
- Screenreader-Name der Work-Page entspricht der sichtbaren Überschrift.
- Der Screenreader-Kontext benennt mindestens Inhaltstyp und Ursprung, z. B. `Kunde hinzufügen, Formular aus Knoten Kunden`.
- Bewegungen respektieren `prefers-reduced-motion`.
- Bei Reduced Motion wird kein räumlicher Flug erzwungen; ein kurzer Fade/Scale oder sofortiger Zustandswechsel reicht.
- Interaktive Ziele haben mindestens 44 x 44 CSS-Pixel.
- Speichern/Abbrechen dürfen nicht nur über Farbe unterschieden werden.
- Runde Aktionsbuttons brauchen sichtbaren Text oder einen stabilen Accessible Name; Icons allein reichen nicht ohne `aria-label`/Buttontext.
- Fokusindikator und aktiver Work-Page-Zustand müssen auch bei hohem Kontrast erkennbar bleiben.

## Offene Entscheidungen

- Soll die Work-Page technisch modal sein oder bleibt sie ein nicht-modaler Arbeitsbereich über dem Graphen?
- Wird der Hintergrundgraph während der Work-Page gesperrt oder sind Knoten weiterhin aktivierbar?
- Schließt `Speichern` immer sofort, oder darf ein Formular nach erfolgreichem Speichern offen bleiben, z. B. für `weitere:n Kund:in hinzufügen`?
- Soll die Rückwärtsanimation zum ursprünglichen Aktionsknoten oder nach erfolgreichem Anlegen zum neu erzeugten Instanzknoten führen?
- Bestätigen: Reicht `Kundenliste` als erster Listen-Slice oder soll stattdessen `Leistungen` priorisiert werden?
- Bestätigt: `Tagesplanung` bleibt erster Kalender-Slice; der konkrete Terminstatus-/Tagesfilter-Vertrag steht in `docs/requirements/day-agenda-api-contract.md`.

## Bewusst entschiedene Scope-Grenzen

- Die runde Form wird ab mittleren/kleinen Viewports zugunsten von Lesbarkeit angepasst; perfekte Kreisform ist nur für ausreichend große Viewports verpflichtend.
- Der erste Listen-Slice ist eine auswählbare Kund:innenliste, keine vollwertige Tabellenverwaltung.
- Der erste Kalender-Slice ist eine Tagesagenda, kein kompletter Kalender/Terminplaner.
- Kalender-Drag-and-Drop, Monats-/Wochenansicht, Ressourcenplanung, Schließzeiten und Arbeitszeitregeln bleiben Folgeanforderungen.

## Empfehlung für den ersten Frontend-Foundation-Slice

- Für die erste Shell wie einen modalen Arbeitszustand behandeln: Hintergrundgraph visuell sichtbar lassen, aber nicht per Tab erreichbar machen, bis UX/UI eine nicht-modale Variante explizit freigibt.
- Nur eine Work-Page gleichzeitig unterstützen.
- `Kunde hinzufügen` als ersten vertikalen Demo-/MVP-Content verwenden, weil der Graph bereits Kunden-Instanzknoten erzeugen kann.
- Bei erfolgreichem Speichern darf die Shell schließen und den Fokus auf den neuen Kund:innen-Instanzknoten setzen; wenn dieser technisch noch nicht fokussierbar ist, Fokus zurück auf `Kunde hinzufügen`.
- Die Shell-API sollte Content-Typen nicht hart mit Domänenlogik koppeln: Content-Typ, Titel, Beschreibung und Aktionen als Daten übergeben; konkretes Formular/List/Kalender-Rendering später separat integrieren.

## Technische Scope-Grenze für ersten Frontend-Slice

- Reusable Shell-Komponente für die runde Work-Page.
- Ansteuerung über Dashboard-/Graph-State statt eigener Route.
- Erster Content: `Kunde hinzufügen` mit vorhandenem Demo-Verhalten `createCustomer()`.
- Animationen: Öffnen und Schließen mit Ursprungspunkt aus aktivem/auslösendem Knoten; bei fehlender Koordinate fallback auf zentriertes Fade/Scale.
- Tests: mindestens Komponenten-/Unit-Test für Öffnen, Schließen, Fokus-/Reduced-Motion-Verhalten soweit im Testumfeld möglich.

## Abnahmekriterien für die Spezifikation

- Auslösender Knoten, Ursprungskoordinaten, Work-Page, Content-Bereich, Content-Renderer, Primär-/Sekundäraktion und Rückkehraktion sind als Begriffe definiert.
- Öffnen aus dem kreisförmigen Knoten und Schließen zurück zum Ursprung sind als Verhalten beschrieben, inklusive Fallback ohne Koordinaten.
- Formular-, Listen-, Kalender- und Detail-Content sind als geplante Varianten abgegrenzt.
- Fokus, Tastatur, Screenreader-Name, Zielgrößen, sichtbare Labels und Reduced Motion sind als Accessibility-Anforderungen dokumentiert.
- Nicht-Ziele und offene Entscheidungen bleiben sichtbar, insbesondere Modalität, Hintergrundbedienbarkeit und Rückkehrziel der Animation.
