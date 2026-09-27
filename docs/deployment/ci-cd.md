# CI/CD Pipeline & Quality Gates

The automated CI/CD pipeline enforces all quality gates before code is eligible for container packaging or production release.

---

## 1. Pipeline Stages

```
GitHub Push / PR
        │
        ├──► [ Job 1: Backend Quality Gate ]
        │         ├── Python 3.11 Environment Setup
        │         ├── Unit & Property Tests (Pytest + Hypothesis)
        │         ├── Database Integrity Tests
        │         └── Security Hardening Test Suite (17 invariants)
        │
        ├──► [ Job 2: Frontend Quality Gate ]
        │         ├── Node.js 20 Setup & npm ci
        │         ├── TypeScript Strict Typecheck (tsc --noEmit)
        │         ├── Vitest Component & Workflow Tests
        │         └── Production Static Bundle Build (Vite)
        │
        └──► [ Job 3: Docker Container Build ] (Requires Job 1 & 2)
                  ├── Backend Container Multi-Stage Build
                  └── Frontend Static Nginx Container Build
```

---

## 2. Configuration Location

The production GitHub Actions workflow is defined in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml).
