# Backend Healthchecks

Das Backend nutzt Spring Boot Actuator als kleine Healthcheck-Basis für lokale und spätere Cloud-/Container-Deployments.

## Endpunkte

```text
/actuator/health
/actuator/health/liveness
/actuator/health/readiness
```

Diese Endpunkte sind ohne Login erreichbar. Fachliche API-Endpunkte bleiben weiter geschützt.

## Konfiguration

Die Actuator-Konfiguration liegt in:

```text
backend/src/main/resources/application.yml
```

Relevant:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      probes:
        enabled: true
```

## Docker

Das Backend-Image enthält einen Docker `HEALTHCHECK`, der die Readiness prüft:

```text
http://localhost:8080/actuator/health/readiness
```

Dadurch können Compose und später Container-Plattformen warten, bis das Backend wirklich bereit ist.

## Compose

Im produktionsnahen Stack und im E2E-App-Overlay wartet der Proxy auf:

```text
backend: service_healthy
```

Relevante Dateien:

```text
backend/Dockerfile
deploy/docker-compose.yml
deploy/docker-compose.e2e.yml
```

## Tests

Der Test liegt in:

```text
backend/src/test/java/de/groomingmanager/backend/actuator/HealthEndpointTest.java
```

Lokal prüfen:

```bash
cd backend
mvn -B -Dtest=HealthEndpointTest test
```
