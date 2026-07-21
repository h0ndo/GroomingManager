# GroomingManager Kanban Board

Dieses Board ist das zentrale Arbeitsboard für die nächsten GroomingManager-Schritte. Es ist bewusst als Markdown-Datei angelegt, damit wir es direkt im Repo versionieren und gemeinsam abarbeiten können.

## Workflow

```text
Backlog -> Bereit -> In Arbeit -> Review/Test -> Erledigt
```

## Board-Regeln

- Jede Karte hat eine ID, einen Owner und eine Definition of Done.
- Maximal 2 Karten gleichzeitig in `In Arbeit`, solange wir alleine/klein arbeiten.
- Requirements Engineering schärft unklare Karten, bevor sie in `Bereit` wandern.
- UX/UI definiert Interaktionsverhalten, bevor Frontend größere UI-Flows baut.
- Backend/DevOps liefern API/Stack-Verträge, bevor Frontend darauf integriert.
- Teamleitung entscheidet Priorität und zieht Blocker sichtbar nach oben.

## Rollen-Kürzel

- `TL` — Teamleitung / Product-Tech Lead
- `REQ` — Requirements Engineering
- `UXUI` — UX/UI Design
- `FE` — Frontend Engineering
- `BE` — Backend Engineering
- `DEVOPS` — DevOps / Platform Engineering
- `TESTER` — QA / Testing

---

## Backlog

### GM-001 — Arbeitsgraph-Vision in konkrete MVP-Features schneiden

- Owner: `REQ`, `TL`
- Unterstützt: `UXUI`, `FE`
- Ziel: Die große Arbeitsgraph-/Accessibility-Vision in kleine umsetzbare MVP-Slices zerlegen.
- Akzeptanzkriterien:
  - 5–10 konkrete MVP-Features sind beschrieben.
  - Jedes Feature hat Nutzen, Scope und Nicht-Ziele.
  - Abhängigkeiten zwischen Features sind sichtbar.
- Definition of Done:
  - Dokumentierte Feature-Liste liegt in `docs/FEATURES.md` oder einem neuen Roadmap-Dokument.

### GM-002 — Accessibility-Ziele für graphbasierte Navigation definieren

- Owner: `UXUI`, `REQ`
- Unterstützt: `FE`
- Ziel: Konkrete Barrierefreiheitsziele für den Arbeitsgraphen festlegen.
- Akzeptanzkriterien:
  - Tastaturbedienung ist als gewünschter Ablauf beschrieben.
  - Screenreader-/lineare Alternative ist als Konzept beschrieben.
  - Kognitive Entlastung wird in überprüfbare Anforderungen übersetzt.
- Definition of Done:
  - Accessibility-Anforderungen sind als testbare Kriterien dokumentiert.

### GM-003 — Prior-Art-/Abgrenzungsrecherche für Arbeitsgraph-Konzept vorbereiten

- Owner: `REQ`, `TL`
- Unterstützt: `UXUI`
- Ziel: Bekannte ähnliche Konzepte sammeln und Unterschiede dokumentieren.
- Akzeptanzkriterien:
  - Mindmaps, Node-Editoren, Workflow-Builder, Knowledge Graph UIs und adaptive UIs sind betrachtet.
  - Abgrenzung zum GroomingManager-Arbeitsgraphen ist formuliert.
- Definition of Done:
  - Ergänzung zu `docs/invention-graph-navigation.md` oder separates Recherche-Dokument vorhanden.

### GM-004 — Graph-Tastaturnavigation konzipieren

- Owner: `UXUI`
- Unterstützt: `FE`, `REQ`
- Ziel: Bedienmodell für Tastatur und Fokuspfade im Workspace-Graphen definieren.
- Akzeptanzkriterien:
  - Pfeiltasten-/Tab-/Enter-/Escape-Verhalten ist beschrieben.
  - Fokuszustände sind visuell und semantisch definiert.
  - Screenreader-Labels für Knoten/Kanten sind beschrieben.
- Definition of Done:
  - UX-Spezifikation ist ausreichend konkret für Frontend-Umsetzung.

### GM-005 — Backend-Domänenmodell Grooming MVP verfeinern

- Owner: `BE`
- Unterstützt: `REQ`
- Ziel: Kunden, Hunde, Termine und Services auf MVP-Niveau fachlich und technisch stabilisieren.
- Akzeptanzkriterien:
  - Offene Modellfragen sind dokumentiert.
  - API-Endpunkte passen zu Frontend-Workflows.
  - Rollenberechtigungen sind pro Endpunkt geklärt.
