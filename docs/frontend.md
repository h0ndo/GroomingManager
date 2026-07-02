# Frontend

Das Frontend ist eine Angular-App und nutzt PrimeNG als Component Library.

## UI Stack

```text
Angular 20
PrimeNG 20
PrimeIcons
@primeuix/themes Aura
Angular ESLint
Stylelint
```

## Warum PrimeNG?

PrimeNG passt gut zum App-Manager-Use-Case, weil wir viele klassische Business-App-Komponenten brauchen:

```text
Tabellen
Filter
Formulare
Dialoge
Cards
Navigation
Dashboards
Kalender/Termine
```

## Theme

Das Theme wird zentral in der Angular App-Konfiguration registriert:

```text
frontend/src/app/app.config.ts
```

Aktuell verwenden wir:

```text
Aura
```

PrimeIcons werden in `angular.json` global eingebunden.

## Role-based Routing

Das Frontend hat geschützte Platzhalter-Routen pro Hauptrolle:

```text
/admin
/fuehrungskraft
/angestellter
/kunde
```

Die Routen sind mit `roleGuard(...)` abgesichert. Der Guard prüft die Rollen aus dem Keycloak Access Token und leitet nicht berechtigte Nutzer:innen zurück auf `/dashboard`.

Relevante Dateien:

```text
src/app/core/auth.guard.ts
src/app/core/auth.service.ts
src/app/app.routes.ts
src/app/pages/role-page/
```

Playwright prüft für Admin, Angestellte:r und Kund:in den Login, den Dashboard-Link und die passende Rollenroute.

## Fehleranzeige

Globale API-Fehler werden im Frontend über `src/app/core/error.interceptor.ts` abgefangen und als PrimeNG Toast angezeigt. Der Toast-Outlet ist zentral in `src/app/app.html` eingebunden.

Details zur Backend-/Frontend-Konvention stehen in [`docs/error-handling.md`](error-handling.md).

## Qualitätschecks

Lokal:

```bash
cd frontend
npm run lint
npm run build
```

GitHub Actions führt das Frontend-Linting ebenfalls aus.
