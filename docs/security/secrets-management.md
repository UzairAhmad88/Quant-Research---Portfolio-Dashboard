# Secrets Management Policy

A zero-trust secrets policy protects credentials, database connections, and external API integrations.

---

## 1. Secrets Boundary & Rules

1. **No Secrets in Source Code**:
   - Never hardcode database passwords, JWT secrets, or provider API tokens in `.py`, `.ts`, or configuration files.
   - `.env` files containing live credentials must be in `.gitignore`.
2. **Sanitized Example Templates**:
   - Maintain `.env.example` in the repository root with placeholder variables only.
3. **Frontend Isolation**:
   - Any environment variable starting with `VITE_` is bundled into browser JavaScript.
   - Private credentials (database URLs, backend secret keys, provider access keys) must **NEVER** be prefixed with `VITE_` or exposed to Vite.
4. **Log Redaction**:
   - Request and response logging redacts sensitive headers: `Authorization`, `Cookie`, `X-API-Key`, `Set-Cookie`.
5. **Secret Rotation Procedure**:
   - In the event of suspected exposure, follow the 7-step incident guidance to immediately revoke, rotate, update, and audit.
