# FEATURES.md

Single source of truth for product requirements.

## How to use
- Add new requirements when user asks for new functionality.
- Update status when implementation changes.
- Keep entries small, testable, and unambiguous.
- Link each requirement to owner and acceptance criteria.

## Status values
- `proposed`
- `planned`
- `in-progress`
- `done`
- `blocked`
- `dropped`

## Template

### F-<id> <Short feature title>
- **Status:** proposed
- **Owner:** frontend | backend | testing | devops | cross-cutting
- **Source:** user request/date
- **Description:**
- **Acceptance Criteria:**
  - [ ] 
  - [ ] 
- **Technical Notes:**
- **Dependencies:**
- **Test Plan:**
- **Release Notes:**

---

## Arbeitsgraph-MVP-Slices

Diese Slices schneiden die Vision aus `docs/invention-graph-navigation.md` in kleine, umsetzbare GroomingManager-Anforderungen. Sie ergänzen die fachlichen Use Cases aus `docs/usecases.md` und sind bewusst auf den ersten Arbeitsgraph-MVP begrenzt. Die konkrete UX/UI- und Accessibility-Spezifikation für Focused Work, Custom Flex, Tastaturführung, Screenreader-Texte und lineare Alternative steht in `docs/ux-workspace-graph-accessibility.md`.

### GM-GRAPH-001 — Rollenbasierter Startgraph als primärer Arbeitsraum
- **Status:** planned
- **Owner:** frontend
- **Unterstützt:** requirements, uxui
- **Source:** GM-001 / `docs/invention-graph-navigation.md`
- **User Story:** Als eingeloggte:r Nutzer:in möchte ich nach dem Login direkt einen rollenpassenden Arbeitsgraphen sehen, damit ich meine wichtigsten Grooming-Arbeitsbereiche ohne klassische Menüsuche erreiche.
- **Nutzen:** Reduziert Orientierungsaufwand und macht Domänen wie Kund:innen, Hunde, Termine, Leistungen und Administration sichtbar.
- **Scope:** Start-/Root-Knoten, Top-Level-Domänen, rollenabhängige Sichtbarkeit für `admin`, `groomer` und `kunde`, Aktivierung eines Knotens.
- **Acceptance Criteria:**
  - [ ] Nach erfolgreichem Login landet jede Rolle im geschützten Dashboard mit Arbeitsgraph statt auf einer klassischen Navigationsseite.
  - [ ] Admin sieht mindestens Admin/Organisation, Kund:innen, Hunde, Termine, Leistungen und Kalender.
  - [ ] Groomer sieht mindestens Tagesplanung/Termine, Kund:innen, Hunde und Grooming-Notizen, soweit berechtigt.
  - [ ] Kund:in sieht mindestens eigenes Profil, eigene Hunde, Leistungen und Termine/Anfragen.
  - [ ] Nicht erlaubte Domänen werden nicht als aktive Navigationsziele angeboten; Backend-Schutz bleibt unabhängig davon Pflicht.
  - [ ] Aktiver Knoten ist visuell eindeutig erkennbar.
- **Nicht-Ziele:** Vollständige CRUD-Funktionalität in allen Domänen, Rechteverwaltung im Graphen, öffentliche Buchungsstrecke.
- **Dependencies:** Keycloak-Rollen im Frontend verfügbar; bestehendes Dashboard/Workspace-Graph-Grundgerüst.
- **Test Plan:** Rollen-Login-Smoke mit Admin/Groomer/Kund:in; Komponententest für rollenabhängige Knotenerzeugung.

