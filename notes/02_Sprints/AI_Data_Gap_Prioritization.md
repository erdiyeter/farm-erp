# AI Data Gap Prioritization and Preparation Plan

## Executive Summary

Farm ERP has enough implemented data for descriptive dashboards, longitudinal animal histories, and limited transparent rule-based decision support. It does not yet have the completeness, context, cross-domain attribution, or outcome labels needed for reliable composite rankings or predictive features.

The highest priority is not AI implementation. It is to make current operational data comparable and attributable. The recommended order is:

1. Define metric semantics and measure data completeness.
2. Complete core animal lifecycle context.
3. Add structured health status and outcomes.
4. Add lactation and reproduction-cycle context.
5. Improve weight context and introduce body condition tracking.
6. Establish animal/group-level economic attribution.
7. Accumulate consistent history and validate factual decision rules.

This plan intentionally excludes machine learning, predictions, composite AI scores, genomic analysis, sensor platforms, and negatively labeled animal lists.

## Evidence and Current AI Readiness

This plan was checked against the implemented domain models and schemas, reporting service/schema, Dashboard calculations, and Animal Profile calculations. No field or metric is treated as available unless it was confirmed in those files.

**Current AI readiness: Level 2.5 of 5 - Foundational to rules-ready.**

Confirmed strengths:

- Animal identity is stable through animal IDs and ear tags.
- Health, milk, weight, and reproduction histories are dated and animal-linked.
- Weight supports latest/previous measurement, weight change, days between records, and ADG calculations.
- Milk supports per-animal records, sessions, daily totals, and descriptive trends.
- Reproduction supports mating, pregnancy confirmation, birth, offspring count, and twin-birth derivation.
- Finance supports dated farm-level income and expenses.
- Inventory supports items, thresholds, and dated movements.
- Reporting supports date-filtered milk, health, weight, finance, lock, and alarm data.

Confirmed limitations:

- Animal birth date, sex, and breed are optional; location, lifecycle stage, entry, and exit context are absent.
- No lactation episode or days-in-milk data exists.
- No body condition record exists.
- Finance records have no animal or managed-group attribution.
- Inventory movements have no animal link and no durable source-record foreign key.
- Health lacks severity, resolution, structured outcome, vitals, and diagnostic coding.
- Weight lacks measurement method and quality context.
- Reproduction events are not linked into cycles and do not identify mates or offspring animals.
- Backend reporting does not include reproduction or inventory.
- No validated training labels or decision outcomes exist.

## Priority Definitions

| Classification | Meaning |
| --- | --- |
| Required for decision support | Needed to make a named decision-support feature factual, comparable, and operationally defensible. |
| Useful but not urgent | Improves interpretation or future scalability but is not required for the first transparent rules. |
| Nice-to-have / defer | Adds analytical depth after core coverage, linkage, and quality are established. |
| Not needed for current project scope | Would create scope or technical complexity without supporting the current operational roadmap. |

MVP status in this document means the current data collection status, not authorization to implement changes.

## Prioritized Missing Data List

### 1. Required for Decision Support

