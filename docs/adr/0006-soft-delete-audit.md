# ADR 0006 — Soft delete and audit logging

## Status

Accepted — permanent

## Context

Meal prep / catering operations need history for food safety, accounting, and support. Hard deletes destroy evidence and break historical references (orders → dishes).

## Decision

### Soft delete

- Business records are never permanently deleted via application flows.
- Use `deleted_at timestamptz` (null = active).
- Services default to filtering `deleted_at IS NULL`.
- Prefer soft delete over `DELETE` statements in Services.

### Audit logging

Prepare global audit logging with at least:

| Field | Meaning |
|-------|---------|
| Who | `actor_id` |
| What | `entity_type` + `entity_id` + `action` |
| When | `created_at` |
| Old value | `old_data` jsonb |
| New value | `new_data` jsonb |
| Tenant | `tenant_id` |
| IP | `ip` (when available) |

Table: `audit_log`. Writes go through AuditService (or Service helpers).

## Consequences

- Historical order lines can still resolve dish IDs after archive/soft-delete.
- Compliance and debugging improve.
- Storage grows; retention policies may be added later without changing the pattern.