### GM-GRAPH-002 — Graphmodell für Domänen, Listen, Instanzen und Aktionen
- **Status:** planned
- **Owner:** frontend
- **Unterstützt:** backend, requirements
- **Source:** GM-001 / Invention-Graph Kernidee
- **User Story:** Als Nutzer:in möchte ich nicht nur Seiten, sondern auch konkrete Objekte und passende Aktionen als Knoten sehen, damit ich Zusammenhänge zwischen Kund:in, Hund, Termin und Aktion direkt verstehe.
- **Nutzen:** Macht Domänenwissen sichtbar und verhindert, dass Aktionen kontextfern in Menüs versteckt sind.
- **Scope:** Datenmodell für Knotentypen `root`, `domain`, `page/list`, `instance`, `action`; Kanten als Parent-Child-/Kontextbeziehungen; erste Beispielinstanzen aus vorhandenen oder Mock-/Stub-Daten.
- **Acceptance Criteria:**
  - [ ] Das Graphmodell unterscheidet Domänenknoten, Listenkontexte, Instanzknoten und Aktionsknoten.
  - [ ] Ein ausgewählter Kund:innen- oder Hunde-Kontext kann als Instanzknoten mit verbundenen Aktionen dargestellt werden.
  - [ ] Aktionen hängen am fachlich passenden Domänen- oder Instanzknoten, z. B. „Hund hinzufügen“ an Kund:in oder Kund:innen-Kontext.
  - [ ] Kanten machen Parent-/Kontextbeziehungen sichtbar und sind nicht nur dekorative Linien.
  - [ ] Graphdaten sind testbar als reine Model-/Builder-Funktionen aufgebaut.
- **Nicht-Ziele:** Persistieren frei angeordneter Graphdaten im Backend; allgemeiner Node-Editor; komplexer Workflow-Designer.
- **Dependencies:** Fachliche Mindestdaten für Kund:in/Hund/Termin; Backend klärt echte API-Verfügbarkeit für Instanzen.
- **Test Plan:** Unit-Tests für Graph-Builder inklusive Instanz- und Aktionsknoten.

### GM-GRAPH-003 — Expand/Collapse zur Komplexitätsreduktion
- **Status:** planned
- **Owner:** frontend
- **Unterstützt:** uxui, requirements
- **Source:** GM-001 / Accessibility-Ziel kognitive Entlastung
- **User Story:** Als Nutzer:in möchte ich Graphbereiche auf- und zuklappen können, damit ich nur die aktuell relevanten Arbeitsbereiche sehe.
- **Nutzen:** Reduziert kognitive Last und hält den Arbeitsraum auch bei mehreren Domänen verständlich.
- **Scope:** Expand/Collapse pro Domänen- und Instanzknoten, sichtbarer Zustand, Root-/Start-Knoten als globaler Toggle im flexiblen Modus.
- **Acceptance Criteria:**
  - [ ] Nutzer:innen können Kinder eines expandierbaren Knotens ein- und ausblenden.
  - [ ] Der Startknoten kann im Custom-Flex-Modus alle aktuell expandierbaren Knoten auf- oder zuklappen.
  - [ ] Der Graph zeigt eindeutig, ob ein Knoten weitere ausgeblendete Inhalte besitzt.
  - [ ] Expand-all berücksichtigt dynamische Instanzknoten, nicht nur statische Top-Level-Domänen.
  - [ ] Eingeklappte Bereiche sind über Tastatur und Maus wieder erreichbar.
- **Nicht-Ziele:** Nutzerdefinierte Filterregeln; Persistenz pro Nutzer:in; Volltextsuche im Graphen.
- **Dependencies:** Graphmodell mit Parent-Child-Beziehungen; UX-Spezifikation für Zustände.
- **Test Plan:** Komponententests für Expand/Collapse, Root-Toggle und dynamische Instanzknoten.

### GM-GRAPH-004 — Focused Work: aktiven Arbeitsknoten zentrieren
- **Status:** planned
- **Owner:** frontend
- **Unterstützt:** uxui
- **Source:** GM-007 / Focused-Work-Prinzip
- **User Story:** Als Groomer oder Admin möchte ich den aktiven Arbeitsknoten im Zentrum behalten, damit ich konzentriert an einem Kund:innen-, Hunde- oder Termin-Kontext arbeiten kann.
- **Nutzen:** Senkt Ablenkung, macht den aktuellen Kontext stabil sichtbar und unterstützt aufgabenorientiertes Arbeiten.
- **Scope:** Modus „Focused Work“, Zentrierung über Layout-/Viewport-Transformation, aktive Knotenmarkierung, Kontextverschiebung nach links/in den Hintergrund.
- **Acceptance Criteria:**
  - [ ] Bei aktivem Focused Work wird der aktive oder explizit zentrierte Knoten im Arbeitsbereich zentriert.
  - [ ] Vorheriger Kontext bleibt sichtbar, wirkt aber räumlich nach links oder in den Hintergrund verschoben.
  - [ ] Die Zentrierung verändert nicht die fachlichen Graphdaten.
  - [ ] Wechsel des aktiven Knotens aktualisiert die Zentrierung nachvollziehbar.
  - [ ] Der Modus ist visuell unterscheidbar von Custom Flex.
