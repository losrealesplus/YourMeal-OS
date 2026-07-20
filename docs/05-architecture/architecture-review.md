# Architecture Review — YourMeal OS

**Date:** 2026-07-20  
**Author role:** Senior Software Architect  
**Scope:** Foundation as-built (no new features in this review)  
**Status:** Awaiting approval before Module 01 (Dish Library)

---

## Executive verdict

YourMeal OS has completed **FOUNDATION**. The product constitution (ADRs + `AGENTS.md` + `docs/`) is unusually clear for this stage. Multi-tenant schema, auth, shells, localization, RBAC scaffolding, and a real `DishService` exist.

The critical risk is **false readiness**: enterprise rules are documented and partially coded, but **runtime enforcement is incomplete**. Any authenticated user can open `/admin/*` and `/saas/*`. Hard `DELETE` remains granted on business tables while soft delete is the stated policy. Permissions (`useCan`) and formatters (`useFmt`) are largely unused.

**Recommendation:** Approve this review, close the Priority 0–1 gaps below, then implement Module 01 (Dish Library). Do not start Dish Library UI until route RBAC and soft-delete enforcement are decided.

---

## Governance shift (new stage)

Until now, the project was **creating a product** (often driven by Lovable prompts and plans).

From this point, the project is **building a software company around that product**.

| Concern | Source of truth | Lovable role |
|---------|-----------------|--------------|
| Architecture decisions | `docs/` + ADRs + Cursor | Do not invent architecture in Lovable |
| Domain rules | `docs/08-business-rules`, Services | UI only |
| Schema / RLS | `supabase/migrations` + `docs/06-database` | Apply migrations; do not redesign tables ad hoc |
| UI / components / visual flows | Can accelerate in Lovable | Must follow design tokens + Services |
| Feature order | Official roadmap v1 below | Do not skip modules |

`.lovable/plan.md` is historical context. When it conflicts with ADRs or this review, **ADRs and `docs/` win**.

---

## Official roadmap v1

```text
FOUNDATION ✅
    ↓
DOMAIN MODEL          ← current gate (this review)
    ↓
Dish Library          ← Module 01 (after review approval)
    ↓
Ingredients
    ↓
Weekly Menus
    ↓
Customers
    ↓
Orders
    ↓
Production
    ↓
Kitchen
    ↓
Inventory
    ↓
Purchasing
    ↓
Logistics
    ↓
Accounting
    ↓
Customer Support
    ↓
Reports
    ↓
AI                    ← deferred by ADR 0008
```

---

## As-built scorecard

| Area | Grade | Notes |
|------|-------|-------|
| Folder structure | B | Clear single-app layout; monorepo deferred correctly |
| Domain structure | B− | Schema broad; only DishService real; UI unwired |
| Feature boundaries | C+ | Route stubs, no feature modules yet |
| Reusable components | B | Strong shadcn base; named OS primitives missing |
| Services | B | Dish/Audit/Flags real; stubs exported (risk) |
| RBAC | C | Map exists; no route gates; nav unfiltered |
| Localization | A− | Solid service; `useFmt` unused in product UI |
| Supabase schema | A− | Wide, tenant-aware; soft delete incomplete on junctions |
| RLS policies | B− | Helpers sound; DELETE vs soft-delete; saas_admin write gaps |
| Navigation | B | Home-by-role works; permission UI missing |
| Design system | B | Tokens + shells; MetricCard/DataTable/StatusPill absent |
| State management | B | TanStack Query + auth hooks; no domain queries yet |
| Documentation | A− | Constitution strong; this review fills as-built gaps |
| Technical debt | — | See prioritized list |

---

## Detailed findings

### 1. Folder structure

**As-built:** single TanStack Start app under `src/` (routes, components, services, permissions, i18n, integrations, lib, hooks).

**Target (deferred):** `apps/{mobile,admin,marketing}` + `packages/{ui,auth,permissions,localization,…}`.

**Judgement:** Correct not to split yet (Lovable sync). Extract only after Dish Library proves the Services boundary.

### 2. Domain structure

Dish Library is correctly named the heart of the model. Schema includes `dishes`, `dish_ingredients`, `ingredients`, `suppliers`. `DishService` implements list/get/create/update/softDelete + audit. `/admin/dishes` is still a placeholder — **Module 01 not started**.

Dependent domains (menus, orders, kitchen, …) exist as empty tables + placeholder routes only. That matches the roadmap: domain tables ahead of features is acceptable if treated as **schema foresight**, not shipped modules.

### 3. Feature boundaries

No `features/dishes/` (or similar) package. Boundaries are route files + shared shells. Acceptable for foundation; before Module 01 grows, prefer:

```text
src/features/dishes/     # or keep services + routes but group clearly
  dish-service.ts        # already in src/services
  components/
  routes (or keep file routes)
```

UI must not call `supabase.from('dishes')` directly — only via Services.

### 4. Reusable components

| Exists | Missing (design plan) |
|--------|------------------------|
| `AdminShell`, `MobileShell`, `PlaceholderPanel` | `MetricCard`, `DataTable`, `StatusPill` |
| Full `components/ui/*` (shadcn) | Extracted `AdminSidebar`, `PhoneBottomNav` |
| Design tokens in `styles.css` | Tenant `--brand-primary` injection from `tenants.brand` |

