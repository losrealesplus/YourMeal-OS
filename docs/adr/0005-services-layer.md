# ADR 0005 — Business logic in Services

## Status

Accepted — permanent

## Context

UI frameworks change; domain rules should not. Putting business rules in React components couples invariants to presentation and blocks reuse (admin, mobile, AI, jobs).

## Decision

- Never put business rules inside React components.
- Business logic belongs to Services under `src/services/`.
- Examples: DishService, InventoryService, AccountingService, RouteService, NotificationService, LocalizationService, ProductionService, AuditService, FeatureFlagService, PermissionService.
- Components may call Services and format results; they must not decide domain validity.

## Consequences

- Features start with a Service API, then UI.
- Server functions and future jobs share the same Services.
- Easier testing of rules without rendering React trees.
