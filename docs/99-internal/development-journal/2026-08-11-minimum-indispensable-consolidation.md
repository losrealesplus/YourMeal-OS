# 2026-08-11 — Minimum Indispensable MVP consolidation

## Qué

Consolidación Git de los P0 que cerraron el circuito Minimum Indispensable en OPPO
(canario `d0ddb630-…` → `in_production`).

## Por qué

E2E GREEN ya demostrado. Sin commit identificable no hay APK final trazable
(Zero Lost Changes).

## Incluido

- Customer materialization post-ActiveTenant
- Auth error UX (Customer)
- Menu dayDate + publish integrity + repair UI
- Orders layout Outlet + index
- `fmt.dateTime` ECMA-402 fix
- Tests asociados + diario

## Excluido

- `developer-platform-v1-performance.json` (baseline ajeno)
- Carpetas `docs/99-internal/evidence/*` (artefactos device; algunos con JWT en console dumps)

## Verdict

Consolidation ready → commit → PR → APK from SHA → OPPO smoke.