### 5. Services

| Service | Status |
|---------|--------|
| DishService | Real — unwired to UI |
| AuditService | Real |
| FeatureFlagService | Real |
| Inventory / Accounting / Route / Notification / Production / Purchasing | Empty stubs |

**Gap:** No shared factory for `ServiceContext` (`supabase`, `userId`, `tenantId`, `ip`) used by routes/server functions. Module 01 must introduce this before UI calls DishService.

**Gap:** Docs mention Zod at service boundaries — DishService validates name only, no Zod schemas yet.

### 6. RBAC

**Prepared:** `app_role`, `user_roles`, SQL helpers, `src/permissions` capability map, `useCan()`, `homePathForRoles`.

**Not enforced:**

- `_authenticated/route.tsx` only checks session — not role/capability
- Any authenticated user can navigate to `/admin/*`, `/saas/*`, `/driver`
- Admin sidebar lists all departments regardless of capabilities
- `useCan` has **zero** consumers

### 7. Localization / regionalization

Centralized correctly (`localization.ts`, `useFmt`, regional columns on tenants/profiles, 6 languages). Product UI still mostly `useTranslation` only — formatters unused until first money/weight/date screens (Dish Library).

### 8–9. Schema & RLS

See [06-database](../06-database/README.md) for full inventory.

**P0 issues:**

1. `GRANT DELETE` + `dishes_delete` (and peers) allow hard delete despite soft-delete ADR.
2. Many write policies use `has_any_staff_role` without `is_saas_admin` — platform admins without tenant membership may fail writes.
3. Soft delete columns missing on some child/junction tables (`dish_ingredients`, `weekly_menu_slots`, …).

### 10. Navigation

Post-login redirect by role: **done**. Permission-filtered nav and surface gates: **not done**.

### 11. Design system

“Stainless industrial precision” tokens are live. Named operational primitives and tenant brand injection remain open.

### 12. State management

TanStack Query + Supabase auth listener + LocalizationProvider. No domain `queryKey` conventions yet — define them with Module 01.

### 13. Technical debt (priority order)

#### P0 — Must close before Module 01

| # | Issue | Why |
|---|-------|-----|
| 1 | No capability/`beforeLoad` gates on `/admin`, `/saas`, `/driver` | Security / false readiness |
| 2 | Hard DELETE still allowed on business tables | Violates soft-delete ADR |
| 3 | No `ServiceContext` builder for UI → Service calls | Module 01 cannot call DishService cleanly |

#### P1 — Should close with or immediately after Module 01 kickoff

| # | Issue | Why |
|---|-------|-----|
| 4 | Permission-filtered admin/SaaS nav | Constitution: UI by permissions |
| 5 | Wire Dish Library UI to DishService (Module 01) | First real domain loop |
| 6 | saas_admin write policy consistency | Platform ops |
| 7 | Zod (or equivalent) at Service input boundaries | Contract clarity |
| 8 | Stop exporting empty stubs as callable APIs (or mark `unimplemented`) | Accidental no-ops |

#### P2 — Improve while iterating

| # | Issue |
|---|-------|
| 9 | Extract MetricCard / DataTable / StatusPill |
| 10 | Drive `useFmt` in Dish Library screens |
| 11 | Soft delete on junction tables or cascade rules |
| 12 | Deduplicate STAFF_ROLES / sign-out helpers |
| 13 | Tenant brand CSS injection |
| 14 | Align `.lovable/plan.md` banner: docs supersede |
| 15 | Rename package `tanstack_start_ts` → `yourmeal-os` |

### 14. Missing documentation (addressed by this pass)

| Need | Action |
|------|--------|
| As-built architecture review | This document |
| Schema + RLS reality | Updated `06-database` |
| Business rules vs stubs | Updated `08-business-rules` |
| Domain dependency graph + Module 01 gate | Updated `12-domain-model` |
| Governance (Lovable vs Cursor/docs) | This section + `AGENTS.md` |

Still thin for later: API inventory (`10-api`), ERD diagrams, seed/role runbook.

---

## Proposed improvement sequence (approval checklist)

Before writing Module 01 feature code, approve this order:

1. **Approve** this Architecture Review and official roadmap v1.
2. **P0.1** — Route gates: staff → `/admin`, saas_admin → `/saas`, customer → `/app` (capability-aware where possible).
3. **P0.2** — Soft-delete enforcement: revoke app-level hard DELETE on business tables (or RLS forbid DELETE; Services only UPDATE `deleted_at`).
4. **P0.3** — Introduce `createServiceContext()` (or equivalent) used by all Services.
5. **Then** Module 01 — Dish Library UI + Ingredient links via DishService / IngredientService.
6. Continue roadmap: Ingredients → Weekly Menus → …

---

## Explicit non-goals of this review

- No new feature implementation
- No rewrite of working foundation code in this change set
- No AI / offline / monorepo split
- No Lovable-driven architecture redesign

---

## Sign-off

| Role | Decision |
|------|----------|
| Product / founder | Approve roadmap v1? |
| Architecture (Cursor + docs) | This review is the gate for Module 01 |
| Lovable | UI acceleration only after Module 01 scope is defined in docs |

**Next after approval:** Module 01 — Dish Library (implementation plan in a separate PR/plan; not started here).
