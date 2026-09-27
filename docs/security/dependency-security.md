# Dependency Security & Supply-Chain Governance

A pinned, reproducible dependency strategy prevents supply-chain compromise and abandoned package risks.

---

## 1. Package Pinning & Lockfiles

- **Backend**: Python dependencies in `backend/requirements.txt` are version-pinned. Production and development requirements are segregated.
- **Frontend**: `frontend/package-lock.json` is committed and enforced via `npm ci` in continuous integration.

---

## 2. Dependency Audit Workflow

- **Frontend Audit**:
  ```bash
  cd frontend
  npm audit
  ```
- **Backend Audit**:
  Use `pip-audit` or `safety` to inspect requirements for known CVEs:
  ```bash
  pip-audit -r backend/requirements.txt
  ```

---

## 3. Dependency Selection Policy

- Standard libraries and established, actively maintained packages (`numpy`, `scipy`, `pandas`, `fastapi`, `sqlalchemy`, `pydantic`) are preferred.
- Micro-packages and unverified dependencies with custom install scripts are rejected.
