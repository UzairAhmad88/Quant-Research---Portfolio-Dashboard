# Quant Research Dashboard — Step 15 Complete

A professional institutional quantitative-finance research and portfolio analysis platform.

> [!NOTE]
> **Step 15 Status**: Signal Management & Strategy Signal Layer Complete. Formalized the **Signal Management Layer** decoupling strategy signal calculation from future backtesting. Created `strategy` schema with `strategy_configurations` and `signal_events` tables in PostgreSQL, added SHA256 Strategy Configuration parameter hashing for parameter set identity, implemented `SignalRepository` and `SignalService` with idempotent bulk signal persistence, standardized `SignalType` (`BUY`, `SELL`), `SignalState` (`BULLISH`, `BEARISH`, `NEUTRAL`), and `SignalSource` (`STRATEGY_ENGINE`), exposed `/api/v1/signals` and `/api/v1/signals/{id}` REST endpoints, created frontend TanStack Query hooks (`useSignals`, `useSignalDetail`), built `SignalDetailModal` for structured signal inspection and auditability with "Focus on Chart" navigation, added comprehensive Pytest test suite (`test_signals.py`), frontend Vitest test suite (`signalAdapter.test.ts`), 100% Pytest pass rate (84 tests), and 100% Vitest pass rate (14 tests).

---

## 1. Product Vision & Architecture

Quant Research Dashboard is engineered as serious quantitative research software. It avoids flashy consumer aesthetics, bright neon gradients, and decorative glassmorphism, prioritizing information density, typography precision, and restrained financial color semantics.

### Key Architectural Pillars
1. **Generic Instrument Model**: Designed around generic instrument abstractions (`EQUITY`, `ETF`, `INDEX`, `CRYPTO`) rather than stock-only assumptions.
2. **Provider Abstraction Layer**: Market data providers are isolated behind an abstract base class (`MarketDataProvider`), preventing vendor lock-in.
3. **Multi-Schema Database Architecture**: Segregated PostgreSQL schemas (`core` for application entities, `market_data` for OHLCV time-series, `strategy` for configurations & signals).
4. **Layered Persistence Pattern**: Clean separation between API routes, Services, Repositories, SQLAlchemy ORM, and PostgreSQL.
5. **Data Validation & Quality Layer**: Centralized validation pipeline (`ValidationPipeline`) enforcing OHLC bounds, UTC normalization, market calendar session gap awareness, anomaly detection, and zero data fabrication.
6. **Analytics & Strategy Signal Engine**: Decoupled numerical analytics engine computing simple/log/cumulative returns, CAGR metrics, portfolio valuation/allocation, position contributions, Pearson correlation matrices, volatility metrics, SMA/EMA moving averages, look-ahead-free research signals, and standardized Signal Management persistence.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript 5 + Vite 6
- **Charting Engine**: Custom Canvas / SVG Time Series & Technical Overlays & Fullscreen Workstation
- **Routing**: `react-router-dom` v7
- **State Management**: TanStack Query v5 (Server state) + Zustand v5 (Client UI state)
- **Icons & UI**: Lucide React + Institutional UI Tokens + Tailwind CSS

### Backend & Database
- **Framework**: Python 3.11 + FastAPI + Pydantic v2
- **Database Engine**: PostgreSQL 16 + SQLAlchemy 2 + Alembic Migrations
- **Schemas**: `core` (Instruments & Portfolios), `market_data` (OHLCV time-series) & `strategy` (Configurations & Signal Events)
- **API Architecture**: Versioned router at `/api/v1`

---

## 3. Application Routes & Roadmap

| Path | Module | Step | Status |
| :--- | :--- | :--- | :--- |
| `/` | Overview & Roadmap | Step 01 | Active |
| `/market-data` | Market Data Workspace, Visualization & Data Quality | Step 06..08 | Complete |
| `/returns` | Return Calculator & Performance Analytics | Step 09 | Complete |
| `/portfolio` | Portfolio Calculator & Portfolio Analytics | Step 10 | Complete |
| `/correlation` | Correlation Analyzer & Correlation Matrix | Step 11 | Complete |
| `/volatility` | Volatility Analyzer & Risk Measurement | Step 12 | Complete |
| `/strategies` | Strategy Visualization & Signal Research Workspace | Step 13..14 | Complete |
| `/signals` | Signal Management & Strategy Signal Layer | Step 15 | Complete |
| `/backtesting` | Backtesting Engine | Step 16 | Scaffolded |
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
