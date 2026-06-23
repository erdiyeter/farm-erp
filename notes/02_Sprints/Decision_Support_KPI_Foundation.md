# Decision Support KPI Foundation

Sprint 141-145: Decision Support KPI Foundation

## Executive Summary

The current system has enough structured operational data to support a first generation of factual, rule-based decision-support KPIs. These KPIs can be implemented without machine learning, prediction, scoring engines, or new data models if they stay focused on transparent counts, recent activity, simple deltas, and existing economic summaries.

Ready KPIs are strongest in these areas:

- Animal lifecycle status and recent exits.
- Health activity counts and treatment frequency.
- Active withdrawal locks.
- Weight gain indicators based on at least two weight records.
- Economic value indicators where purchase value, sale value, configured milk price, milk records, and inventory-linked health costs exist.

Partially ready KPIs need threshold policy before they should be surfaced as decision-support indicators. For example, "High Milk Producer", "Low Milk Producer", "Repeated Treatments", and "High Health Activity" can be calculated from existing records, but the project does not yet define what qualifies as high, low, repeated, or concerning.

Not ready KPIs are those that require missing data or policy that does not exist yet, such as breed-normalized production, feed efficiency, genetic merit, disease risk scoring, or true profitability after feed, labor, depreciation, and overhead costs.

## Verified Current Data Sources

This assessment was checked against the implemented backend models, services, and reporting/dashboard structures. No fields or metrics are assumed unless present in code.

### Animal and Lifecycle Data

Source: `backend/app/models/animal.py`

Available fields:

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
- `is_active`
- `lactation_status`
- `active_lactation`
- `days_in_milk`

Decision-support relevance:

- Active versus exited animals.
- Recent exits.
- Sold, died, culled, transferred, and other exit classification.
- Active lactation and days in milk context.
- Basic purchase and sale economic context.

Missing:

- Animal purpose or production group.
- Breed benchmarks.
- body condition score.
- feed intake.
- cull reason detail beyond `exit_reason`.
- replacement status or herd role.

### Milk Data

Source: `backend/app/models/milk_record.py`

Available fields:

- `animal_id`
- `record_date`
- `milk_liters`
- `session`
- `notes`

Existing report/dashboard support:

- Today milk total.
- Last 7 days milk total.
- Total milk records.
- Total milk liters by date range.
- Average daily milk by date range.
- Recent milk records.

Decision-support relevance:

- High and low milk producer candidates.
- Recent production trend candidates.
- Lifetime milk production.
- Lifetime milk revenue when milk price is configured.

Missing:

- lactation-stage adjusted yield.
- parity-adjusted yield benchmarks.
- dry cow classification beyond lactation dates.
- milk quality data such as fat, protein, SCC, conductivity, or rejection status.

### Weight Data

Source: `backend/app/models/weight_record.py`

Available fields:

- `animal_id`
- `record_date`
- `weight_kg`
- `notes`

Existing report support:

- Total weight records.
- Latest weight.
- Latest weight record date.
- Average weight change across animals with at least two dated records.
- Animals with weight change.

Decision-support relevance:

- Latest weight.
- Weight change between latest and previous records.
- Average daily gain when two records have different dates.
- Low and high weight gain candidate flags.
- Missing recent weight record indicators.

Missing:

- target weight by age or breed.
- body condition score.
- feed intake.
- frame size or mature weight target.
- explicit animal growth group.

### Health Data

Source: `backend/app/models/health_record.py`

Available fields:

- `animal_id`
- `record_type`
- `diagnosis`
- `treatment`
- `medicine_name`
- `dosage`
- `record_date`
- `withdrawal_end_date`
- `notes`

Existing report/dashboard support:

- Total health records.
- Today health records.
- Last 7 days health records.
- Active withdrawal health records.

Decision-support relevance:

- Repeated treatment candidate.
- High health activity candidate.
- Treatment count.
- Active withdrawal based on health record withdrawal date.
- Health event count in animal economic summary.

Missing:

