# 04 - API Specification

## API Standard

Base URL:

```text
/api/v1
```

Authentication:

```text
JWT Bearer Token
```

Standard error shape:

```json
{
  "detail": "Error message"
}
```

Some validation errors use FastAPI's standard validation error list under `detail`.

---

## Authentication

Base path:

```text
/auth
```

Endpoints:

- `POST /auth/login` - login and return a bearer token.
- `GET /auth/me` - return the current authenticated user.

Current user roles:

- `admin`
- `worker`
- `veterinarian`

---

## Animals

Base path:

```text
/animals
```

Endpoints:

- `GET /animals` - list active animals.
- `GET /animals/stats` - animal statistics.
- `POST /animals` - create animal.
- `GET /animals/{animal_id}` - animal detail.
- `PUT /animals/{animal_id}` - update animal.
- `DELETE /animals/{animal_id}` - deactivate animal.

Current animal data includes identity, lifecycle, purchase/sale, lactation, exit, and active status fields.

---

## Vaccinations

Endpoints:

- `GET /vaccinations` - list vaccination records.
- `POST /vaccinations` - create vaccination record.
- `GET /animals/{animal_id}/vaccinations` - list vaccinations for one animal.

---

## Milk Records

Endpoints:

- `POST /milk-records` - create milk record.
- `GET /milk-records` - list milk records.
- `GET /animals/{animal_id}/milk-records` - list milk records for one animal.

---

## Health Records

Endpoints:

- `GET /health-records` - list health records.
- `POST /health-records` - create health record.
- `GET /health-records/animal/{animal_id}` - list health records for one animal.
- `GET /health-records/{health_record_id}` - health record detail.
- `PATCH /health-records/{health_record_id}` - update health record.
- `DELETE /health-records/{health_record_id}` - delete health record.

Common record types used by the frontend:

- `treatment`
- `illness`
- `checkup`
- `vaccination`

Health records can include withdrawal dates and optional inventory consumption through the implemented service workflow.

---

## Inventory

Base path:

```text
/inventory
```

Item endpoints:

- `GET /inventory/items` - list inventory items.
- `POST /inventory/items` - create inventory item.
- `GET /inventory/items/{item_id}` - inventory item detail.
- `PUT /inventory/items/{item_id}` - update inventory item.
- `DELETE /inventory/items/{item_id}` - deactivate inventory item.

Movement endpoints:

- `GET /inventory/movements` - list inventory movements.
- `POST /inventory/movements` - create inventory movement.

Supported movement types:

- `in`
- `out`
- `adjustment`

---

## Finance

Base path:

```text
/finance
```

Endpoints:

- `GET /finance` - list active finance records.
- `POST /finance` - create finance record.
- `GET /finance/{finance_record_id}` - finance record detail.
- `PATCH /finance/{finance_record_id}` - update finance record.
- `DELETE /finance/{finance_record_id}` - deactivate finance record.

Supported record types:

- `income`
- `expense`

---

## Withdrawal Locks

Base path:

```text
/withdrawal-locks
```

Endpoints:

- `GET /withdrawal-locks` - list withdrawal locks.
- `GET /withdrawal-locks/active` - list active withdrawal locks.
- `POST /withdrawal-locks` - create withdrawal lock.
- `GET /withdrawal-locks/{lock_id}` - withdrawal lock detail.
- `PATCH /withdrawal-locks/{lock_id}` - update withdrawal lock.
- `DELETE /withdrawal-locks/{lock_id}` - deactivate withdrawal lock.

---

## Alarms

Base path:

```text
/alarms
```

Endpoints:

- `GET /alarms` - list alarms.
- `POST /alarms` - create alarm.
- `GET /alarms/{alarm_id}` - alarm detail.
- `PATCH /alarms/{alarm_id}` - update alarm.
- `DELETE /alarms/{alarm_id}` - delete alarm.

Supported alarm types:

- `vaccination`
- `withdrawal`
- `health`
- `reminder`

Supported priorities:

- `low`
- `medium`
- `high`

---

## Weight Records

Endpoints:

- `POST /weight-records` - create weight record.
- `GET /weight-records` - list weight records.
- `GET /animals/{animal_id}/weight-records` - list weight records for one animal.
- `GET /weight-records/{weight_record_id}` - weight record detail.
- `PATCH /weight-records/{weight_record_id}` - update weight record.
- `DELETE /weight-records/{weight_record_id}` - delete weight record.

---

## Reproduction Events

Endpoints:

- `POST /reproduction-events` - create reproduction event.
- `GET /reproduction-events` - list reproduction events.
- `GET /animals/{animal_id}/reproduction-events` - list reproduction events for one animal.
- `GET /reproduction-events/{event_id}` - reproduction event detail.
- `PATCH /reproduction-events/{event_id}` - update reproduction event.
- `DELETE /reproduction-events/{event_id}` - delete reproduction event.

Common event types used by the frontend:

- `mating`
- `pregnancy`
- `birth`

---

## Settings

Base path:

```text
/settings
```

Endpoints:

- `GET /settings` - get farm settings.
- `PUT /settings` - update farm settings.

Settings currently include farm name, owner name, contact phone, milk price, address, and notes.

---

## Dashboard

Base path:

```text
/dashboard
```

Endpoints:

- `GET /dashboard` - return dashboard statistics and operational summary data.

Dashboard data is calculated from operational records. It is not stored separately.

---

## Reports

Base path:

```text
/reports
```

Summary endpoints:

- `GET /reports/animals/summary`
- `GET /reports/milk/summary`
- `GET /reports/health/summary`
- `GET /reports/finance/summary`
- `GET /reports/summary`

Detail endpoint:

- `GET /reports/details`

CSV export endpoints:

- `GET /reports/animals/export.csv`
- `GET /reports/health-records/export.csv`
- `GET /reports/withdrawal-locks/export.csv`
- `GET /reports/milk-records/export.csv`
- `GET /reports/weight-records/export.csv`

Supported date filters where applicable:

- `start_date`
- `end_date`

Report data includes animals, milk records, health records, weight records, reproduction events, exited animals, financial records, withdrawal locks, and alarms.

---

## Route Access Summary

Route protection is configured in `backend/app/main.py`.

Current access is role-based at router level:

- Auth routes are public where required for login.
- Admin-only areas include finance, settings, and vaccinations.
- Worker-oriented areas include animals, milk, inventory, weight, reproduction, and dashboard access.
- Veterinarian-oriented areas include animals, health, withdrawal locks, alarms, and reports.

This is the current implemented behavior, not a full permission management system.

---

## Outdated Statements Removed

Older API documentation omitted these implemented areas:

- `GET /auth/me`
- Weight record endpoints.
- Reproduction event endpoints.
- Settings endpoints.
- Current report summary/detail/export endpoints.
- Current role-based route protection.

Older documentation also listed `/reports/dashboard`, `/reports/milk`, `/reports/health`, `/reports/finance`, and `/reports/export/csv` as if they were the active report API. The current code uses the report endpoints listed above.
