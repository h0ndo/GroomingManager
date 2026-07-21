# Keycloak-Konfiguration mit Terraform

Dieses Verzeichnis enthält die deklarative Keycloak-Konfiguration für eine App-Manager-Kundeninstanz.

## Ziel

Nach dem Start des Docker-Compose-Stacks soll Keycloak nicht manuell im Browser konfiguriert werden müssen. Terraform legt stattdessen reproduzierbar an:

- Realm `grooming-manager`,
- OIDC Client für die App,
- Rollen:
  - `admin`,
  - `groomer`,
  - `kunde`,
- Gruppen:
  - `Admins`,
  - `Groomer`,
  - `Kund:innen`,
- optional initialen Admin-User in der Gruppe `Admins`.
- optional lokale Playwright-Testnutzer für Admin, Groomer und Kund:in.

## Ablauf pro Kundeninstanz

1. Docker-Compose-Stack starten:

```bash
cp deploy/.env.example deploy/.env
# deploy/.env anpassen
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d
```

2. Warten, bis Keycloak erreichbar ist:

```bash
curl -f https://<kunde-domain>/auth/health/ready
```

3. Terraform-Variablen vorbereiten:

```bash
cd infra/keycloak
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars anpassen
```

4. Keycloak-Konfiguration anwenden:

```bash
terraform init
terraform plan
terraform apply
```

## Wichtige Hinweise

- `terraform.tfvars` enthält Secrets und darf nicht committed werden.
- Terraform-State enthält ebenfalls sensible Werte. Für Produktion sollte der State nicht ungeschützt lokal herumliegen.
- Pro Kundeninstanz sollte es einen separaten Terraform-State geben.
- Das Angular Frontend nutzt Authorization Code Flow mit PKCE und deshalb einen **public** OIDC Client ohne Client Secret.
- Der erste Aufruf der App leitet direkt zu Keycloak weiter. Keycloak dient als Login-System, nicht als öffentliche Selbstregistrierung.
- Nutzer:innen werden durch Admins oder App-Workflows angelegt; danach melden sie sich über Keycloak an.
- Das Backend validiert nur Access Tokens/JWTs über die Keycloak JWK Set URL; es benötigt kein OIDC Client Secret.
- Keycloak sollte erst über Terraform konfiguriert werden, wenn der Container vollständig hochgefahren ist.
- Lokale Testnutzer mit einfachen Passwörtern werden nur angelegt, wenn `test_users_enabled = true` gesetzt ist. In produktiven Kundeninstanzen muss das `false` bleiben.

## Lokale Tooling-Hinweise

In dieser Entwicklungsumgebung war `terraform` beim Anlegen dieser Dateien noch nicht installiert. Die Dateien sind daher strukturell vorbereitet, müssen aber nach Installation von Terraform mit `terraform fmt`, `terraform init` und `terraform validate` final geprüft werden.
