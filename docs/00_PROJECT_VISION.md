# 00 - Project Vision

## Project Name

Farm ERP

## Purpose

Farm ERP is a farm management system for small and medium livestock operations.

The project is both:

- A real farm management application intended for long-term use.
- A full-stack software development learning project.

The system manages animal records, health events, milk production, inventory, finances, operational alerts, weight tracking, reproduction events, settings, and reporting from one web application.

---

## Vision

Build a simple, reliable, and understandable farm management system.

Expand only when real operational needs appear.

The project prioritizes:

- Accuracy over speed.
- Simplicity over complexity.
- Sustainability over feature count.
- Learning over premature optimization.
- Documentation that matches the implemented system.

The long-term direction is to evolve from record keeping into decision support while preserving the current simple architecture.

---

## Target Users

Farm owner:

- Reviews operational status, animals, production, health, inventory, finances, and risks.

Farm worker:

- Enters and reviews daily operational records.

Veterinarian:

- Reviews animal history, treatments, withdrawal periods, and health-related alerts.

---

## Development Philosophy

- Build in layers.
- Keep architecture simple.
- Avoid speculative infrastructure.
- Keep documentation synchronized with code.
- Follow YAGNI.
- Treat `docs/09_TURKISH_TERMINOLOGY_GLOSSARY.md` as the SSOT for Turkish UI terminology.

---

## Layer 1 - Core MVP

Status: Completed.

Implemented scope:

- Animal management.
- Vaccination tracking.
- Milk production tracking.
- Basic dashboard.
- FastAPI backend.
- PostgreSQL database.
- React frontend.
- REST API.

---

## Layer 2 - Operational System

Status: Completed for the current implemented scope.

Implemented scope:

- Authentication with JWT.
- Role-aware backend route protection and frontend navigation.
- Animal lifecycle, lactation, exit, and economic fields.
- Health tracking.
- Inventory management.
- Health-to-inventory consumption workflow.
- Finance management.
- Withdrawal lock management.
- Alarm management.
- Weight tracking.
- Reproduction event tracking.
- Farm settings.
- Dashboard and reporting.
- CSV report exports.
- Frontend Turkish translation cleanup.

---

## Current Focus

The current project focus is documentation alignment and controlled operational improvement.

Priority areas:

- Keep documentation accurate.
- Preserve the simple React/FastAPI/PostgreSQL architecture.
- Improve existing workflows when needed.
- Avoid adding speculative systems such as Redis, Celery, microservices, event systems, AI services, mobile, or offline sync as current architecture.

---

## Layer 3 - Decision Support

Status: Future work.

Decision-support features may be expanded later using accumulated operational data.

Possible future areas:

- More advanced animal performance analysis.
- More advanced risk detection.
- More advanced reporting.
- AI-assisted analysis after enough reliable farm data exists.

These are not current implementation unless explicitly documented in the current architecture, API, database, and frontend guides.

---

## Success Definition

Farm ERP is successful when it remains:

- Useful in daily farm operations.
- Easy to understand and maintain.
- Technically sustainable.
- Supported by accurate documentation.
- Able to evolve without major rewrites.
