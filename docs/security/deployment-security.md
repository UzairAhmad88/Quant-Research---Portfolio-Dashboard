# Deployment Security & Incident Response

Guidelines for secure production deployment, environment hardening, and incident response procedures.

---

## 1. Production Deployment Checklist

- [ ] `APP_ENV=production` is set in the runtime environment.
- [ ] `DEBUG=false` is enforced.
- [ ] `SECRET_KEY` is set to a cryptographically secure random value (not the default dev key).
- [ ] `CORS_ORIGINS` is configured with explicit authorized domain origins (no `*`).
- [ ] Database credentials use a dedicated non-superuser role (`quant_app`) over TLS.
- [ ] Direct internet access to PostgreSQL port 5432 is disabled.
- [ ] Reverse proxy (Nginx / Cloudflare / AWS ALB) terminates TLS and enforces HTTPS.
- [ ] All `.env` files are excluded from container images and source control.

---

## 2. Security Incident Guidance

### Procedure A: Compromised Credential or Secret Key
1. **Revoke & Rotate**: Immediately revoke the exposed token or generate a new `SECRET_KEY` / database password.
2. **Identify Affected Systems**: Determine which services or environments had access to the compromised secret.
3. **Review Access Logs**: Query request logs for the specific timeframe and IP patterns associated with the key.
4. **Update Secret**: Deploy updated secrets using secure environment injection or secret manager.
5. **Retest & Verify**: Confirm service operations and verify no unauthorized requests succeed.
6. **Post-Mortem**: Document root cause, exposure window, and preventative improvements.

### Procedure B: Data Poisoning or Corrupted Ingestion
1. **Halt Affected Ingestion**: Temporarily disable provider ingestion tasks.
2. **Isolate Invalid Records**: Identify corrupted OHLCV bars using data quality queries.
3. **Verify Provenance**: Trace provider logs to verify if upstream provider returned bad data.
4. **Restore / Reprocess**: Purge bad bars and re-ingest clean historical data from trusted source.
5. **Resume**: Re-enable scheduled ingestion with verified monitoring.