- diagnosis taxonomy.
- severity.
- outcome or recovery status.
- recurring condition classification.
- veterinary cost unless linked through inventory consumption with unit cost.

### Inventory and Treatment Cost Data

Source: `backend/app/models/inventory.py`

Available fields:

- Inventory item `unit_cost`.
- Inventory movement `item_id`.
- Inventory movement `movement_type`.
- Inventory movement `quantity`.
- Inventory movement `movement_date`.
- Inventory movement `notes`.

Existing integration:

- Treatment records can create inventory consumption movements.
- Animal economic summary can calculate health cost when a treatment has linked inventory consumption and the inventory item has `unit_cost`.

Decision-support relevance:

- Health cost component.
- Costed treatment candidate.
- Inventory-based treatment expense visibility.

Missing:

- non-inventory veterinary service cost.
- invoice-level costs.
- cost history by effective date.
- labor cost.

### Withdrawal Lock Data

Source: `backend/app/models/withdrawal_lock.py`

Available fields:

- `animal_id`
- `health_record_id`
- `start_date`
- `end_date`
- `reason`
- `is_active`

Existing dashboard/report support:

- Active withdrawal locks.
- Withdrawal locks expiring today.
- Overdue withdrawal locks.
- Withdrawal lock detail export.

Decision-support relevance:

- Active withdrawal lock indicator.
- Expiring withdrawal lock indicator.
- Overdue withdrawal lock indicator.

Missing:

- product impact classification such as milk withheld versus meat withheld.
- automatic lock completion policy.

### Reproduction Data

Source: `backend/app/models/reproduction_event.py`

Available fields:

- `animal_id`
- `event_type`
- `event_date`
- `pregnancy_status`
- `pregnancy_outcome`
- `offspring_count`
- `is_twin_birth`

Existing report support:

- Total reproduction events.
- Total matings.
- Total pregnancies.
- Total births.
- Total offspring.
- Twin births.
- Pregnancy outcomes.
- Animals with reproduction history.
- Last birth date.

Decision-support relevance:

- Current pregnancy context.
- Recent reproduction event context.
- Animal profile reproduction summary.

Missing:

- planned breeding windows.
- service sire.
- insemination method.
- pregnancy check due dates.
- calving interval target.
- fertility benchmark policy.

### Finance and Economic Data

Sources:

- `backend/app/models/finance.py`
- `backend/app/models/settings.py`
- `backend/app/services/animal.py`

Available fields and calculations:

- Farm-level financial records with `record_type`, `category`, `amount`, and `record_date`.
- Animal purchase price.
- Animal sale price.
- Global milk price setting.
- Lifetime milk production.
- Lifetime milk revenue when milk price exists.
- Health event count.
- Treatment count.
- Health cost when inventory consumption has unit cost.
- Net economic value when required components exist.

Decision-support relevance:

- Positive economic value.
- Negative economic value.
- Lifetime milk production.
- Lifetime milk revenue.
- Purchase and sale value context.

Missing:

- animal-level feed cost.
- animal-level labor cost.
- animal-level overhead allocation.
- depreciation.
- tax.
- direct link between general finance records and animals.

### Reporting and Dashboard Data

Sources:

- `backend/app/services/report.py`
- `backend/app/schemas/report.py`
- `backend/app/services/dashboard.py`
- `backend/app/schemas/dashboard.py`

Available report/dashboard support:

- Farm totals and operational counts.
- Date range summaries.
- Milk, health, weight, reproduction, lifecycle, finance, withdrawal lock, and alarm details.
- Dashboard counts for active animals, milk totals, health activity, and withdrawal locks.

Decision-support relevance:

- Good foundation for report-backed KPI aggregation.
- Current implementation is mostly summary-level, not per-animal ranking or flag output.

Missing:

- formal KPI response schema.
- per-animal KPI list endpoint.
- configured thresholds.
- user-visible KPI explanations.

## KPI Readiness Matrix

