# 01 - Development Roadmap

## Current Status

Project status: Post-MVP operational improvement and documentation alignment.

The MVP and the main post-MVP operational modules are implemented. Current work is focused on keeping documentation accurate, improving day-to-day usability, and making controlled refinements to the existing system.

This document describes the implemented roadmap state. Future work is listed only as future work.

---

## Development Principles

- Keep the architecture simple.
- Build working software first.
- Avoid speculative infrastructure.
- Add new capabilities only when there is a real operational need.
- Keep documentation synchronized with the implemented system.
- Use `docs/09_TURKISH_TERMINOLOGY_GLOSSARY.md` as the SSOT for Turkish UI terminology.

---

## Layer 1 - Core MVP

Status: Completed.

Implemented scope:

- Animal records: create, list, detail, edit, soft delete, statistics.
- Vaccination records and animal vaccination history.
- Milk production records and animal milk history.
- Basic dashboard metrics.
- FastAPI backend.
- PostgreSQL database.
- React/Vite frontend.
- REST API.

Layer 1 outcome: the system became usable for basic farm record management.

---

## Layer 2 - Operational System

Status: Completed for the current implemented scope.

Implemented modules:

- Authentication with JWT and role-based route protection.
- Animal management with operational fields, lifecycle exit fields, lactation fields, and economic values.
- Vaccination tracking.
- Milk production tracking.
- Health records for treatment, illness, checkup, and vaccination-type records.
- Inventory items and inventory movements.
- Health-to-inventory medicine consumption workflow.
- Finance records for income and expense.
- Withdrawal lock management.
- Alarm management.
- Weight records and growth-related reporting.
- Reproduction events for mating, pregnancy, and birth.
- Farm settings.
- Dashboard and reporting views.
- CSV report exports.
- Frontend Turkish translation cleanup and glossary-based terminology.

Layer 2 outcome: the system now supports practical daily farm operations beyond the original MVP.

---

## Current Phase

Status: Documentation refactor and alignment.

Current priority:

1. Keep documentation aligned with the real codebase.
2. Preserve the current simple architecture.
3. Improve existing workflows without changing APIs or business behavior unnecessarily.
4. Keep Turkish UI terminology consistent with the glossary.

---

## Completed Items That Were Previously Listed As Future Work

The following items are now implemented and should no longer be documented as future-only work:

- Weight tracking.
- Growth-related metrics in reporting/dashboard views.
- Reproduction event tracking.
- Basic role-based access behavior.
- Settings page and settings API.
- Decision-support style dashboard review sections based on existing operational data.

---

## Future Work

Future work must remain optional until there is a clear operational need.

Possible future enhancements:

- More detailed role and permission management.
- More advanced reporting filters.
- Better dashboard resilience and partial loading behavior.
- Additional animal analytics based on accumulated data.
- Hardware identification such as RFID, NFC, or QR.
- Mobile or offline support.
- AI-assisted analysis after enough reliable farm data exists.

Not current implementation:

- Redis.
- Celery.
- Microservices.
- Event systems.
- Offline sync.
- Mobile app.
- AI services.

---

## Long-Term Direction

Farm ERP should remain a practical farm management system that can gradually evolve into a decision-support platform while staying maintainable, understandable, and accurately documented.
