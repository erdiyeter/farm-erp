# 07 - Deployment Guide

## Purpose

This document describes the current development and deployment setup for Farm ERP.

The project is currently optimized for local development. Production deployment is not part of the current implemented system.

---

## Current Stack

Backend:

- Python.
- FastAPI.
- SQLAlchemy.
- Pydantic.
- JWT authentication.

Frontend:

- React.
- Vite.
- JavaScript.

Database:

- PostgreSQL.

---

## Project Structure

```text
farm-erp/
  backend/
  frontend/
  docs/
```

---

## Backend Setup

From the repository root:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Environment variables are loaded from `backend/.env`.

Example:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/farm_erp
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

Run the backend:

```powershell
uvicorn app.main:app --reload
```

Backend URLs:

```text
http://localhost:8000
http://localhost:8000/docs
http://localhost:8000/openapi.json
```

---

## Frontend Setup

From the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

The backend CORS configuration currently allows the local Vite origin.

---

## Database

The backend requires a PostgreSQL database through `DATABASE_URL`.

Implemented operational tables:

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

Database initialization depends on the current backend setup scripts and migrations available in the repository. Use the implemented project scripts rather than creating tables manually.

---

## Local Verification

For documentation-only changes:

```powershell
git diff --check
```

For frontend code changes when needed:

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build
npm.cmd run check:tr
```

For backend code changes when needed, run the relevant backend tests or API checks for the changed area.

Do not run broad test suites for documentation-only changes unless a generated file or documentation link requires it.

---

## Current Deployment Status

Current status:

```text
Local development only
```

Not currently used:

- Docker.
- CI/CD deployment pipeline.
- Redis.
- Celery.
- Message queues.
- Cloud services.
- Mobile app backend.
- Offline sync service.

These may be considered later only if there is a real operational need.

---

## Backup Recommendation

For local development:

- Keep regular Git commits.
- Back up PostgreSQL data when the database contains important records.
- Keep `.env` secrets out of Git.

---

## Outdated Statements Removed

Older deployment documentation omitted implemented tables for weight records, reproduction events, and settings. They are now listed.

Older deployment documentation included machine-specific details. The current guide keeps setup instructions general and project-focused.
