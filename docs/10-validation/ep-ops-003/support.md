# Support · Workspace Operational Journey

**Workspace:** Support  
**Landing:** `/admin/support`  
**Epic:** EP-OPS-003  
**Metodología:** FROZEN  
**Estado:** ✅ **CERTIFIED**  
**Gate:** **OBSERVATIONS**  
**Input:** **Orders Delivered** (Delivery) · continuidad OK  
**Outcome:** **Issues Resolved** · alcanzado (tras Correction + Re-Certification)  
**Fecha:** 2026-07-28  

**Pack:** [support/](./support/)

| Artefacto | Path |
|-----------|------|
| Journey SJ-01…05 | [SUPPORT_JOURNEY.md](./support/SUPPORT_JOURNEY.md) |
| Validation / Gate | [SUPPORT_VALIDATION.md](./support/SUPPORT_VALIDATION.md) |
| Negative Cases | [SUPPORT_NEGATIVE_CASES.md](./support/SUPPORT_NEGATIVE_CASES.md) |
| Observations | [SUPPORT_OBSERVATIONS.md](./support/SUPPORT_OBSERVATIONS.md) |

---

## Continuidad

```text
Orders Delivered (Delivery CERTIFIED)
        ↓  Input OK
Support Journey
        ↓
FAIL (no lifecycle) → Correction → Re-Certification
        ↓
Issues Resolved  ✅  Gate OBSERVATIONS · CERTIFIED
```

Upstream Kitchen + Delivery **no se reabren** (regla de estabilidad).

---

## Pregunta maestra

> ¿Puede un agente, partiendo de Orders Delivered, gestionar una incidencia completa sin abandonar su Workspace?

**Sí** (actor `support`) — con observaciones residuales no bloqueantes.

---

## Evidence Gate · Support

```text
STATUS: CERTIFIED (with OBSERVATIONS)
Gate: OBSERVATIONS
Outcome: Issues Resolved
Prior Gate: FAIL (lifecycle missing) — corrected
```

**Siguiente:** Accounting Journey · Outcome Financial Records Complete.
