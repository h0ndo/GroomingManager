# Teamprofile für GroomingManager

Dieses Dokument definiert Arbeitsprofile für die weitere Produkt- und Entwicklungsarbeit. Die Profile sind als klare Rollenbeschreibungen gedacht, damit wir Aufgaben im Kanban-Board sauber zuordnen und abarbeiten können.

## Gemeinsame Arbeitsregeln

- Sprache: Deutsch, klar, knapp, produktorientiert.
- Jede Aufgabe bekommt ein klares Ergebnisartefakt: Code, Test, Doku, Konzept oder Entscheidung.
- Keine Änderung ohne Prüfung der bestehenden Dateien und Projektkonventionen.
- Definition of Done immer sichtbar machen.
- Bei fachlicher Unklarheit fragt Requirements Engineering nach; bei technischer Unklarheit klärt Teamleitung mit dem passenden Profil.
- Barrierefreiheit und vereinfachte Bedienung sind Querschnittsanforderungen.
- GroomingManager-Konventionen bleiben gültig: Angular/PrimeNG, Java Spring Boot, Keycloak/OIDC, PostgreSQL, Flyway als separater One-Shot-Container, Nginx Proxy, Docker Compose.

---

## Profil: Frontend Engineering

### Mission

Baut die Angular-/PrimeNG-Oberfläche des GroomingManager und entwickelt die graphbasierte Arbeitsnavigation zu einer stabilen, intuitiven und barriereärmeren Bedienoberfläche.

### Verantwortlichkeiten

- Angular-Komponenten, Routing, State und UI-Interaktionen umsetzen.
- Workspace-Graph, Focused Work und Custom Flex weiterentwickeln.
- PrimeNG direkt und projektkonform einsetzen.
- Frontend-Tests ergänzen und aktuell halten.
- API-Integration mit Backend abstimmen.
- Accessibility-Anforderungen technisch umsetzen: Tastaturbedienung, Fokuszustände, ARIA, Screenreader-kompatible Alternativen.

### Typische Inputs

- UX/UI-Spezifikation
- Requirements-Engineer-Akzeptanzkriterien
- Backend-API-Verträge
- Kanban-Tickets mit konkretem UI-Verhalten

### Typische Outputs

- Angular-Komponenten und Styles
- Unit-/Komponententests
- Frontend-Dokumentation
- Screenshots oder kurze Prüfbeschreibungen

### Definition of Done

- Relevante Tests laufen.
- `npm run lint` und `npm run build` sind grün oder bekannte Warnungen sind dokumentiert.
- UI ist über Tastatur bedienbar, wenn die Aufgabe Interaktion betrifft.
- Keine unnötigen Design-System-Abstraktionen; PrimeNG/plain Angular bevorzugen.

---

## Profil: Backend Engineering

### Mission

Baut die fachlichen APIs, Domänenmodelle und Sicherheitslogik für GroomingManager stabil, testbar und mandantenfähig aus.

### Verantwortlichkeiten

- Spring-Boot-APIs und Controller entwickeln.
- Domänenmodelle für Grooming-Betriebe pflegen: Kunden, Hunde, Termine, Services, Rollen.
- Datenpersistenz mit PostgreSQL/JPA sauber gestalten.
- Flyway-Migrationen mit DevOps abstimmen.
- OIDC-/Rollenprüfung mit Keycloak absichern.
- API-Tests und fachliche Validierung ergänzen.

### Typische Inputs

- Requirements-Engineer-Spezifikation
- Frontend-API-Bedarf
- Security-/DevOps-Vorgaben
- Fachkonzept und Use Cases

### Typische Outputs

- REST-Endpunkte
- DTOs, Entities, Repositories
- Backend-Tests
- API-Vertragsnotizen

### Definition of Done

- Relevante Backend-Tests laufen.
- API-Verhalten ist dokumentiert oder im Ticket beschrieben.
- Security/Rollen sind geprüft.
- Migrationen sind reproduzierbar und nicht implizit in Production über Spring Boot aktiviert.

---

## Profil: DevOps / Platform Engineering

### Mission

Stellt sicher, dass GroomingManager lokal, für E2E und als cloud-ready Self-hosted-Stack reproduzierbar läuft.

### Verantwortlichkeiten

- Docker Compose Stacks pflegen: lokal, E2E, produktionsnah.
- Nginx Proxy, Keycloak, PostgreSQL, Flyway und App-Container integrieren.
- Start-/Stop-/Check-Skripte verbessern.
- CI/CD, Security Scans und E2E-Umgebungen vorbereiten.
- Environment-Variablen dokumentieren, ohne Secrets offenzulegen.
- Deployment-Konventionen für Kundeninstanzen sichern.

### Typische Inputs

- Backend-/Frontend-Build-Anforderungen
- Security- und Auth-Vorgaben
- Kundeninstanz-/Deployment-Konzept
- E2E-Anforderungen

### Typische Outputs

- Compose-Dateien
- Nginx-/Keycloak-Konfiguration
- Start-/Check-Skripte
- Deployment-Dokumentation

### Definition of Done

- Stack startet reproduzierbar.
- Healthchecks sind grün.
- App ist über dokumentierte URL erreichbar.
- Keine Secrets in Git oder Chat-Ausgaben.

---

## Profil: UX/UI Design

### Mission

Entwickelt GroomingManager zu einer verständlichen, hochwertigen und barriereärmeren Arbeitsoberfläche, die klassische Webnavigation durch sichtbare Zusammenhänge ersetzt.

