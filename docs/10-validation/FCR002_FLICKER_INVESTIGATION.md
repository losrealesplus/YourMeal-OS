# FCR-002 · Render Stability Regression

**Severidad:** P1  
**Clasificación:** Render Stability Regression (no «solo titileo»)  
**Síntoma visible:** titileo / parpadeo / vibración en Ops  
**Estado:** ✅ **FIXED (código)** · ⏳ confirmación visual pendiente  
**Fix:** Platform Stabilization v1 — [UI_STABILITY](./platform-stabilization/UI_STABILITY.md)  
**Contexto:** Functional Review Mode · Centro de Operaciones

---

## Nota metodológica

| | |
|--|--|
| **Síntoma** | Titileo / parpadeo |
| **Clase de defecto** | **Render Stability Regression** |
| **Causa** | Render loop inducido por dependencia inestable (`can`) |

**Regla permanente (FOPEBA / FCR):** nunca registrar un síntoma como si fuera la causa.

---

## Cadena (confirmada)

```text
render
  → useCan()  (nueva referencia de `can`)
  → useEffect([…, can, …])
  → setLoading(…)
  → render
  → useCan()
  → …
```

---

## Corrección aplicada (2026-07-29)

1. `useCan()` — `useCallback` / `useMemo` sobre `roles`  
2. Ops Home — deps = booleanos de capability, no identidad de `can`  
3. Feature flags — `rolesKey` estable  

Confirmación: idle `/admin` sin titileo → marcar FCR-002 **CLOSED** en registro.

---

## Hipótesis históricas

| # | Hipótesis | Resultado |
|---|-----------|-----------|
| H1 | deps inestables `can` en Ops Home | ✅ Confirmada · fixed |
| H2 | remount por `router.invalidate` | No causa idle loop |
| H3 | polling | Solo Customer 60s |

---

## Cómo confirmar (smoke)

1. `/admin` Company Admin — ¿parpadea sin interacción? → debe ser **no**  
2. Profiler: Ops Home idle sin re-renders en bucle  
3. Ocultar DEV panel — síntoma no debe reaparecer  
