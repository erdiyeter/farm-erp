# Sprint 15 — Alarm Backend MVP

## Sprint Goal

Implement a simple Alarm Module backend for Farm ERP.

The module provides CRUD operations for manually created operational alarms.

Examples:

- Vaccination due
- Withdrawal period reminder
- Health follow-up
- General farm reminder

This sprint is backend-only.

---

## Scope

Implemented:

- Alarm database model
- Alarm schemas
- Alarm repository
- Alarm service
- Alarm router
- API registration
- CRUD endpoints
- Validation rules
- Manual API testing

Not implemented:

- Frontend
- Notifications
- Automatic alarm generation
- Dashboard integration
- Background jobs
- Authentication

---

## Files Created

### Models

- backend/app/models/alarm.py

### Schemas

- backend/app/schemas/alarm.py

### Repositories

- backend/app/repositories/alarm.py

### Services

- backend/app/services/alarm.py

### Routers

- backend/app/routers/alarm.py

---

## Files Modified

- backend/app/models/__init__.py
- backend/app/main.py

---

## Database Model

Table:

```text
alarms
```

Fields:

```text
id
title
description
alarm_type
priority
due_date
is_completed
created_at
```

Alarm Types:

```text
vaccination
withdrawal
health
reminder
```

Priorities:

```text
low
medium
high
```

---

## API Endpoints

Base Path:

```text
/api/v1/alarms
```

Endpoints:

```text
GET    /api/v1/alarms
POST   /api/v1/alarms
GET    /api/v1/alarms/{id}
PATCH  /api/v1/alarms/{id}
DELETE /api/v1/alarms/{id}
```

---

## Validation Rules

Title:

```text
Required
```

Alarm Type:

```text
vaccination
withdrawal
health
reminder
```

Priority:

```text
low
medium
high
```

Error Handling:

```text
404 Alarm not found
422 Validation error
```

---

## Testing Performed

### Backend Verification

Passed:

```text
alarm model ok
alarm schemas ok
alarm repository ok
alarm service ok
alarm router ok
```

---

### CRUD Tests

Passed:

```text
Create Alarm
List Alarms
Get Alarm By ID
Update Alarm
Delete Alarm
```

---

### Validation Tests

Passed:

```text
Invalid alarm_type
Invalid priority
Missing title
```

Returned:

```text
422 Validation Error
```

---

### Not Found Test

Passed:

```text
Deleted alarm returns 404
```

---

## Git Commit

```bash
git commit -m "feat: add alarm backend CRUD"
```

---

## Sprint Result

Status:

```text
COMPLETED
```

Alarm Backend MVP is fully implemented, tested, and committed.

---

## Next Sprint

```text
Sprint 16 — Alarm Frontend Package
```

Planned Scope:

- alarmApi.js
- Alarm list page
- Alarm create form
- Route integration
- Navigation link
- Frontend testing