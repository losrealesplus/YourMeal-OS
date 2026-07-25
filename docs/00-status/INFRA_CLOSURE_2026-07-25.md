# Infrastructure Closure Block — 2026-07-25

**Modo:** Freeze de features de negocio hasta cierre infra.  
**Motivo:** Bootstrap Supabase oficial OK; Auth migrado a nativo (código); binding y Dashboard pendientes.

## Carril activo

| Epic | Estado | Acción inmediata |
|------|--------|------------------|
| INFRA-002 Cutover | PR [#66](https://github.com/losrealesplus/YourMeal-OS/pull/66) OPEN | Pegar publishable oficiales → merge |
| INFRA-003 Auth | PR [#68](https://github.com/losrealesplus/YourMeal-OS/pull/68) OPEN — código ✅ | Merge tras #66 (o en paralelo solo si `.env` ya oficial) |
| INFRA-004 Prod readiness | [Doc](../10-validation/INFRA004_PRODUCTION_READINESS.md) | Dashboard Google + Redirect URLs → OAuth E2E → smoke → tag |

**Tag objetivo:** `v0.2.0-auth-complete`

## Binding

- Oficial: `djangucecsphnejplvic`
- Legacy a erradicar de runtime: `cbeegcxkayybfncnuirg`
- En `main` hoy: `.env` + `config.toml` aún legacy

## No hacer todavía

- Nuevos módulos Pedidos / Cocina / SaaS ampliados
- Assumir OAuth verde sin Dashboard + keys oficiales
- Escribir en Lovable Cloud con token solo lectura

## Docs

- [INFRA004](../10-validation/INFRA004_PRODUCTION_READINESS.md)
- [Checklist](../10-validation/checklists/INFRA004_PRODUCTION_READINESS_CHECKLIST.md)
- [INFRA-002.1 Lovable env](../10-validation/INFRA002_1_LOVABLE_ENV_CUTOVER.md)
