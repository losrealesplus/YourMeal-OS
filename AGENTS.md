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

## Governance (new stage)

We are past “create the product in prompts.” We are building a **software company around the product**.

| Concern | Source of truth |
|---------|-----------------|
| Architecture, domain, schema, RBAC, roadmap | **`docs/` + ADRs + this file (Cursor)** |
| UI components, visual flows, speed | Lovable may accelerate — **must follow docs** |
| Conflicts with `.lovable/plan.md` | **`docs/` and ADRs win** |

Do **not** invent architecture inside Lovable. Read the Architecture Review before Module 01.

- Constitution: [`docs/`](./docs/README.md)
- **Architecture Review (gate):** [`docs/05-architecture/architecture-review.md`](./docs/05-architecture/architecture-review.md)
- ADRs: [`docs/adr/`](./docs/adr/README.md)
- Roadmap v1: [`docs/roadmap/README.md`](./docs/roadmap/README.md)

## Permanent rules (never violate)

1. **Canonical storage** — grams, milliliters, kilometers, Celsius, UTC, decimal + ISO currency. Localize only at presentation.
2. **Localization** — Never `toLocaleString()` in product components. Always `useFmt()`.
3. **Multi-tenant** — All business data is tenant-scoped. New tables: `tenant_id` + RLS.
4. **Auth / RBAC** — Supabase Auth, profiles, tenant-aware roles. Do not hardcode permissions in UI; use `src/permissions` / `useCan`.
5. **Services** — No business rules in React components. Logic lives in `src/services/`.
6. **Soft delete** — Never hard-delete business records in app flows; set `deleted_at`.
7. **Audit** — Record who/what/when/old/new/tenant/IP on mutations.
8. **Feature flags** — Evaluate via FeatureFlagService for beta/plan/tenant rollout.
9. **AI / offline** — Do not implement yet; keep architecture compatible.

## Navigation

One app, one login. After login → Home. UI changes by department/permissions — not by switching apps.

## Module order

Follow official roadmap v1. **Do not start Dish Library implementation until the Architecture Review is approved** and P0 gaps (route gates, soft-delete enforcement, ServiceContext) are addressed.
