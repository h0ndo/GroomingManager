# Lokaler LLM-/Vision-Service

GroomingManager kann optional mit einem lokalen Vision-LLM laufen. Der Service ist für KI-Assistenzfunktionen gedacht, z. B.:

- natürlichsprachliche Kapazitätsfragen,
- Rezeptfoto-Extraktion,
- strukturierte Vorschläge für Angestellte und Führungskraft.

## Modell

Startkandidat:

```text
google/gemma-3-4b-it-qat-q4_0-gguf
```

Das Modell ist multimodal (`image-text-to-text`) und besteht aus:

```text
gemma-3-4b-it-q4_0.gguf
mmproj-model-f16-4B.gguf
```

## Start im produktionsnahen Modus

Wichtig: Das Google-Gemma-Repository auf Hugging Face ist zugriffsbeschränkt. Vor dem ersten Start:

1. Auf Hugging Face die Gemma-Lizenz/Terms akzeptieren.
2. Einen Hugging-Face-Token erzeugen.
3. Lokal in `deploy/.env` setzen:

```env
HF_TOKEN=hf_...
```

Der Token darf nicht committed werden.

```bash
cp deploy/.env.example deploy/.env
# deploy/.env anpassen

docker compose \
  --env-file deploy/.env \
  -f deploy/docker-compose.yml \
  -f deploy/docker-compose.llm.yml \
  --profile llm \
  up -d --build
```

Das Backend erreicht das LLM intern über:

```text
http://llm:8080
```

## Start für lokale Entwicklung

```bash
cp deploy/.env.local.example deploy/.env.local
# deploy/.env.local anpassen

docker compose \
  --env-file deploy/.env.local \
  -f deploy/docker-compose.local-dev.yml \
  -f deploy/docker-compose.llm.yml \
  --profile llm \
  up -d
```

Wenn das Backend lokal auf dem Host läuft, nutzt es:

```text
LLM_BASE_URL=http://localhost:8081
```

## GPU-Voraussetzungen

Unter Windows typischerweise:

```text
NVIDIA GPU
aktueller NVIDIA Treiber
Docker Desktop mit WSL2 Backend
GPU-Support in Docker aktiviert
```

Test auf dem Host:

```bash
docker run --rm --gpus all nvidia/cuda:12.4.1-base-ubuntu22.04 nvidia-smi
```

## Sicherheit

Das LLM ist ein interner Dienst. Zugriff läuft immer so:

```text
Frontend -> Backend -> LLM
```

Nicht so:

```text
Frontend -> LLM
```

Das Backend prüft:

- Keycloak-Token,
- Rollen/Berechtigungen,
- erlaubte Tools,
- Validierung von KI-Ausgaben,
- menschliche Freigabe bei Rezeptimport.

## Rezeptfoto-Import

Zielprozess:

```text
Upload Rezeptfoto
  -> Vision-LLM extrahiert JSON-Vorschlag
  -> Backend validiert Pflichtfelder
  -> Vorschauformular
  -> Mensch bestätigt/korrigiert
  -> Customer/Rezept wird angelegt
```

Wichtig: Kein automatisches finales Speichern medizinischer Daten ohne Prüfung.
