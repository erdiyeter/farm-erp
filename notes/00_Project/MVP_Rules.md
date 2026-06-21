# Farm ERP MVP Rules - Historical Baseline

**Status:** MVP completed. This document is retained to explain the constraints used during MVP delivery.

Active engineering rules now live in `AGENTS.md` and `CODEX_RULES.md`. When this historical file conflicts with them, the active rules take precedence.

## Baseline Principles Still Preserved

- Prefer the simplest working solution and follow YAGNI.
- Keep React -> FastAPI -> PostgreSQL.
- Keep the backend layered as model -> repository -> service -> router.
- Keep PostgreSQL as the single source of truth.
- Avoid microservices, event systems, queues, Redis, Celery, GraphQL, and unnecessary infrastructure.
- Keep frontend state and styling simple and reuse existing patterns.

## Obsolete MVP Statements

Earlier versions listed only Animals, Inventory, and Finance as active and described Health and Reporting as future work. Those statements are obsolete: all current modules are listed in `PROJECT_STATUS.md`.

The original "during MVP development" wording is also historical. The same simplicity constraints remain active in the post-MVP phase through `AGENTS.md`.
