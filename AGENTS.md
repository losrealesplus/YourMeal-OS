<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# YourMeal OS — Agent rules

**YourMeal OS** is the operating system for meal prep & catering. First tenant: EatClean Tenerife.

Prioritize **maintainability, architecture, clean code, and documentation** over development speed.

- Constitution: [`docs/`](./docs/README.md)
- ADRs (permanent): [`docs/adr/`](./docs/adr/README.md)
- Status: [`docs/00-status/README.md`](./docs/00-status/README.md)
- Roadmap: [`docs/roadmap/README.md`](./docs/roadmap/README.md)

## Permanent rules (never violate)

1. **Canonical storage** — grams, milliliters, kilometers, Celsius, UTC, decimal + ISO currency. Localize only at presentation.
2. **Localization** — Never `toLocaleString()` in components. Always `useFmt()`.
3. **Multi-tenant** — All business data is tenant-scoped. New tables: `tenant_id` + RLS.
4. **Auth / RBAC** — Supabase Auth, profiles, tenant-aware roles. Do not hardcode permissions in UI; use `src/permissions`.
5. **Services** — No business rules in React components. Logic lives in `src/services/`.
6. **Soft delete** — Never hard-delete business records in app flows; set `deleted_at`.
7. **Audit** — Record who/what/when/old/new/tenant/IP on mutations.
8. **Feature flags** — Evaluate via FeatureFlagService for beta/plan/tenant rollout.
9. **AI / offline** — Do not implement yet; keep architecture compatible.

## Navigation

One app, one login. After login → Home. UI changes by department/permissions — not by switching apps.

## First module

**Dish Library** (`DishService` + `/admin/dishes`) before menus, orders, kitchen, etc.
