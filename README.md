# Codebase Audit Report

Date: 2026-02-27  
Scope: Entire workspace at `/home/savvy/mini-project/2nd-round/file share with zero trust`  
Projects reviewed:
- Flask app: `app/` + `run.py`
- FastAPI Clean Architecture app: `task-platform-backend/`

## Executive Summary

I found **12 actionable issues**:
- **2 Critical**
- **4 High**
- **4 Medium**
- **2 Low**

Most severe risks are in `task-platform-backend/` (privilege escalation + insecure JWT default secret) and operational resilience gaps around Redis dependency handling.

## Method Used

- Static scan with `rg` for security/quality anti-patterns.
- Focused manual review of auth, middleware, routing, models, caching, and config.
- Test execution attempts:
  - `pytest -q` (workspace root) -> collection errors
  - `pytest -q` (`task-platform-backend/`) -> missing dependency/import/env issues

## Findings

## Critical

1. **Self-service admin privilege escalation during registration**  
   - File: `task-platform-backend/src/presentation/schemas/auth.py:7`, `task-platform-backend/src/application/use_cases/auth_use_cases.py:19-27`  
   - Evidence: Registration schema permits `role` pattern `^(admin|user)$` and use case persists caller-supplied role directly.
   - Impact: Any unauthenticated caller can register an admin account.
   - Recommendation: Remove `role` from public registration request; force role=`user` in use case; create admin users only via protected admin workflow/seeding.

2. **Insecure default JWT secret in production path**  
   - File: `task-platform-backend/src/shared/config.py:16`  
   - Evidence: `jwt_secret_key` defaults to `"change-me-in-production"` and app starts even if env secret is missing.
   - Impact: Predictable signing key allows token forgery if not overridden.
   - Recommendation: Fail fast when JWT secret is unset/weak (minimum length + entropy checks).

## High

3. **Redis outage can bypass token revocation checks (fail-open auth)**  
   - File: `app/__init__.py:80-87`, `app/middleware/zero_trust.py:422-439`  
   - Evidence: Blocklist checks return allow when Redis errors occur.
   - Impact: Revoked tokens may continue to work during Redis outages.
   - Recommendation: Prefer fail-closed for privileged/sensitive routes or introduce degraded mode policy (strict for admin/file ops, fail-open only for low-risk endpoints).

4. **Task API middleware hard-fails when Redis is unavailable**  
   - File: `task-platform-backend/src/infrastructure/rate_limit/middleware.py:15-18`  
   - Evidence: `incr/expire` calls have no exception handling.
   - Impact: Redis outage can convert most requests into 500 errors (availability incident).
   - Recommendation: Add try/except with safe fallback, circuit breaker, and metric/alerting.

5. **Task use-cases hard-depend on Redis cache without fallback**  
   - File: `task-platform-backend/src/application/use_cases/task_use_cases.py:14,18,41,85,96`  
   - Evidence: Direct cache operations without exception handling.
   - Impact: Redis instability causes task CRUD/read failures.
   - Recommendation: Treat cache as optional (best-effort read/write), never block core DB flow.

6. **Environment loading is brittle in monorepo context**  
   - File: `task-platform-backend/src/shared/config.py:24`  
   - Evidence: `env_file=".env"` from current working dir + strict settings behavior caused runtime validation errors from unrelated Flask `.env` keys during test run.
   - Impact: Boot/test failures depending on execution directory.
   - Recommendation: Load env file relative to service root, set `extra="ignore"` for unrelated env keys, and isolate service execution context.

## Medium

7. **Rate-limit keying trusts unvalidated `X-Forwarded-For`**  
   - File: `app/middleware/rate_limiter.py:18-22`  
   - Evidence: Client IP is taken directly from request header.
   - Impact: Attackers can spoof IP to evade per-IP limits unless upstream strips/sets header.
   - Recommendation: Trust forwarded headers only behind known proxy chain; otherwise use `remote_addr`.

8. **Admin audit-log filter can 500 on invalid UUID input**  
   - File: `app/admin/routes.py:291-293`  
   - Evidence: `uuid.UUID(user_id)` without input validation/exception handling.
   - Impact: Invalid query value causes unhandled exception -> 500.
   - Recommendation: Catch `ValueError` and return 400.

9. **Stored XSS risk in admin user table**  
   - File: `app/static/js/app.js:816`  
   - Evidence: `u.department` rendered into `innerHTML` without escaping.
   - Impact: Malicious stored department value can execute script in admin browser.
   - Recommendation: Escape dynamic values (`escapeHtml`) or render via DOM text nodes.

10. **Stored XSS risk in policy table JSON rendering**  
   - File: `app/static/js/app.js:917-918`  
   - Evidence: `JSON.stringify(...)` output is inserted into `innerHTML` unsanitized.
   - Impact: Crafted policy attributes can inject executable markup.
   - Recommendation: Escape JSON output before insertion or render with `textContent`.

## Low

11. **`/health` endpoint can return 500 when Redis is down**  
   - File: `task-platform-backend/src/main.py:59-62`  
   - Evidence: `await redis_client.ping()` without exception handling.
   - Impact: Health checks may flap and trigger restarts during transient Redis issues.
   - Recommendation: Return degraded health payload instead of throwing.

12. **Repository hygiene issue: accidental brace-named directories**  
   - Path examples under `task-platform-backend/src/`:  
     - `./{domain,application,infrastructure,presentation`  
     - `./application/{dto,use_cases,ports}`  
   - Evidence: Non-standard directories detected by `find`.
   - Impact: Confusing imports/tooling, packaging risk.
   - Recommendation: Remove accidental directories/files and enforce scaffolding checks.

## Test/CI Observations

- Root test execution currently not reliable from workspace root:
  - Missing module path setup for `app` tests (no `tests/conftest.py` at root to set `PYTHONPATH` consistently).
  - Missing package dependency in active environment for `flask_jwt_extended` / `jose` during attempted runs.
- `task-platform-backend` tests depend on isolated env and expected dependency set from its own `requirements.txt`.

## Priority Fix Plan

1. Block privilege escalation (`register` role control) and enforce strong JWT secret requirements.
2. Add Redis fault-tolerance policy across rate limiter, auth revocation checks, and task caching paths.
3. Patch admin UI XSS vectors and add regression tests for escaped rendering.
4. Harden input validation (`user_id` query parsing), proxy-aware rate limiting, and health endpoint degradation behavior.
5. Clean repository structure and align test bootstrapping for monorepo execution.
