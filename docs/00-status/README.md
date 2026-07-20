# Status

**Last updated:** 2026-07-20

## Current phase

Foundation — architecture, multi-tenant schema, auth shell, localization, design tokens, Services scaffolding.

## Implemented

| Area | Status |
|------|--------|
| Multi-tenant schema + RLS | Done |
| EatClean Tenerife tenant seed | Done |
| Supabase Auth (email, phone, Google, Apple UI) | Done |
| Profiles + `user_roles` + `app_role` enum | Done |
| Localization service + `useFmt()` | Done (underused in UI) |
| Design tokens (Stainless industrial precision) | Done |
| Customer app shell (`/app`) | Placeholder |
| Admin shell + department routes (`/admin/*`) | Placeholders |
| SaaS admin shell (`/saas/*`) | Placeholders |
| Driver shell (`/driver`) | Placeholder |
| Role-based post-login home path | Done |
| Soft delete columns on business tables | Schema prepared |
| Global audit log table | Schema prepared |
| Feature flags table | Schema prepared |
| Services layer (`DishService`, Audit, Flags, stubs) | Prepared |
| Permissions / capabilities (`src/permissions`) | Prepared |
| Docs constitution + ADRs | Done |

## Not started

- Dish Library UI wired to `DishService` (first real feature)
- RBAC `beforeLoad` gates per department route
- Permission-filtered admin nav
- Monorepo (`apps/`, `packages/`) — documented target only
- PostHog, Resend, Google Maps, push
- AI, offline sync

## First business module

**Dish Library** — every other module depends on it. See [roadmap](../roadmap/README.md).

## Source of truth

- Product constitution: [02-vision](../02-vision/README.md)
- Permanent decisions: [adr/](../adr/)
- Agent rules: [/AGENTS.md](../../AGENTS.md)