| KPI Candidate | Area | Readiness | Current Data Basis | Eligibility Rule | Calculation Rule | Missing Requirement |
| --- | --- | --- | --- | --- | --- | --- |
| High Milk Producer | Milk Production | Partially Ready | Milk records by animal and date | Animal has milk records in selected period | Compare animal milk total or average per day against chosen threshold | Threshold policy, lactation-stage context |
| Low Milk Producer | Milk Production | Partially Ready | Milk records by animal and date | Animal has milk records in selected period | Compare animal milk total or average per day below chosen threshold | Threshold policy, expected production context |
| Recent Milk Activity | Milk Production | Ready | Milk record dates | Animal has at least one milk record in recent window | Latest milk record date within configured window | Window length policy |
| No Recent Milk Record | Milk Production | Partially Ready | Milk record dates plus lactation fields | Active lactation animal only | No milk record in configured recent window | Window length policy |
| Lifetime Milk Production | Milk Production | Ready | Animal economic summary, milk records | Animal may have zero or more milk records | Sum all `milk_liters` for animal | None |
| Lifetime Milk Revenue | Economic Performance | Ready | Milk records plus settings `milk_price` | Milk price is configured | Lifetime milk production * milk price | None when milk price exists; otherwise unavailable |
| Latest Weight | Weight Growth | Ready | Weight records | Animal has at least one weight record | Most recent record by date and id | None |
| High Weight Gain | Weight Growth | Partially Ready | At least two weight records | Animal has two records with different dates | `(latest_weight - previous_weight) / days_between` above threshold | Threshold policy, animal age/group context |
| Low Weight Gain | Weight Growth | Partially Ready | At least two weight records | Animal has two records with different dates | `(latest_weight - previous_weight) / days_between` below threshold | Threshold policy, animal age/group context |
| Missing Recent Weight | Weight Growth | Ready | Active animals and weight record dates | Active animal | No weight record in last configured window | Window length policy |
| High Health Activity | Health Activity | Partially Ready | Health record count by animal and period | Animal has health records in selected period | Count health records above threshold | Threshold policy, severity not available |
| Repeated Treatments | Treatment Frequency | Partially Ready | Health records where `record_type = treatment` | Animal has treatment records in selected period | Count treatment records above threshold | Threshold policy, diagnosis grouping optional |
| Active Withdrawal Lock | Withdrawal Locks | Ready | Withdrawal lock `is_active` and `end_date` | Animal has active lock with end date today or later | Exists active lock where `end_date >= today` | None |
| Withdrawal Expiring Today | Withdrawal Locks | Ready | Withdrawal lock dates | Active lock exists | Exists active lock where `end_date == today` | None |
| Overdue Withdrawal Lock | Withdrawal Locks | Ready | Withdrawal lock dates | Active lock exists | Exists active lock where `end_date < today` | None |
| Recently Exited Animal | Animal Lifecycle | Ready | Animal `exit_date` and `exit_reason` | Animal has exit date | Exit date within configured recent window | Window length policy |
| Mortality Indicator | Animal Lifecycle | Ready | Animal `exit_reason = died` | Animal has exit date and died reason | Exit reason equals `died` | None |
| Sold Animal Indicator | Animal Lifecycle | Ready | Animal `exit_reason = sold` | Animal has exit date and sold reason | Exit reason equals `sold` | None |
| Positive Profit/Loss | Economic Performance | Ready | Purchase price and sale price | Both values exist | Sale price - purchase price > 0 | None |
| Negative Profit/Loss | Economic Performance | Ready | Purchase price and sale price | Both values exist | Sale price - purchase price < 0 | None |
| Positive Net Economic Value | Economic Performance | Ready with Data | Animal economic summary | Milk revenue, purchase value, sale value, and health cost are all calculable | Net economic value > 0 | Complete cost/revenue inputs for animal |
| Negative Net Economic Value | Economic Performance | Ready with Data | Animal economic summary | Milk revenue, purchase value, sale value, and health cost are all calculable | Net economic value < 0 | Complete cost/revenue inputs for animal |
| High Treatment Cost | Economic Performance | Partially Ready | Inventory-linked health cost | Animal has costed treatment consumption | Health cost above threshold | Threshold policy, non-inventory costs missing |
| Open Alarm | Operational Attention | Ready | Alarm `is_completed` | Alarm exists and is not completed | Count or list open alarms | Animal link is not available on alarm model |
| Animal-Specific Open Alarm | Operational Attention | Not Ready | Alarm has no animal_id | Not supported | Not supported | Add animal linkage if needed later |
| Reproduction Attention | Operational Attention | Partially Ready | Reproduction event history | Animal has reproduction events | Rule-based from current pregnancy status, birth history, or pregnancy outcome | Due-date/workflow rules not defined |

