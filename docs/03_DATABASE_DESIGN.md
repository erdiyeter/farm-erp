# 03 · Database Design

## Purpose

This document describes the current production database structure used by Farm ERP.

The database reflects the actual implemented system.

Future tables should not be added unless required by an implemented feature.

---

# Database Technology

```text
PostgreSQL
```

Application access:

```text
FastAPI
↓
SQLAlchemy
↓
PostgreSQL
```

Business rules remain in the application layer.

---

# Design Principles

## Simplicity

The database should remain understandable and maintainable.

---

## YAGNI

Tables are created only when required by implemented functionality.

---

## Data Integrity

Relationships are enforced through foreign keys.

---

## Soft Delete Preference

Operational records should remain available whenever possible.

Some modules use soft delete.

---

# Current Database Tables

## users

System users and authentication.

```sql
users
```

Main fields:

```text
id
email
hashed_password
is_active
created_at
```

Used by:

- Authentication
- Login
- JWT security

---

## animals

Master animal records.

```sql
animals
```

Main fields:

```text
id
ear_tag
name
species
breed
sex
birth_date
notes
is_active
created_at
updated_at
```

Relationships:

```text
animals
 ├─ vaccinations
 ├─ milk_records
 ├─ health_records
 └─ withdrawal_locks
```

---

## vaccinations

Vaccination history.

```sql
vaccinations
```

Main fields:

```text
id
animal_id
vaccine_name
dose
application_date
next_due_date
notes
created_at
```

Relationship:

```text
vaccinations.animal_id
→ animals.id
```

---

## milk_records

Milk production records.

```sql
milk_records
```

Main fields:

```text
id
animal_id
record_date
milk_liters
session
notes
created_at
```

Relationship:

```text
milk_records.animal_id
→ animals.id
```

---

## health_records

Health events and treatments.

```sql
health_records
```

Main fields:

```text
id
animal_id
record_type
diagnosis
treatment
medicine_name
dosage
record_date
withdrawal_end_date
notes
created_at
```

Relationship:

```text
health_records.animal_id
→ animals.id
```

Supported record types:

```text
treatment
illness
checkup
vaccination
```

---

## inventory_items

Inventory master records.

```sql
inventory_items
```

Main fields:

```text
id
name
category
unit
current_quantity
minimum_quantity
notes
is_active
created_at
updated_at
```

Relationship:

```text
inventory_items
 └─ inventory_movements
```

---

## inventory_movements

Inventory transactions.

```sql
inventory_movements
```

Main fields:

```text
id
item_id
movement_type
quantity
movement_date
notes
created_at
```

Relationship:

```text
inventory_movements.item_id
→ inventory_items.id
```

Supported movement types:

```text
in
out
adjustment
```

---

## financial_records

Income and expense records.

```sql
financial_records
```

Main fields:

```text
id
record_type
category
amount
record_date
description
is_active
created_at
```

Supported types:

```text
income
expense
```

---

## withdrawal_locks

Drug withdrawal periods.

```sql
withdrawal_locks
```

Main fields:

```text
id
animal_id
health_record_id
start_date
end_date
reason
is_active
created_at
updated_at
```

Relationships:

```text
withdrawal_locks.animal_id
→ animals.id

withdrawal_locks.health_record_id
→ health_records.id
```

---

## alarms

Operational reminders and alerts.

```sql
alarms
```

Main fields:

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

# Entity Relationship Overview

```text
animals
 ├─ vaccinations
 ├─ milk_records
 ├─ health_records
 │      └─ withdrawal_locks
 └─ withdrawal_locks

inventory_items
 └─ inventory_movements

users

financial_records

alarms
```

---

# Reporting Data Sources

Reporting currently reads directly from operational tables.

Sources:

```text
animals
milk_records
health_records
withdrawal_locks
alarms
financial_records
inventory_items
inventory_movements
```

No reporting tables exist.

No reporting warehouse exists.

---

# Dashboard Data Sources

Dashboard values are calculated from:

```text
animals
milk_records
health_records
withdrawal_locks
alarms
```

Dashboard data is not stored separately.

---

# Current Database Scope

Implemented modules:

```text
Authentication
Animal Management
Vaccinations
Milk Production
Health Tracking
Inventory
Finance
Withdrawal Locks
Alarms
Reporting
Dashboard
```

---

# Future Candidate Tables

These tables are not implemented.

Possible future additions:

```text
weight_records
breeding_records
pregnancy_records
lambing_records
calving_records
ai_predictions
hardware_tags
sync_queue
```

Future tables must be justified by an implemented feature.

---

# Excluded by Design

The following database structures are intentionally not used:

```text
Event Store
CQRS Tables
Message Queue Tables
Workflow Engines
AI Storage Tables
Microservice Databases
```

The current system does not require them.