# ADR 0008 — AI and offline readiness

## Status

Accepted — permanent intent; **do not implement yet**

## Context

Future capabilities include demand prediction, automatic purchasing, production optimization, inventory forecasting, route optimization, and recommendations. Mobile/ops staff will eventually need offline sync.

## Decision

- Prepare architecture (canonical data, Services boundary, soft delete, audit, idempotent IDs) so AI and offline can plug in later.
- **Do not implement AI now.**
- **Do not implement offline synchronization now.**

## Consequences

- Avoid UI-only data shapes that cannot be reasoned over by jobs/models.
- Prefer explicit Service mutations that can later be queued/synced.
- Revisit with dedicated ADRs when implementation starts.
