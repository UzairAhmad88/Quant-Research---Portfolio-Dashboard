# Deployment, Infrastructure & Production Configuration

## 1. Overview
The Quant Research Workstation is designed for multi-tier deployment across modern cloud platforms (Vercel, AWS, Render, Railway, Fly.io) with dual-mode database support:
- **Production Tier**: Supabase PostgreSQL with PgBouncer session/transaction connection pooling.
- **Serverless / Local Fallback**: SQLite stored in `/tmp/quant_research.db` or local environment.

## 2. Environment Configuration
The application reads settings strictly from environment variables:
```bash
# Database Configuration
DATABASE_URL=postgresql://postgres.xxx:xxx@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Serverless & Deployment Mode
IS_VERCEL=true
ENVIRONMENT=production

# Market Data Providers
YAHOO_FINANCE_ENABLED=true
TWELVE_DATA_API_KEY=optional_api_key

# WebSocket Server
WS_HOST=0.0.0.0
WS_PORT=8000
```

## 3. Vercel Monorepo Serverless Deployment (`vercel.json`)
The frontend is built using Vite to produce an optimized Single Page Application (SPA), while the FastAPI backend runs as serverless functions:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **API Rewrites**: All `/api/*` and `/ws/*` requests route seamlessly to backend handlers without CORS issues.

## 4. Health Checks & Telemetry
- `GET /health`: Returns application status, database connectivity, market data engine readiness, and system uptime.
- `GET /api/v1/workstation/system-health`: Comprehensive diagnostics across API, Database, Market Data, WebSocket, and Cache subsystems.
