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

Prioritize **maintainability, architecture, clean code, and documentation** over development speed.

## Before writing code

Act as an architect first:

1. Review the constitution (`docs/`)
2. Review ADRs (`docs/adr/`)
3. Review domain model + ubiquitous language
4. Review existing Services / modules
5. Identify inconsistencies
6. Only then implement

## Governance

| Concern | Source of truth |
|---------|-----------------|
| Architecture, domain, schema, RBAC, roadmap | **`docs/` + ADRs + Cursor** |
| UI / visual flows | Lovable may accelerate — must follow docs |
| Conflicts with `.lovable/plan.md` | **docs win** |

- [Foundation Lock](./docs/05-architecture/FOUNDATION_LOCK.md) — gate before Module 01
- [Capability Matrix](./docs/09-security/CAPABILITY_MATRIX.md)
- [Ubiquitous Language](./docs/12-domain-model/UBIQUITOUS_LANGUAGE.md)
- [Roadmap v1](./docs/roadmap/README.md)

## Permanent rules

1. Canonical storage (grams, ml, km, °C, UTC, decimal currency).
2. Never `toLocaleString()` in product UI — use `useFmt()`.
3. Multi-tenant: `tenant_id` + RLS on business data.
4. Capabilities via `useCan` / `requireCapability` — not raw role checks in features.
5. `UI → Service → Repository → Supabase` — no business `supabase.from` in components.
6. Soft delete: `archive` / `restore` / `purge` — never Service `delete()`.
7. Typed `DomainError` — not bare `throw new Error` for expected cases.
8. Single `ServiceContext` into every Service.
9. Modules under `src/modules/<name>/{domain,application,infrastructure,presentation}`.
10. No architectural change after `v0.1.0` without a new ADR.
11. AI / offline — do not implement yet.

## Module order

```text
Foundation Lock → Dish Library → Ingredient Library → Recipe Builder → …
```

Module 01 starts with **domain entities**, not CRUD UI.
