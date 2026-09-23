# Quant Research Dashboard — Step 11 Complete

A professional institutional quantitative-finance research and portfolio analysis platform.

> [!NOTE]
> **Step 11 Status**: Correlation Analyzer & Correlation Matrix Complete. Implemented return-based correlation calculation engine (`app/analytics/correlation/`), Pearson correlation matrices ($N \times N$, diagonal = 1.0, symmetric), pairwise complete observation alignment, min 30 observations rule, rolling window correlation, FastAPI `/api/v1/correlation` REST API, frontend `/correlation` research workstation with interactive heatmap, pairwise scatter plot, lightweight-charts rolling correlation canvas, summary stats, matrix CSV export, 100% Pytest pass rate, and 100% Vitest pass rate.

---

## 1. Product Vision & Architecture

Quant Research Dashboard is engineered as serious quantitative research software. It avoids flashy consumer aesthetics, bright neon gradients, and decorative glassmorphism, prioritizing information density, typography precision, and restrained financial color semantics.

### Key Architectural Pillars
1. **Generic Instrument Model**: Designed around generic instrument abstractions (`EQUITY`, `ETF`, `INDEX`, `CRYPTO`) rather than stock-only assumptions.
2. **Provider Abstraction Layer**: Market data providers are isolated behind an abstract base class (`MarketDataProvider`), preventing vendor lock-in.
3. **Multi-Schema Database Architecture**: Segregated PostgreSQL schemas (`core` for application entities, `market_data` for OHLCV time-series).
4. **Layered Persistence Pattern**: Clean separation between API routes, Services, Repositories, SQLAlchemy ORM, and PostgreSQL.
5. **Data Validation & Quality Layer**: Centralized validation pipeline (`ValidationPipeline`) enforcing OHLC bounds, UTC normalization, market calendar session gap awareness, anomaly detection, and zero data fabrication.
6. **Return, Portfolio & Correlation Analytics Engine**: Decoupled numerical analytics engine computing simple/log/cumulative returns, CAGR metrics, portfolio valuation/allocation, position contributions, Pearson correlation matrices, pairwise return distributions, and time-varying rolling correlations.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript 5 + Vite 6
- **Charting Engine**: TradingView `lightweight-charts` v5 & Custom SVG Heatmap / Scatter Plot
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
