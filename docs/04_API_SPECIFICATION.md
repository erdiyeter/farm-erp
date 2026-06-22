# 04 · API Specification

## API Standard

Base URL:

```text
/api/v1
```

Authentication:

```text
JWT Bearer Token
```

Content type:

```text
application/json
```

Error format:

```json
{
  "detail": "Error message"
}
```

---

# Authentication API

## POST /auth/login

User login.

Request:

```json
{
  "email": "admin@farm.local",
  "password": "password"
}
```

Response:

```json
{
  "access_token": "jwt_token",
  "token_type": "bearer"
}
```

---

# Animals API

Base path:

```text
/animals
```

## GET /animals

List active animals.

---

## POST /animals

Create animal.

---

## GET /animals/{id}

Animal detail.

---

## PUT /animals/{id}

Update animal.

---

## DELETE /animals/{id}

Soft delete animal.

---

## GET /animals/stats

Animal statistics.

Example response:

```json
{
  "total_active": 120,
  "male_count": 25,
  "female_count": 95
}
```

---

# Vaccinations API

Base path:

```text
/ vaccinations
```

## GET /vaccinations

List vaccination records.

---

## POST /vaccinations

Create vaccination record.

---

## GET /animals/{id}/vaccinations

Animal vaccination history.

---

# Milk Records API

Base path:

```text
/milk-records
```

## GET /milk-records

List milk records.

---

## POST /milk-records

Create milk record.

---

## GET /animals/{id}/milk-records

Animal milk history.

---

# Health Records API

Base path:

```text
/health-records
```

## GET /health-records

List health records.

---

## POST /health-records

Create health record.

---

## GET /health-records/{id}

Health record detail.

---

## PATCH /health-records/{id}

Update health record.

---

## DELETE /health-records/{id}

Delete health record.

---

## GET /health-records/animal/{animal_id}

Health history for animal.

---

# Inventory Items API

Base path:

```text
/inventory/items
```

## GET /inventory/items

List inventory items.

---

## POST /inventory/items

Create inventory item.

---

## GET /inventory/items/{id}

Inventory item detail.

---

## PUT /inventory/items/{id}

Update inventory item.

---

## DELETE /inventory/items/{id}

Soft delete inventory item.

---

# Inventory Movements API

Base path:

```text
/inventory/movements
```

## GET /inventory/movements

List inventory movements.

---

## POST /inventory/movements

Create inventory movement.

Supported movement types:

```text
in
out
adjustment
```

---

# Finance API

Base path:

```text
/finance
```

## GET /finance

List finance records.

---

## POST /finance

Create finance record.

---

## GET /finance/{id}

Finance record detail.

---

## PATCH /finance/{id}

Update finance record.

---

## DELETE /finance/{id}

Soft delete finance record.

Supported record types:

```text
income
expense
```

---

# Withdrawal Locks API

Base path:

```text
/withdrawal-locks
```

## GET /withdrawal-locks

List withdrawal locks.

---

## GET /withdrawal-locks/active

List active withdrawal locks.

---

## POST /withdrawal-locks

Create withdrawal lock.

---

## GET /withdrawal-locks/{id}

Withdrawal lock detail.

---

## PATCH /withdrawal-locks/{id}

Update withdrawal lock.

---

## DELETE /withdrawal-locks/{id}

Soft delete withdrawal lock.

---

# Alarms API

Base path:

```text
/alarms
```

## GET /alarms

List alarms.

---

## POST /alarms

Create alarm.

---

## GET /alarms/{id}

Alarm detail.

---

## PATCH /alarms/{id}

Update alarm.

---

## DELETE /alarms/{id}

Delete alarm.

Supported alarm types:

```text
reminder
withdrawal
```

Supported priorities:

```text
low
medium
high
```

---

# Dashboard API

Base path:

```text
/dashboard
```

## GET /dashboard

Dashboard summary.

Current dashboard includes:

```text
Animal KPIs
Milk KPIs
Health KPIs
Withdrawal Lock KPIs
Alarm KPIs
Recent Records
```

---

# Reporting API

Base path:

```text
/reports
```

## GET /reports/dashboard

Dashboard reporting summary.

---

## GET /reports/milk

Milk reporting data.

---

## GET /reports/health

Health reporting data.

---

## GET /reports/finance

Finance reporting data.

---

## GET /reports/export/csv

CSV export endpoint.

Supported filters:

```text
start_date
end_date
```

---

# Business Rule Summary

## Animals

```text
Ear tag must be unique.
Inactive animals cannot be used in operational records.
```

---

## Milk Records

```text
Milk liters must be greater than zero.
Future dates are not allowed.
```

---

## Health Records

```text
Animal must exist.
Animal must be active.
```

---

## Inventory

```text
Stock cannot become negative.
OUT movements require sufficient stock.
```

---

## Finance

```text
Amount must be greater than zero.
```

---

## Withdrawal Locks

```text
Referenced animal must exist.
Referenced health record must exist when provided.
```

---

## Authentication

```text
Protected endpoints require valid JWT token.
```

---

# HTTP Status Codes

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
404 Not Found
422 Validation Error
500 Internal Server Error
```

---

# Current API Scope

Implemented modules:

```text
Authentication
Animals
Vaccinations
Milk Records
Health Records
Inventory
Finance
Withdrawal Locks
Alarms
Dashboard
Reporting
```