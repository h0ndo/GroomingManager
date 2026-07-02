# Backend Quality Checks

Das Spring-Boot-Backend nutzt eine kleine Qualitätsbasis, die lokal und in GitHub Actions läuft.

## Checks

```bash
cd backend
mvn -B test spotless:check
```

Damit prüfen wir:

```text
JUnit/Spring Tests
Java-Formatierung via Spotless
```

## Formatierung

Spotless verwendet Google Java Format:

```text
com.diffplug.spotless:spotless-maven-plugin
Google Java Format
```

Wenn `spotless:check` fehlschlägt, lokal formatieren:

```bash
cd backend
mvn spotless:apply
```

Danach erneut prüfen:

```bash
mvn -B test spotless:check
```

## CI

GitHub Actions führt den Check im Workflow aus:

```text
.github/workflows/ci.yml
```
