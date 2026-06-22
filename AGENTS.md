# Farm ERP - Project Rules

## Project Goal

Farm ERP is a personal learning and long-term farm management project.

Goals:

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
- Monolithic
- Layered architecture

## Core Principles

- MVP first.
- YAGNI.
- Prefer simple solutions.
- Reuse existing code whenever possible.
- Preserve existing API contracts unless explicitly required.
- Preserve existing database structure unless explicitly required.

## Technology Constraints

Do not introduce new infrastructure or architectural patterns unless explicitly requested.

Examples:

- Microservices
- Event-driven architecture
- Redis
- Celery
- Kafka
- RabbitMQ
- GraphQL
- WebSockets
- Background workers

## Database Rules

- Reuse existing entities whenever possible.
- Do not create new tables unless required by the sprint.

## Backend Rules

- Follow existing repository/service/router structure.
- Keep validation in the service layer.
- Maintain consistent error handling.

## Frontend Rules

- Reuse existing components and styles.
- Avoid unnecessary CSS duplication.
- Maintain current UI patterns.

## Sprint Rules

Before implementation:

1. Inspect existing implementation.
2. Reuse existing patterns.
3. Minimize file changes.

After implementation:

1. Run only relevant verification.
2. Run frontend lint and build when frontend changes.
3. Run backend compilation when backend changes.

## Documentation

Every sprint must create or update:

notes/02_Sprints/Sprint_xx_Name.md

Required sections:

- Objective
- Scope
- Files Modified
- Implementation Summary
- Verification
- Result