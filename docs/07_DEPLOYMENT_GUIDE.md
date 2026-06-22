# 07 · Deployment Guide

## Purpose

This document describes the current development and deployment environment used by Farm ERP.

The project is currently optimized for local development.

Production deployment is not a current priority.

---

# Development Environment

Current development machine:

```text
OS: Windows 10 Home x64
CPU: Intel Core i7-7700HQ
Editor: VS Code
Terminal: PowerShell
```

---

# Technology Stack

## Backend

```text
Python 3.12
FastAPI
SQLAlchemy
Pydantic
JWT Authentication
```

---

## Frontend

```text
React
Vite
JavaScript
```

---

## Database

```text
PostgreSQL 18
```

Current database:

```text
farm_erp
```

---

# Required Software

## Backend

```text
Python 3.12+
pip
virtualenv
```

---

## Frontend

```text
Node.js LTS
npm
```

---

## Database

```text
PostgreSQL 18
```

---

## Development Tools

```text
VS Code
Git
Postman
```

---

# Project Structure

```text
farm-erp/

├─ backend/
├─ frontend/
├─ docs/
├─ notes/
```

---

# Backend Setup

Navigate to backend:

```powershell
cd backend
```

Create virtual environment:

```powershell
python -m venv .venv
```

Activate environment:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

---

# Environment Configuration

Environment variables are stored in:

```text
backend/.env
```

Example:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/farm_erp
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

---

# Database Initialization

Run database initialization:

```powershell
python -m app.init_db
```

Purpose:

```text
Create tables
Initialize database structure
Prepare application startup
```

---

# Running Backend

From backend directory:

```powershell
uvicorn app.main:app --reload
```

Backend URL:

```text
http://localhost:8000
```

API Documentation:

```text
http://localhost:8000/docs
```

OpenAPI Schema:

```text
http://localhost:8000/openapi.json
```

---

# Running Frontend

Navigate to frontend:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Run development server:

```powershell
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

# Authentication Setup

Current authentication method:

```text
JWT Bearer Authentication
```

Flow:

```text
Login
 ↓
JWT Token
 ↓
Protected API Access
```

Default development user depends on the database seed data.

---

# Database Tables

Current operational tables:

```text
users
animals
vaccinations
milk_records
health_records
inventory_items
inventory_movements
financial_records
withdrawal_locks
alarms
```

---

# Verification Checklist

## Backend

Verify:

```text
Database connection works
Application starts
Swagger opens
Authentication works
```

Check:

```text
http://localhost:8000/docs
```

---

## Frontend

Verify:

```text
Frontend loads
Navigation works
Forms submit correctly
Dashboard loads
```

Check:

```text
http://localhost:5173
```

---

## Database

Verify:

```text
Database exists
Tables created
Application can read/write data
```

Database name:

```text
farm_erp
```

---

# Git Workflow

Basic workflow:

```powershell
git status
git add .
git commit -m "message"
git push
```

Commit after every completed task.

---

# Backup Recommendation

Current recommendation:

```text
Regular PostgreSQL backups
Regular Git commits
GitHub repository synchronization
```

---

# Docker Status

Current status:

```text
Not used
```

Reason:

```text
Project simplicity
Learning-focused development
Local environment sufficient
```

Docker may be evaluated later if a real need appears.

---

# Production Status

Current status:

```text
Local development only
```

Production deployment is not part of the current project phase.

---

# Future Deployment Candidates

Possible future options:

```text
Docker
VPS Deployment
Cloud PostgreSQL
Automated Backup Strategy
CI/CD Pipeline
```

None are currently required.

---

# Deployment Principles

```text
Keep setup simple.
Prefer local development.
Avoid unnecessary infrastructure.
Use proven and understandable tools.
Follow YAGNI.
```