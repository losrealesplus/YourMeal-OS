# 09 · Análisis conjunto de brechas (post batería VS-001…006)

**Estado:** ✅ tren MC aplicado vía [Operational Dynamics v0.2](../17-operational-model/07-operational-dynamics/README.md)  
**Principio 16:** no seis parches sueltos — un marco + un tren coherente

---

## Decisión de sesión (milestone)

En lugar de editar objeto a objeto los MC-001…006 como síntomas:

> **Operational Dynamics v0.2** unifica transiciones, Supporting, Checks y Recovery.

| Entregable Dynamics | Absorbe |
|---------------------|---------|
| Lifecycles 2.0 | MC-001 · 002 · 004 · Recovery · Impact · Temporal Grammar |
| Supporting Taxonomy | MC-003 Lot · MC-006 Location · Resources · Spatial |
| Checks 2.0 | MANUAL DECISION · PASS/WARNING/BLOCKED · todos los VR |

---

## Resultados de la campaña (recordatorio)

```text
Extended × 4 · Clarified × 2 · Contradicted × 0 · Core Δ × 0
```

---

## Tren de aplicación — ✅ cerrado

| # | Paso | Estado |
|---|------|--------|
| 1 | Vocabulario Dynamics (docs 07) | ✅ |
| 2 | Packaging Hold/Quarantine + Label Void (MC-004 · parte MC-003) | ✅ |
| 3 | Order Amend · Plan/Route Revise · Batch Pause (MC-001 · 002) | ✅ |
| 4 | Lot + INV-031 (MC-003) | ✅ |
| 5 | Location activo (MC-006) | ✅ |
| 6 | Cardinalidad docs (MC-005) | ✅ |
| 7 | KS · Coverage · **Beta** | ✅ |

Archivos tocados en `17`: `spine-transitions` · `support-transitions` · `checks-on-transitions` · `state-index` · `level-2-supporting` · `spine-flow` · `consistency` (INV-031) · taxonomy.

---

## Regla de oro

> Preferir **un** marco estructural (Dynamics) que cierre varios VR  
> antes que seis parches locales.

---

## Relacionado

- [07 Operational Dynamics](../17-operational-model/07-operational-dynamics/README.md)  
- [06 model-changes](./06-model-changes/README.md)  
- [validation-coverage](./05-validation-reports/validation-coverage.md) · [07 certification](./07-certification.md)
