# ADR 0007 — Feature flags

## Status

Accepted — permanent (schema prepared; evaluation expands over time)

## Context

YourMeal OS will roll out beta features, plan-gated capabilities, and tenant-specific modules. Ad-hoc boolean checks in UI cause inconsistent rollout.

## Decision

Architecture is prepared for:

- Beta features
- Plan-based features
- Tenant features
- Controlled rollout

Table `feature_flags` stores flag key, scope, and targeting metadata. Evaluation belongs in FeatureFlagService / PermissionService — not scattered component conditionals.

## Consequences

- New modules can ship dark and enable per tenant.
- UI may hide surfaces based on `isEnabled("dish_library")` from a Service/hook.
- Flags are not a substitute for RLS.