- **Nicht-Ziele:** Animationsperfektion; dauerhaft gespeicherte Layouts; mobile Spezialansicht.
- **Dependencies:** Workspace-Graph-Komponente unterstützt `centeredNodeId`; UX definiert Fokus-/Kontextzustände.
- **Test Plan:** Regressionstest, dass `centeredNodeId` zentriert wird und Root/Kontext relativ links liegt.

### GM-GRAPH-005 — Custom Flex: Top-Level-Knoten manuell arrangieren
- **Status:** planned
- **Owner:** frontend
- **Unterstützt:** uxui
- **Source:** Custom-Flex-Prinzip / Parent-relative Kindpositionierung
- **User Story:** Als Nutzer:in möchte ich meine wichtigsten Arbeitsbereiche räumlich anordnen können, damit der Arbeitsgraph zu meiner Arbeitsweise passt.
- **Nutzen:** Unterstützt individuelle Orientierung, ohne fachliche Beziehungen zwischen Parent und Kind zu verlieren.
- **Scope:** Modus „Custom Flex“, Dragging von Top-Level-Knoten, manuelle Positionen im Frontend-State, parent-relative Neuberechnung der Kindknoten.
- **Acceptance Criteria:**
  - [ ] Top-Level-Knoten können im Custom-Flex-Modus per Drag verschoben werden.
  - [ ] Kindknoten bleiben radial und semantisch sichtbar ihrem Parent zugeordnet.
  - [ ] Wenn ein Parent verschoben wird, werden seine Kindpositionen aus der aktuellen Parent-Position neu berechnet.
  - [ ] Veraltete manuelle Kindpositionen dürfen die parent-relative Anordnung nicht brechen.
  - [ ] Ein Layout-Reset stellt eine nachvollziehbare Standardanordnung wieder her.
- **Nicht-Ziele:** Kollaboratives Layout-Sharing; serverseitige Layoutspeicherung; freies Verbinden beliebiger Knoten.
- **Dependencies:** Dragging-Grundlage im Workspace-Graph; UX-Regeln für Reset und visuelles Feedback.
- **Test Plan:** Komponententest für verschobenen Parent plus stale child position; manueller Drag-Smoke.

### GM-GRAPH-006 — Fit-to-View und einfache Viewport-Steuerung
- **Status:** planned
- **Owner:** frontend
- **Unterstützt:** uxui
- **Source:** Invention-Graph Fit-to-View
- **User Story:** Als Nutzer:in möchte ich den relevanten Graphen schnell wieder komplett sehen, damit ich nach Fokuswechseln oder Dragging nicht die Orientierung verliere.
- **Nutzen:** Erhöht Bedienbarkeit und Fehlertoleranz, besonders bei motorischen oder visuellen Einschränkungen.
- **Scope:** Fit-to-View-Control in Custom Flex, automatische Bounds-Berechnung, Zoom-/Pan-Anpassung mit sinnvollen Min-/Max-Grenzen.
- **Acceptance Criteria:**
  - [ ] In Custom Flex gibt es eine sichtbare Aktion „Alles einpassen“.
  - [ ] Die Aktion berechnet sichtbare Graphgrenzen inklusive Padding.
  - [ ] Zoom und Pan werden so angepasst, dass der relevante Graphbereich sichtbar ist.
  - [ ] Der Zoom bleibt innerhalb definierter Min-/Max-Grenzen.
  - [ ] Focused Work bleibt vom Fit-to-View-Verhalten klar getrennt.
