# Sprint 44 - Detailed Animal Profile

## Goal

Improve the existing Animal Detail page with operational information already available from current APIs and database tables.

## Current Phase

- MVP is completed.
- The project is in the Post-MVP Operational Enhancement Phase.
- This sprint must remain a simple frontend composition task unless a confirmed backend gap blocks the required view.

## Files Reviewed

### Project Documentation

- `notes/00_Project/Project_Status_2026_06_21.md`
- `docs/08_DEVELOPER_RULES.md`
- `notes/00_Project/MVP_Rules.md`
- `notes/03_Decisions/Architecture_Decisions.md`

### Frontend

- `frontend/src/pages/AnimalDetail.jsx`
- `frontend/src/hooks/useAnimalDetail.js`
- `frontend/src/api/animalApi.js`
- `frontend/src/api/milkRecordApi.js`
- `frontend/src/api/healthRecordApi.js`
- `frontend/src/api/withdrawalLockApi.js`
- `frontend/src/api/alarmApi.js`
- `frontend/src/components/KpiCard.jsx`
- `frontend/src/App.css`

### Backend

- Animal, milk record, health record, withdrawal lock, and alarm models.
- Animal, milk record, health record, withdrawal lock, and alarm schemas.
- Animal, milk record, health record, withdrawal lock, and alarm routers.
- Withdrawal lock repository and automatic withdrawal alarm service.

## Reusable Endpoints

- `GET /api/v1/animals/{animal_id}` - existing animal detail.
- `GET /api/v1/animals/{animal_id}/milk-records` - all milk records for one animal, newest first.
- `GET /api/v1/health-records/animal/{animal_id}` - all health records for one animal, newest first.
- `GET /api/v1/withdrawal-locks` - existing lock list; filter by `animal_id`, `is_active`, and `end_date` in the page.
- `GET /api/v1/alarms` - existing alarm list and automatic withdrawal-alarm synchronization.

## Existing API Client Reuse

- `getAnimalById()` is already used by `useAnimalDetail`.
- `getMilkRecordsByAnimalId()` already exists and can be reused unchanged.
- The health backend endpoint exists, but `healthRecordApi.js` does not currently expose a matching per-animal function. Add one small client function rather than loading every health record.
- `getWithdrawalLocks()` and `getAlarms()` already exist and can be reused unchanged.

## Backend Assessment

Backend changes are not required for the proposed MVP implementation.

The current tables and endpoints provide sufficient data for recent milk records, recent health records, and active withdrawal locks. Active automatically generated withdrawal alarms can be matched to the animal through the existing deterministic title format:

```text
Withdrawal lock {lock_id} for animal {animal_id}
```

## Risks and Missing Support

- The Alarm model and schema do not contain `animal_id` or another structured animal relationship.
- Manual alarms therefore cannot be reliably assigned to an animal with current data.
- The proposed Active Alarms section will show open automatic withdrawal alarms associated with the animal's active locks.
- Supporting arbitrary animal-specific manual alarms would require a backend/data-contract change and is intentionally not proposed for this sprint.
- `GET /api/v1/alarms` performs the existing withdrawal-alarm synchronization as a side effect. The page will reuse that established behavior rather than add new logic.

## Proposed Minimal Implementation Plan

1. Add `getHealthRecordsByAnimalId(animalId)` to the existing health API client.
2. In `AnimalDetail.jsx`, load milk records, health records, withdrawal locks, and alarms for the current route ID using the existing clients.
3. Keep the current animal loading, edit, back, and deactivate behavior unchanged.
4. Filter active locks by matching `animal_id`, `is_active === true`, and `end_date >= today`.
5. Match open automatic withdrawal alarms against those active lock IDs and the existing title format.
6. Show a simple four-card operational summary using existing `KpiCard` and dashboard grid styles:
   - Milk record count
   - Health record count
   - Active withdrawal lock count
   - Active alarm count
7. Show at most five recent milk records and five recent health records.
8. Show active locks and active alarms in small read-only tables.
9. Reuse `dashboard-section`, `dashboard-records-table`, `data-table`, `empty-text`, `status-text`, and `error-text` styles. Add CSS only if an actual layout gap appears during implementation.
10. After approval and implementation, run frontend lint/build and verify the page with animals that have both populated and empty operational data.

## Files Likely to Be Modified

- `frontend/src/pages/AnimalDetail.jsx`
- `frontend/src/api/healthRecordApi.js`

`frontend/src/App.css` should remain unchanged unless existing styles prove insufficient during implementation.

## Expected Scope

- Frontend-only implementation is sufficient.
- No new endpoint.
- No new database table or field.
- No new module or architecture.
- Existing Animal Detail behavior remains intact.

## Approval Status

Waiting for approval before coding.
