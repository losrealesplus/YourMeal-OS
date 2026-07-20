# Vision

YourMeal OS is the operating system for meal prep & catering companies.

## North star

One shared platform where every department of a prepared-food company operates from a single canonical source of truth — menus, kitchen, production, purchasing, inventory, accounting, logistics, and customer support — with complete tenant isolation and enterprise-ready quality.

## Core principles

1. **Architecture before speed** — structure wins over shortcuts.
2. **Business rules outside UI** — React components never own domain logic.
3. **Canonical data** — store SI/UTC/decimal; localize only at presentation.
4. **Reusable components** — design system first.
5. **Scalable modules** — domain-driven, independently evolvable.
6. **Domain-driven thinking** — Dish Library is the heart of the model.
7. **Enterprise-ready quality** — audit, soft delete, RBAC, feature flags.

## Permanent architecture decisions

These rules are permanent. Every future feature must respect them.

Documented as ADRs:

| ADR | Topic |
|-----|-------|
| [0001](../adr/0001-canonical-storage.md) | Canonical storage units |
| [0002](../adr/0002-localization.md) | Centralized localization |
| [0003](../adr/0003-multi-tenant.md) | Multi-tenant isolation |
| [0004](../adr/0004-authentication-rbac.md) | Auth + RBAC |
| [0005](../adr/0005-services-layer.md) | Business logic in Services |
| [0006](../adr/0006-soft-delete-audit.md) | Soft delete + audit logging |
| [0007](../adr/0007-feature-flags.md) | Feature flags readiness |
| [0008](../adr/0008-ai-offline-ready.md) | AI / offline readiness (deferred) |

## Technology

**Now:** React, TypeScript, Vite (TanStack Start), Supabase, PostgreSQL, Tailwind, GitHub, Cursor, Lovable.

**Future:** PostHog, Resend, Google Maps, Push Notifications.

## Target project structure

Architecture should evolve into:

```text
apps/
  mobile
  admin
  marketing
packages/
  ui
  database
  auth
  permissions
  localization
  notifications
  maps
  shared
docs/
  ...
```

The current codebase is a single TanStack Start app. Monorepo extraction is planned; do not force a premature split that breaks Lovable sync.

## Development priority

Maintainability, architecture, clean code, and documentation over development speed.