| Order | Data addition or preparation item | Area and features enabled | Current MVP status | Complexity | Why required | Future scalability |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Metric definitions, observation windows, minimum record counts, and missing-data rules | All KPIs, rankings, Golden List | Missing | Low | Existing frontend KPIs use valid but local formulas. Rankings need one documented definition for period, eligibility, ties, and missing records. | Versioned definitions allow future reports and services to produce consistent results. |
| 2 | Data completeness inventory for birth date, sex, breed, milk cadence, weight cadence, health outcomes, and reproduction sequences | All decision-support features | Missing | Low | Missing data can otherwise be mistaken for poor performance. | Completeness scores become eligibility gates rather than performance scores. |
| 3 | Enforce or actively collect birth date, sex, breed, and active lifecycle status | Growth, reproduction, milk cohorts, Golden List | Partial: fields exist but are optional | Low | Age, sex, and breed are basic comparison context. Current active status exists, but entry/exit history does not. | Supports stable cohort definitions without redesigning performance records. |
| 4 | Acquisition date/source, exit date/reason, lifecycle stage, and managed group/location | Animal lifecycle, denominator/exposure time, fair rankings | Missing | Medium | Counts need to distinguish time at risk, production stage, current location, and why an animal left. | A managed-group concept can later support economics and operational comparisons. |
| 5 | Lactation episode identifier/number, lactation start or linked birth, dry-off date, and expected milking frequency | Milk Trend Analysis, milk ranking, Golden List | Missing | Medium | Current milk liters are dated but not normalized by lactation stage or recording completeness. | Episode-based data supports multiple lactations and comparable production periods. |
| 6 | Health severity, open/resolved status, resolution date, and treatment outcome | Health Attention List, Golden/Black readiness | Missing | Medium | Record counts cannot distinguish a resolved minor checkup from severe unresolved illness. | Structured status/outcome fields support auditable rules and later outcome analysis. |
| 7 | Standardized diagnosis/symptom categories while retaining notes | Health Attention List and cross-animal health summaries | Partial: record type is structured; diagnosis is free text | Medium | Free text cannot reliably group recurring conditions or treatment outcomes. | Controlled vocabularies can expand without replacing narrative notes. |
| 8 | Reproduction cycle/attempt identifier linking mating, pregnancy check, and birth | Reproduction Ranking, current status, Golden List | Missing | High | Current events are chronological but not relationally grouped into one reproductive cycle. | Stable cycle IDs support multiple attempts, outcomes, and interval analysis. |
| 9 | Mate/sire, parity, expected due date, live/stillborn count, calving difficulty, and offspring animal links | Reproduction Ranking and lifecycle continuity | Missing | High | Offspring count alone does not measure reproductive efficiency or outcome quality. | Links establish multi-generation history without requiring genetic scoring. |
| 10 | Weight measurement method, quality flag, and standardized eligible comparison interval | Growth Performance Ranking | Missing | Low to Medium | ADG exists, but ranking can be distorted by same-day, irregular, or non-comparable measurements. | Quality flags and metric rules support future devices without depending on them. |
| 11 | Animal or managed-group attribution on finance records | Economic Ranking and Golden List | Missing | High | Current finance data is farm-level, so per-animal cost, revenue, and margin cannot be calculated. | Group attribution provides a practical fallback when individual allocation is not possible. |
| 12 | Structured source/purpose links for inventory movements, including originating health record where applicable | Health cost, medicine usage, Economic Ranking | Partial: treatment consumption is inferred from a generated movement note | Medium | Note-based linkage is fragile and general inventory consumption is not animal-attributable. | Source type/source ID can support multiple operational modules consistently. |
| 13 | Revenue attribution for milk and animal/offspring sales plus basic unit price/quantity | Economic Ranking and Golden List | Missing | High | Expenses alone are insufficient; current finance records do not identify production revenue sources. | Supports factual contribution margins before any advanced cost allocation. |

### 2. Useful but Not Urgent

| Data addition | Area | Current MVP status | Complexity | Justification | Future scalability |
| --- | --- | --- | --- | --- | --- |
| Dated body condition score with scoring scale and observer | Body condition, health, reproduction, growth | Missing | Medium | BCS adds valuable physiological context but is not required for current raw weight ADG or basic health recency rules. | A standalone dated history supports multiple species/scales more cleanly than a single animal field. |
| Health provider/veterinarian and treatment administration route | Health audit and treatment review | Missing | Low | Improves accountability and interpretation without blocking initial attention rules. | Can support provider workload and protocol adherence later. |
| Pregnancy check method and technician | Reproduction quality | Missing | Low | Improves confidence in confirmation records but is secondary to cycle/outcome linkage. | Supports auditability as reproduction workflows mature. |
| Milk quality values such as fat, protein, and somatic cell count | Milk quality trends | Missing | Medium | Important for richer production decisions but not required for volume trend analysis. | Numeric quality measurements can extend milk records or a dated quality history. |
| Explicit missing-record reason for milk and weight | Data quality and attention lists | Missing | Low | Separates operationally missing data from deliberate non-measurement. | Improves completeness analytics and prevents false negative rankings. |
| Feed/ration attribution by animal or managed group | Growth, milk, and economics | Missing | High | Valuable for efficiency analysis, but core lifecycle and attribution should be stable first. | Group-level collection can precede individual feed measurement. |
| Inventory supplier, item cost, batch/lot, expiry, and storage location | Inventory and health operations | Missing | Medium | Improves stock and medicine management but does not unblock the first animal performance lists. | Enables expiry, procurement, and traceability rules later. |
| Structured finance category taxonomy and counterparty/reference fields | Farm economics | Partial: category and description exist | Medium | Improves consistency before animal-level economic comparisons. | Stable categories reduce later migration and mapping work. |

