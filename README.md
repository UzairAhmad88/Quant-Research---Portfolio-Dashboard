# Quant Research Dashboard — Step 07 Complete

A professional institutional quantitative-finance research and portfolio analysis platform.

> [!NOTE]
> **Step 07 Status**: Advanced Market Data Visualization & Research View Complete. Integrated TradingView `lightweight-charts` Canvas engine, Candlestick & Line series views, Volume pane, interactive crosshair with real-time OHLCV legend overlay, date range presets (`1M`..`5Y`, `MAX`), price mode selection (`Raw` vs `Adjusted`), chart settings popover, fullscreen mode with Escape key binding, data quality validation & LTTB downsampling adapter, Vitest test suite, and backend query optimization.

---

## 1. Product Vision & Architecture

Quant Research Dashboard is engineered as serious quantitative research software. It avoids flashy consumer aesthetics, bright neon gradients, and decorative glassmorphism, prioritizing information density, typography precision, and restrained financial color semantics.

### Key Architectural Pillars
1. **Generic Instrument Model**: Designed around generic instrument abstractions (`EQUITY`, `ETF`, `INDEX`, `CRYPTO`) rather than stock-only assumptions.
2. **Provider Abstraction Layer**: Market data providers are isolated behind an abstract base class (`MarketDataProvider`), preventing vendor lock-in.
3. **Multi-Schema Database Architecture**: Segregated PostgreSQL schemas (`core` for application entities, `market_data` for OHLCV time-series).
4. **Layered Persistence Pattern**: Clean separation between API routes, Services, Repositories, SQLAlchemy ORM, and PostgreSQL.
5. **Interactive Canvas Charting**: `lightweight-charts` integration with strict TypeScript adapters, downsampling, crosshairs, and fullscreen research mode.

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
| `/market-data` | Market Data Workspace & Visualization | Step 06 & 07 | Complete |
| `/returns` | Return Calculator | Step 08 | Next |
| `/portfolio` | Portfolio Analytics | Step 09 | Scaffolded |
| `/correlation` | Correlation Matrix | Step 10 | Scaffolded |
| `/volatility` | Volatility Analytics | Step 11 | Scaffolded |
| `/strategies` | Quantitative Strategies | Step 12 | Scaffolded |
| `/backtesting` | Backtesting Engine | Step 13 | Scaffolded |
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
