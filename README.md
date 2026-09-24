# Quant Research Dashboard — Step 14 Complete

A professional institutional quantitative-finance research and portfolio analysis platform.

> [!NOTE]
> **Step 14 Status**: Strategy Visualization & Signal Research Workspace Complete. Enhanced backend `StrategyService` with pre-warmup lookback fetching ($3 \times slow\_window$), created frontend `strategyChartAdapter.ts` with dedicated Vitest unit test suite, built Strategy Header with Research Signal State badge (`BUY`, `SELL`, `HOLD`), updated Strategy Config Panel with Candlestick vs Line price selectors and overlay toggles (`Fast MA`, `Slow MA`, `Signals`, `Volume`), built interactive strategy price chart with `▲` BUY and `▼` SELL crossover markers, crosshairs, tooltips, and Fullscreen mode, added Crossover Signal History Log table with `BUY`/`SELL`/`ALL` filtering and sorting, Methodology Panel, Data Quality Provenance Panel, Market Data Context navigation link, 100% Pytest pass rate (80 tests), and 100% Vitest pass rate (10 tests).

---

## 1. Product Vision & Architecture

Quant Research Dashboard is engineered as serious quantitative research software. It avoids flashy consumer aesthetics, bright neon gradients, and decorative glassmorphism, prioritizing information density, typography precision, and restrained financial color semantics.

### Key Architectural Pillars
1. **Generic Instrument Model**: Designed around generic instrument abstractions (`EQUITY`, `ETF`, `INDEX`, `CRYPTO`) rather than stock-only assumptions.
2. **Provider Abstraction Layer**: Market data providers are isolated behind an abstract base class (`MarketDataProvider`), preventing vendor lock-in.
3. **Multi-Schema Database Architecture**: Segregated PostgreSQL schemas (`core` for application entities, `market_data` for OHLCV time-series).
4. **Layered Persistence Pattern**: Clean separation between API routes, Services, Repositories, SQLAlchemy ORM, and PostgreSQL.
5. **Data Validation & Quality Layer**: Centralized validation pipeline (`ValidationPipeline`) enforcing OHLC bounds, UTC normalization, market calendar session gap awareness, anomaly detection, and zero data fabrication.
6. **Analytics & Strategy Signal Engine**: Decoupled numerical analytics engine computing simple/log/cumulative returns, CAGR metrics, portfolio valuation/allocation, position contributions, Pearson correlation matrices, volatility metrics, SMA/EMA moving averages, and look-ahead-free research signals with warm-up lookback.

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
- **Schemas**: `core` (Instruments & Portfolios) & `market_data` (OHLCV time-series)
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
| `/backtesting` | Backtesting Engine | Step 15 | Scaffolded |
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
