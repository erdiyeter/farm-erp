# Animal Economics Foundation

Sprint 105-110 documentation-only analysis for future animal-level economic work.

## Executive Summary

The current system can support limited animal-level economics using existing animal, milk, health, lifecycle, finance, inventory, reporting, dashboard, and profile structures. The main blocker is that financial and inventory records are not linked to individual animals, and milk records store liters but no milk price. Therefore, most monetary animal-level metrics are not fully ready for calculation without additional data collection.

Current readiness:

- Animal lifecycle status: ready for identifying active and exited animals.
- Animal milk volume: ready for animal-level production volume.
- Animal health event count: ready for animal-level health activity.
- Direct animal revenue/cost: not ready because finance records are farm-level, not animal-level.
- Economic ranking: not ready until purchase, sale, milk price, and animal-linked cost data exist.

No economic calculations should be implemented yet. The next economic sprint should first add the minimum missing data fields and links.

## Verified Existing Data

Verified against implemented files:

- `backend/app/models/animal.py`
  - Animal identity, species, breed, sex, birth date.
  - Lifecycle fields: `exit_date`, `exit_reason`, `is_active`.
  - Lactation fields: `lactation_number`, `lactation_start_date`, `lactation_end_date`.
  - No purchase price, sale price, acquisition cost, or disposal amount.

- `backend/app/models/milk_record.py`
  - Animal-linked milk records via `animal_id`.
  - Record date, milk liters, session, notes.
  - No price per liter, revenue amount, quality premium, or buyer/payment link.

- `backend/app/models/health_record.py`
  - Animal-linked health records via `animal_id`.
  - Diagnosis, treatment, medicine name, dosage, record date, withdrawal end date.
  - No treatment cost, medicine cost, vet fee, labor cost, or inventory usage link.

- `backend/app/models/finance.py`
  - Farm-level financial records: income/expense, category, amount, record date, description.
  - No `animal_id`, no milk-record link, no health-record link, no inventory link.

- `backend/app/models/inventory.py`
  - Inventory item and movement tracking.
  - No animal-level allocation, no health-record usage link, no unit cost field verified in the model.

- `backend/app/schemas/report.py` and `backend/app/services/report.py`
  - Existing reporting aggregates total milk, health, weight, reproduction, lifecycle, finance, lactation, locks, and alarms.
  - Reports do not calculate animal-level monetary economics.

## Metric Readiness Matrix

| Metric | Readiness | Can Calculate Today | Missing Data |
|---|---:|---|---|
| Purchase Value | Not Ready | No | Animal purchase price, acquisition date/source, purchase transaction link |
| Sale Value | Partially Ready | Only sale occurrence, not amount | Sale price/amount, sale transaction link, buyer/market notes |
| Lifetime Milk Revenue | Partially Ready | Milk liters only | Milk price per liter, pricing period, milk sale/payment records, quality adjustments |
| Health Cost | Partially Ready | Health event count only | Medicine cost, vet fee, treatment cost, inventory usage, labor cost |
| Net Economic Value | Not Ready | No | Purchase value, sale value, milk revenue, animal-linked costs |

## Calculation Rules For Future Implementation

These rules are implementation-ready once missing data exists.

### Purchase Value

Definition:

```text
Purchase Value = animal.purchase_price
```

Fallback rule:

```text
If purchase_price is missing, Purchase Value = null, not 0.
```

Readiness: Not Ready.

Reason:

The animal model does not currently store purchase price or acquisition cost. Finance records may contain farm-level expenses, but they are not linked to animals.

### Sale Value

Definition:

```text
Sale Value = animal.sale_price or linked sale financial record amount
```

Eligibility:

```text
animal.exit_reason == "sold"
```

Fallback rule:

```text
If exit_reason == "sold" but no sale amount exists, Sale Value = null.
```

Readiness: Partially Ready.

Reason:

Lifecycle can identify sold animals using `exit_reason == "sold"` and `exit_date`, but no sale amount exists on the animal record and finance records are not animal-linked.

### Lifetime Milk Revenue

Definition:

```text
Lifetime Milk Revenue = sum(animal milk liters * applicable milk price)
```

If a single farm-level milk price exists in a future sprint:

```text
Lifetime Milk Revenue = total_animal_milk_liters * milk_price_per_liter
```

If price varies by date:

```text
Lifetime Milk Revenue = sum(record.milk_liters * price_for(record.record_date))
```

Readiness: Partially Ready.

Reason:

Milk volume is animal-linked and available. Revenue cannot be calculated because no milk price or milk payment data exists.

### Health Cost

Definition:

```text
Health Cost = sum(vet fees + medicine costs + treatment costs + allocated inventory usage)
```

