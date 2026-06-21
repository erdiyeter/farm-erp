# Farm ERP - Project Rules

## Project Goal

Farm ERP is a personal learning and long-term farm management project.

Primary goals:

- Learn software engineering concepts.
- Build a reliable MVP.
- Keep the system maintainable.
- Avoid unnecessary complexity.

## Architecture

Frontend:
- React (Vite)

Backend:
- FastAPI

Database:
- PostgreSQL

Architecture:
- Monolithic application
- Layered architecture

## Mandatory Principles

- MVP first.
- YAGNI.
- Prefer simple solutions.
- Reuse existing code whenever possible.
- Preserve existing architecture.
- Preserve existing API contracts unless explicitly required.
- Preserve existing database structure unless explicitly required.

## Forbidden Changes

Do not introduce:

- Microservices
- Event-driven architecture
- Redis
- Celery
- Kafka
- RabbitMQ
- GraphQL
- WebSockets
- Background workers
- New infrastructure dependencies

unless explicitly requested.

## Database Rules

- Do not create new tables unless required by the sprint.
- Reuse existing entities whenever possible.
- Prefer extending existing schemas over introducing new structures.

## Backend Rules

- Follow existing repository/service/router structure.
- Keep validation inside service layer.
- Maintain consistent error handling.
- Preserve existing endpoint behavior.

## Frontend Rules

- Reuse existing components and styles.
- Avoid unnecessary CSS duplication.
- Maintain current UI patterns.
- Preserve existing routes and navigation.

## Sprint Execution Rules

Before modifying code:

1. Inspect existing implementation.
2. Reuse existing patterns.
3. Minimize file changes.

After implementation:

1. Run relevant verification.
2. Run frontend lint when frontend changes.
3. Run frontend build when frontend changes.
4. Run backend compilation when backend changes.

## Documentation

Every sprint must create or update:

notes/02_Sprints/Sprint_xx_Name.md

The sprint note must contain:

- Objective
- Scope
- Files Modified
- Implementation Summary
- Verification
- Result



---

## Documentation Status

### Source of Truth

Project execution must follow:

1. AGENTS.md
2. PROJECT_STATUS.md
3. CODEX_RULES.md

### Documentation Refactor

Status:
Pending

Trigger:

After major operational enhancement work is completed and before AI/Layer 3 work begins.

Scope:

- Roadmap
- Architecture
- Database Design
- API Specification

Goal:

Synchronize documentation with the implemented system and archive obsolete statements.