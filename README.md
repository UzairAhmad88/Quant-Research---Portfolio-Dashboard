# Quant Research Dashboard — Step 08 Complete

A professional institutional quantitative-finance research and portfolio analysis platform.

> [!NOTE]
> **Step 08 Status**: Data Validation, Quality Control & Storage Integrity Layer Complete. Implemented modular backend validation pipeline (`app/validators/`), market calendar awareness (`EquityCalendar` vs `CryptoCalendar`), pre-persistence deduplication, OHLC logical bounds, UTC normalization, anomaly detection (>20% price jump warnings, volume spikes), dataset quality scoring (`GOOD`, `GOOD_WITH_WARNINGS`, `INVALID`, `NO_DATA`), FastAPI quality endpoints (`/quality`, `/ingestions/{id}`), frontend `DataQualityPanel` & `QualityIssuesDrawer`, 31/31 Pytest test pass rate, and 6/6 Vitest pass rate.

---

## 1. Product Vision & Architecture

Quant Research Dashboard is engineered as serious quantitative research software. It avoids flashy consumer aesthetics, bright neon gradients, and decorative glassmorphism, prioritizing information density, typography precision, and restrained financial color semantics.

### Key Architectural Pillars
1. **Generic Instrument Model**: Designed around generic instrument abstractions (`EQUITY`, `ETF`, `INDEX`, `CRYPTO`) rather than stock-only assumptions.
2. **Provider Abstraction Layer**: Market data providers are isolated behind an abstract base class (`MarketDataProvider`), preventing vendor lock-in.
3. **Multi-Schema Database Architecture**: Segregated PostgreSQL schemas (`core` for application entities, `market_data` for OHLCV time-series).
4. **Layered Persistence Pattern**: Clean separation between API routes, Services, Repositories, SQLAlchemy ORM, and PostgreSQL.
5. **Data Validation & Quality Layer**: Centralized validation pipeline (`ValidationPipeline`) enforcing OHLC bounds, UTC normalization, market calendar session gap awareness, anomaly detection, and zero data fabrication for downstream quantitative modules.


---

## 2. Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript 5 + Vite 6
- **Charting Engine**: TradingView `lightweight-charts` v5
- **Routing**: `react-router-dom` v7
- **State Management**: TanStack Query v5 (Server state) + Zustand v5 (Client UI state)
- **Icons & UI**: Lucide React + Institutional UI Tokens + Tailwind CSS

### Backend & Database
- **Framework**: Python 3.11 + FastAPI + Pydantic v2
- **Database Engine**: PostgreSQL 16 + SQLAlchemy 2 + Alembic Migrations
- **Schemas**: `core` (Instruments) & `market_data` (OHLCV time-series)
- **API Architecture**: Versioned router at `/api/v1`

---

## 3. Application Routes & Roadmap

| Path | Module | Step | Status |
| :--- | :--- | :--- | :--- |
| `/` | Overview & Roadmap | Step 01 | Active |
| `/market-data` | Market Data Workspace, Visualization & Data Quality | Step 06..08 | Complete |
| `/returns` | Return Calculator | Step 09 | Next |
| `/portfolio` | Portfolio Analytics | Step 10 | Scaffolded |
| `/correlation` | Correlation Matrix | Step 11 | Scaffolded |
| `/volatility` | Volatility Analytics | Step 12 | Scaffolded |
| `/strategies` | Quantitative Strategies | Step 13 | Scaffolded |
| `/backtesting` | Backtesting Engine | Step 14 | Scaffolded |
| `/settings` | System Settings | Step 02 | Active |



---

## 4. Quickstart & Local Development

### Running Database Migrations & Seed
```bash
cd backend
alembic upgrade head
python -m app.db.seed
```

### Running Backend API
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### Running Frontend Workstation
```bash
cd frontend
npm run dev
```

### Running Test Suites
```bash
# Frontend Vitest
cd frontend && npm test

# Backend Pytest
cd backend && python -m pytest
```

### Docker Quickstart
```bash
docker-compose up --build
```
