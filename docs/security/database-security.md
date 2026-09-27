# Database Security & Data Integrity

The PostgreSQL database layer ensures isolation, transaction safety, and SQL injection immunity.

---

## 1. SQL Injection Protection

- **100% Parameterized Access**: All queries utilize SQLAlchemy ORM with typed column mappings. Raw SQL interpolation (`f"SELECT * FROM ... {user_input}"`) is prohibited.
- **Dynamic Sort/Filter Whitelisting**: Sorting and filtering parameters are matched against static allowlists (`timestamp`, `symbol`, `name`, `created_at`). Unrecognized column keys are rejected.

---

## 2. Least Privilege Database User

Production deployments should configure two distinct database roles:

1. **Migration Role (`quant_migrator`)**:
   - Authorized to execute DDL migrations via Alembic (`CREATE`, `ALTER`, `DROP` in `core` schema).
   - Used only during deployment / migration tasks.
2. **Application Runtime Role (`quant_app`)**:
   - Granted DML only: `SELECT`, `INSERT`, `UPDATE`, `DELETE` on tables in schema `core`.
   - Explicitly denied DDL and superuser permissions.

---

## 3. Network & Deployment Security

- Direct exposure of port 5432 to the public internet is prohibited.
- Enable TLS connection enforcement (`sslmode=require` or `sslmode=verify-full`).
- PostgreSQL connections should be restricted to the internal application subnet or Docker bridge network.