- **Nicht-Ziele:** Freie Minimap; komplexe Gestensteuerung; responsive Mobile-Finalisierung.
- **Dependencies:** Zugriff auf sichtbare Node-Positionen und Viewportmaße.
- **Test Plan:** Komponententest mit Stub-Viewport, der eine veränderte Canvas-Transformation nach Fit-to-View prüft.

### GM-GRAPH-007 — Tastaturbedienung und lineare Alternative vorbereiten
- **Status:** planned
- **Owner:** uxui
- **Unterstützt:** frontend, requirements
- **Source:** GM-002 / Accessibility-Aspekte
- **User Story:** Als Nutzer:in mit Tastatur oder Screenreader möchte ich den Arbeitsgraphen auch ohne Maus bedienen und verstehen können, damit die graphbasierte Navigation keine neue Barriere erzeugt.
- **Nutzen:** Sichert Barrierefreiheit als Kernanforderung statt als spätes Add-on.
- **Scope:** Tastaturpfade für Knotenfokus/Aktivierung, sichtbare Fokuszustände, ARIA-/Label-Konzept, lineare Alternativdarstellung als Spezifikation oder erster Read-only-Prototyp.
- **Acceptance Criteria:**
  - [ ] Jeder sichtbare Knoten ist per Tastatur fokussierbar oder über eine dokumentierte lineare Alternative erreichbar.
  - [ ] Enter/Space aktiviert einen fokussierten Knoten oder dessen Hauptaktion.
  - [ ] Escape führt aus Detail-/Aktionskontexten nachvollziehbar zurück.
  - [ ] Screenreader-Labels nennen Knotentyp, Name und vorhandene Beziehungen/Aktionen in verständlicher Sprache.
  - [ ] Eine lineare Darstellung bildet die sichtbaren Graphbereiche in sinnvoller Reihenfolge ab.
- **Nicht-Ziele:** Vollständige WCAG-Zertifizierung; Sprachausgabe; komplexe Nutzerprofile für Accessibility-Präferenzen.
- **Dependencies:** UX/UI muss exakte Tastaturregeln und Zustände finalisieren; Frontend prüft technische Machbarkeit.
- **Test Plan:** Keyboard-Smoke, Fokuszustandsprüfung, erste Screenreader-/Accessibility-Tree-Prüfung.

### GM-GRAPH-008 — Kontextpanel für Knoteninformationen und Primäraktionen
- **Status:** planned
- **Owner:** frontend
- **Unterstützt:** uxui, backend
- **Source:** Arbeitsgraph als Bedienoberfläche, nicht nur Visualisierung
- **User Story:** Als Nutzer:in möchte ich zu einem ausgewählten Knoten direkt die wichtigsten Informationen und Aktionen sehen, damit ich vom Graphen aus arbeiten kann statt nur zu navigieren.
- **Nutzen:** Verbindet Navigation, Kontextverständnis und konkrete Arbeit in einem Arbeitsraum.
- **Scope:** Seiten-/Panelbereich für aktive Knotendetails, Anzeige von Beschreibung/Status/verbundenen Objekten, 1–3 Primäraktionen je Knotentyp.
- **Acceptance Criteria:**
  - [ ] Auswahl eines Knotens aktualisiert ein Kontextpanel ohne vollständigen Seitenwechsel.
  - [ ] Das Panel zeigt Knotentyp, Label, kurze Beschreibung und relevante Beziehungen.
  - [ ] Erlaubte Primäraktionen sind direkt sichtbar und rollenabhängig eingeschränkt.
  - [ ] Bei fehlenden Daten gibt es einen verständlichen Empty State.
  - [ ] Panel und Graph bleiben semantisch gekoppelt: der aktive Knoten bleibt erkennbar.
- **Nicht-Ziele:** Vollständige Formularstrecken für alle Domänen; modaler Dialogstandard für die ganze App; Backend-Admin-Konsole.
- **Dependencies:** Graphmodell liefert Payload/Node-Kontext; Backend/API-Bedarf wird je Domäne geklärt.
- **Test Plan:** Komponententest für Node-Auswahl -> Panelinhalt; Rollensmoke für sichtbare Aktionen.

