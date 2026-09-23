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
