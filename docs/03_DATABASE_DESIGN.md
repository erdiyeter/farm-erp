# 03 - Database Design

## Purpose

This document describes the database tables implemented in the current Farm ERP codebase.

The database is PostgreSQL and is accessed by the FastAPI backend through SQLAlchemy.

Business rules belong in the application layer unless a database constraint is already implemented.

---

## Implemented Tables

### users

Purpose: authentication and role identity.

Main fields:

- `id`
- `full_name`
- `email`
- `password_hash`
- `role`
- `is_active`
- `created_at`

Current roles used by the application:

- `admin`
- `worker`
- `veterinarian`

---

### animals

Purpose: master animal records and operational animal state.

Main fields:

- `id`
- `ear_tag`
- `name`
- `species`
- `breed`
- `sex`
- `birth_date`
- `purchase_date`
- `purchase_price`
- `sale_price`
- `lactation_number`
- `lactation_start_date`
- `lactation_end_date`
- `exit_date`
- `exit_reason`
- `notes`
- `is_active`
- `created_at`
- `updated_at`

Computed model properties:

- `lactation_status`
- `active_lactation`
- `days_in_milk`

---

### vaccinations

Purpose: vaccination history.

Main fields:

- `id`
- `animal_id`
- `vaccine_name`
- `dose`
- `application_date`
- `next_due_date`
- `notes`
- `created_at`

Relationship:

- `vaccinations.animal_id -> animals.id`

---

### milk_records

Purpose: milk production records.

Main fields:

- `id`
- `animal_id`
- `record_date`
- `milk_liters`
- `session`
- `notes`
- `created_at`

Relationship:

- `milk_records.animal_id -> animals.id`

---

### health_records

Purpose: animal health events and treatments.

Main fields:

- `id`
- `animal_id`
- `record_type`
- `diagnosis`
- `treatment`
- `medicine_name`
- `dosage`
- `record_date`
- `withdrawal_end_date`
- `notes`
- `created_at`

Relationship:

- `health_records.animal_id -> animals.id`

Common record types used by the frontend:

- `treatment`
- `illness`
- `checkup`
- `vaccination`

---

### inventory_items

Purpose: inventory master data.

Main fields:

- `id`
- `name`
- `category`
- `unit`
- `current_quantity`
- `minimum_quantity`
- `unit_cost`
- `notes`
- `is_active`
- `created_at`
- `updated_at`

---

### inventory_movements

Purpose: inventory quantity transactions.

Main fields:

- `id`
- `item_id`
- `movement_type`
- `quantity`
- `movement_date`
- `notes`
- `created_at`

Relationship:

- `inventory_movements.item_id -> inventory_items.id`

Supported movement types:

- `in`
- `out`
- `adjustment`

---

### financial_records

Purpose: income and expense records.

Main fields:

- `id`
- `record_type`
- `category`
- `amount`
- `record_date`
- `description`
- `is_active`
- `created_at`

Implemented constraints:

- `record_type` must be `income` or `expense`.
- `amount` must be greater than zero.

---

### withdrawal_locks

Purpose: withdrawal periods linked to animals and optionally health records.

Main fields:

- `id`
- `animal_id`
- `health_record_id`
- `start_date`
- `end_date`
- `reason`
- `is_active`
- `created_at`
- `updated_at`

Relationships:

- `withdrawal_locks.animal_id -> animals.id`
- `withdrawal_locks.health_record_id -> health_records.id`

---

### alarms

Purpose: operational reminders and alerts.

Main fields:

- `id`
- `title`
- `description`
- `alarm_type`
- `priority`
- `due_date`
- `is_completed`
- `created_at`

Implemented constraints:

- `alarm_type` must be one of `vaccination`, `withdrawal`, `health`, `reminder`.
- `priority` must be one of `low`, `medium`, `high`.

---

### weight_records

Purpose: animal weight tracking and growth-related reporting.

Main fields:

- `id`
- `animal_id`
- `record_date`
- `weight_kg`
- `notes`
- `created_at`
- `updated_at`

Relationship:

- `weight_records.animal_id -> animals.id`

---

### reproduction_events

Purpose: mating, pregnancy, and birth events.

Main fields:

- `id`
- `animal_id`
- `event_type`
- `event_date`
- `pregnancy_status`
- `pregnancy_outcome`
- `offspring_count`
- `notes`
- `created_at`
- `updated_at`

Relationship:

- `reproduction_events.animal_id -> animals.id`

Common event types used by the frontend:

- `mating`
- `pregnancy`
- `birth`

Computed model property:

- `is_twin_birth`

---

### settings

Purpose: farm-level settings.

Main fields:

- `id`
- `farm_name`
- `owner_name`
- `contact_phone`
- `milk_price`
- `address`
- `notes`

---

## Relationship Overview

```text
animals
  -> vaccinations
  -> milk_records
  -> health_records
       -> withdrawal_locks
  -> withdrawal_locks
  -> weight_records
  -> reproduction_events

inventory_items
  -> inventory_movements

users
financial_records
alarms
settings
```

---

## Reporting Data Sources

Reports and dashboard values are calculated from operational tables, including:

- `animals`
- `milk_records`
- `health_records`
- `weight_records`
- `reproduction_events`
- `financial_records`
- `withdrawal_locks`
- `alarms`
- `inventory_items`
- `inventory_movements`

No report tables, data warehouse, event store, or AI storage tables are implemented.

---

## Outdated Statements Removed

Older documentation listed `weight_records` as a future candidate table. It is now implemented.

Older documentation omitted `reproduction_events` and `settings`. They are now included as implemented tables.

---

## Not Implemented

The following tables are not part of the current system:

- `breeding_records`
- `pregnancy_records`
- `lambing_records`
- `calving_records`
- `ai_predictions`
- `hardware_tags`
- `sync_queue`
- event store tables
- CQRS tables
