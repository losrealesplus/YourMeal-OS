# Architecture

**Source of truth for architecture decisions.** Lovable accelerates UI; it does not own architecture. See [Architecture Review](./architecture-review.md) and [ADRs](../adr/).

## Phase

**FOUNDATION ✅** — gate: [Architecture Review](./architecture-review.md) must be approved before Module 01 (Dish Library).

## As-built overview

Single PostgreSQL database (Supabase). Multi-tenant via `tenant_id` + RLS. One React application (TanStack Start); surfaces change by role. Domain logic belongs in Services.

```text
Browser
  └─ TanStack Start (src/routes)
       ├─ Auth gate only today (_authenticated)  ⚠ RBAC gates = P0
       ├─ Shells: AdminShell / MobileShell / SaaS shell
       ├─ Department + SaaS placeholders
       └─ hooks → Auth, permissions (unused), localization
                │
                ▼  intended path (DishService ready, UI unwired)
         src/services
                │
                ▼
         Supabase Auth + Postgres + RLS
```

## Layers

| Layer | Location | Responsibility | Must not |
|-------|----------|----------------|----------|
| Routes / UI | `src/routes`, `src/components` | Layout, forms, nav, `useFmt` | Business rules, hardcoded roles |
| Hooks | `src/hooks` | Session, capabilities, UI state | Domain invariants |
| Permissions | `src/permissions` | Role → capability | Scattered `if (role === …)` |
| Services | `src/services` | Validation, workflows, soft delete, audit | JSX |
| Localization | `src/lib/localization.ts` | Canonical → display | `toLocaleString` in product UI |
| Database | `supabase/migrations` | Canonical storage, RLS | Presentation formats |

## Navigation model

One login. After login → home by role (`homePathForRoles` / `resolveHomePath`).

| Path | Audience | Gate today |
|------|----------|------------|
| `/` | Marketing | Public |
| `/auth`, `/reset-password` | Auth | Public |
| `/app/*` | Customers | Session only |
| `/admin/*` | Staff departments | Session only ⚠ |
| `/saas/*` | SaaS admin | Session only ⚠ |
| `/driver` | Drivers | Session only ⚠ |

## Cross-cutting map

| Concern | Implementation | ADR |
|---------|----------------|-----|
| Canonical units | Schema conventions | 0001 |
| Localization | `useFmt` / Localization service | 0002 |
| Multi-tenant | `tenant_id` + RLS | 0003 |
| Auth / RBAC | Supabase + `user_roles` + capabilities | 0004 |
| Services | `src/services` | 0005 |
| Soft delete / audit | `deleted_at`, `audit_log` | 0006 |
| Feature flags | `feature_flags` | 0007 |
| AI / offline | Deferred | 0008 |

## Folder structure (as-built)

```text
src/
  routes/           # File-based TanStack Router
  components/       # Shells + shadcn ui/
  services/         # Domain services (Dish/Audit/Flags real)
  permissions/      # Capability map
  hooks/            # useAuth, useCan, language sync
  i18n/             # Locales + LocalizationProvider
  lib/              # localization, home-path, soft-delete
  integrations/     # Supabase, Lovable auth broker
supabase/migrations/
docs/               # Constitution + this architecture
```

Target monorepo (`apps/`, `packages/`) is deferred until Services + Dish Library prove boundaries without breaking Lovable sync.

## Governance

| Decision type | Owner |
|---------------|--------|
| Architecture, domain, schema, RBAC | Repository docs + Cursor |
| Visual UI, components, flows | Lovable allowed (must follow docs) |
| Feature order | [Roadmap v1](../roadmap/README.md) |

## Related

- [Architecture Review (full)](./architecture-review.md)
- [Database](../06-database/README.md)
- [Business rules](../08-business-rules/README.md)
- [Domain model](../12-domain-model/README.md)
