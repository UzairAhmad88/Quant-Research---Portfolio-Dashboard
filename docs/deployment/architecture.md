# Deployment Architecture

The **Quant Research Dashboard** employs a clean, containerized, three-tier architecture optimized for quantitative research predictability, horizontal API scalability, and isolated persistence.

---

## 1. Deployment Topology

```
                       [ Internet Clients / Quant Analysts ]
                                         │
                                         ▼ (HTTPS / TLS 1.3)
                         [ Reverse Proxy (Nginx / ALB) ]
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼ (Static / SPA)                                ▼ (Proxy /api/*)
     [ Frontend Container ]                             [ FastAPI ASGI Backend ]
     (Nginx Alpine + Built Dist)                         (Gunicorn + Uvicorn Workers)
                                                                 │
                                                                 ▼ (PostgreSQL Wire Protocol + TLS)
                                                       [ PostgreSQL Database ]
                                                       (Multi-Schema: core, market_data,
                                                        strategy, backtesting)
                                                                 │
                                                                 ▼ (Outbound HTTPS)
                                                      [ External Market Data ]
                                                      (Yahoo Finance Adapter)
```

---

## 2. Component Specifications

| Tier | Technology | Runtime Role | Resource Allocation |
| :--- | :--- | :--- | :--- |
| **Edge / Proxy** | Nginx Alpine | TLS termination, gzip compression, request routing, rate limiting proxy | 1 CPU, 256MB RAM |
| **Frontend** | React 19 + Vite Dist | Pre-compiled static single-page application with SPA route fallback | 1 CPU, 512MB RAM |
| **API Backend** | FastAPI + Python 3.11 | High-throughput quantitative computation engine & data access | 2 CPUs, 2GB RAM |
| **Persistence** | PostgreSQL 16 | Relational store with ACID transactions & connection pooling | 2 CPUs, 2GB RAM |