- Definition of Done:
  - Backend-Tests decken Kernfälle ab.

### GM-006 — Docker-Start-/Check-Erlebnis verbessern

- Owner: `DEVOPS`
- Unterstützt: `TL`
- Ziel: Lokalen Start von Docker-Stack und Dev-Server vereinfachen.
- Akzeptanzkriterien:
  - Ein dokumentierter Startbefehl für den vollständigen Stack ist vorhanden.
  - Healthcheck-/Smoke-Test-Befehle sind dokumentiert.
  - Bekannte Ports und URLs sind klar.
- Definition of Done:
  - README oder separates DevOps-Dokument ist aktualisiert.

---

## Bereit

### GM-007 — Workspace-Graph: aktiven Fokusmodus visuell weiter schärfen

- Owner: `UXUI`, `FE`
- Ziel: Focused Work so ausarbeiten, dass der aktive Knoten klar im Zentrum steht und der linke Kontext verständlich bleibt.
- Akzeptanzkriterien:
  - Aktiver Knoten ist eindeutig sichtbar.
  - Linker Kontext wirkt nicht wie ein Fehler oder abgeschnittenes Layout.
  - Hover/Active/Focus-Zustände bleiben konsistent grün.
- Definition of Done:
  - UI-Verhalten ist implementiert und mit Frontend-Test oder manueller Prüfung bestätigt.

### GM-008 — Kanban-Board regelmäßig pflegen

- Owner: `TL`
- Ziel: Dieses Board als Arbeitsgrundlage aktuell halten.
- Akzeptanzkriterien:
  - Karten wandern bei Fortschritt zwischen Spalten.
  - Neue Ideen werden zuerst als Backlog-Karten angelegt.
  - Blocker werden sichtbar notiert.
- Definition of Done:
  - Board wurde nach jeder größeren Änderung aktualisiert.

### GM-009 — Runde Work-Page als Graph-Arbeitsmuster spezifizieren

- Owner: `REQ`, `UXUI`
- Unterstützt: `FE`
- Ziel: Das Öffnen fachlicher Arbeitsinhalte aus Graphknoten als testbares UX-/Requirements-Muster definieren.
- User Story: Als Nutzer:in möchte ich aus einem Graphknoten heraus eine runde zentrale Work-Page öffnen, damit Formular, Liste, Kalender oder Detailansicht den räumlichen Bezug zum auslösenden Knoten behalten.
- Akzeptanzkriterien:
  - Auslöser, Work-Page, Content-Bereich und Rückkehraktionen sind begrifflich beschrieben.
  - Öffnen aus dem kreisförmigen Knoten und Schließen zurück zum Knoten sind als Verhalten beschrieben.
  - Formular-, Listen-, Kalender- und Detail-Content sind als geplante Varianten abgegrenzt.
  - Accessibility-Anforderungen für Fokus, Tastatur, Screenreader-Name, Zielgrößen und Reduced Motion sind dokumentiert.
  - Nicht-Ziele und offene Entscheidungen sind sichtbar.
- Definition of Done:
  - Spezifikation liegt in `docs/ux-circular-work-page.md` vor und ist durch TL/UXUI kommentiert oder freigegeben.

### GM-010 — Frontend-Foundation: wiederverwendbare runde Work-Page-Shell bauen

- Owner: `FE`
- Unterstützt: `UXUI`, `REQ`
- Ziel: Eine wiederverwendbare Angular/PrimeNG-nahe Shell schaffen, die zentrale runde Work-Pages über dem Arbeitsgraphen anzeigen kann.
- User Story: Als Frontend-Team möchte ich eine generische Work-Page-Shell verwenden, damit neue Graphknoten später kleine Content-Renderer einhängen können statt eigene Seitenlayouts zu bauen.
- Akzeptanzkriterien:
  - Shell rendert zentral über dem Graphen mit runder Optik, Überschrift, optionaler Beschreibung und Content-Slot/-Renderer.
  - Speichern/Primäraktion und Abbrechen/Sekundäraktion sind als runde Buttons rechts unten an bzw. nahe an der runden Page positioniert.
  - Öffnen und Schließen unterstützen Animation aus/zu dem auslösenden Graphknoten; bei fehlenden Koordinaten gibt es einen sauberen zentrierten Fallback.
  - `prefers-reduced-motion` reduziert oder deaktiviert die Spawn-/Rückkehranimation.
  - Fokusmanagement ist entschieden und umgesetzt: entweder modal mit Fokusfalle oder nicht-modal mit dokumentiertem Fokusverhalten.
  - Auf kleinen Viewports bleibt die Page bedienbar; Lesbarkeit geht vor perfekter Kreisform.
