# 05 · Frontend Guide

## Purpose

This document describes the current frontend structure used by Farm ERP.

The frontend is focused on operational usability, simplicity, and maintainability.

---

# Technology Stack

```text
React
Vite
JavaScript
React Router
Fetch API
CSS
```

Frontend communicates only with the backend API.

Database access is never performed directly.

---

# Frontend Architecture

```text
Pages
  ↓
API Layer
  ↓
Backend API
```

Simple architecture is intentionally preferred.

No frontend state management framework is currently required.

Not used:

```text
Redux
MobX
GraphQL
React Query
Micro Frontends
```

---

# Current Project Structure

```text
src/

├─ api/
├─ pages/
├─ components/
├─ assets/
├─ App.jsx
├─ App.css
├─ main.jsx
```

---

# API Layer

Current API modules:

```text
animalsApi.js
vaccinationsApi.js
milkRecordsApi.js
healthRecordApi.js
inventoryApi.js
financeApi.js
withdrawalLockApi.js
alarmApi.js
reportApi.js
dashboardApi.js
authApi.js
```

Responsibilities:

- HTTP requests
- API communication
- Response handling

Business logic should remain in the backend.

---

# Authentication Pages

## Login

Purpose:

```text
User authentication
JWT token generation
Protected system access
```

Responsibilities:

- Login form
- Credential submission
- Token storage
- Redirect after login

---

# Dashboard

Route:

```text
/dashboard
```

Purpose:

Provide a farm-wide operational overview.

Current sections:

```text
Animal KPIs
Milk KPIs
Health KPIs
Withdrawal Lock KPIs
Alarm KPIs
Recent Records
Quick Navigation
```

Dashboard aggregates information from multiple modules.

---

# Animal Management Pages

## Animals

Route:

```text
/animals
```

Features:

```text
Animal list
Create animal
View animal
Navigate to edit page
```

---

## Animal Detail

Route:

```text
/animals/:id
```

Current sections:

```text
Identity Information
Operational Summary
Recent Milk Records
Recent Health Records
Active Withdrawal Locks
Related Alarms
```

Purpose:

Provide a single operational view of an animal.

---

## Animal Edit

Route:

```text
/animals/:id/edit
```

Features:

```text
Update animal information
Manage active status
```

---

# Vaccination Pages

## Vaccinations

Route:

```text
/vaccinations
```

Features:

```text
Vaccination list
Vaccination creation
Animal association
```

---

# Milk Production Pages

## Milk Records

Route:

```text
/milk-records
```

Features:

```text
Milk record list
Milk record creation
Animal association
```

Purpose:

Milk production tracking.

---

# Health Tracking Pages

## Health Records

Route:

```text
/health-records
```

Features:

```text
Health record list
Health record creation
Health filters
```

Supported filters:

```text
All
Treatments
Vaccinations
Checkups
```

---

## Health Record Detail

Route:

```text
/health-records/:id
```

Features:

```text
Health information
Treatment information
Inventory consumption information
Withdrawal information
```

---

## Health Record Edit

Route:

```text
/health-records/:id/edit
```

Features:

```text
Update health record
Update treatment information
```

---

# Inventory Pages

## Inventory Dashboard

Route:

```text
/inventory
```

Features:

```text
Inventory summary
Stock overview
Low stock indicators
```

---

## Inventory Items

Route:

```text
/inventory/items
```

Features:

```text
Item list
Create item
View item
Edit item
```

---

## Inventory Item Detail

Route:

```text
/inventory/items/:id
```

Features:

```text
Item information
Stock information
Movement history
```

---

## Inventory Item Edit

Route:

```text
/inventory/items/:id/edit
```

Features:

```text
Update item
Update thresholds
```

---

## Inventory Movements

Route:

```text
/inventory/movements
```

Features:

```text
Movement list
Create movement
Stock adjustment
```

Supported types:

```text
IN
OUT
ADJUSTMENT
```

---

# Finance Pages

## Finance Records

Route:

```text
/finance
```

Features:

```text
Income records
Expense records
Record creation
```

---

## Finance Detail

Route:

```text
/finance/:id
```

Features:

```text
Record details
Financial information
```

---

## Finance Edit

Route:

```text
/finance/:id/edit
```

Features:

```text
Update finance record
```

---

# Withdrawal Lock Pages

## Withdrawal Locks

Route:

```text
/withdrawal-locks
```

Features:

```text
Lock list
Lock creation
Status filters
```

Supported filters:

```text
All
Active
Expired
Released
```

---

## Withdrawal Lock Detail

Route:

```text
/withdrawal-locks/:id
```

Features:

```text
Lock details
Animal reference
Health record reference
```

---

## Withdrawal Lock Edit

Route:

```text
/withdrawal-locks/:id/edit
```

Features:

```text
Update withdrawal lock
```

---

# Alarm Pages

## Alarms

Route:

```text
/alarms
```

Features:

```text
Alarm list
Alarm creation
Alarm filtering
```

Supported filters:

```text
All
Open
Completed
Overdue
Upcoming
```

---

## Alarm Detail

Route:

```text
/alarms/:id
```

Features:

```text
Alarm details
Status information
```

---

## Alarm Edit

Route:

```text
/alarms/:id/edit
```

Features:

```text
Update alarm
Mark completed
```

---

# Reporting Pages

Current reporting functionality is integrated into dashboard and reporting screens.

Features:

```text
Date range filtering
Reporting summaries
CSV export
Preset date ranges
```

---

# Navigation Structure

Current primary navigation:

```text
Dashboard
Animals
Vaccinations
Milk Records
Health Records
Inventory
Finance
Withdrawal Locks
Alarms
Reports
```

---

# UI Principles

## Operational First

The system is designed for daily farm operations.

Functionality is more important than visual effects.

---

## Simple Forms

Every form should:

```text
Accept input
Validate input
Submit data
Show result
```

---

## Clear Navigation

Users should reach important data in as few clicks as possible.

---

## Reuse Existing Components

Existing patterns should be reused whenever possible.

Avoid creating duplicate UI patterns.

---

# Current Frontend Scope

Implemented:

```text
Authentication
Dashboard
Animals
Vaccinations
Milk Records
Health Records
Inventory
Finance
Withdrawal Locks
Alarms
Reporting
```

Future candidates:

```text
Weight Tracking
Breeding Tracking
Advanced Animal Analytics
Role-Based UI Permissions
AI Insights
Mobile Interface
```