# Sprint 45 - Inventory - Health Integration

## Objective

Allow a treatment health record to optionally consume an existing inventory item through the current inventory movement workflow.

## Scope

- Extend health record create and update inputs with an optional inventory item.
- Create one inventory `out` movement when a treatment has an inventory item and numeric dosage.
- Show linked inventory consumption on the health record detail page.
- Preserve health records that do not consume inventory and all non-treatment record types.

## Backend Changes

- Added the optional `inventory_item_id` health record input field without changing the database schema.
- Reused the inventory movement service for item lookup, stock validation, stock reduction, and movement creation.
- Added transaction-aware repository operations so the health record and movement commit together or roll back together.
- Linked the movement to its health record with the movement note `Health record ID: {id}`.
- Extended the existing health record detail response with inventory item name, consumed quantity, and movement date when a linked movement exists.
- Prevented changes to the item, dosage, record date, or record type after inventory consumption to avoid stock inconsistencies and duplicate movements.

## Frontend Changes

- Added an inventory item dropdown to treatment create and edit forms.
- Made dosage required when an inventory item is selected.
- Refreshed inventory quantities after health record creation.
- Disabled movement-defining fields after inventory consumption has been recorded.
- Added a read-only Inventory Consumption section to health record detail.

## Business Rules

- Inventory consumption is optional.
- Consumption occurs only for a treatment with an inventory item and dosage.
- One health record can create at most one inventory movement.
- Non-treatment health records do not consume inventory.
- Existing health records without inventory consumption continue to work.

## Validation Rules

- The selected inventory item must exist and be active.
- Dosage used for inventory consumption must be a finite positive number.
- Available stock must be at least the dosage quantity.
- Insufficient stock rejects the request and rolls back both the health record and movement changes.

## Verification Results

- `python -m app.init_db`: passed using the project virtual environment.
- `python -m compileall app`: passed.
- Valid treatment consumption: passed; stock reduced and one movement created.
- Insufficient stock: passed; request rejected with `Not enough stock` and neither record persisted.
- Treatment without an inventory item: passed without a movement.
- Non-treatment record with an inventory selection: passed without a movement.
- Health record update: passed; first inventory selection created one movement and later edits did not duplicate it.
- Health record detail inventory data: passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.
- Animal Detail compatibility: unchanged and covered by the successful frontend build.

## Out of Scope

- Database schema changes or new tables.
- Multiple inventory items per health record.
- Editing or reversing completed inventory consumption.
- Medicine catalogs, batch or lot tracking, and expiration management.
- Background processing, events, reporting, dashboard, and authentication changes.