## Implementation-Ready KPI Rules

These rules are suitable for future backend implementation without introducing AI or scoring systems.

### Milk Production KPIs

#### Lifetime Milk Production

Readiness: Ready

Eligibility:

- Any animal.

Calculation:

- Sum all `MilkRecord.milk_liters` where `MilkRecord.animal_id = animal.id`.

Display:

- Show liters.
- Show `0` when no milk records exist.

Notes:

- This already exists in the animal economic summary.

#### Lifetime Milk Revenue

Readiness: Ready

Eligibility:

- Animal has milk records or zero production.
- Settings `milk_price` is configured.

Calculation:

- `lifetime_milk_liters * settings.milk_price`.

Display:

- Show `-` if milk price is unavailable.
- Show `0` only when milk price is configured and lifetime milk production is zero.

#### High Milk Producer

Readiness: Partially Ready

Eligibility:

- Animal has milk records in a selected period.
- Prefer active lactation animals when lactation data exists.

Candidate calculation:

- `animal_period_milk_liters / distinct_record_days`.
- Mark high if above a configured threshold.

Required future policy:

- Define default period, likely last 7 or 30 days.
- Define high threshold.
- Decide whether threshold is absolute or herd-relative.

#### Low Milk Producer

Readiness: Partially Ready

Eligibility:

- Active lactation animal.
- Animal has enough milk records in selected period.

Candidate calculation:

- `animal_period_milk_liters / distinct_record_days`.
- Mark low if below configured threshold.

Required future policy:

- Define period.
- Define low threshold.
- Define how to handle missing milk records separately from low production.

### Weight Growth KPIs

#### Latest Weight

Readiness: Ready

Eligibility:

- Animal has at least one weight record.

Calculation:

- Latest `WeightRecord` by `record_date desc, id desc`.

Display:

- Show weight in kg.
- Show record date.
- Show `-` if no record exists.

#### Weight Gain

Readiness: Ready

Eligibility:

- Animal has at least two weight records.
- Latest and previous records have different dates.

Calculation:

- `weight_change_kg = latest.weight_kg - previous.weight_kg`.
- `days_between = latest.record_date - previous.record_date`.
- `adg = weight_change_kg / days_between`.

Display:

- Show weight change, days between, and ADG.
- Show `-` when fewer than two records exist or dates are the same.

#### High Weight Gain

Readiness: Partially Ready

Eligibility:

- Weight gain is calculable.

Candidate calculation:

- Mark high when ADG is above configured threshold.

Required future policy:

- Define threshold.
- Decide whether thresholds vary by species, breed, age, or production group. Current data cannot fully support those variations.

#### Low Weight Gain

Readiness: Partially Ready

Eligibility:

- Weight gain is calculable.

Candidate calculation:

- Mark low when ADG is below configured threshold.

Required future policy:

- Define threshold.
- Decide how to treat negative ADG.

### Health and Treatment KPIs

#### Health Event Count

Readiness: Ready

Eligibility:

- Any animal.

Calculation:

- Count health records by animal.

Display:

- Show count.

#### High Health Activity

Readiness: Partially Ready

Eligibility:

- Animal has health records in selected period.

Candidate calculation:

- Count health records for animal in period.
- Mark high when count exceeds threshold.

Required future policy:

