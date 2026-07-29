# Platform Stabilization · Performance Report

**Documento:** `PERFORMANCE_REPORT.md`  
**Fase:** Platform Stabilization v1  
**Fecha:** 2026-07-29

---

## Problema

Re-renders en bucle en Ops Home (FCR-002) y posibles refetches de feature flags por identidad inestable de `roles`.

## Causa

| Origen | Efecto |
|--------|--------|
| `useCan().can` inestable | Loop de efectos + loading |
| `usePilotAdminModuleFlags` deps `[roles]` | Refetch si el array se recrea con el mismo set |

## Corrección

- Estabilizar `useCan`
- `rolesKey` ordenado en flags
- Ops Home: deps booleanas memoizadas

## Evidencia

Análisis estático + test de regresión. Profiler en browser: ⏳ pendiente.

## Resultado

| Métrica | Antes (hipótesis confirmada) | Después (código) |
|---------|------------------------------|------------------|
| Efectos Ops Home en idle | Continuo | Solo al cambiar user/tenant/roles/flags |
| Identidad `can` | Nueva cada render | Estable mientras `roles` estable |

Sin memoización generalizada ni refactors de Providers (restricción: no deuda cosmética).
