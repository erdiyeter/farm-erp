# 08 · Developer Rules

## Purpose

This document defines the development rules used in Farm ERP.

The goal is to keep the project understandable, maintainable, and aligned with real operational needs.

---

# Current Project Status

Current phase:

```text
Post-MVP Operational Enhancement Phase
```

MVP status:

```text
Completed
```

Development is now focused on:

- Documentation alignment
- Operational improvements
- Quality improvements
- Controlled feature expansion

---

# Core Principle

```text
Build the simplest working solution first.
Improve it only when a real need appears.
```

---

# Source of Truth Documents

Before starting any development work, review:

```text
AGENTS.md
PROJECT_STATUS.md
CODEX_RULES.md
```

These documents are the primary project references.

Rules already defined there should not be duplicated unnecessarily.

---

# Development Workflow

Development order:

```text
Analysis
    ↓
Design
    ↓
Implementation
    ↓
Verification
    ↓
Commit
```

Avoid jumping directly into coding without understanding the problem.

---

# Simplicity First

Prefer:

```text
Simple code
Simple architecture
Simple workflows
```

Avoid:

```text
Premature optimization
Architectural experimentation
Unnecessary abstractions
```

---

# YAGNI

Do not build features because they may be useful later.

Only build features that solve a current problem.

Questions to ask:

```text
Is this needed now?
Does the system currently require it?
Can it be added later without major issues?
```

If the answer is "yes", postpone it.

---

# Architecture Rules

Current architecture:

```text
React
  ↓
FastAPI
  ↓
PostgreSQL
```

Maintain this structure unless a real requirement proves otherwise.

---

# Technologies Not Currently Allowed

The following technologies should not be introduced without strong justification:

```text
Redis
Celery
RabbitMQ
Kafka
Microservices
Event Bus
CQRS
Event Sourcing
GraphQL
Workflow Engines
Complex Caching Systems
```

The current project does not require them.

---

# Database Rules

## Create Tables Only When Needed

A new table must have a clear operational purpose.

Do not create tables for speculative features.

---

## Avoid Duplicate Data

Prefer:

```text
Single Source of Truth
```

Avoid storing the same business information in multiple places.

---

## Business Logic Stays in Backend

Business rules belong in:

```text
Service Layer
```

Not in:

```text
Database triggers
Frontend code
```

unless there is a strong reason.

---

# API Rules

## Keep APIs Predictable

Prefer:

```text
Clear endpoints
Simple request models
Simple responses
```

Avoid unnecessary complexity.

---

## Maintain Consistency

Use:

```json
{
  "detail": "Message"
}
```

for standard error responses.

---

# Frontend Rules

## Function Before Appearance

Priority order:

```text
1. Works correctly
2. Easy to understand
3. Looks good
```

---

## Reuse Existing Patterns

Before creating:

```text
Component
Form
Page Layout
CSS Pattern
```

check whether one already exists.

---

## Avoid UI Complexity

The system is an operational tool.

Fancy UI should never reduce usability.

---

# Testing Rules

## Verify Every Feature

New work should be verified before completion.

Possible verification methods:

```text
Backend tests
Frontend build
Frontend lint
API testing
Manual testing
```

Use only the tests required by the change.

Avoid running large test suites unnecessarily.

---

## Fix Root Causes

Do not hide problems.

When an issue appears:

```text
Find cause
Fix cause
Verify fix
```

---

# Documentation Rules

## Documentation Must Match Reality

Documentation is part of the system.

If implementation changes:

```text
Code changes
→ Documentation changes
```

---

## Avoid Duplicate Documentation

Prefer updating existing documents.

Do not create multiple documents describing the same thing.

---

## Archive Obsolete Information

When information becomes outdated:

```text
Update it
Archive it
Remove it
```

Do not leave conflicting documentation.

---

# Codex Rules

## Read Only What Is Necessary

Before implementation:

```text
Read only files related to the task.
```

Avoid scanning unrelated modules.

---

## Keep Prompts Small

Prompts should focus on:

```text
Goal
Scope
Constraints
```

Avoid large repeated instructions.

---

## Reuse Existing Code

Prefer:

```text
Existing APIs
Existing services
Existing database structures
Existing UI patterns
```

before creating new ones.

---

## Sprint Notes

Sprint notes are not the primary source of project status.

Primary references are:

```text
PROJECT_STATUS.md
Roadmap
Architecture
Database
API Documentation
```

Sprint notes are historical records.

---

# Feature Evaluation Rules

Before adding a feature, evaluate:

## 1. Justification

```text
Why is this needed?
```

---

## 2. MVP Relevance

```text
Is it required for the current phase?
```

---

## 3. Complexity

```text
How difficult is it?
```

---

## 4. Future Expansion

```text
Can it grow later without redesign?
```

---

# Post-MVP Development Priorities

Current priority order:

```text
1. Documentation Alignment
2. Weight Tracking
3. Animal Profile Improvements
4. Operational Enhancements
5. Advanced Reporting
6. Role Permissions
7. AI Features
```

Future priorities may change based on operational needs.

---

# AI Development Rules

AI remains a future feature.

Requirements before AI:

```text
Enough real farm data
Reliable operational records
Stable workflows
```

AI should never invent facts.

AI should only use real system data.

---

# Learning Principle

Farm ERP is both:

```text
A real farm management system
A long-term learning project
```

Development speed is not the primary goal.

Understanding the system is more important than finishing quickly.

---

# Final Rule

When unsure:

```text
Choose the simpler solution.
```

Most long-term maintenance problems come from unnecessary complexity.