### 3. Nice-to-Have / Defer

| Data addition | Reason to defer | Complexity |
| --- | --- | --- |
| Detailed milk laboratory panels beyond core quality measures | Requires collection equipment/processes and is unnecessary for volume trends. | High |
| Environmental context such as weather, temperature, and housing conditions | Useful only after core event completeness and animal/group location exist. | High |
| Automated scale, milking, or wearable sensor ingestion | Current manual dated records are adequate for initial rules; device integration adds data-quality and operational complexity. | High |
| Detailed feed nutrient composition and individual intake | Requires mature feed attribution and consistent measurement first. | High |
| Full accounting allocation for labor, depreciation, housing, and overhead | Basic direct cost/revenue attribution should be proven before complex allocation. | High |
| Pedigree depth beyond direct sire/dam links | Not required for current operational decision support. | Medium to High |
| Image, audio, or document datasets | No validated current decision-support use case requires unstructured media. | High |

### 4. Not Needed for Current Project Scope

- AI or machine-learning models.
- Predictive health, milk, growth, or reproduction scores.
- Genomic scoring or breeding recommendations.
- Automated Golden List scoring.
- A negatively labeled Black List.
- Computer vision, voice analysis, or biometric identification.
- Real-time streaming architecture or data lake infrastructure.
- External benchmark subscriptions.
- Autonomous alerts, treatments, breeding actions, or workflow automation.
- Collection of model training labels before operational decisions and outcomes are defined and validated.

## Area-by-Area Gap Classification

| Area | Required for decision support | Useful but not urgent | Defer | Not needed now |
| --- | --- | --- | --- | --- |
| Animal lifecycle | Complete core demographics; entry/exit; lifecycle stage; managed group/location | Acquisition source; direct sire/dam | Deep pedigree | Genomic scoring |
| Lactation tracking | Lactation episode/number; start/calving link; dry-off; expected cadence | Milk quality and explicit missing reason | Detailed lab panels | Predictive lactation curves |
| Body condition tracking | Not required for first raw weight/milk rules | Dated BCS history and observer | Automated image-based BCS | Computer vision scoring |
| Animal-level economics | Animal/group attribution; direct cost/revenue source; unit amount context | Counterparty and richer category taxonomy | Full overhead allocation | Predictive profitability |
| Health risk indicators | Severity; open/resolved; resolution; outcome; structured diagnosis/symptoms | Provider, route, basic vitals | Broad lab integration | Predictive disease risk |
| Milk trend analysis | Lactation context; expected recording cadence; data quality rules | Core quality values; feed/group context | Environmental enrichment | Prediction |
| Growth performance | Reliable age; measurement quality; eligible interval and coverage rules | BCS; feed/group context | Device telemetry | Growth prediction |
| Reproduction performance | Cycle linkage; mate/sire; parity; due date; live/stillborn outcome; offspring links | Check method and technician | Detailed reproductive lab data | Breeding recommendations |
| Golden List readiness | Metric contracts; completeness gates; comparable periods; lifecycle context; economic attribution | BCS, milk quality, feed context | External benchmarks | Automated opaque scoring |
| Black List readiness | No Black List recommended; use neutral factual attention lists with explicit reasons | Resolution workflow for attention items | None | Negative animal labels and automated removal recommendations |

## Decision-Support Feature Readiness Matrix

