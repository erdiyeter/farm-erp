# Farm ERP - Current Project Status

## Project State

- **MVP:** Completed.
- **Post-MVP operational enhancements:** Completed through Sprint 56.
- **Current focus:** Stabilization and separately approved future work.
- **Layer 3 decision-support features:** Planned, not started.

This file is the canonical live status. Technical details are maintained in `README.md`; future direction is maintained in `notes/00_Project/Roadmap.md`.

## Implemented System

### Core Modules

- Animals: CRUD, soft delete, statistics, detail/edit pages, and operational profile.
- Milk Records: create/list flows, animal history, and dashboard totals.
- Vaccinations: create/list flows and animal history.
- Inventory: item CRUD, movement history, stock calculation, and low-stock visibility.
- Finance: income/expense CRUD and soft deletion.
- Health Records: CRUD for treatment, illness, checkup, and vaccination records.
- Withdrawal Locks: CRUD, active tracking, dashboard data, and soft deletion.
- Alarms: CRUD, filters, dashboard data, and automatic withdrawal-lock alarms.
- Settings: singleton farm/application settings.

### Operational Integrations

- Animal Detail composes recent milk and health records, active withdrawal locks, associated alarms, and summary values.
- Treatment health records can optionally consume an inventory item through an atomic Inventory OUT movement with stock validation.

### Dashboard and Reporting

- Operational KPI cards and recent records.
- Reporting summaries and detail tables.
- Date filters and Today, Last 7 Days, Last 30 Days, and This Month presets.
- Authenticated CSV exports for Animals, Milk, Health, and Withdrawal Locks.

### Authentication and Authorization

- JWT login, logout, local token persistence, and current-user response.
- Default development administrator created by database initialization.
- Fixed roles: `admin`, `worker`, and `veterinarian`.
- Backend role dependencies return HTTP 403 for unauthorized authenticated access.
- Admin has full access; veterinarian and worker access follows the documented module assignments in `README.md`.
- No user-management or role-management UI exists.

### Quality

- Pytest foundation uses PostgreSQL rollback-only transaction isolation.
- Sixty-five backend tests cover critical happy and failure paths across Animals, Authentication, Authorization, Health, Inventory, Withdrawal Locks, Alarms, and Reporting.
- Backend compilation and frontend lint/build commands are documented in `README.md`.

## Architecture

- React with Vite.
- FastAPI layered monolith.
- PostgreSQL through SQLAlchemy.
- REST API under `/api/v1`.
- No Redis, Celery, message broker, background worker, microservice, or cache layer.

## Documentation Status

Sprint 56 aligned the roadmap, architecture decisions, database design, API specification, frontend guide, local deployment guide, technical debt, and project status.

- `README.md`: canonical technical reference.
- `PROJECT_STATUS.md`: canonical live status.
- `notes/00_Project/Roadmap.md`: planned work only.
- Sprint/module notes: historical records.
- `notes/00_Project/Project_Status_2026_06_21.md`: dated historical snapshot.

## Open Technical Debt

- Low-priority legacy CSS cleanup remains documented in `notes/04_Technical_Debt/Technical_Debt.md`.

No blocking issue is currently recorded.
