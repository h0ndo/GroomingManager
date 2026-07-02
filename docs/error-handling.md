# Error Handling

GroomingManager nutzt eine einheitliche Fehlerbasis für Backend-APIs und Frontend-Feedback.

## Backend

Das Backend gibt für API-Validierungsfehler Spring `ProblemDetail` Antworten zurück.

Beispiel:

```json
{
  "type": "https://grooming-manager.local/problems/validation-error",
  "title": "Validation failed",
  "status": 400,
  "detail": "The request contains invalid fields.",
  "errors": {
    "name": "must not be blank"
  }
}
```

Relevante Dateien:

```text
backend/src/main/java/de/groomingmanager/backend/api/ApiErrorHandler.java
backend/src/test/java/de/groomingmanager/backend/api/ApiErrorHandlerTest.java
```

Aktuelle Konventionen:

- Validierungsfehler werden als `400 Bad Request` mit Feldfehlern unter `errors` zurückgegeben.
- Unerwartete Fehler werden als `500 Internal Server Error` mit generischem Detailtext zurückgegeben.
- Keine internen Exception-Details oder Stacktraces in API-Antworten ausgeben.
- Method-Security-Fehler werden als `403 Forbidden` Problem Detail zurückgegeben.
- Security-Fehler vor der Controller-Ausführung wie `401` kommen weiterhin aus Spring Security; das Frontend behandelt sie benutzerfreundlich.

## Frontend

Das Frontend registriert einen HTTP Error Interceptor:

```text
frontend/src/app/core/error.interceptor.ts
```

Der Interceptor zeigt für `/api/...` Fehler einen PrimeNG Toast an:

- `401`: Anmeldung erforderlich
- `403`: Keine Berechtigung
- Problem-Details: `title` und `detail` aus der Backend-Antwort
- Fallback: generische Fehlermeldung

Der Toast-Outlet sitzt zentral in:

```text
frontend/src/app/app.html
```

## Verifikation

Backend:

```bash
cd backend
mvn -B test spotless:check
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```