| Feature | Confirmed data currently available | Blocking gaps | Current readiness | Earliest defensible MVP |
| --- | --- | --- | --- | --- |
| Animal lifecycle view | Identity, optional demographics, active status | Entry/exit, reason, stage, group/location | Level 2 | Factual lifecycle status after Phase 1 |
| Lactation tracking | Milk date, liters, optional session; birth events exist separately | No lactation episode or birth link, dry-off, days in milk, cadence | Level 1.5 | Episode-based descriptive lactation view after Phase 3 |
| Body condition tracking | Weight only; no BCS field/history | Entire dated BCS dataset and scale definition | Level 1 | Simple BCS history after Phase 4 |
| Health Attention List | Dated health type, diagnosis text, treatments, withdrawals | Severity, open/resolved, structured condition, outcome | Level 3 for limited factual rules | Recency/frequency list now; clinical priority after Phase 2 |
| Milk Trend Analysis | Dated per-animal liters, session, dashboard/profile trends | Lactation context and cadence/completeness | Level 3 | Descriptive own-history trend now; comparable trend after Phase 3 |
| Growth Performance Ranking | Dated weights, latest/previous change, ADG | Eligibility window, quality, reliable age, coverage | Level 3 conditional | Transparent eligible-animal ranking after Phases 0-1 and 4 |
| Reproduction Ranking | Mating, confirmed pregnancy, birth, offspring, twins | Cycle, attempts, parity, mate, live/stillborn, exposure time | Level 2 | Factual event counts now; efficiency ranking after Phase 3 |
| Economic Ranking | Farm-level finance; inventory movement quantities | Animal/group costs and revenue, unit economics, allocation scope | Level 1 | Direct contribution summary after Phase 5 |
| Golden List | Separate milk, weight, health, and reproduction histories | Metric semantics, completeness, comparable cohorts, outcomes, economics | Level 2 | Multi-metric factual scorecard only after Phases 0-5; no opaque rank |
| Black List | Some factual attention indicators | Missingness bias, health severity/outcomes, economics, governance | Level 1 | Do not implement; provide neutral attention lists instead |

## KPI Root Cause and Consistency Summary

### Dashboard Weight KPI Binding

- The animal list endpoint returns active animals only.
- Its list response schema does not include `is_active`.
- Dashboard previously filtered that response again using `animal.is_active`, producing an empty set and zero/unavailable weight KPIs.
- The implemented fix correctly treats the returned animal list as the active-animal set.
- Preparation implication: API semantics and KPI eligibility rules must be documented; list contracts should not invite a second incompatible active-status filter.

### Weight ADG Definitions

- Animal Profile calculates ADG from one animal's latest two records when the dates differ.
- Dashboard calculates an average of calculable per-animal ADGs for active animals.
- These are valid but different metrics and are currently frontend-derived rather than part of one reporting metric contract.
- Preparation implication: define names, scope, eligibility, date handling, and precision before using ADG in ranking or Golden List logic.

### Reproduction KPI Semantics

- Dashboard `Total Pregnancies` counts all confirmed pregnancy event records, not the number of animals currently pregnant.
- Animal Profile derives current pregnancy status from the latest relevant pregnancy/birth event.
- Dashboard reproduction totals use the reproduction list API and are lifetime totals; backend reporting does not contain reproduction records or date-filtered reproduction totals.
- Preparation implication: distinguish `confirmed pregnancy events`, `currently pregnant animals`, and period-filtered pregnancy counts. Do not compare or rank these as if they were the same KPI.

### Reporting Coverage

- Backend reporting covers milk, health, weight, finance, withdrawal locks, and alarms.
- Reproduction and inventory are not in the reporting detail/summary contract.
- Preparation implication: a future cross-domain scorecard cannot assume one shared reporting period until those domains have aligned reporting semantics.

## Recommended Next Data Collection Phases

### Phase 0: Definitions and Data Quality Baseline

**Priority:** Immediate  
**Complexity:** Low  
**MVP status:** Missing

- Define each KPI, observation period, eligible population, minimum record count, and missing-data behavior.
- Measure completeness for existing demographics and record cadence.
- Define neutral attention-list terminology and prohibit missing data from being scored as poor performance.

**Justification:** This prevents repeating KPI binding/semantic inconsistencies and avoids collecting fields without a defined operational use.

### Phase 1: Animal Lifecycle and Cohort Foundation

**Priority:** First data addition  
**Complexity:** Low to Medium  
**MVP status:** Partial

- Improve collection of existing birth date, sex, and breed fields.
- Add entry/exit dates and reasons, lifecycle stage, and managed group/location.

**Justification:** Every performance denominator and comparison cohort depends on knowing who is active, for how long, at what stage, and in which management context.

### Phase 2: Health Status and Outcome Foundation