Minimum future MVP:

```text
Health Cost = sum(health_record.cost_amount)
```

Readiness: Partially Ready.

Reason:

Health events are animal-linked, but no cost amount exists on health records. Inventory movements are not linked to animals or health records.

### Net Economic Value

Definition:

```text
Net Economic Value =
  Sale Value
  + Lifetime Milk Revenue
  - Purchase Value
  - Health Cost
  - Other Animal-Level Costs
```

For active animals:

```text
Net Economic Value =
  Lifetime Milk Revenue
  - Purchase Value
  - Health Cost
  - Other Animal-Level Costs
```

Readiness: Not Ready.

Reason:

The required monetary inputs do not exist at animal level yet.

## What Can Be Calculated Today

Animal-level operational economics proxies:

- Total lifetime milk liters per animal.
- Total milk records per animal.
- Total health records per animal.
- Treatment count per animal if using health record type.
- Lifecycle status: active or exited.
- Sale indicator: `exit_reason == "sold"`.
- Mortality/culling indicator: `exit_reason == "died"` or `exit_reason == "culled"`.
- Lactation status and DIM for dairy context.

These are not monetary metrics. They can support future economics screens as context, but should not be labeled as economic value.

## Missing Data Inventory

Required for MVP animal economics:

- Animal purchase value.
- Animal sale value.
- Animal-level cost amount on health records or linked health expenses.
- Milk price per liter or milk sale/payment records.
- Animal linkage for finance records, or specific domain links from finance records to animal/milk/health records.

Useful but not urgent:

- Acquisition date and source.
- Sale buyer/market notes.
- Medicine unit cost.
- Inventory movement unit cost.
- Health record inventory usage link.
- Feed cost allocation method.

Defer:

- Labor allocation by animal.
- Facility overhead allocation.
- Genetic value.
- Projected future milk revenue.
- AI economic ranking.

## Recommended Implementation Order

1. Add animal purchase and sale value fields.

Reason:

This is the smallest missing foundation for lifecycle economics. It makes purchase value and sale value directly calculable.

MVP status:

Required.

Complexity:

Low.

2. Add a simple milk price source.

Reason:

Milk records already contain animal-level liters. A simple price-per-liter table or configurable price enables lifetime milk revenue.

MVP status:

Required for milk revenue.

Complexity:

Medium.

3. Add health cost amount.

Reason:

Health records are already animal-linked. A simple optional cost field enables direct animal health cost without inventory allocation.

MVP status:

Required for health cost.

Complexity:

Low.

4. Add optional `animal_id` linkage to finance records.

Reason:

This enables animal-level expense/income attribution beyond milk and health. It should follow the direct fields above because broad finance allocation can become ambiguous.

MVP status:

Useful after direct economic fields.

Complexity:

Medium.

5. Link inventory usage to health records.

Reason:

This supports medicine/feed cost rollups, but it is more complex than a direct health cost amount.

MVP status:

Defer until direct health costs are working.

Complexity:

High.

## Future Economic Report Shape

Recommended future animal economics response:

```text
animal_id
animal_label
purchase_value
sale_value
lifetime_milk_liters
lifetime_milk_revenue
health_cost
other_income
other_expense
net_economic_value
readiness_flags
```

Recommended readiness flags:

- Missing purchase value.
- Missing sale value for sold animal.
- Missing milk price.
- Missing health cost.
- Missing animal-linked finance.

## Compatibility With Future AI And Ranking

Golden List / Economic Ranking needs:

- Net economic value.
- Milk revenue.
- Health cost.
- Lifecycle outcome.
- Reproduction and lactation context.

Black List / Attention List needs:

- High health cost.
- Low or missing milk revenue.
- Mortality/culling lifecycle outcomes.
- Repeated failed reproduction outcomes.

Current system is not ready for AI or economic ranking because monetary labels are missing. It is ready to collect operational context that future ranking can use once economic fields are added.

## Scope Guardrails

Do not implement in the economics foundation sprint:

- Economic calculations.
- Ranking.
- AI recommendations.
- Cost allocation algorithms.
- Forecasting.
- Milk yield prediction.
- Feed efficiency.
- Genetic scoring.

Do not infer monetary value from notes, categories, or descriptions. If a number is not stored in a structured field and linked to the animal or relevant record, mark the metric as missing.

## Final Recommendation

Proceed with a staged animal economics foundation:

1. Add direct purchase/sale values on animals.
2. Add simple milk price support.
3. Add direct health cost support.
4. Add animal-linked finance records only after direct MVP metrics are available.

Until those fields exist, report economic readiness and operational proxies only. Do not calculate net economic value or economic rankings from incomplete data.
