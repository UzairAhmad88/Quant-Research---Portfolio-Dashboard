# Quant Research Dashboard — Project Foundation (Step 01)

A professional institutional quantitative-finance research and portfolio analysis platform.

> [!NOTE]
> **Step 01 Status**: Foundation & Architecture Established. Dark institutional theme, generic instrument model, decoupled app shell, React 19 + TypeScript + Vite frontend, FastAPI versioned backend API router (`/api/v1`), PostgreSQL database setup, Alembic migration environment, Docker compose setup, and Pytest/Vitest suites.

---

## 1. Product Vision & Architecture

Quant Research Dashboard is engineered as serious quantitative research software. It avoids flashy consumer aesthetics, bright neon gradients, and decorative glassmorphism, prioritizing information density, typography precision, and restrained financial color semantics.

### Key Architectural Pillars
1. **Generic Instrument Model**: Designed around generic instrument abstractions (`EQUITY`, `ETF`, `INDEX`, `CRYPTO`) rather than stock-only assumptions.
2. **Provider Abstraction Layer**: Market data providers are isolated behind an abstract base class (`MarketDataProvider`), preventing vendor lock-in.
3. **Decoupled Architecture**: Clean separation between React frontend presentation, FastAPI analytics engine, and PostgreSQL time-series storage.
4. **Zero Fabricated Financial Data**: Placeholder views clearly state development status without generating mock financial metrics.

---

## 2. Visual Direction & Theme Palette

- **Main Background**: `#0B1220`
- **Secondary Background**: `#111827`
- **Cards / Panels**: `#151F2E`
- **Borders**: `#263244`
- **Primary Text**: `#E5E7EB`
- **Secondary Text**: `#94A3B8`
- **Accent**: `#3B82F6` (Institutional Blue)
- **Positive**: `#22C55E` (Muted Green)
- **Negative**: `#EF4444` (Muted Red)
- **Warning**: `#F59E0B` (Muted Amber)

Typography:
- **UI Text**: Inter
- **Numerical Data / Tickers / Prices / Percentages**: JetBrains Mono / Monospace (`.font-mono-num`)

---

## 3. Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript 5 + Vite 6
- **Routing**: `react-router-dom` v7
- **State Management**: TanStack Query v5 (Server state) + Zustand v5 (Client UI state)
- **Icons & UI**: Lucide React + Institutional UI Tokens + Tailwind CSS

### Backend
- **Framework**: Python 3.11 + FastAPI + Pydantic v2
- **ORM & Database**: SQLAlchemy 2 + Alembic + PostgreSQL
- **Analytics Libraries (Prepared)**: Pandas, NumPy, SciPy
- **API Architecture**: Versioned router at `/api/v1`

---

## 4. Initial Application Routes

| Path | Module | Step | Status |
| :--- | :--- | :--- | :--- |
| `/` | Overview & Roadmap | Step 01 | Active |
| `/market-data` | Market Data Ingestion | Step 02 | Scaffolded |
| `/returns` | Return Calculator | Step 03 | Scaffolded |
| `/portfolio` | Portfolio Analytics | Step 04 | Scaffolded |
| `/correlation` | Correlation Matrix | Step 05 | Scaffolded |
| `/volatility` | Volatility Analytics | Step 06 | Scaffolded |
| `/strategies` | Quantitative Strategies | Step 07 | Scaffolded |
| `/backtesting` | Backtesting Engine | Step 08 | Scaffolded |
| `/settings` | System Settings | Step 01 | Active |

---

## 5. Quickstart & Local Development

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL (or Docker)

### Running Frontend
```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

### Running Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# API available at http://localhost:8000
# OpenAPI Docs at http://localhost:8000/api/v1/openapi.json
```

### Testing Suites
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
