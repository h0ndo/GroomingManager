# ADR 0004: Lokaler Vision-LLM-Service

## Status

Vorgeschlagen / als optionale Erweiterung vorbereitet.

## Kontext

GroomingManager soll perspektivisch KI-Funktionen anbieten, ohne sensible Kund:innen- und Rezeptdaten an externe Cloud-LLM-Anbieter schicken zu müssen.

Geplante Anwendungsfälle:

- Führungskraft fragt natürlichsprachlich nach Kapazitäten, z. B. freie App-Slots morgen um 10:00 Uhr unter Berücksichtigung der Tagesauslastung.
- Angestellte lädt ein Foto eines ärztlichen Rezeptes hoch; KI extrahiert Kund:innen- und Rezeptdaten als Vorschlag.

Die Daten sind medizinisch und organisatorisch sensibel. Deshalb darf das LLM keine unkontrollierte direkte Datenbank- oder Schreibberechtigung bekommen.

## Entscheidung

Wir bereiten einen optionalen internen LLM-Service in Docker vor.

Startmodell:

```text
google/gemma-3-4b-it-qat-q4_0-gguf
```

Dateien:

```text
gemma-3-4b-it-q4_0.gguf
mmproj-model-f16-4B.gguf
```

Der Service läuft über `llama.cpp` mit CUDA-fähigem Docker-Image:

```text
ghcr.io/ggml-org/llama.cpp:server-cuda
```

Der Service wird nur optional gestartet:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml -f deploy/docker-compose.llm.yml --profile llm up -d --build
```

## Architektur

```text
Frontend
  -> Backend
      -> LLM-Service intern
      -> Datenbank / Business-Services
```

Das Frontend spricht nie direkt mit dem LLM.

Das LLM bekommt keinen direkten Datenbankzugriff. Das Backend bleibt die Sicherheits- und Tool-Schicht:

```text
Keycloak/Rollen prüfen
Business-Regeln ausführen
Datenbankabfragen kontrollieren
LLM-Ausgaben validieren
DB-Schreibaktionen freigeben
```

## Datenabfragen per LLM

Für Fragen wie:

```text
Welche Apps haben morgen um 10 Uhr einen freien Slot und sind nicht komplett ausgelastet?
```

soll das LLM nicht beliebig SQL erzeugen. Stattdessen nutzt das Backend später kontrollierte Tools/Funktionen, z. B.:

```json
{
  "tool": "find_available_apps",
  "arguments": {
    "date": "tomorrow",
    "time": "10:00",
    "maxDailyUtilizationPercent": 85
  }
}
```

Das Backend berechnet die Antwort deterministisch und das LLM formuliert sie verständlich.

## Rezeptfoto-Import

Der Rezeptimport muss immer mit menschlicher Prüfung laufen:

```text
Upload Foto/PDF
  -> Vision/OCR/LLM extrahiert strukturierte Daten
  -> Backend validiert Pflichtfelder und Plausibilität
  -> Angestellte sieht Vorschau
  -> Mensch bestätigt/korrigiert
  -> Customer/Rezept wird angelegt
```

Kein automatisches finales Anlegen medizinischer Daten nur auf Basis einer LLM-Antwort.

## GPU/VRAM

Für GPU-Nutzung braucht der Host:

- NVIDIA GPU,
- aktuellen NVIDIA-Treiber,
- Docker Desktop mit WSL2/GPU-Unterstützung,
- Containerstart mit GPU-Reservierung / `--gpus all`-Äquivalent.

Gemma 3 4B QAT GGUF benötigt grob mehrere GB Speicher. Praktisch sinnvoll:

```text
Minimum: ca. 6 GB RAM/VRAM
Besser: 8 GB+ VRAM
Komfortabel: 12 GB+ VRAM
```

## Konsequenzen

Positiv:

- Kundendaten bleiben in der Kundeninstanz.
- Gute Grundlage für Assistenzfunktionen und Rezeptvorerfassung.
- Optionaler Service; Deployments ohne KI bleiben schlank.

Negativ / Risiken:

- GPU-Support macht Deployment komplexer.
- Kleine Vision-LLMs können OCR-/Extraktionsfehler machen.
- Medizinische Dokumente brauchen menschliche Prüfung.
- Latenz und VRAM-Verbrauch müssen real getestet werden.
