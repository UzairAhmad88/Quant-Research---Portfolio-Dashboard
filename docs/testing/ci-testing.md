# Continuous Integration (CI) Testing & Quality Gates

## 1. CI Pipeline Architecture

Our Continuous Integration architecture enforces automated verification on every commit and pull request. The pipeline is designed to execute rapidly without external network flakiness.

```text
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Lint & Type │ ──> │ Backend Test │ ──> │ Frontend Test│ ──> Quality Gate
│    Checks    │     │ & Coverage   │     │ & E2E Suite  │     (Pass / Reject)
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## 2. Pipeline Execution Stages

### Stage 1: Static Analysis & Type Checking
- **Backend**: `ruff check .` and `mypy app`
- **Frontend**: `npm run lint` and `tsc -b`

### Stage 2: Backend Financial & Integration Tests
- Executes full pytest suite including Hypothesis property-based invariants and mock provider tests:
  ```bash
  pytest backend/tests/ --cov=backend/app --cov-report=term-missing --cov-fail-under=80
  ```

### Stage 3: Frontend Component & Page Tests
- Executes Vitest unit and workflow tests with coverage verification:
  ```bash
  npm run test:coverage
  ```

### Stage 4: Playwright E2E Workflows
- Executes mocked headless browser testing:
  ```bash
  npm run test:e2e
  ```

---

## 3. Quality Gate Thresholds

The CI build automatically halts and marks the pull request as failing if:
1. Any test in the backend or frontend fails.
2. Code coverage falls below **80% overall**, or below **90% on critical financial analytics**.
3. Any financial accounting identity fails ($V \ne C + \sum P_i$ or $DD > 0$).
4. Any execution timing test detects look-ahead bias (fills prior to $t+1$ Open).
5. Any unhandled external network call is attempted during test execution.

---

## 4. Local Reproduction Commands

Developers can run the complete quality pipeline locally prior to committing:

```bash
# 1. Backend tests with coverage
cd backend
pytest --cov=app --cov-report=term-missing

# 2. Frontend tests with coverage
cd ../frontend
npm test
npm run test:coverage

# 3. Type check & build verification
npm run build
```
