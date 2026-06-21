# Sprint 41 - Settings MVP

## Goal

Add a simple page and API for viewing and updating basic farm information.

## Scope

- Singleton farm settings record.
- Farm name, owner name, contact phone, address, and notes fields.
- Settings GET and PUT API endpoints.
- Settings navigation route and editable frontend form.

## Files Created

- `backend/app/models/settings.py`
- `backend/app/schemas/settings.py`
- `backend/app/repositories/settings.py`
- `backend/app/services/settings.py`
- `backend/app/routers/settings.py`
- `frontend/src/api/settingsApi.js`
- `frontend/src/pages/Settings.jsx`
- `notes/02_Sprints/Sprint_41_Settings_MVP.md`

## Files Modified

- `backend/app/models/__init__.py`
- `backend/app/main.py`
- `frontend/src/App.jsx`
- `frontend/src/App.css`

## Backend Changes

- Added the `settings` table and registered its model.
- Added singleton repository and service behavior using record ID 1.
- Added `GET /api/v1/settings` and `PUT /api/v1/settings`.
- Added optional field validation, including non-blank farm names.

## Frontend Changes

- Added a Settings navigation link and `/settings` route.
- Added loading, error, save, and success states.
- Added a form for all supported settings fields.

## Out of Scope

- Authentication, users, roles, and permissions.
- Multiple farms or multiple settings profiles.
- Advanced configuration, integrations, and background processing.

## Verification Checklist

- [x] Initialize the database and create the settings table.
- [x] Compile backend modules.
- [x] Verify GET creates or returns the singleton record.
- [x] Verify PUT persists changes.
- [x] Verify blank farm-name validation.
- [x] Run frontend lint.
- [x] Run frontend production build.
- [ ] Open `/settings`, save a farm name, refresh, and confirm persistence.
- [ ] Confirm existing dashboard, animals, and reporting pages still open.
