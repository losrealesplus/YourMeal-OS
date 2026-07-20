# API philosophy (permanent)

```text
Component / Route
       ↓
   Service          (business rules, capabilities, audit, state machine)
       ↓
   Repository       (persistence mapping only)
       ↓
   Supabase         (PostgREST + RLS)
```

## Rules

1. **No component talks directly to Supabase** for business data.
2. Auth/session bootstrap may use the Supabase auth client in hooks; **business tables** go through Service → Repository.
3. Services never expose raw SQL strings to UI.
4. Repositories never contain business rules (no “if order cancelled then…”).
5. RLS is mandatory — Repositories still filter by `tenant_id` and `deleted_at`.
6. All Service entry points receive a single **`ServiceContext`** (tenant, user, capabilities, localization, audit, flags, supabase client) — not loose parameters.

## Soft delete API shape

```text
archive(id)    // sets deleted_at (+ status archived when applicable)
restore(id)    // clears deleted_at
purge(id)      // hard delete — SaaS Admin + records.purge only
```

Never `delete()` on business Services.

## Events (future)

Domain events live under `packages/events` (scaffold). Services may emit events later for notifications, AI, automation — do not couple UI to side effects.

## Related

- [Module convention](../05-architecture/MODULE_CONVENTION.md)
- [Foundation Lock](../05-architecture/FOUNDATION_LOCK.md)
- [ADR 0005](../adr/0005-services-layer.md)
