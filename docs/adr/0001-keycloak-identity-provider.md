# ADR 0001: Keycloak als Identity Provider

## Status

Vorgeschlagen / vorläufig angenommen für die Zielarchitektur.

## Kontext

GroomingManager verarbeitet sensible Kund:innen- und Gesundheitsdaten. Authentifizierung, Rollen, Sessions und spätere Mandanten-/Kundeninstanzen sollten deshalb nicht nebenbei selbst gebaut werden.

Die Anwendung soll außerdem cloud-ready sein: pro Kund:in soll eine eigene Docker-Compose-Instanz mit App, Datenbank, Proxy und Auth-Komponente gestartet werden können.

## Entscheidung

Wir verwenden **Keycloak** als zentralen Identity Provider pro Kundeninstanz.

Die Docker-Compose-Zielarchitektur enthält:

- `proxy` — Nginx als Reverse Proxy,
- `app` — GroomingManager Anwendung,
- `keycloak` — Authentifizierung und Benutzer-/Rollenverwaltung,
- `db` — PostgreSQL für App und Keycloak, mit getrennten Datenbanken/Usern.

Keycloak wird unter derselben Kundendomain über den Pfad `/auth` veröffentlicht:

```text
https://kunde-demo.example.de/       -> App
https://kunde-demo.example.de/auth   -> Keycloak
```

Die App integriert Keycloak über OpenID Connect/OAuth2:

```text
OIDC_ISSUER_URL=https://<domain>/auth/realms/<realm>
OIDC_CLIENT_ID=grooming-manager-app
```

Das Angular Frontend verwendet Authorization Code Flow mit PKCE und einen **public** OIDC Client ohne Client Secret. Beim ersten Aufruf der App wird ohne gültigen Token direkt zu Keycloak weitergeleitet. Nach erfolgreichem Login leitet Keycloak zurück auf die App-Startseite. Keycloak-Selbstregistrierung ist deaktiviert; Nutzer:innen werden durch Admins oder App-Workflows angelegt. Das Spring-Boot-Backend ist ein Resource Server und validiert Access Tokens über Keycloaks JWK Set.

## Warum Keycloak?

Vorteile:

- etabliert und Open Source,
- läuft gut als Docker-Container,
- OpenID Connect/OAuth2/SAML,
- Rollen, Gruppen und Benutzerverwaltung,
- MFA/2FA möglich,
- Passwortregeln, Brute-Force-Schutz, Account-Policies,
- später SSO mit Kundensystemen möglich,
- trennt Auth sauber von der eigentlichen Fachanwendung.

## Zur „Lite“-Frage

Keycloak hatte früher eine schwerere WildFly-basierte Distribution. Das heutige Keycloak basiert auf Quarkus und ist deutlich schlanker und containerfreundlicher. Eine separate offizielle „Keycloak Lite“-Produktlinie ist für die Architektur nicht notwendig; für uns reicht die moderne Container-Distribution.

Wenn Keycloak später trotzdem zu schwer wirkt, wären Alternativen:

- Zitadel,
- Authentik,
- Ory Kratos/Hydra,
- Supabase Auth, falls Supabase als Plattform gewählt würde.

Für dieses Projekt ist Keycloak aber fachlich passend, weil Gesundheitsdaten, Rollen und spätere Kunden-SSO-Anforderungen wahrscheinlich relevant werden.

## Konsequenzen

### Positiv

- Die App muss keine eigene Passwortverwaltung implementieren.
- Rollen können zentral gepflegt werden.
- Spätere 2FA und SSO werden realistischer.
- Jede Kundeninstanz kann eigene Benutzer, Rollen und Policies haben.

### Negativ / Kosten

- Ein zusätzlicher Container und etwas mehr RAM.
- Realm-/Client-Konfiguration muss automatisiert werden.
- Backup umfasst neben App-Daten auch Keycloak-Daten.
- Lokale Entwicklung braucht entweder Keycloak oder einen Mock/OIDC-Testmodus.

## Offene Folgeentscheidungen

1. Keycloak pro Kundeninstanz oder zentraler Keycloak für alle Kunden?
   - Empfehlung aktuell: pro Kundeninstanz, passend zur Instanz-pro-Kunde-Strategie.
2. Keycloak unter `/auth` oder eigener Subdomain `auth.<kunde>`?
   - Empfehlung aktuell: `/auth`, weil nur eine Domain/DNS-Konfiguration nötig ist.
3. Realm-Import direkt im Docker-Compose-Start oder separates Setup-Script?
   - Entscheidung: Keycloak-Konfiguration soll deklarativ mit Terraform gepflegt werden (`infra/keycloak`).
4. App-Rollen nur in Keycloak oder zusätzlich in App-Datenbank spiegeln?
   - Empfehlung: Keycloak für Login/Rollen, App-Datenbank für fachliche Profile wie Angestellte:r, Angestellte, Führungskraft.
