# Farm ERP

Farm ERP is a monolithic farm-management application built with React, FastAPI, and PostgreSQL. The MVP is complete; current work focuses on small operational improvements, authorization, quality, and documentation.

## Documentation Sources

- `AGENTS.md`: mandatory engineering and scope rules.
- `PROJECT_STATUS.md`: canonical current project status.
- `CODEX_RULES.md`: execution and verification rules.
- `notes/00_Project/Roadmap.md`: planned work only.
- This file: canonical technical reference and local deployment guide.
- Sprint and module notes: historical implementation records, not current specifications.

When documents conflict, use the order above.

## Architecture

```text
React (Vite) -> FastAPI -> PostgreSQL
```

- One repository and one deployable application stack.
- Backend layers: model -> repository -> service -> router.
- REST API base path: `/api/v1`.
- JWT bearer authentication with `admin`, `worker`, and `veterinarian` roles.
- No Redis, Celery, message broker, background worker, microservice, or cache layer.

## Database Design

PostgreSQL is the single source of truth. SQLAlchemy models define these tables:

| Table | Purpose |
| --- | --- |
| `animals` | Animal identity, profile, status, and soft deletion |
| `milk_records` | Dated milk production by animal |
| `vaccinations` | Vaccination history by animal |
| `inventory_items` | Current item quantities and low-stock thresholds |
| `inventory_movements` | In, out, and adjustment stock movements |
| `financial_records` | Income and expense records with soft deletion |
| `health_records` | Treatment, illness, checkup, and vaccination records |
| `withdrawal_locks` | Animal withdrawal periods, optionally linked to health records |
| `alarms` | Manual and withdrawal-generated alarms |
| `settings` | Singleton farm/application settings |
| `users` | Login identity, password hash, active state, and role |

Key relationships use existing foreign keys from milk, vaccination, health, and withdrawal records to animals. Inventory consumption created from a health treatment reuses an inventory OUT movement and records the health record ID in movement notes; no additional link table exists.

`app.init_db` creates missing tables and applies the small compatibility columns used by existing databases. This project does not currently use a migration framework.

## API Specification

Interactive OpenAPI documentation is available at `/docs` while the backend is running.

| Area | Endpoints |
| --- | --- |
| Authentication | `POST /auth/login`, `GET /auth/me` |
| Animals | CRUD under `/animals`, plus `/animals/stats` |
| Milk | list/create under `/milk-records`, animal history under `/animals/{id}/milk-records` |
| Vaccinations | list/create under `/vaccinations`, animal history under `/animals/{id}/vaccinations` |
| Inventory | item CRUD under `/inventory/items`, movements under `/inventory/movements` |
| Finance | CRUD under `/finance` |
| Health | CRUD under `/health-records`, animal history under `/health-records/animal/{id}` |
| Withdrawal locks | CRUD and active list under `/withdrawal-locks` |
| Alarms | CRUD under `/alarms` |
| Dashboard | `GET /dashboard` |
| Reporting | summaries, filtered details, and CSV exports under `/reports` |
| Settings | `GET /settings`, `PUT /settings` |

Date-filtered reporting accepts optional `start_date` and `end_date` values in `YYYY-MM-DD` format. Invalid reversed ranges return HTTP 400.

All business endpoints require a valid bearer token. Missing or invalid authentication returns HTTP 401; authenticated users without the required role receive HTTP 403.

| Role | Access |
| --- | --- |
| `admin` | All current endpoints |
| `veterinarian` | Animals, health records, withdrawal locks, alarms, and read-only reports |
| `worker` | Animals, milk records, inventory, and read-only dashboard |

## Frontend Guide

- Source: `frontend/src`.
- Page routes are registered in `App.jsx` and wrapped by the existing authenticated route.
- API clients live in `frontend/src/api` and attach the token stored under `farm_erp_access_token`.
- Authentication state is held in the existing React context; no external state library is used.
- Pages reuse shared CSS in `App.css` and existing small components.
- Reporting is part of the Dashboard page and supports date presets, detail tables, and authenticated CSV downloads.
- There is no user or role management screen.

## Local Deployment

Prerequisites: Python 3.12, Node.js/npm, and a reachable PostgreSQL database.

Backend environment (`backend/.env`):

```dotenv
DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET_KEY=replace-for-non-development-use
```

Backend setup and start:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m app.init_db
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Frontend setup and start:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

The frontend expects the API at `http://127.0.0.1:8000/api/v1` and Vite serves locally on `http://localhost:5173` by default.

Current deployment support is local/manual only. Docker, orchestration, background services, and a production hosting topology are not implemented.

## Verification

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m compileall app tests

cd ..\frontend
npm.cmd run lint
npm.cmd run build
```

Default development account after database initialization:

- Email: `admin@farm.local`
- Password: `admin123`

Change the default credentials and JWT secret before any non-local use.
