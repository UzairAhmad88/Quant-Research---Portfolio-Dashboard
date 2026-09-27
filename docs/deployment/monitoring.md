# Operational Monitoring & Observability

Observability guidelines covering application health, performance metrics, and log aggregation.

---

## 1. Core Health Signals

| Signal | Endpoint / Method | Healthy State | Alert Condition |
| :--- | :--- | :--- | :--- |
| **API Liveness** | `GET /health` | HTTP 200 `status: ok` | Status $\ne 200$ for $> 30$ seconds |
| **Database Readiness** | `GET /health/ready` | HTTP 200 `database: connected` | HTTP 503 or latency $> 500\text{ms}$ |
| **Request Latency** | HTTP Access Logs | P95 $< 100\text{ms}$ (analytics $< 250\text{ms}$) | P95 $> 1000\text{ms}$ sustained |
| **Error Rate** | Structured Logs (`status >= 500`) | $< 0.1\%$ of total requests | $> 1\%$ 5xx errors over 5-minute window |
| **Database Connections** | PostgreSQL pg_stat_activity | $< 80\%$ pool capacity | Active connections $> 45$ (pool limit: 50) |

---

## 2. Structured Log Format

All backend requests log structured JSON/correlated text:
```
INFO  quant_api:middleware.py method=GET path=/api/v1/returns status=200 duration=4.12ms req_id=7a35607b-8919-4cb5-aebe-99222c36ca2b
```
Sensitive headers (`Authorization`, `Cookie`, `X-API-Key`) and secret keys are automatically redacted.
