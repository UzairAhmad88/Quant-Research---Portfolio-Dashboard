---
name: supabase-management
description: Manage Supabase PostgreSQL migrations, database pooling, connection strings, and client configurations for Quant Research Dashboard.
---

# Supabase Integration for Quant Research Dashboard

This skill provides operational patterns for connecting and maintaining the **Quant Research Dashboard** on **Supabase**.

## Architecture & Connection Strategy

1. **Transaction Pooler (Port 6543)** - Recommended for Serverless & Vercel:
   ```env
   DATABASE_URL=postgresql+psycopg://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require
   ```
2. **Session Pooler / Direct Connection (Port 5432)** - For Migrations & Standalone Servers:
   ```env
   DATABASE_URL=postgresql+psycopg://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?sslmode=require
   ```

## Key Configuration Variables
- `SUPABASE_URL`: `https://[project-ref].supabase.co`
- `SUPABASE_ANON_KEY`: Public client anon key for frontend queries
- `SUPABASE_SERVICE_ROLE_KEY`: Admin service role key for backend elevated operations
- `DATABASE_URL`: SQLAlchemy connection string with `postgresql+psycopg` driver

## Running Migrations on Supabase
```bash
# Run Alembic migrations against Supabase
DATABASE_URL="postgresql+psycopg://..." alembic upgrade head
```
