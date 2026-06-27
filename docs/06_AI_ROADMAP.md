# 06 - AI Roadmap

## Status

AI is future work.

No AI service, AI model integration, prediction service, vector database, background worker, or AI-specific storage is part of the current Farm ERP implementation.

This document is only a future planning note.

---

## Rule

AI features must not be added before the system has enough reliable operational data.

AI must never invent facts that are not supported by Farm ERP records.

Any future AI feature must use real system data and clearly show uncertainty where appropriate.

---

## Data Needed Before AI

Useful AI or predictive features require accumulated records such as:

- Animal records.
- Milk records.
- Vaccination records.
- Health records.
- Weight records.
- Reproduction events.
- Finance records.
- Withdrawal locks and alarms.

---

## Possible Future Features

These are not current implementation.

### Mastitis Or Health Risk Scoring

Possible inputs:

- Recent milk production changes.
- Health history.
- Treatment history.
- Repeated illness records.

First versions should be rule-based before considering machine learning.

### Milk Production Forecasting

Possible inputs:

- Daily milk records.
- Lactation status.
- Historical production trends.

### Animal Priority Lists

Possible lists:

- Best-performing animals.
- Animals requiring attention.
- Animals with repeated health or production issues.

The current dashboard already has decision-support style review sections based on implemented data. Future AI should build on that only if needed.

### Assistant Interface

Possible future questions:

- Which animals need attention this week?
- Which animals show production decline?
- Which animals have repeated health issues?
- Which animals are economically weak?

---

## Not Current Architecture

Do not describe any of these as current Farm ERP architecture:

- AI service.
- LLM integration.
- Vector database.
- Embedding pipeline.
- Background prediction workers.
- Redis or Celery for AI jobs.
- Event-driven AI pipeline.

These may be considered only after a concrete operational requirement exists.
