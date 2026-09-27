# Security Threat Model

A practical, asset-driven threat model for the **Quant Research Dashboard**.

---

## 1. Protected Assets

| Asset | Sensitivity | Integrity Importance | Impact of Compromise |
| :--- | :--- | :--- | :--- |
| **Market Data (OHLCV)** | Low / Public | Critical | Bad research decisions, faulty signals, corrupted backtests |
| **Portfolio Data & Holdings** | High (Proprietary) | High | Exposure of research strategy and positions |
| **Strategy Configurations & Signals** | High (IP) | Critical | Strategy theft or execution of poisoned trade signals |
| **Backtest Results & Analytics** | Medium | High | Tampered performance metrics, misleading Sharpe/Drawdowns |
| **Database Credentials** | Critical | Critical | Full system database compromise |
| **Provider Credentials / Keys** | Critical | Critical | External account hijacking, billing exhaustion, quota denial |
| **Application Secret Key** | Critical | Critical | Session/token forgery when authentication is active |

---

## 2. Threat Sources & Mitigations

| Threat | Attack Surface | Vulnerability / Attack Vector | Mitigation Applied | Residual Risk |
| :--- | :--- | :--- | :--- | :--- |
| **SQL Injection** | Search, filters, pagination, sort keys | Malicious strings (`' OR 1=1; --`) | 100% SQLAlchemy parameterized queries, allowlisted sort columns | Extremely Low |
| **Cross-Site Scripting (XSS)** | React DOM, symbol displays, error messages | Injected script tags via untrusted inputs | React default HTML escaping, no `dangerouslySetInnerHTML`, Strict CSP headers | Low |
| **Server-Side Request Forgery (SSRF)** | Market data fetching endpoints | User supplying arbitrary URLs to probe internal metadata | Strict provider allowlist (`ALLOWED_PROVIDERS`), rejection of raw URL inputs | Negligible |
| **Path Traversal / Export Tampering** | Export endpoints, file downloads | Malicious filenames (`../../etc/passwd`) | Strict `sanitize_filename` stripping null bytes, dots, and path separators | Negligible |
| **CSV Formula Injection** | CSV export files opened in Excel/Sheets | Formulas beginning with `=`, `+`, `-`, `@`, `\t` | Formula prefix shielding (single-quote prepending on textual cells) | Negligible |
| **Denial of Service / Resource Exhaustion** | Heavy calculation endpoints (Correlation, Volatility, Backtest) | Massive date ranges, 100+ correlation assets, extreme rolling windows | Enforced limits: max 20 correlation instruments, window $\in [2, 500]$, max 35-year range, sliding-window rate limiting | Low (High compute workloads still scale with observations) |
| **Credential & Secret Leakage** | Logs, git repositories, frontend bundles | Committing `.env` or logging authorization tokens | Redaction middleware, clean `.env.example`, no private keys in `VITE_*` | Low |
| **Provider Data Poisoning** | External provider API responses | Malformed OHLC, zero prices, negative volume, stale timestamps | Multi-tier Market Data Validation pipeline, provenance tracking | Low (Upstream provider downtime still handled via retry/cache fallback) |
