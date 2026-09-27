# Architecture Documentation — Quant Research Dashboard

This document details the system design, component boundaries, and data flow of the Quant Research Dashboard platform.

---

## 1. System Overview Diagram

```text
[ User Interface ]
       │
   (HTTP/REST)
       ▼
┌───────────────────────────────────────────────────────────┐
│                    FastAPI Backend                        │
│                                                           │
│   ┌───────────────────┐        ┌──────────────────────┐   │
│   │  /api/v1 Router   │ ─────► │   Health & Core      │   │
│   └─────────┬─────────┘        └──────────────────────┘   │
│             │                                             │
│             ▼                                             │
│   ┌───────────────────┐        ┌──────────────────────┐   │
│   │ Service Boundary  │ ─────► │ Provider Abstraction │   │
│   └─────────┬─────────┘        └──────────┬───────────┘   │
└─────────────┼─────────────────────────────┼───────────────┘
              │                             │
              ▼                             ▼
   ┌────────────────────┐       ┌───────────────────────┐
   │ SQLAlchemy ORM     │       │ External Market Data  │
   └──────────┬─────────┘       │ Provider (Step 02)    │
              │                 └───────────────────────┘
              ▼
   ┌────────────────────┐
   │ PostgreSQL DB      │
   └────────────────────┘
```

---

## 2. Frontend Architecture (`frontend/`)

### Layout & Component Structure
- `src/app`: Application entry point and router configuration.
- `src/components/layout`: AppShell, Sidebar, TopBar, persistent navigation layout.
- `src/components/common`: MonogramLogo, PlaceholderModule, reusable shared items.
- `src/components/ui`: Card, Badge, Button, Input base UI components.
- `src/pages`: Route-level pages for Overview, Market Data, Returns, Portfolio, Correlation, Volatility, Strategies, Backtesting, Settings.
- `src/store`: Zustand client state store (`appStore.ts`).
- `src/lib`: TanStack Query API fetchers and axios wrappers.
- `src/types`: Domain model TypeScript definitions (`instrument.ts`).
- `src/styles`: CSS variables design system (`globals.css`).

---

## 3. Backend Architecture (`backend/`)

### Module Boundaries
- `app/api/v1`: Versioned API endpoints (e.g. `/api/v1/health`).
- `app/core`: Configuration settings via `pydantic-settings` (`config.py`) and auth dependency placeholder (`auth.py`).
- `app/db`: Database connection engine, session management, and Base models (`session.py`, `base.py`).
- `app/models`: SQLAlchemy ORM entity definitions (`base.py`).
- `app/schemas`: Pydantic input validation and response schemas (`health.py`).
- `app/providers`: Abstract `MarketDataProvider` base class (`base.py`).
- `app/analytics`: Directory structure for future quantitative computation engines (Pandas/NumPy/SciPy).
- `alembic`: Database migration environment and version scripts.

---

## 4. Generic Instrument Architecture

All analytics and data structures operate on the generic concept of an `Instrument`:

```typescript
export type AssetClass = 'EQUITY' | 'ETF' | 'INDEX' | 'CRYPTO';

export interface Instrument {
  id: string;
  ticker: string;
  name: string;
  assetClass: AssetClass;
  currency: Currency;
  exchange: string;
  isActive: boolean;
}
```

This guarantees that future modules can handle multi-asset quantitative research without refactoring core models.

---

## 5. Cross-Module State & Research Context Architecture (Step 22)

The application enforces a strict **State Ownership Model**:

```text
URL State (Query Params)  ──► Shareable / Bookmarkable Research Context (symbol, range, priceSource, etc.)
TanStack Query           ──► Server-Owned Data (market data, returns, volatility, backtests, reports)
Zustand                  ──► Local UI / Ephemeral State (sidebarCollapsed, commandPaletteOpen, tableDensity)
PostgreSQL Database       ──► Persistent Domain Entities (Instrument, Portfolio, Strategy, Signal, Backtest)
```

### Context Resolution Order
1. Explicit URL parameters (`?symbol=AAPL&range=5Y&priceSource=adjusted`)
2. Explicit user dropdown selection in `ResearchContextBar`
3. Existing local workspace preference
4. Safe module-specific default (e.g. `AAPL`, `1Y`, `ADJUSTED_CLOSE`)

### Routing & Context Helper Rules
- **Centralized Engine**: `frontend/src/lib/researchContext.ts` handles parsing (`parseResearchContext`), serialization (`serializeResearchContext`), validation (`validateResearchContext`), and URL building (`buildResearchUrl`).
- **Hook Layer**: `useResearchContext()` hook syncs React Router `useSearchParams` with typed `ResearchContext`.
- **Module Independence**: Context parameters are route/module-scoped; navigating between modules preserves active parameters without creating tight global store locks.

---

## 6. Real-Time & Latest Market Data Architecture (Step 23)

The latest market-data layer extends the historical foundation without replacing it:

```text
External Provider (e.g. Yahoo Finance)
                 │
                 ▼
Provider Adapter Interface (`app/providers/base.py`)
├── Capabilities (`ProviderCapabilities`: historical, latest, delayed, not real-time)
└── Latest Retrieval (`get_latest_ohlcv`, `get_latest_ohlcv_batch`)
                 │
                 ▼
MarketDataService (`app/services/market_data_service.py`)
├── Calendar-Aware Freshness Policy (`app/analytics/market_data/freshness_policy.py`)
│   └── CURRENT, RECENT, STALE, UNKNOWN, UNAVAILABLE
├── Database-First Cache (`market_data.ohlcv`)
│   └── Valid stored observations served immediately without network calls
├── Validation & Idempotent Persistence (`insert_bar_idempotent`)
└── Graceful Error Fallback (cached observation returned with diagnostic warning)
                 │
                 ▼
REST API (`/api/v1/market-data/latest`, `/latest/batch`, `/providers/capabilities`)
                 │
                 ▼
Frontend Workspace (`LatestMarketDataPanel.tsx`) & Unified Dashboard (`MarketDataSnapshotPanel.tsx`)
```


