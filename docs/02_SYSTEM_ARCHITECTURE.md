# 02 - System Architecture

## Purpose

This document describes the current implemented architecture of Farm ERP.

The system is intentionally simple:

```text
React/Vite frontend
        |
        | HTTP / JSON
        v
FastAPI backend
        |
        | SQLAlchemy
        v
PostgreSQL database
```

No microservices, message queues, Redis, Celery, event bus, GraphQL layer, mobile backend, or AI service is part of the current implementation.

---

## Current Modules

Implemented application areas:

- Authentication and roles.
- Animals.
- Vaccinations.
- Milk records.
- Health records.
- Inventory items and movements.
- Finance records.
- Withdrawal locks.
- Alarms.
- Weight records.
- Reproduction events.
- Settings.
- Dashboard.
- Reports and CSV exports.

---

## Frontend

Technology:

- React.
- Vite.
- JavaScript.
- React Router.
- CSS.

Responsibilities:

- Render pages and navigation.
- Manage forms and local UI state.
- Call backend APIs.
- Store and send the JWT token.
- Display dashboard and report data.
- Display Turkish UI text through the existing i18n helper structure.

The frontend does not access the database directly.

Current i18n structure:

```text
frontend/src/i18n/index.js
frontend/src/i18n/tr/animals.js
frontend/src/i18n/tr/business.js
frontend/src/i18n/tr/dashboard.js
frontend/src/i18n/tr/operations.js
```

The Turkish terminology glossary remains the SSOT for UI wording.

---

## Backend

Technology:

- FastAPI.
- SQLAlchemy.
- Pydantic.
- JWT authentication.

Current backend structure:

```text
backend/app/main.py
backend/app/database.py
backend/app/models/
backend/app/repositories/
backend/app/routers/
backend/app/schemas/
backend/app/services/
```

Responsibilities:

- Define REST endpoints.
- Validate request and response data.
- Enforce authentication and role access.
- Apply business rules in services.
- Read and write PostgreSQL data through repositories and SQLAlchemy sessions.
- Calculate dashboard and report responses.
- Coordinate inventory movement creation when treatments consume inventory.
- Coordinate withdrawal lock and alarm behavior.

---

## Database

Technology:

- PostgreSQL.
- SQLAlchemy models.

Implemented tables:

- `users`
- `animals`
- `vaccinations`
- `milk_records`
- `health_records`
- `inventory_items`
- `inventory_movements`
- `financial_records`
- `withdrawal_locks`
- `alarms`
- `weight_records`
- `reproduction_events`
- `settings`

No separate reporting database exists. Dashboard and report data is calculated from operational tables.

---

## Authentication And Roles

Authentication uses JWT bearer tokens.

Implemented user roles are used by backend route dependencies and frontend navigation:

- `admin`
- `worker`
- `veterinarian`

The current role behavior is route-level access control. It is not a full configurable permissions system.

---

## Reporting

Reports are generated directly from operational data.

Implemented reporting includes:

- Summary endpoints.
- Detailed report endpoint.
- Date range filters.
- CSV exports for selected datasets.
- Dashboard report UI.

No background worker or reporting warehouse is used.

---

## Current Integration Points

Health and inventory:

```text
Treatment health record
        |
        v
Optional inventory item consumption
        |
        v
Inventory OUT movement and stock update
```

Health and withdrawal:

```text
Health record with withdrawal end date
        |
        v
Withdrawal tracking and related operational alerting
```

Dashboard and reports:

```text
Operational tables
        |
        v
Backend calculations
        |
        v
Dashboard / report views / CSV exports
```

---

## Outdated Statements Removed

Older documentation described weight tracking, growth metrics, reproduction tracking, and roles as future-only work. They are now implemented in the current codebase and are documented as current modules.

Older documentation also described the backend as a strict router-service-repository architecture. The current backend has routers, services, repositories, schemas, and models, but the documentation should not imply a more complex architecture than the code actually uses.

---

## Not Current Implementation

The following are not part of the current system:

- Redis.
- Celery.
- RabbitMQ.
- Kafka.
- Microservices.
- Event sourcing.
- CQRS.
- GraphQL.
- Offline sync.
- Mobile app.
- AI service.

They may be considered only as future work if a real requirement appears.