- Define period.
- Define threshold.
- Decide whether all record types are equal. Current model has record type but no severity.

#### Treatment Count

Readiness: Ready

Eligibility:

- Any animal.

Calculation:

- Count health records where `record_type = treatment`.

Display:

- Show count.

#### Repeated Treatments

Readiness: Partially Ready

Eligibility:

- Animal has treatment records in selected period.

Candidate calculation:

- Count treatment records in period.
- Mark repeated when count exceeds threshold.

Required future policy:

- Define period and threshold.
- Optional future improvement: group by diagnosis or medicine when reliable taxonomy exists.

### Withdrawal Lock KPIs

#### Active Withdrawal Lock

Readiness: Ready

Eligibility:

- Withdrawal lock exists for animal.

Calculation:

- Active lock exists where `is_active = true` and `end_date >= today`.

Display:

- Boolean indicator plus end date if available.

#### Expiring Withdrawal Lock

Readiness: Ready

Eligibility:

- Active withdrawal lock exists.

Calculation:

- Active lock exists where `end_date = today`.

Display:

- "Expires today".

#### Overdue Withdrawal Lock

Readiness: Ready

Eligibility:

- Active withdrawal lock exists.

Calculation:

- Active lock exists where `end_date < today`.

Display:

- "Overdue".

### Animal Lifecycle KPIs

#### Recently Exited Animal

Readiness: Ready

Eligibility:

- Animal has `exit_date`.

Calculation:

- `exit_date` within configured recent window.

Display:

- Show exit date and exit reason.

Required future policy:

- Define default recent window, likely 30 days.

#### Mortality Indicator

Readiness: Ready

Eligibility:

- Animal has `exit_date` and `exit_reason`.

Calculation:

- `exit_reason = died`.

Display:

- Show death/mortality indicator with exit date.

#### Sold Animal Indicator

Readiness: Ready

Eligibility:

- Animal has `exit_date` and `exit_reason`.

Calculation:

- `exit_reason = sold`.

Display:

- Show sold indicator with sale price if available.

### Economic Performance KPIs

#### Profit/Loss

Readiness: Ready

Eligibility:

- Animal has purchase price and sale price.

Calculation:

- `sale_price - purchase_price`.

Display:

- Positive, negative, or zero value.
- Show `-` if either value is missing.

#### Positive Economic Value

Readiness: Ready with Data

Eligibility:

- Net economic value is calculable.

Calculation:

- Mark positive if `net_economic_value > 0`.

Current net economic value inputs:

- Lifetime milk revenue.
- Sale value.
- Purchase value.
- Health cost.

Display:

- Show indicator only when net economic value exists.
- Show `-` when inputs are incomplete.

#### Negative Economic Value

Readiness: Ready with Data

Eligibility:

- Net economic value is calculable.

Calculation:

- Mark negative if `net_economic_value < 0`.

Display:

- Show indicator only when net economic value exists.
- Show `-` when inputs are incomplete.

Limitations:

- This is not full profitability. Feed, labor, overhead, depreciation, and tax are not available.

### Operational Attention Indicators

#### Open Alarm

Readiness: Ready at farm level, Not Ready at animal level

Eligibility:

- Alarm exists and is not completed.

Calculation:

- Count alarms where `is_completed = false`.

Animal-level limitation:

- Alarm model does not include `animal_id`, so an animal-specific open alarm KPI is not currently supported.

#### Missing Recent Weight

Readiness: Ready

Eligibility:

- Active animal.

Calculation:

- No weight record exists within configured recent window.

Required future policy:

- Define recent window, likely 30 days.

#### Missing Recent Milk

Readiness: Partially Ready

Eligibility:

- Active lactation animal.

Calculation:

- No milk record exists within configured recent window.

Required future policy:

- Define recent window.
- Confirm whether all active lactation animals are expected to have milk records.

## Missing Data Requirements

### Required for First KPI Implementation

- KPI threshold constants or settings for:
  - high milk producer.
  - low milk producer.
  - repeated treatments.
  - high health activity.
  - high weight gain.
  - low weight gain.
  - recent record windows.