## Abhängigkeiten und empfohlene Reihenfolge

1. `GM-GRAPH-001` Startgraph als rollenbasierte Grundlage.
2. `GM-GRAPH-002` Graphmodell erweitern, damit Instanzen und Aktionen sauber abbildbar sind.
3. `GM-GRAPH-003` Komplexität steuerbar machen.
4. `GM-GRAPH-004` und `GM-GRAPH-005` als getrennte Interaktionsmodi ausbauen.
5. `GM-GRAPH-006` als Orientierungshilfe für Custom Flex ergänzen.
6. `GM-GRAPH-007` parallel durch UX/UI spezifizieren und dann technisch umsetzen.
7. `GM-GRAPH-008` als Arbeitsfähigkeit auf dem aktiven Knoten ergänzen.

## Offene Fragen / Entscheidungsbedarf

- Soll der MVP nur die Rollen `admin`, `groomer` und `kunde` verwenden oder bleibt `Führungskraft` als eigene Rolle im Arbeitsgraph sichtbar?
- Welche echten Backend-Daten stehen für erste Instanzknoten zur Verfügung: Kund:innen, Hunde, Termine oder zunächst Demo-/Stub-Daten?
- Sollen manuelle Custom-Flex-Positionen im MVP nur im Frontend-State leben oder bereits pro Nutzer:in persistiert werden? Empfehlung für MVP: nicht persistieren.
- Welche Tastaturbelegung soll UX/UI final festlegen: Pfeiltasten entlang Graphkanten, Tab-Reihenfolge über lineare Liste oder Kombination?
- Welche Mindestkriterien gelten für „barriereärmer“ im MVP: Tastaturbedienung, sichtbarer Fokus, lineare Alternative, Screenreader-Labels oder alles davon?
- Wie stark darf der Arbeitsgraph klassische Routen ersetzen, solange einzelne Detailformulare technisch noch als bestehende Angular-Seiten umgesetzt sind?

## Nicht-Ziele für den Arbeitsgraph-MVP

- Kein allgemeiner Mindmap-, Sitemap-, Node-Editor- oder Workflow-Builder.
- Keine freie Erstellung beliebiger Knoten und Kanten durch Endnutzer:innen.
- Keine vollständige Persistenz individueller Layouts im ersten Slice.
- Keine vollständige mobile Spezialbedienung im ersten Graph-MVP.
- Keine Patent-/Prior-Art-Bewertung durch Requirements Engineering; dafür ist ein separater Recherche-/Rechts-Task nötig.

---

## Backlog

### F-001 Core app scaffold (Angular + ASP.NET + PostgreSQL)
- **Status:** done
- **Owner:** cross-cutting
- **Source:** initial project setup
- **Description:** Full-stack baseline with frontend/backend and local Postgres.
- **Acceptance Criteria:**
  - [x] Angular app runs on `http://localhost:4200`
  - [x] ASP.NET backend runs on `http://localhost:5000`
  - [x] PostgreSQL container runs via Docker Compose
- **Technical Notes:** Existing implementation in `frontend/`, `backend/`, `docker-compose.yml`.
- **Dependencies:** Docker Desktop, Node.js/npm, .NET SDK
- **Test Plan:** Build + unit + smoke e2e in CI
- **Release Notes:** Baseline ready for iterative feature development.

### F-002 User registration and authentication
- **Status:** done
- **Owner:** cross-cutting
- **Source:** extracted from historical Codex session + existing app behavior (2026-02-11)
- **Description:** Users can register, log in, and access role-based areas with JWT/Identity-backed auth.
- **Acceptance Criteria:**
  - [x] Registration route exists (`/register`)
  - [x] Login route exists (`/login`)
  - [x] Role-aware access for user/admin areas
- **Technical Notes:** Auth controllers/services and frontend guards/interceptor are present.
- **Dependencies:** Backend Identity/JWT configuration
- **Test Plan:** Unit tests for auth guards/services + login flow E2E
- **Release Notes:** Enables protected user/admin flows.