- Definition of Done:
  - Komponente ist im Frontend eingebunden, lint/build laufen, und ein Komponenten-/Unit-Test deckt Öffnen/Schließen mindestens ab.
- Abhängigkeiten:
  - Baut auf `GM-009` auf.

### GM-011 — Erster vertikaler Slice: `Kunde hinzufügen` in runder Work-Page

- Owner: `FE`
- Unterstützt: `REQ`, `TESTER`
- Ziel: Das vorhandene Demo-Formular `Kunden hinzufügen` aus dem rechten Panel in die neue runde Work-Page überführen.
- User Story: Als Admin möchte ich den Aktionsknoten `Kunde hinzufügen` aktivieren und ein rundes Formular öffnen, damit der neue Kundenknoten direkt aus der Graphaktion entsteht.
- Akzeptanzkriterien:
  - Klick/Enter auf `Kunde hinzufügen` öffnet die runde Work-Page mit Titel `Kunden hinzufügen`.
  - Die Page enthält mindestens das vorhandene Namensfeld und verständliche Beschreibung.
  - Speichern erzeugt wie bisher einen Kunden-Instanzknoten und setzt Active-State/Fokus nachvollziehbar.
  - Abbrechen schließt ohne neuen Kundenknoten und führt Fokus/Active-State nachvollziehbar zum auslösenden Kontext zurück.
  - Schließen/Speichern/Abbrechen spielen die Rückkehranimation zum Ursprung oder fachlich begründet zum neuen Instanzknoten ab.
  - Bestehende Graphfunktionen wie Focused Work, Custom Flex und Expand/Collapse bleiben nutzbar und werden nicht regressiert.
- Definition of Done:
  - Frontend-Test oder Playwright-Smoke prüft Öffnen, Eingabe, Speichern, Abbrechen und Rückkehrzustand.
  - `npm run lint` und `npm run build` laufen erfolgreich.
- Abhängigkeiten:
  - Baut auf `GM-010` auf.

### GM-012 — Content-Varianten für Liste und Kalender als Folge-Slices schneiden

- Owner: `REQ`, `UXUI`
- Unterstützt: `FE`
- Ziel: Nach dem Formular-MVP festlegen, wie Listen- und Kalenderinhalte in derselben runden Work-Page dargestellt werden, ohne Bedienbarkeit oder Lesbarkeit zu verlieren.
- User Story: Als Nutzer:in möchte ich auch Listen und Kalender aus Graphknoten heraus öffnen können, damit der Arbeitsgraph ein einheitliches Navigations- und Arbeitsmuster bietet.
- Akzeptanzkriterien:
  - Mindestens je ein konkreter Listen- und Kalender-Anwendungsfall ist ausgewählt.
  - Scrollverhalten innerhalb der runden Page ist beschrieben.
  - Responsive Grenze ist definiert: ab wann runde Optik zugunsten von Lesbarkeit angepasst wird.
  - Nicht-Ziel ist klar: kein vollständiger Kalenderbau ohne ausgewählten Fachfall.
- Definition of Done:
  - Folge-Karten für konkrete Listen-/Kalender-Slices sind im Board angelegt oder bewusst zurückgestellt.
- Abhängigkeiten:
  - Baut auf Erfahrungen aus `GM-011` auf.

---

## In Arbeit

_Leer._

---

## Review/Test

_Leer._

---

## Erledigt

### GM-000 — Teamprofile und initiales Kanban-Board anlegen

- Owner: `TL`
- Ergebnis:
  - `docs/team/profiles.md`
  - `docs/team/kanban.md`
- Definition of Done:
  - Profile und Board sind im Repo angelegt.

---

## Blocker

_Keine aktiven Blocker._

---

## Kartenvorlage

```markdown
### GM-XXX — Titel

- Owner: `ROLLE`
- Unterstützt: `ROLLE`, `ROLLE`
- Ziel:
- Akzeptanzkriterien:
  - ...
- Definition of Done:
  - ...
- Notizen:
  - ...
```
