# Module convention (permanent)

**Target layout for every business module.** Prefer this over dumping files into flat `components/`, `hooks/`, `services/`, `pages/` as the codebase grows.

```text
src/modules/<module-name>/
  domain/           # Entities, value objects, states, domain errors (no I/O)
  application/      # Services / use-cases (business rules)
  infrastructure/   # Repositories, Supabase adapters
  presentation/     # Route-specific UI pieces (optional; routes may stay in src/routes)
```

## Example — Dish Library

```text
src/modules/dish-library/
  domain/
    entities.ts
    states.ts
  application/
    dish-service.ts
  infrastructure/
    dish-repository.ts
  presentation/
    README.md
```

## Rules

1. **domain/** never imports React, Supabase, or routers.
2. **application/** depends on domain + repository interfaces; performs capability checks, audit, state transitions.
3. **infrastructure/** is the only place that talks to Supabase for that aggregate.
4. **presentation/** calls application Services only — never Repository, never `supabase.from`.
5. Cross-module imports go through application APIs or shared `src/domain`, not reaching into another module’s infrastructure.

## Migration path

Foundation code may still live under `src/services` during Foundation Lock. New Module 01 work **starts** under `src/modules/dish-library/`. Existing services are re-homed or re-exported as modules land.

## Related

- [API philosophy](../10-api/README.md)
- [ADR 0005 Services](../adr/0005-services-layer.md)
- [Foundation Lock](../05-architecture/FOUNDATION_LOCK.md)
- [Operational Representation Pattern](./OPERATIONAL_REPRESENTATION_PATTERN.md) — Service → Report / Workspace (DICT-072)
