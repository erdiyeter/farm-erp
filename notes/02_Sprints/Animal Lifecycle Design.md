# Animal Lifecycle Design

## Purpose

Add basic animal lifecycle tracking to support:

- Herd performance analysis
- Exit statistics
- Future economic analysis
- Future Golden List / Black List features
- Future decision-support reporting

This is a data collection improvement only.

No AI functionality is included.

---

## Current Situation

The system currently tracks:

- Animal identity
- Health history
- Milk production
- Reproduction history
- Weight history

However, the system does not know:

- When an animal left the herd
- Why an animal left the herd

As a result:

- True herd turnover cannot be measured
- Exit statistics cannot be calculated
- Mortality rate cannot be calculated
- Sale rate cannot be calculated

---

## MVP Scope

Track only the final herd exit information.

No lifecycle event history.

No audit trail.

No event timeline.

---

## Database Changes

### animals

Add:

```text
exit_date
exit_reason
```

### exit_reason Values

```text
sold
died
culled
transferred
other
```

---

## Business Rules

### Active Animal

Animal remains active when:

```text
exit_date = null
```

### Exited Animal

Animal is considered exited when:

```text
exit_date is not null
```

### Validation

If exit_date exists:

```text
exit_reason required
```

If exit_reason exists:

```text
exit_date required
```

---

## Animal Profile

Add a new section:

```text
Lifecycle Information
```

Display:

```text
Exit Date
Exit Reason
```

If animal is active:

```text
Status: Active
```

If animal exited:

```text
Status: Exited
```

---

## Reporting Impact

Future reports may use:

### Exit Summary

- Total exits
- Exits by reason

### Mortality Summary

- Animals with exit_reason = died

### Sales Summary

- Animals with exit_reason = sold

### Herd Turnover

- Entry vs exit counts

---

## Dashboard Impact

No Dashboard changes in the first implementation.

Dashboard KPIs can be evaluated later after sufficient data exists.

---

## API Impact

Animal create/update endpoints extended with:

```text
exit_date
exit_reason
```

No new endpoints required.

Existing architecture remains unchanged.

---

## AI Readiness Impact

This addition enables future:

- Herd turnover analysis
- Mortality analysis
- Exit trend analysis
- Economic performance analysis
- Golden List preparation
- Black List preparation

---

## Complexity

Low

---

## MVP Decision

Approved for implementation.

Reason:

High future value with minimal complexity and no new architecture.{\rtf1}