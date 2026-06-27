# 05 - Frontend Guide

## Purpose

This document describes the current implemented frontend.

The frontend is a React/Vite application focused on operational farm workflows. It should stay simple and follow existing page, API, and i18n patterns.

---

## Technology

- React.
- Vite.
- JavaScript.
- React Router.
- Fetch API through local API helper modules.
- CSS.

Not currently used:

- Redux.
- MobX.
- React Query.
- GraphQL.
- Micro frontends.

---

## Current Structure

```text
frontend/src/
  api/
  assets/
  components/
  context/
  hooks/
  i18n/
  pages/
  App.jsx
  App.css
  main.jsx
```

---

## API Layer

Current API modules:

- `alarmApi.js`
- `animalApi.js`
- `apiClient.js`
- `authApi.js`
- `dashboardApi.js`
- `financeApi.js`
- `healthRecordApi.js`
- `inventoryApi.js`
- `milkRecordApi.js`
- `reproductionEventApi.js`
- `settingsApi.js`
- `vaccinationApi.js`
- `weightRecordApi.js`
- `withdrawalLockApi.js`

Responsibilities:

- Build backend request URLs.
- Send authenticated requests.
- Parse responses.
- Convert failed responses into UI-facing errors.

Business logic should remain in the backend.

---

## Authentication And Navigation

Authentication is handled with:

- `AuthProvider`
- `useAuth`
- `ProtectedRoute`
- JWT token storage and authenticated fetch helpers.

Navigation is role-aware in `App.jsx`.

Current roles used by the frontend:

- `admin`
- `worker`
- `veterinarian`

The frontend hides or shows navigation items based on role, while the backend remains responsible for enforcing access.

---

## Implemented Pages

Authentication:

- `/login` - login page.

Dashboard:

- `/dashboard` - dashboard, operational summaries, decision-support style review sections, reports, and CSV export actions.

Animals:

- `/animals` - animal list.
- `/animals/new` - animal create.
- `/animals/:id` - animal detail and operational profile.
- `/animals/:id/edit` - animal edit.

Vaccinations:

- `/vaccinations` - vaccination list and creation.

Milk:

- `/milk-records` - milk record list and creation.

Inventory:

- `/inventory` - inventory dashboard.
- `/inventory/items` - inventory item list and creation.
- `/inventory/items/:id` - inventory item detail.
- `/inventory/items/:id/edit` - inventory item edit.
- `/inventory/movements` - inventory movement list and creation.

Finance:

- `/finance` - finance record list and creation.
- `/finance/:id` - finance record detail.
- `/finance/:id/edit` - finance record edit.

Health:

- `/health-records` - health record list, creation, and filters.
- `/health-records/:id` - health record detail.
- `/health-records/:id/edit` - health record edit.

Weight:

- `/weight-records` - weight record list and creation.
- `/weight-records/:id` - weight record detail.
- `/weight-records/:id/edit` - weight record edit.

Reproduction:

- `/reproduction-events` - mating, pregnancy, and birth event list and creation.
- `/reproduction-events/:id` - reproduction event detail.
- `/reproduction-events/:id/edit` - reproduction event edit.

Withdrawal locks:

- `/withdrawal-locks` - withdrawal lock list, creation, and filters.
- `/withdrawal-locks/:id` - withdrawal lock detail.
- `/withdrawal-locks/:id/edit` - withdrawal lock edit.

Alarms:

- `/alarms` - alarm list, creation, and filters.
- `/alarms/:id` - alarm detail.
- `/alarms/:id/edit` - alarm edit.

Settings:

- `/settings` - farm settings.

---

## Dashboard And Reports

Reporting is integrated into the dashboard page.

Current dashboard/report behavior includes:

- Operational KPIs.
- Animal performance and economic ranking sections.
- Milk, health, withdrawal, alarm, weight, reproduction, finance, and lifecycle reporting.
- Date range filters.
- CSV export actions.

The dashboard reads data from backend endpoints. It does not persist dashboard-only state to the database.

---

## i18n Structure

Current Turkish i18n files:

```text
frontend/src/i18n/index.js
frontend/src/i18n/tr/animals.js
frontend/src/i18n/tr/business.js
frontend/src/i18n/tr/dashboard.js
frontend/src/i18n/tr/operations.js
```

Current helper exports:

- `tAnimal`
- `tAnimalValue`
- `tBusiness`
- `tBusinessValue`
- `tDashboard`
- `tDashboardValue`
- `tOperation`
- `tOperationValue`

Rules:

- Use `t...()` for UI labels and fixed text.
- Use `t...Value()` for enum-like display values.
- Do not translate user-entered free text unless it exactly matches a known standardized/system value.
- Keep `docs/09_TURKISH_TERMINOLOGY_GLOSSARY.md` as the SSOT for Turkish UI terminology.

---

## UI Principles

- Prefer existing page and component patterns.
- Keep forms direct and predictable.
- Keep table/detail/list pages consistent.
- Keep operational usability ahead of visual decoration.
- Do not add new frontend state frameworks unless the current codebase actually needs one.

---

## Outdated Statements Removed

Older frontend documentation omitted implemented pages for:

- Weight records.
- Reproduction events.
- Settings.
- Role-aware navigation.
- Current i18n helper structure.

Older documentation described reporting as separate reporting screens. In the current frontend, reporting is integrated into `Dashboard.jsx`.

---

## Future Work

Future frontend work may include better role-permission UX, more resilient dashboard loading, and additional reporting controls.

Not current frontend implementation:

- Mobile app.
- Offline mode.
- AI interface.
- Micro frontend architecture.