**Priority:** Second  
**Complexity:** Medium  
**MVP status:** Partial history; missing structured status/outcome

- Add severity, open/resolved status, resolution date, outcome, and structured condition categories.
- Preserve notes for clinical narrative.

**Justification:** This upgrades the existing factual Health Attention List from record frequency to operationally meaningful unresolved/severe cases.

### Phase 3: Lactation and Reproduction Episodes

**Priority:** Third  
**Complexity:** Medium to High  
**MVP status:** Milk and reproduction events exist; episode linkage is missing

- Collect lactation episode/number, start/calving link, dry-off date, and expected cadence.
- Link reproduction events into cycles and capture mate/sire, parity, due date, and birth outcomes.

**Justification:** Episode context is the largest blocker to fair milk and reproduction comparisons.

### Phase 4: Growth Context and Body Condition

**Priority:** Fourth  
**Complexity:** Medium  
**MVP status:** Weight history and ADG exist; context and BCS are missing

- Define eligible weight intervals and quality flags.
- Collect measurement method and explicit missing reason.
- Introduce a dated BCS history only after a scoring scale and collection process are agreed.

**Justification:** Current ADG supports simple rules; context and BCS improve interpretation without introducing predictions.

### Phase 5: Direct Animal/Group Economics

**Priority:** Fifth, after lifecycle/group identifiers stabilize  
**Complexity:** High  
**MVP status:** Farm-level finance only

- Attribute direct finance records to animals or managed groups.
- Add structured inventory movement source/purpose.
- Capture milk/animal sale revenue and basic unit price/quantity.
- Start with direct contribution only; defer overhead allocation.

**Justification:** Economic Ranking and a credible Golden List are impossible without attributable costs and revenues.

### Phase 6: Coverage Accumulation and Rule Validation

**Priority:** Continuous  
**Complexity:** Medium operational effort  
**MVP status:** Not measured

- Accumulate sufficient history under the agreed definitions.
- Review false positives/negatives in neutral attention lists.
- Validate that records are complete enough before enabling comparative rankings.

**Justification:** Adding fields does not create readiness until data coverage and operational consistency are demonstrated.

## Deferred Items

- Milk laboratory expansion beyond a small agreed core.
- Detailed environment and weather context.
- Automated sensors, wearables, scales, and milking integrations.
- Individual feed intake and nutrient optimization.
- Full overhead and depreciation allocation.
- Deep pedigree and genomic information.
- Unstructured media datasets.
- External breed benchmarks or target weights.
- Any predictive model or automated recommendation.

## Scope Creep Warnings

- Do not create an AI platform, feature store, data lake, or streaming architecture for this preparation work.
- Do not add fields without a named operational decision, owner, collection method, and validation rule.
- Do not combine lifetime, current-state, and date-filtered KPIs under the same label.
- Do not treat missing records as zero performance.
- Do not call event counts rates unless exposure time and denominator are defined.
- Do not rank animals across incompatible age, lifecycle, lactation, or management cohorts.
- Do not calculate animal profitability from farm-level finance totals.
- Do not infer health severity from free-text diagnosis alone.
- Do not interpret a confirmed pregnancy event count as current pregnancy prevalence.
- Do not use frontend-only formulas as enterprise metric definitions without documenting their scope.
- Do not implement a Black List. Use neutral, factual attention lists with visible criteria and data-quality exclusions.
- Do not collect genetics, images, sensors, or external benchmarks during the core preparation phases.

## Final Recommendation

Proceed with data preparation in the phased order above, starting with metric definitions and completeness measurement rather than schema expansion. The first practical decision-support target should be neutral factual attention lists and eligible-animal descriptive scorecards, not AI or composite ranking.

Growth and milk are the closest to readiness because numeric dated animal histories already exist. Health can support a limited attention list now but needs structured status and outcomes. Reproduction requires cycle and birth-outcome linkage. Economic Ranking, Golden List, and any cross-domain performance score must wait for animal/group attribution and consistent observation periods. Black List work should remain excluded from the project scope.

Reassess readiness only after the proposed fields are collected consistently for a meaningful period and completeness can be measured. Until then, the appropriate maturity target is reliable Level 3 rules-ready decision support, not Level 4/5 analytical or AI readiness.
