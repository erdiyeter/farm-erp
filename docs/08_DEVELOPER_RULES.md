# 08 - Developer Rules

## Purpose

This document defines development rules for Farm ERP.

The goal is to keep the project understandable, maintainable, and aligned with real operational needs.

---

## Current Project Status

Current phase:

```text
Post-MVP operational improvement and documentation alignment
```

MVP status:

```text
Completed
```

The main post-MVP operational modules are also implemented for the current scope.

Current priorities:

- Documentation alignment.
- Existing workflow improvements.
- Quality and verification improvements.
- Accurate Turkish UI terminology.

---

## Core Principle

```text
Build the simplest working solution first.
Improve it only when a real need appears.
```

---

## Architecture Rule

Current architecture:

```text
React/Vite frontend
  -> FastAPI backend
  -> PostgreSQL database
```

Do not introduce new infrastructure unless a real requirement proves it is needed.

Not current implementation:

- Redis.
- Celery.
- RabbitMQ.
- Kafka.
- Microservices.
- Event bus.
- CQRS.
- Event sourcing.
- GraphQL.
- Workflow engines.
- Offline sync.
- AI services.

---

## Database Rules

- Create tables only for implemented features.
- Avoid duplicate storage of the same business information.
- Keep business rules in backend services unless a database constraint already exists.
- Document any new table in `03_DATABASE_DESIGN.md`.

---

## API Rules

- Keep endpoints predictable.
- Keep request and response models simple.
- Preserve existing API behavior unless the task explicitly requires an API change.
- Document new or changed endpoints in `04_API_SPECIFICATION.md`.
- Use the standard error shape where practical:

```json
{
  "detail": "Message"
}
```

---

## Frontend Rules

- Reuse existing page, component, API, and i18n patterns.
- Keep operational usability ahead of visual decoration.
- Do not add a frontend state framework unless the current application clearly needs it.
- Document new pages or navigation behavior in `05_FRONTEND_GUIDE.md`.
- Use `docs/09_TURKISH_TERMINOLOGY_GLOSSARY.md` as the SSOT for Turkish UI terminology.

---

## Documentation Rules

- Documentation must match the implemented system.
- Prefer updating existing numbered docs instead of creating duplicates.
- Mark obsolete historical docs clearly.
- Do not document planned systems as current implementation.
- Future features must be clearly labeled as future work.

---

## Testing And Verification Rules

Use verification that matches the change.

Documentation-only changes:

```powershell
git diff --check
```

Frontend translation/UI changes commonly require:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run check:tr
```

Backend changes require relevant backend tests or API verification for the changed area.

Avoid running broad test suites unnecessarily when the change is documentation-only.

---

## Post-MVP Priority Order

Current priority order:

1. Documentation alignment.
2. Existing workflow improvements.
3. Quality and verification improvements.
4. Advanced reporting refinements.
5. Role permission refinements.
6. Future analytics.
7. AI features only after enough reliable data exists.

---

## Final Rule

When unsure, choose the simpler solution and keep the documentation honest about what is actually implemented.
