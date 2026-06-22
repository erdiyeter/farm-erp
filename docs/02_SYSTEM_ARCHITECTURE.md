# 02 · System Architecture

## Purpose

Farm ERP is a personal farm management system developed for learning, long-term use, and real farm operations.

The project follows a simple architecture:

```text
React Frontend
      ↓ HTTP / JSON
FastAPI Backend
      ↓ SQLAlchemy
PostgreSQL Database
```

The goal is not architectural complexity.

The goal is a maintainable and understandable system.

---

# Current System Status

Project phase:

```text
Post-MVP Operational Enhancement Phase
```

Current architecture supports:

- Animal Management
- Vaccination Management
- Milk Production Tracking
- Health Tracking
- Inventory Management
- Finance Management
- Withdrawal Lock Management
- Alarm Management
- Authentication
- Reporting
- Dashboard

---

# High Level Architecture

```text
Frontend (React + Vite)
            ↓
REST API (FastAPI)
            ↓
Business Logic Layer
            ↓
Repository Layer
            ↓
PostgreSQL Database
```

No microservices are used.

No distributed systems are used.

No external processing services are required.

---

# Frontend Layer

Technology:

```text
React
Vite
JavaScript
```

Responsibilities:

- Display pages
- Handle user input
- Form validation
- API communication
- Navigation
- Dashboard rendering
- Reporting screens

Frontend never accesses the database directly.

All communication goes through the backend API.

---

# Backend Layer

Technology:

```text
FastAPI
SQLAlchemy
Pydantic
JWT Authentication
```

Responsibilities:

- API endpoints
- Business rules
- Authentication
- Data validation
- Reporting calculations
- Inventory transactions
- Withdrawal lock logic
- Alarm generation

Backend acts as the single source of business logic.

---

# Database Layer

Technology:

```text
PostgreSQL
```

Current main tables:

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

Database responsibilities:

- Store operational data
- Maintain relationships
- Support reporting
- Support authentication

No database-side business automation is currently required.

Business logic remains in the application layer.

---

# Backend Internal Structure

Current backend follows a simple layered architecture.

```text
Router
  ↓
Service
  ↓
Repository
  ↓
Database
```

---

## Router Layer

Responsibilities:

- Define API endpoints
- Receive requests
- Validate request schemas
- Return responses

Example:

```text
GET /animals
POST /health-records
GET /reports/dashboard
```

---

## Service Layer

Responsibilities:

- Business rules
- Validation logic
- Workflow coordination
- Cross-module operations

Examples:

```text
Check stock availability

Create inventory movement

Generate withdrawal lock

Generate withdrawal alarm

Validate animal state
```

---

## Repository Layer

Responsibilities:

- Database access
- CRUD operations
- Query execution

Repositories should not contain business rules.

---

# Authentication Architecture

Current authentication method:

```text
User Login
      ↓
JWT Token
      ↓
Protected API Access
```

Authentication flow:

```text
Login Request
      ↓
Credential Validation
      ↓
JWT Creation
      ↓
Frontend Stores Token
      ↓
Authorized API Requests
```

Current scope:

- Login
- JWT authentication
- Protected endpoints

Future scope:

- Role-based permissions

---

# Reporting Architecture

Reporting is generated directly from operational data.

```text
Operational Tables
        ↓
Reporting Service
        ↓
Reporting API
        ↓
Dashboard / CSV Export
```

Current reporting features:

- Dashboard summaries
- Date range filtering
- CSV export

No separate reporting database exists.

---

# Inventory and Health Integration

Current workflow:

```text
Health Treatment Record
          ↓
Medicine Selected
          ↓
Inventory OUT Movement
          ↓
Stock Updated
```

This integration prevents inventory and treatment records from diverging.

---

# Withdrawal Lock and Alarm Integration

Current workflow:

```text
Health Record
        ↓
Withdrawal Period
        ↓
Withdrawal Lock
        ↓
Alarm Generation
```

The system automatically tracks active withdrawal periods and related alarms.

---

# Dashboard Architecture

Dashboard aggregates data from multiple modules.

Sources:

```text
Animals
Milk Records
Health Records
Withdrawal Locks
Alarms
Reports
```

Dashboard does not store its own data.

All values are calculated from operational records.

---

# Design Principles

## Simplicity First

The simplest working solution is preferred.

---

## YAGNI

Features are not added before they are needed.

---

## Single Source of Truth

Operational data should exist in one place.

Duplicate storage is avoided.

---

## Learning-Friendly Architecture

The system should remain understandable after months of inactivity.

Complex patterns are avoided unless they provide clear value.

---

# Not Used

The following technologies are intentionally excluded:

```text
Redis
Celery
RabbitMQ
Kafka
Microservices
Event Bus
CQRS
Event Sourcing
GraphQL
Offline Sync
AI Services
Mobile Backend
```

These may be evaluated in future phases if a real requirement appears.

---

# Future Expansion Areas

Possible future additions:

```text
Weight Tracking
Breeding Management
Lambing / Calving Tracking
Role-Based Permissions
Advanced Reporting
AI Decision Support
RFID / NFC / QR Integration
Offline Support
Mobile Application
```

Future additions must follow existing architecture and avoid unnecessary complexity.