### F-003 User and admin dashboards
- **Status:** done
- **Owner:** frontend
- **Source:** extracted from historical Codex session + README feature list
- **Description:** Separate dashboard experiences for normal users and admins.
- **Acceptance Criteria:**
  - [x] User dashboard route exists (`/dashboard`)
  - [x] Admin dashboard route exists (`/admin`)
  - [x] Navigation adapts to role/session
- **Technical Notes:** Dashboard components and role checks are implemented.
- **Dependencies:** Auth and role claims
- **Test Plan:** Route guard tests and role navigation smoke checks
- **Release Notes:** Distinct UX per role.

### F-004 Profile and dog management
- **Status:** done
- **Owner:** cross-cutting
- **Source:** extracted from historical Codex session + README feature list
- **Description:** Users can maintain profile details (including image) and manage dogs.
- **Acceptance Criteria:**
  - [x] Profile update flow exists
  - [x] Profile image support exists
  - [x] Dog add/remove functionality exists
- **Technical Notes:** Profile and dog endpoints/components are present.
- **Dependencies:** Authenticated user context
- **Test Plan:** Profile and dog CRUD tests (unit/integration + UI smoke)
- **Release Notes:** Supports core owner profile management.

### F-005 Appointment booking and calendar management
- **Status:** done
- **Owner:** cross-cutting
- **Source:** extracted from historical Codex session context
- **Description:** Appointment booking flow with admin calendar controls/blocks.
- **Acceptance Criteria:**
  - [x] Appointment domain exists in backend/frontend
  - [x] Admin can manage availability/calendar settings
  - [x] User booking flow is available
- **Technical Notes:** Appointment controllers, DTOs, realtime/calendar support, and admin pages are present.
- **Dependencies:** Services + user/dog data
- **Test Plan:** Booking happy-path E2E and calendar API integration tests
- **Release Notes:** Enables scheduling workflows.

### F-006 Payments and checkout integration (PayPal)
- **Status:** done
- **Owner:** cross-cutting
- **Source:** README feature list + historical Codex context
- **Description:** Booking payment/deposit integration with PayPal checkout and return flows.
- **Acceptance Criteria:**
  - [x] Checkout route exists (`/checkout`)
  - [x] Return/success/cancel pages exist
  - [x] Payment capture/pending payment handling exists in backend
- **Technical Notes:** Payment controllers/settings/DTOs and checkout UI are present.
- **Dependencies:** PayPal settings (sandbox/live)
- **Test Plan:** API integration tests + E2E checkout smoke in sandbox mode
- **Release Notes:** Supports deposit-style booking payments.

### F-007 Theme customization for public/admin UI
- **Status:** done
- **Owner:** cross-cutting
- **Source:** historical Codex context + backend/frontend theme files
- **Description:** Brand/theme settings (colors/logo/home images) can be configured and applied.
- **Acceptance Criteria:**
  - [x] Theme settings model/API exists
  - [x] Frontend applies theme settings dynamically
  - [x] Admin theme management endpoints/components exist
- **Technical Notes:** `ThemeSettings` backend model + frontend `ThemeService` in use.
- **Dependencies:** Stored theme settings in DB
- **Test Plan:** Theme API tests + visual smoke checks on key pages
- **Release Notes:** Allows branding customization without code changes.

### F-008 Frontend lint quality gates (ESLint + SCSS lint)
- **Status:** done
- **Owner:** cross-cutting
- **Source:** user request (2026-02-11)
- **Description:** Enforce Angular-recommended ESLint + TypeScript rules and SCSS linting, both locally and in CI.
- **Acceptance Criteria:**
  - [x] ESLint is configured for Angular/TypeScript in `frontend/`
  - [x] SCSS linting is configured in `frontend/`
  - [x] CI runs both linters before frontend tests
- **Technical Notes:** `ng lint` and `stylelint` scripts added; CI job `frontend-lint` added.
- **Dependencies:** Node/npm + lint devDependencies
- **Test Plan:** `npm run lint`, `npm run lint:scss`, CI workflow run
- **Release Notes:** Improves code quality and consistency gates pre-merge.
