# Security Checks

Dieses Projekt nutzt bewusst schlanke Security Checks, die lokal und in GitHub Actions schnell laufen.

## Secret Scan mit Gitleaks

Gitleaks prüft, ob versehentlich Secrets im Repository landen, z. B.:

- API Tokens,
- `HF_TOKEN`,
- Datenbank-Passwörter,
- Keycloak Secrets,
- private Schlüssel.

CI-Befehl:

```bash
gitleaks detect --source . --no-git --redact --no-banner --verbose
```

Die Konfiguration liegt in:

```text
.gitleaks.toml
```

Sie ignoriert lokale/generierte Dateien wie `.terraform/`, `node_modules/`, `dist/`, Angular Cache und lokale `.env`-/Terraform-Override-Dateien. Dadurch kann derselbe Scan lokal laufen, ohne echte Entwickler-Secrets aus ignorierten Dateien zu melden.

## Frontend Dependency Audit

Für npm-Abhängigkeiten wird ein bewusst pragmatischer High-Severity-Gate genutzt:

```bash
cd frontend
npm audit --audit-level=high
```

Damit blockieren nur ernstere Dependency-Probleme. Niedrige Findings werden dokumentiert, aber nicht als hartes CI-Kriterium behandelt.

## Keycloak Registrierung und E-Mail-Verifizierung

GroomingManager erlaubt öffentliche Registrierung für Kund:innen über Keycloak. Dabei gilt:

```text
registration_allowed = true
registration_email_as_username = true
verify_email = true
```

Der Registrieren-Button der öffentlichen Startseite führt direkt auf den Keycloak-Registrierungs-Endpunkt. Keycloak nutzt die E-Mail-Adresse als Benutzername und fordert eine E-Mail-Verifizierung, bevor der Account vollständig nutzbar ist.

Wichtig: Für echte Kundeninstanzen muss SMTP im Keycloak-Realm bzw. in der Keycloak-Instanz konfiguriert sein. Ohne funktionierenden SMTP-Versand kann Keycloak keine Verifikationsmails zustellen.

## Backend Rollenautorisierung

Das Backend nutzt Spring Security Method Security:

```text
@EnableMethodSecurity
@PreAuthorize("hasRole('admin')")
@PreAuthorize("hasRole('groomer')")
@PreAuthorize("hasRole('kunde')")
```

Die Keycloak-Realm-Rollen werden aus dem JWT auf Spring Authorities gemappt:

```text
admin   -> ROLE_admin
groomer -> ROLE_groomer
kunde   -> ROLE_kunde
```

Aktuelle rollenbezogene Test-Endpunkte:

```text
GET /api/admin/me
GET /api/groomer/me
GET /api/kunde/me
```

Diese Endpunkte sind absichtlich klein und dienen als Sicherheitsbasis für spätere fachliche Ressourcen. Frontend Guards sind nur Komfort; Backend-`@PreAuthorize` ist die verbindliche Sicherheitsgrenze.

## Aktuelle Entscheidung

Vorerst keine großen SAST-/Plattformtools wie SonarQube oder vollständige OWASP Dependency-Check Pflichtläufe. Diese können später als separater Nightly- oder Release-Job ergänzt werden, wenn das Projekt mehr Code und mehr externe Abhängigkeiten hat.
