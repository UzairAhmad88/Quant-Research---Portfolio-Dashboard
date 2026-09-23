# Quant Research Dashboard — Database Foundation (Step 03)

A professional institutional quantitative-finance research and portfolio analysis platform.

> [!NOTE]
> **Step 03 Status**: Database Foundation Complete. Logical PostgreSQL schemas (`core`, `market_data`), SQLAlchemy ORM models (`Instrument`, `OHLCV`), controlled Enums (`AssetType`, `DataFrequency`), Alembic migrations, Repository-Service pattern, reference instrument seeding script (no fake price data), Pytest test suite, and database documentation.

---

## 1. Product Vision & Architecture

Quant Research Dashboard is engineered as serious quantitative research software. It avoids flashy consumer aesthetics, bright neon gradients, and decorative glassmorphism, prioritizing information density, typography precision, and restrained financial color semantics.

### Key Architectural Pillars
1. **Generic Instrument Model**: Designed around generic instrument abstractions (`EQUITY`, `ETF`, `INDEX`, `CRYPTO`) rather than stock-only assumptions.
2. **Provider Abstraction Layer**: Market data providers are isolated behind an abstract base class (`MarketDataProvider`), preventing vendor lock-in.
3. **Multi-Schema Database Architecture**: Segregated PostgreSQL schemas (`core` for application entities, `market_data` for OHLCV time-series).
4. **Layered Persistence Pattern**: Clean separation between API routes, Services, Repositories, SQLAlchemy ORM, and PostgreSQL.
5. **Zero Fabricated Financial Data**: Reference instrument seed metadata without mock/fake price bars.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript 5 + Vite 6
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
| `/market-data` | Market Data Ingestion | Step 04 | Scaffolded |
| `/returns` | Return Calculator | Step 05 | Scaffolded |
| `/portfolio` | Portfolio Analytics | Step 06 | Scaffolded |
| `/correlation` | Correlation Matrix | Step 07 | Scaffolded |
| `/volatility` | Volatility Analytics | Step 08 | Scaffolded |
| `/strategies` | Quantitative Strategies | Step 09 | Scaffolded |
| `/backtesting` | Backtesting Engine | Step 10 | Scaffolded |
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