- A formal per-animal KPI response shape if KPIs are exposed through APIs.
- Display labels and explanations so users understand why an animal was flagged.

### Useful But Not Urgent

- Animal production group.
- Animal purpose such as dairy, beef, breeding, replacement, or calf.
- Breed or age adjusted target values.
- Diagnosis taxonomy.
- Health severity.
- Treatment outcome.
- Milk quality fields.
- Animal-linked alarm field.

### Nice To Have / Defer

- Genetic scoring.
- breed benchmarks.
- feed intake.
- labor cost.
- overhead cost allocation.
- depreciation.
- advanced reproduction workflow due dates.

### Not Needed for Current Project Scope

- Machine learning model features.
- AI recommendations.
- predictions.
- external benchmark integrations.
- accounting ledger.
- full economic ranking engine.

## Recommended Future Implementation Order

### Phase 1: Simple Animal Profile Indicators

Implement per-animal display indicators using already available animal detail and related records.

Recommended KPIs:

- Latest weight.
- Weight gain and ADG.
- Health event count.
- Treatment count.
- Active withdrawal lock.
- Recently exited animal.
- Profit/loss.
- Net economic value when available.

Reason:

- These are transparent, low-risk, and already supported by current data.

Complexity:

- Low to Medium.

### Phase 2: Threshold-Based Operational Attention

Implement threshold-backed flags after threshold policy is defined.

Recommended KPIs:

- Missing recent weight.
- Missing recent milk for active lactation animals.
- Repeated treatments.
- High health activity.
- Low weight gain.

Reason:

- These are useful daily management indicators, but they require explicit threshold decisions to avoid arbitrary flags.

Complexity:

- Medium.

### Phase 3: Production Performance Indicators

Implement milk and weight performance indicators with transparent rules.

Recommended KPIs:

- High milk producer.
- Low milk producer.
- High weight gain.
- Low weight gain.

Reason:

- Existing data is sufficient for simple calculations, but production context and thresholds should be reviewed before surfacing labels.

Complexity:

- Medium.

### Phase 4: Economic Indicators

Expose economic value flags after enough animals have complete economic inputs.

Recommended KPIs:

- Positive profit/loss.
- Negative profit/loss.
- Positive net economic value.
- Negative net economic value.
- High treatment cost.

Reason:

- Calculations exist, but many animals may not have sale price, configured milk price, or costed health consumption. UI must distinguish unavailable from zero.

Complexity:

- Medium.

### Phase 5: Future Data Enhancements

Add only data fields that support clearly defined operational decisions.

Recommended additions:

- KPI threshold configuration.
- animal production group.
- animal-linked alarms.
- health severity and outcome.
- milk quality fields if milk trend analysis expands.

Reason:

- These improve KPI quality without introducing AI or ranking systems prematurely.

Complexity:

- Medium to High depending on UI and reporting scope.

## Scope Creep Warnings

Do not implement these in the first KPI sprint:

- AI recommendations.
- prediction models.
- weighted scoring.
- Golden List or Black List automation.
- economic ranking engine.
- breed benchmark logic.
- fertility scoring.
- disease risk scoring.
- feed efficiency analysis.
- full accounting profitability.

These require additional policy, data quality controls, and user-facing explanations. Adding them before factual KPI foundations would create misleading outputs.

## Final Recommendation

The project is ready for a first generation of factual decision-support KPIs, provided the first implementation stays rule-based and transparent.

Best next sprint:

- Add a small per-animal KPI summary backend helper or response section.
- Start with Ready KPIs only:
  - latest weight.
  - weight gain when calculable.
  - health event count.
  - treatment count.
  - active withdrawal lock.
  - recent lifecycle exit.
  - profit/loss when calculable.
  - net economic value when calculable.

Do not implement high/low labels until threshold rules are explicitly defined. Those KPIs are partially ready from a data standpoint, but not ready from a product-rule standpoint.
