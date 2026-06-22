# Finance Module Summary

## Database Objects
- `financial_records`
  - `id`
  - `record_type`
  - `category`
  - `amount`
  - `record_date`
  - `description`
  - `is_active`
  - `created_at`

## API Endpoints
- `GET /api/v1/finance`
- `POST /api/v1/finance`
- `GET /api/v1/finance/{id}`
- `PATCH /api/v1/finance/{id}`
- `DELETE /api/v1/finance/{id}`

## Frontend Pages
- `FinanceRecords.jsx`
- `FinanceRecordDetail.jsx`
- `FinanceRecordEdit.jsx`

## Routes
- `/finance`
- `/finance/:id`
- `/finance/:id/edit`

## Validation Rules
- `record_type` must be `income` or `expense`.
- `amount` must be greater than 0.
- `category` must not be empty.
- `record_date` is required.
- Soft-deleted records are excluded from list, detail, update, and delete flows.
