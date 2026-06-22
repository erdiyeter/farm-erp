# Sprint 79 - Operational Gap Analysis Follow-up

## Objective

Identify and prioritize the highest-value operational gaps remaining after Sprint 78 without changing application behavior.

## Scope

- Existing module workflows.
- Dashboard usefulness and actionability.
- Animal Profile operational value.
- Reporting clarity and decision support.
- Missing operational metrics that can reuse existing data.
- Recommended sprint order.

## Files Modified

- `notes/02_Sprints/Sprint_79_Operational_Gap_Analysis_Follow_Up.md`

## Implementation Summary

- Reviewed the current Dashboard, Animal Profile, reporting, milk, health, vaccination, withdrawal, alarm, inventory, and finance surfaces.
- Reviewed only the existing APIs and schemas needed to distinguish frontend quick wins from larger contract changes.
- Added no source code, API, database, architecture, module, or dependency changes.

## Ranked Operational Gaps

### 1. Animal selection still depends on numeric IDs

**Business value: Very high**

Milk, health, vaccination, and withdrawal entry workflows require operators to type an Animal ID. Several record tables also show an ID without an ear tag or animal name. This slows routine entry and creates avoidable wrong-animal risk.

**Recommendation:** Reuse the existing Animals list API to provide an ear-tag/name selector while continuing to submit the existing `animal_id` field. Show the same animal identity beside IDs in operational tables.

### 2. Dashboard queues identify work but do not let operators finish it

**Business value: Very high**

The Dashboard highlights overdue alarms and withdrawal locks, but completing an alarm or releasing a lock still requires navigation through separate detail and edit screens. The existing alarm and withdrawal PATCH APIs already support these state changes.

**Recommendation:** Add explicit, confirmed quick actions to the relevant Dashboard queues and refresh the affected data after success.

### 3. Operational risks remain split across module screens

**Business value: High**

The Dashboard prioritizes withdrawal and alarm activity, but low-stock items and upcoming vaccinations remain isolated in Inventory and Vaccinations. Operators do not have one daily view of the main care, restriction, and supply risks already recorded by the system.

**Recommendation:** Reuse existing inventory and vaccination responses to add small, role-aware Dashboard queues. Keep each queue limited and link to its existing module.

### 4. Animal Profile lacks recent production comparison

**Business value: High**

Animal Profile shows lifetime milk, the last 30-day total, record count, and recency. It does not show whether recent output is improving or declining, so operators must interpret the timeline manually.

**Recommendation:** Derive a simple recent-period comparison, average per production day, and latest-versus-previous production result from the milk history already loaded for the animal. Avoid predictive scoring or new persistence.

### 5. Reports show farm totals but not the animals driving them

**Business value: High**

Reporting provides totals and detailed rows, but no per-animal milk aggregation, health-event count, or withdrawal count. Users can see the farm result but cannot quickly identify the animals contributing most to production or workload.

**Recommendation:** Group the existing report detail data by animal and display a compact sortable breakdown. Reuse the Animals response for ear tags and names before considering a new reporting endpoint.

### 6. Report period meaning is not fully consistent across KPIs

**Business value: Medium**

The applied date range filters milk, health, finance, locks, and alarms by different domain dates, while total animals remains a current all-time count. Active withdrawal locks also combine current status with lock start-date filtering. The UI presents these together as one applied period, which can lead to incorrect comparisons.

**Recommendation:** Define and label the period semantics for every KPI. First improve labels where the existing values are intentional; change API calculations only in a separately approved sprint if the required business meaning differs.

### 7. Dashboard reporting loads full detail datasets eagerly

**Business value: Medium now, higher as data grows**

Admin and veterinarian Dashboard loading retrieves complete report detail collections so the frontend can calculate queues, trends, and tables. This is simple for the current project size but will make the main operational screen slower as historical records grow.

**Recommendation:** Keep the current approach until measured data volume justifies change. When necessary, add narrowly scoped limits or summary queries within the existing monolith rather than introducing caching or background infrastructure.

## Quick Wins

- Replace typed Animal IDs with selectors backed by the existing Animals API.
- Show ear tag and animal name beside IDs in operational lists.
- Add confirmed Complete Alarm and Release Lock actions using existing PATCH APIs.
- Add limited low-stock and upcoming-vaccination Dashboard queues from existing responses.
- Derive recent milk comparison and average production-day metrics in Animal Profile.
- Add client-side per-animal report grouping from existing detail data.
- Clarify report KPI labels where values use different date semantics.

## Larger Improvements

- Change report KPI definitions if agreed business semantics require API calculation changes.
- Add server-side report grouping only if client-side grouping becomes insufficient.
- Add bounded or paginated Dashboard/report detail retrieval when real data volume demonstrates a performance problem.

These larger items should not be started until their business definitions and measured need are confirmed.

## Recommended Next Sprint Order

1. **Sprint 80 - Animal Selection and Identity Usability**  
   Replace typed IDs and add animal identity labels using the existing Animals API. This reduces daily entry errors with minimal contract risk.
2. **Sprint 81 - Dashboard Queue Actions and Risk Visibility**  
   Add existing alarm/lock state actions, then expose limited low-stock and vaccination-due queues using current APIs.
3. **Sprint 82 - Animal Production Context**  
   Add simple recent milk comparisons and averages derived from history already loaded by Animal Profile.
4. **Sprint 83 - Per-Animal Reporting Breakdown**  
   Group current report details by animal and clarify applied-period labels without changing backend contracts.
5. **Later, only if required - Reporting Semantics and Scale**  
   Approve precise KPI definitions before changing API calculations, and address data volume only after measurement.

## Verification

- Confirmed no source code files were modified.
- Confirmed no database, API, or frontend implementation changes were made.
- Confirmed the Git diff contains only this Sprint 79 note.

## Result

Completed as analysis-only documentation. The recommended order prioritizes daily error reduction and actionability before broader reporting changes.
