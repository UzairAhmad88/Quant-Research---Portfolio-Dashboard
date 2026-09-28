# Quant Research Workstation — System Architecture

## Overview

The **Quant Research Workstation** is an institutional quantitative finance and portfolio research environment built with **FastAPI**, **React (TypeScript)**, **PostgreSQL / SQLite**, and **SciPy / NumPy / Pandas**.

---

## 1. End-to-End Quantitative Pipeline

```text
REAL MARKET DATA (Yahoo Finance REST / WebSocket Stream)
       ↓
DATA VALIDATION (OHLCV High-Low bounds, zero volumes, timestamp gaps)
       ↓
NORMALIZATION (Split & dividend proportion adjustments)
       ↓
FEATURE ENGINE (Momentum, Trend, Volatility, Volume factors)
       ↓
ANALYTICS (CAGR, Rolling Volatility, Correlation Matrix, Beta)
       ↓
STRATEGY ENGINE (Deterministic signal generation without lookahead bias)
       ↓
PORTFOLIO & RISK ENGINE (Mark-to-Market, VaR, CVaR, Sortino, MCR)
       ↓
BACKTEST & SIMULATION (Execution lag, commission, slippage, Monte Carlo)
       ↓
RESEARCH REPRODUCIBILITY (Fingerprints, Lineage, Experiment Tracker)
```

---

## 2. Technology Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy ORM, Pandas, NumPy, SciPy, Uvicorn, WebSockets.
- **Frontend**: React 18, TypeScript, Tailwind CSS, TanStack React Query, Lucide Icons, Vite.
- **Database**: PostgreSQL (Supabase pooler on port 6543 / 5432) with local SQLite compatibility (`/tmp` writable layer for serverless execution).
- **Deployment**: Vercel Serverless full-stack architecture with proxy routing.
