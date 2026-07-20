# ADR 0009 — Foundation Lock

## Status

Accepted — 2026-07-20

## Context

The Architecture Review found false readiness: rules existed in docs and partial code, but runtime did not guarantee them. Before Module 01, the platform must be locked.

## Decision

1. Introduce **Foundation Lock** as a mandatory gate before any business module UI/CRUD.
2. Enforce **Runtime RBAC** on routes (not nav-only).
3. Enforce **soft delete**: Services expose `archive`/`restore`/`purge`; revoke client `DELETE` on business tables.
4. Mandate **Service → Repository → Supabase** and a single **ServiceContext**.
5. Mandate **typed domain errors**.
6. After tag `v0.1.0 FOUNDATION LOCKED`, no architectural change without a new ADR.
7. Module layout follows `src/modules/<name>/{domain,application,infrastructure,presentation}`.
8. Domain events package is scaffolded at `packages/events` (inactive).
9. Catalog roadmap becomes Dish Library → Ingredient Library → Recipe Builder.

## Consequences

- Short delay before Dish Library UI.
- Long-term protection against architecture drift.
- Lovable/Cursor must follow locked docs; conflicts resolved by ADRs.
