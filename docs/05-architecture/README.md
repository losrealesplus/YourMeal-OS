# Architecture

## Overview

Single PostgreSQL database. Multi-tenant via `tenant_id` + Row Level Security. One React application; UI surfaces change by role and department. Domain logic lives in Services, never in React components.

```text
┌─────────────────────────────────────────────────────────┐
│  React (TanStack Start) — presentation only             │
│  routes / components / hooks → call Services            │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Services (src/services)                                │
│  DishService · InventoryService · AccountingService …   │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Supabase (Auth + Postgres + RLS)                       │
│  tenants · profiles · user_roles · dishes · …           │
│  audit_log · feature_flags · soft deletes               │
└─────────────────────────────────────────────────────────┘
```

## Layers

| Layer | Responsibility | Must not |
|-------|----------------|----------|
| Routes / UI | Layout, forms, navigation, formatting via `useFmt` | Business rules, permission hardcoding |
| Hooks | Session, queries, UI state | Domain invariants |
| Services | Validation, workflows, audit hooks | JSX / UI concerns |
| Permissions | Role → capability checks | Scattered `if (role === …)` in components |
| Localization | Canonical → display | Direct `Intl` / `toLocaleString` in UI |
| Database | Canonical storage, RLS, constraints | Presentation formats |

## Navigation model

Everyone enters the same application. After login → **Home**. Interface changes by permissions.

| Path | Audience |
|------|----------|
| `/` | Public marketing |
| `/auth`, `/reset-password` | Unauthenticated |
| `/app/*` | Customers |
| `/admin/*` | Staff departments |
| `/saas/*` | SaaS administrators (planned) |
| `/driver/*` | Drivers (deferred) |

Post-login routing should use `useAuth().homePath` (not hardcode `/app`).

## Cross-cutting

| Concern | Location |
|---------|----------|
| Canonical units | ADR 0001 |
| Localization | `src/lib/localization.ts`, `useFmt()` |
| Multi-tenant | `tenant_id` + RLS helpers |
| Auth / roles | Supabase Auth, `profiles`, `user_roles` |
| Soft delete | `deleted_at` on business tables |
| Audit | `audit_log` |
| Feature flags | `feature_flags` |
| Services | `src/services/*` |

## Evolution

Target monorepo (`apps/`, `packages/`) is documented in [02-vision](../02-vision/README.md). Stay in the single app until extraction can be done without rewriting Lovable history or breaking sync.
