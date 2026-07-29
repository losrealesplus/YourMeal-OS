# Platform Stabilization · UI Stability

**Documento:** `UI_STABILITY.md`  
**Fase:** Platform Stabilization v1 · Pre-Flow Certification  
**Fecha:** 2026-07-29  
**Hallazgo ancla:** [FCR-002](../FCR002_FLICKER_INVESTIGATION.md)

---

## Problema

Titileo / parpadeo / vibración en Centro de Operaciones (`/admin`) en idle (sin interacción).

## Clasificación pre-check

| Campo | Valor |
|-------|-------|
| ID | FCR-002 |
| Estado previo | Investigar · sin fix |
| Pre-check | **VALID** — causa raíz aún presente en `main` |

## Causa

```text
useCan() → nueva función `can` cada render
    ↓
useEffect([…, can, …]) en Ops Home
    ↓
setLoading(true/false)
    ↓
re-render → nueva `can` → loop
```

`animate-fade-in` / `ops-home-in` **amplificaban** el síntoma al remount; no eran la causa.

## Corrección

1. `src/hooks/use-can.ts` — `can` / `canAny` estabilizados con `useCallback` + `useMemo` (deps = `roles`).
2. `src/routes/_authenticated/admin.index.tsx` — efecto de contadores depende de **booleanos de capability** (`showKitchen`, `canReadOrders`, …), no de la identidad de `can`.
3. `src/hooks/use-pilot-admin-module-flags.ts` — deps por `rolesKey` (set ordenado) para evitar refetch por churn de identidad del array `roles`.

## Evidencia

| Chequeo | Resultado |
|---------|-----------|
| `can` en deps del efecto Ops Home | Eliminado |
| Test `use-can.stability.spec.ts` | PASS |
| Causa documentada FCR-002 H1 | Confirmada e implementada |

## Resultado

| Campo | Valor |
|-------|-------|
| Código | ✅ Fix aplicado |
| Confirmación visual idle `/admin` | ✅ PASS (PS-001 · childList=0) |
| Bloqueo Flow | ❌ Levantado — ver [PLATFORM_STABILIZATION_COMPLETE](./PLATFORM_STABILIZATION_COMPLETE.md) |
