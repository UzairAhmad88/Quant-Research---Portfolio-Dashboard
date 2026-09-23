# Development Documentation — Quant Research Dashboard

Guidelines and coding standards for developing within the Quant Research Dashboard codebase.

---

## 1. Coding Principles

1. **Institutional Aesthetics**:
   - Primary dark theme: `#0B1220` main background, `#151F2E` cards, `#263244` borders.
   - Use Inter for UI typography, JetBrains Mono for financial metrics/tickers/percentages.
   - Green (`#22C55E`) and Red (`#EF4444`) are reserved strictly for financial meaning.

2. **Strict TypeScript & Python Type Safety**:
   - Avoid `any` in TypeScript.
   - Use Pydantic schemas for all API requests/responses in Python.
   - Use explicit return types for services and helper functions.

3. **No Fabricated Financial Metrics**:
   - Never populate cards with fake/simulated numbers.
   - When a module is scaffolded, render a clean placeholder showing its purpose and target status.

---

## 2. Directory Structure Conventions

```text
quant-research-dashboard/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── lib/
│   │   ├── types/
│   │   └── styles/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── providers/
│   ├── alembic/
│   └── tests/
├── docs/
├── docker-compose.yml
└── README.md
```

---

## 3. Running Verification Commands

### Frontend Build & Typecheck
```bash
cd frontend
npm run build
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Backend Pytest Suite
```bash
cd backend
python -m pytest
```

---

## 4. Environment Variables

Create `.env` based on `.env.example`:

```ini
DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/quant_dashboard
MARKET_DATA_API_KEY=
MARKET_DATA_BASE_URL=
CORS_ORIGINS=["http://localhost:5173"]
ENVIRONMENT=development
```
