# Farm ERP Roadmap

`PROJECT_STATUS.md` is the source of truth for completed work. This document contains planned direction only.

## Completed Baseline

- MVP modules, reporting, settings, and JWT authentication.
- Detailed animal operational profile.
- Inventory and health treatment integration.
- User roles and role-based endpoint authorization.
- PostgreSQL rollback-based backend test infrastructure and expanded coverage.
- Sprint 56 documentation alignment.

## Current Phase

Post-MVP operational stabilization is complete through the documentation refactor. New work should remain small, testable, and consistent with the existing monolith.

## Planned Layer 3

Layer 3 remains planned and has not started.

- Mastitis risk scoring.
- Milk yield prediction.
- Golden List and Black List.
- AI assistant.
- RFID, NFC, or QR integration.
- Offline support.
- Mobile application.

Breeding management also remains a previously planned future module and has not started.

Each item requires a separately approved sprint. This roadmap does not define implementation architecture or commit the project to all items.

## Explicitly Not Planned Now

- Microservices or event-driven architecture.
- Redis, Celery, message queues, or background workers.
- Multiple databases or speculative infrastructure.
- Advanced permission matrices beyond the current three roles.
