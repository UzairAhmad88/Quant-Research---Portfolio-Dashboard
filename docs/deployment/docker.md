# Docker Build & Container Architecture

The containerized deployment uses multi-stage builds to minimize image size and eliminate build toolchains from runtime containers.

---

## 1. Container Images

### Backend Image (`docker/backend/Dockerfile`)
- **Base**: `python:3.11-slim`
- **Builder**: Installs `build-essential` and `libpq-dev` to compile C extensions (NumPy, SciPy, psycopg3).
- **Runtime**: Runs as unprivileged user `quant:quant`.
- **Server**: Production ASGI execution via `gunicorn -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:8000 app.main:app`.
- **Health Check**: Native probe calling `http://localhost:8000/health`.

### Frontend Image (`docker/frontend/Dockerfile`)
- **Base**: `node:20-alpine` (Builder) -> `nginx:1.25-alpine` (Runtime).
- **Runtime**: Serves pre-compressed static assets with immutable cache headers for fingerprinted chunks.
- **Routing**: Internal SPA rewrite rules (`try_files $uri $uri/ /index.html`).

---

## 2. Running Local Docker Stack

```bash
# Build and run complete multi-tier stack locally
docker compose up --build

# Run in background
docker compose up -d

# Check service logs
docker compose logs -f backend
```