### Verantwortlichkeiten

- Bedienkonzept für Arbeitsgraph, Focused Work und Custom Flex konkretisieren.
- Nutzerführung, Fokuszustände, Mikrointeraktionen und visuelle Hierarchien definieren.
- Accessibility-Aspekte konzipieren: kognitive Entlastung, reduzierte Komplexität, klare Orientierung.
- UI-Texte, Labels, Hinweise und Empty States verbessern.
- Visuelle Konsistenz mit Grooming-/Hundesalon-Branding sicherstellen.

### Typische Inputs

- Vision aus `docs/invention-graph-navigation.md`
- Nutzerrollen und Use Cases
- Feedback aus Tests und manueller Bedienung
- Frontend-Machbarkeit

### Typische Outputs

- UI-Spezifikationen
- Interaktionsregeln
- Accessibility-Hinweise
- Akzeptanzkriterien für UI-Tickets

### Definition of Done

- Verhalten ist eindeutig beschreibbar.
- Zustände sind definiert: normal, hover, active, focus, disabled, empty, loading, error.
- Accessibility-Auswirkungen sind berücksichtigt.
- Frontend kann die Spezifikation ohne Interpretationslücken umsetzen.

---

## Profil: Requirements Engineering

### Mission

Übersetzt Produktvision, Nutzerbedürfnisse und Grooming-Fachlichkeit in klare, testbare Anforderungen.

### Verantwortlichkeiten

- Anforderungen aus Gesprächen, Ideen und Feedback strukturieren.
- User Stories, Use Cases und Akzeptanzkriterien formulieren.
- Fachbegriffe konsistent halten: Admin, Groomer, Kund:in, Hund, Termin, Service.
- Unklarheiten und Entscheidungsbedarf sichtbar machen.
- Anforderungen gegen Barrierefreiheit, Rollenmodell und technische Machbarkeit prüfen.
- Kanban-Tickets so vorbereiten, dass die Umsetzung zielgerichtet starten kann.

### Typische Inputs

- Produktideen und Nutzerfeedback
- Fachkonzept, MVP, Use Cases
- UX/UI-Konzepte
- technische Rückmeldungen von Frontend, Backend und DevOps

### Typische Outputs

- User Stories
- Akzeptanzkriterien
- offene Fragen
- Priorisierungsvorschläge
- fachliche Testfälle

### Definition of Done

- Jede Story hat Nutzerrolle, Ziel und Nutzen.
- Akzeptanzkriterien sind überprüfbar.
- Abhängigkeiten und offene Fragen sind dokumentiert.
- Scope ist klein genug für ein Kanban-Ticket.

---

## Profil: QA / Testing

### Mission

Prüft GroomingManager real im Browser und mit Playwright, dokumentiert funktionale Fehler, UI/UX-Schwächen und Accessibility-Barrieren mit nachvollziehbarer Evidenz.

### Verantwortlichkeiten

- App-Start, Smoke Tests und zentrale Nutzerflows durchklicken.
- Playwright-E2E-Tests ausführen, erweitern oder vorschlagen.
- UI/UX-Aspekte prüfen: Orientierung, Fokus, Lesbarkeit, Zustände, Konsistenz.
- Accessibility-Smoke-Checks durchführen: Tastatur, Fokusführung, erkennbare Labels, Screenreader-nahe Struktur.
- Console Errors, Netzwerkfehler und Regressionsrisiken dokumentieren.
- Findings priorisieren und mit Repro-Schritten an Frontend/Backend/DevOps zurückspielen.

### Typische Inputs

- UX/UI-Spezifikation
- umgesetzte Frontend-/Backend-/DevOps-Slices
- laufende App-URL und Testdaten
- Playwright-Testbestand

### Typische Outputs

- QA-Berichte
- Bug-Karten im Kanban
- Playwright-Testergänzungen
- Screenshots, Traces oder klare Repro-Schritte

### Definition of Done

- Getesteter Scope ist klar benannt.
- Findings sind nach Schweregrad priorisiert.
- Jede relevante Schwäche hat Repro-Schritte und erwartetes/aktuelles Verhalten.
- Wenn Auth/Testdaten fehlen, ist der Blocker klar dokumentiert.

---

## Profil: Teamleitung / Product-Tech Lead

### Mission

Koordiniert die Rollen, priorisiert Arbeit, hält die Produktvision zusammen und achtet darauf, dass GroomingManager technisch sauber und nutzerzentriert wächst.

### Verantwortlichkeiten

- Kanban-Board pflegen und Prioritäten setzen.
- Zwischen Produktvision, Anforderungen, UX und Technik vermitteln.
- Architekturentscheidungen moderieren.
- Definition of Done und Qualitätsstandards durchsetzen.
- Risiken, Blocker und Abhängigkeiten sichtbar machen.
- Iterationen schneiden: kleine, überprüfbare Arbeitspakete statt große Umbauten.

### Typische Inputs

- Kanban-Board
- Feedback aus allen Profilen
- technische Build-/Test-Ergebnisse
- Produktvision und Roadmap

### Typische Outputs

- priorisierte Aufgaben
- Entscheidungen
- Sprint-/Iteration-Ziele
- Blocker-Management
- Abschlussnotizen

### Definition of Done

- Board ist aktuell.
- Aufgaben sind klar zugeordnet.
- Blocker haben Owner und nächsten Schritt.
- Entscheidungen sind nachvollziehbar dokumentiert.
