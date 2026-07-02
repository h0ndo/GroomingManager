# MVP: GroomingManager

Das erste MVP soll GroomingManager als stabile, cloud-ready Basis-App lauffähig machen.

## Ziel des MVP

Ein Grooming-Betrieb soll eine eigene Instanz mit Login, Rollen und ersten UI-/API-Pfaden erhalten.

Enthalten:

- Login über Keycloak,
- Rollenmodell für Admin, Führungskraft, Angestellte:r und Kund:in,
- Angular/PrimeNG UI mit geschütztem Dashboard,
- Spring Boot API mit Rollen-Endpunkten,
- PostgreSQL mit Flyway-Migrationen,
- Docker Compose Deployment,
- GitHub Actions CI inklusive E2E gegen den laufenden Compose-Stack.

## Erste Produktslices nach der Basis

1. Kund:innenprofile
2. Tierprofile
3. Leistungskatalog
4. Terminanfragen
5. Terminübersicht für Angestellte
6. Kapazitätsübersicht für Führungskräfte

## Rollen-Demo

Frontend-Routen:

```text
/admin
/fuehrungskraft
/angestellter
/kunde
```

Backend-Endpunkte:

```text
/api/admin/me
/api/fuehrungskraft/me
/api/angestellter/me
/api/kunde/me
```

## Nicht im ersten Basisstand

- vollwertige Terminlogik,
- Zahlungsabwicklung,
- Online-Buchung mit öffentlichen Slots,
- SMS/E-Mail-Integrationen,
- Abrechnung oder Rechnungsstellung.
