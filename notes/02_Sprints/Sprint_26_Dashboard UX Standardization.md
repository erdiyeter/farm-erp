Implement Sprint 26 Dashboard UX Standardization.

Goals:

- Standardize all Dashboard sections.
- Make Dashboard the central Layer 2 overview page.
- No backend changes.
- No API changes.
- No database changes.
- No new features.

Files expected to modify:

- frontend/src/pages/Dashboard.jsx
- frontend/src/App.css

Requirements:

1. Use the same section structure for:
   - Animals
   - Milk Production
   - Health Records
   - Withdrawal Locks
   - Alarms

2. Each section must contain:
   - Section title
   - Right-aligned navigation link
   - KPI card grid

3. Standardize:
   - KPI card spacing
   - KPI card sizing
   - Section spacing
   - Section header layout

4. Keep all existing dashboard data fields unchanged.

5. Keep all existing routes unchanged.

6. Do not modify business logic.

Verification:

- npm.cmd run lint
- npm.cmd run build

Return:
- Files modified
- What changed
- Verification results