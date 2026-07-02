# Software Bill of Materials (SBOM)

Für GroomingManager erzeugen wir SBOMs im CycloneDX-JSON-Format.

## Enthaltene Ökosysteme

```text
frontend-npm.cdx.json   -> npm/Angular-Abhängigkeiten aus frontend/package-lock.json
backend-maven.json      -> Maven/Spring-Boot-Abhängigkeiten aus backend/pom.xml
```

## Lokal erzeugen

Auf dem Windows/Git-Bash-Setup kann der gemeinsame Generator genutzt werden:

```bash
./scripts/generate-sbom.sh
```

Der Generator schreibt nach:

```text
sbom/
```

Dieser Ordner ist bewusst in `.gitignore`, weil SBOMs Build-Artefakte sind und sich mit Dependency-/Lockfile-Änderungen neu erzeugen lassen.

## Einzelbefehle

Frontend:

```bash
cd frontend
npm ci
npx -y @cyclonedx/cyclonedx-npm@5.0.0 \
  --package-lock-only \
  --output-reproducible \
  --output-format JSON \
  --output-file ../sbom/frontend-npm.cdx.json
```

Backend ohne lokale Java-Installation über Docker:

```bash
MSYS_NO_PATHCONV=1 docker run --rm \
  -v "$PWD:/repo" \
  -w /repo/backend \
  maven:3.9.11-eclipse-temurin-21 \
  mvn -B org.cyclonedx:cyclonedx-maven-plugin:2.9.1:makeAggregateBom \
    -DschemaVersion=1.6 \
    -DoutputFormat=json \
    -DoutputName=backend-maven \
    -DoutputDirectory=/repo/sbom
```

## CI

GitHub Actions erzeugt die SBOMs in:

```text
.github/workflows/sbom.yml
```

Das Frontend-SBOM läuft mit `actions/setup-node` und Node 22. Das Backend-SBOM läuft mit `actions/setup-java` und Temurin 21.

Die CI validiert, dass beide SBOM-Dateien erzeugt werden können und nicht leer sind. GitHub Actions lädt die erzeugten SBOMs zusätzlich als Workflow-Artefakte hoch. Dauerhaft nutzbare lokale SBOM-Dateien können weiter über `./scripts/generate-sbom.sh` erzeugt werden und werden nicht ins Git committed.

Der CI-Workflow prüft zusätzlich, dass `scripts/generate-sbom.sh` vorhanden ist.
