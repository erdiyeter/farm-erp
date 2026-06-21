# Architecture Decisions

This file records accepted rationale. Current technical details belong in `README.md`.

## AD-001 - Application Stack

**Decision:** Use React, FastAPI, and PostgreSQL.

**Reason:** The stack is simple, proven, and appropriate for the learning and farm-management goals.

**Status:** Accepted.

## AD-002 - Layered Monolith

**Decision:** Keep one monolithic backend with model, repository, service, and router layers.

**Reason:** It separates responsibilities without distributed-system complexity.

**Status:** Accepted.

## AD-003 - Selective Soft Deletion

**Decision:** Preserve historical Animals, Finance records, Withdrawal Locks, and Inventory Items using their existing active-state behavior.

**Reason:** Operational history must remain available where the implemented module requires it.

**Status:** Accepted.

## AD-004 - JWT Authentication and Fixed Roles

**Decision:** Use JWT access tokens and three fixed roles: admin, worker, and veterinarian.

**Reason:** This provides understandable MVP authorization without a role-management subsystem or permission matrix.

**Status:** Accepted.

## AD-005 - PostgreSQL Test Isolation

**Decision:** Run backend tests against PostgreSQL inside rollback-only outer transactions.

**Reason:** Tests exercise real database behavior while leaving persistent data unchanged.

**Status:** Accepted.

## AD-006 - Infrastructure Restraint

**Decision:** Do not add microservices, events, queues, caching, or background workers without a documented requirement.

**Reason:** Current workloads do not justify added operational complexity.

**Status:** Accepted.
