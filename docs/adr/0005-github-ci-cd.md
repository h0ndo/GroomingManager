# ADR 0005: GitHub als Git- und CI/CD-Plattform

## Status

Angenommen.

## Kontext

Das Projekt wurde zunächst mit einem lokalen/self-hosted Forgejo-Setup aufgebaut. Für die aktuelle Projektphase ist Forgejo aber ein Flaschenhals: Einrichtung, Runner-Betrieb und Kompatibilität kosten mehr Zeit als sie sparen.

GroomingManager soll deshalb wieder GitHub als primäre Git- und CI/CD-Plattform verwenden.

## Entscheidung

Das primäre Remote ist GitHub:

```text
https://github.com/h0ndo/AppManager.git
```

GitHub Actions ist die primäre CI/CD-Umgebung.

Workflows liegen unter:

```text
.github/workflows/
```

Aktuelle Workflows:

```text
.github/workflows/ci.yml
.github/workflows/sbom.yml
```

Forgejo wird aus diesem Repository entfernt:

```text
.forgejo/
```

## Konsequenzen

### Positiv

- Keine lokale Forgejo-/Runner-Infrastruktur als Blocker.
- GitHub Actions unterstützt `actions/upload-artifact` zuverlässig.
- CI ist einfacher mit Standard-Actions wie `actions/setup-java` und `actions/setup-node`.
- Repository ist direkt auf GitHub für spätere Issues, PRs und Actions verfügbar.

### Negativ / Achtung

- Abhängigkeit von GitHub als externer Plattform.
- Für private Repos/Secrets gelten GitHub-Berechtigungen und GitHub Actions Secret Handling.
- Self-hosted Forgejo bleibt nicht mehr die primäre Quelle.

## Betriebsregel

Normale Git-Befehle verwenden ab jetzt `origin` auf GitHub:

```bash
git remote -v
git push
git pull
```

CI/CD-Änderungen werden in `.github/workflows/` gepflegt.
