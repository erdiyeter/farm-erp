# Farm ERP MVP Rules

## Purpose

This document defines the boundaries of the Farm ERP MVP.

All development decisions should respect these rules unless a deliberate architecture change is approved and documented.

---

## MVP First

Rules:

- Build the simplest working solution.
- Avoid premature optimization.
- Avoid enterprise-level complexity.
- Deliver working features before advanced features.

---

## Architecture

Current architecture:

Frontend
→ React (Vite)

Backend
→ FastAPI

Database
→ PostgreSQL

This architecture should remain stable during MVP development.

---

## Forbidden During MVP

Do not introduce:

- Microservices
- Event-driven architecture
- Message queues
- Redis
- Celery
- Kubernetes
- GraphQL
- Multiple databases

Unless there is a documented architecture decision.

---

## Database Rules

Rules:

- PostgreSQL is the single source of truth.
- Use soft delete when appropriate.
- Keep schemas simple.
- Avoid unnecessary tables.
- Avoid unnecessary relationships.

---

## Backend Rules

Rules:

- Follow the existing layer structure.

Model
→ Repository
→ Service
→ Router

- Business logic belongs in services.
- Routers should remain thin.
- Repositories should handle database access only.

---

## Frontend Rules

Rules:

- Keep UI simple.
- Prefer functional components.
- Avoid unnecessary state management libraries.
- Use API clients for backend communication.
- Prioritize usability over visual complexity.

---

## Development Rules

Rules:

- Finish one feature before starting another.
- Validate functionality before moving forward.
- Keep documentation synchronized when necessary.
- Avoid large uncontrolled refactors.

---

## AI Usage Rules

AI tools may assist development.

Examples:

- ChatGPT
- Codex

AI-generated code must:

- Respect project architecture.
- Respect MVP scope.
- Avoid introducing new technologies without approval.

---

## Current MVP Modules

Active:

- Animals
- Inventory
- Finance

Planned:

- Breeding
- Health

Future:

- Reporting
- Analytics
- Advanced dashboards

---

## Decision Rule

When unsure:

Choose the simpler solution that fits the current MVP.