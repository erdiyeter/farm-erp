# Codex Execution Rules

## Mandatory References

Read before implementation:

- AGENTS.md
- PROJECT_STATUS.md
- CODEX_RULES.md

Use them as the source of truth.

---

## Scope Control

- Implement only the requested sprint scope.
- No extra features.
- No speculative development.
- No architecture changes without request.
- No roadmap deviations unless explicitly requested.

---

## Token Efficiency

- Do not perform full-project analysis.
- Do not review unrelated modules.
- Use existing documentation as source of truth.
- Inspect only files related to the sprint.
- Run only targeted verification.
- Avoid project-wide test runs unless required.
- Keep implementation reports concise.

---

## Architecture Rules

Preserve:

React → FastAPI → PostgreSQL

Do not introduce:

- Redis
- Celery
- Kafka
- RabbitMQ
- GraphQL
- WebSockets
- Microservices
- Event-driven architecture
- Background workers

unless explicitly requested.

---

## Development Rules

- Prefer the simplest working solution.
- Follow YAGNI.
- Reuse existing code patterns.
- Preserve existing APIs unless sprint requires change.
- Preserve existing database structures unless sprint requires change.
- Avoid unnecessary refactors.
- Minimize file modifications.

---

## Sprint Packaging

When multiple consecutive roadmap items are low-risk and closely related:

- Prefer implementing them as a single sprint package.
- Avoid unnecessary sprint fragmentation.
- Preserve roadmap order.

---

## Verification Rules

Backend changes:

- Run backend compilation.
- Run only affected backend verification.

Frontend changes:

- Run frontend lint.
- Run frontend build.
- Run only affected frontend verification.

Do not run unrelated tests.

---

## Sprint Output

Provide only:

- Files created
- Files modified
- Verification results
- Build/test results
- Short summary

Do not generate long implementation reports.