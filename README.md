# Quant Research Dashboard — Step 29 Complete (v1.0.0 Production Ready)

A professional institutional quantitative-finance research, strategy development, and portfolio analysis platform.

> [!NOTE]
> **Step 29 Status**: Deployment & Production Readiness Complete (v1.0.0). The application is fully packaged, hardened, observable, recoverable, and deployable:
> - **Production Containerization**: Multi-stage, non-root Docker builds for Backend (Gunicorn + Uvicorn ASGI workers) and Frontend (Nginx Alpine with SPA routing and asset caching).
> - **Operational Health Probes**: Dual-layer liveness (`/health`) and database-verified readiness (`/health/ready`) with version metadata (`/version`).
> - **Automated Backup & Recovery**: Tested backup scripts (`scripts/backup_db.sh` / `scripts/backup_db.ps1`) and restoration verification runbooks (`scripts/restore_db.sh` / `scripts/restore_db.ps1`).
> - **CI/CD Quality Pipeline**: GitHub Actions workflow orchestrating strict linting, typechecking, 180 Pytest tests, 59 Vitest tests, security tests, and multi-container builds.
> - **Production Documentation**: 14 operational guides in [`docs/deployment/`](docs/deployment/architecture.md) and 11 security specifications in [`docs/security/`](docs/security/security-overview.md).

---

## 1. Product Vision & Architecture

Quant Research Dashboard is engineered as serious quantitative research software. It avoids flashy consumer aesthetics, bright neon gradients, and decorative glassmorphism, prioritizing information density, typography precision, and restrained financial color semantics.

### Key Architectural Pillars
1. **Generic Instrument Model**: Multi-asset support (`EQUITY`, `ETF`, `INDEX`, `CRYPTO`) with timezone-aware UTC normalization.
2. **Provider Abstraction Layer**: Market data providers isolated behind `MarketDataProvider`, backed by a 6-tier validation pipeline.
3. **Multi-Schema Database Architecture**: Segregated PostgreSQL schemas (`core`, `market_data`, `strategy`, `backtesting`).
4. **Layered Persistence Pattern**: Clean separation between API routes, Services, Repositories, SQLAlchemy ORM, and PostgreSQL.
5. **Analytics & Strategy Signal Engine**: Vectorized return calculation, portfolio allocation, Pearson correlation matrices, volatility metrics, look-ahead-free moving average crossover signals, and event-driven backtesting simulation.
6. **Quality Engineering & Determinism**: Property-based invariant verification, zero live provider calls during testing, deterministic synthetic fixtures, and sub-millisecond execution budgets.
7. **Security & Zero-Trust Defense**: 100% parameterized queries, defensive HTTP headers (CSP, nosniff, frame denial), sliding-window rate limiting, SSRF provider allowlist, and CSV formula injection neutralization.
8. **Operational Readiness**: Automated health probes, non-root execution, graceful shutdown lifecycle, and database backup/restore runbooks.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript 5 + Vite 6
- **Charting Engine**: Custom Canvas / SVG Time Series & Technical Overlays & Fullscreen Workstation
- **Routing**: `react-router-dom` v7 (with route-level code splitting)
- **State Management**: TanStack Query v5 (Server state) + Zustand v5 (Client UI state)
- **Icons & UI**: Lucide React + Institutional UI Tokens + Tailwind CSS
- **Testing**: Vitest + React Testing Library + Playwright E2E

### Backend & Database
- **Framework**: Python 3.11 + FastAPI + Pydantic v2
- **Testing**: Pytest + pytest-asyncio + Hypothesis (Property testing) + pytest-cov
- **Database Engine**: PostgreSQL 16 + SQLAlchemy 2 + Alembic Migrations
- **Schemas**: `core`, `market_data`, `strategy`, and `backtesting`
- **Server**: Gunicorn / Uvicorn ASGI with connection pooling (`pool_size=20`, `max_overflow=30`)

---

## 3. Application Routes & Roadmap

| Path | Module | Step | Status |
| :--- | :--- | :--- | :--- |
| `/` | Overview & Unified Dashboard | Step 01, 21 | Complete |
| `/market-data` | Market Data Workspace, Visualization & Data Quality | Step 06..08, 23 | Complete |
| `/returns` | Return Calculator & Performance Analytics | Step 09 | Complete |
| `/portfolio` | Portfolio Calculator & Portfolio Analytics | Step 10 | Complete |
| `/correlation` | Correlation Analyzer & Correlation Matrix | Step 11 | Complete |
| `/volatility` | Volatility Analyzer & Risk Measurement | Step 12 | Complete |
| `/strategies` | Strategy Visualization & Signal Research Workspace | Step 13..14 | Complete |
| `/signals` | Signal Management & Strategy Signal Layer | Step 15 | Complete |
| `/backtesting` | Backtesting Architecture & Historical Simulation Framework | Step 16..20 | Complete |
| `/settings` | System Settings & Provider Configuration | Step 02 | Complete |

---

## 4. Testing & Quality Assurance

### 4.1 Backend Test Suite (Pytest + Hypothesis)
```bash
cd backend
$env:PYTHONPATH="backend"; python -m pytest backend/tests/ -v
```

### 4.2 Security Test Suite
```bash
cd backend
$env:PYTHONPATH="backend"; python -m pytest backend/tests/security/ -v
```

### 4.3 Frontend Test Suite (Vitest)
```bash
cd frontend
npm test -- --run
```

### 4.4 Production Build Verification
```bash
cd frontend
npm run build
```

---

## 5. Docker & Production Deployment

### 5.1 Local Multi-Container Development
```bash
docker compose up --build
```

### 5.2 Production Stack Deployment
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 5.3 Health Probes
```bash
# Liveness probe
curl http://localhost:8000/health

# Readiness probe (verifies database)
curl http://localhost:8000/health/ready

# Version metadata
curl http://localhost:8000/version
```

### 5.4 Database Backups & Maintenance
```bash
# Automated timestamped backup
./scripts/backup_db.sh

# Database restore
./scripts/restore_db.sh ./backups/quant_backup_quant_dashboard_YYYYMMDD_HHMMSS.sql.gz
```

---

## 6. Documentation Index

- **Deployment**: [`docs/deployment/`](docs/deployment/architecture.md)
- **Security**: [`docs/security/`](docs/security/security-overview.md)
- **Testing**: [`docs/testing/`](docs/testing/testing-strategy.md)
- **Calculations & Methodology**: [`docs/CALCULATIONS.md`](docs/CALCULATIONS.md)
- **API Contracts**: [`docs/API.md`](docs/API.md)
- **Release Notes**: [`RELEASE_NOTES.md`](RELEASE_NOTES.md)
