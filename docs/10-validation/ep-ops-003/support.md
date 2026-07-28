# Support · Workspace Operational Journey

**Workspace:** Support  
**Landing:** `/admin/support`  
**Epic:** EP-OPS-003  
**Metodología:** FROZEN  
**Estado:** **NOT CERTIFIED**  
**Gate:** **FAIL**  
**Input:** **Orders Delivered** (Delivery) · continuidad OK  
**Outcome:** **Issues Resolved** · **no alcanzado**  
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
Issues Resolved  ✗  Gate FAIL
```

Upstream Kitchen + Delivery **no se reabren**.

---

## Pregunta maestra

> ¿Puede un agente, partiendo de Orders Delivered, gestionar una incidencia completa sin abandonar su Workspace?

**No** (falta resolución/cierre demostrable).

---

## Evidence Gate · Support

```text
STATUS: NOT CERTIFIED
Gate: FAIL
Outcome: Issues Resolved — NOT DEMONSTRABLE
```

**Siguiente:** Corrección P0 Support (lifecycle) → Re-certification · Accounting permanece bloqueado por continuidad (Input Issues Resolved / billing events incompletos hasta entonces).
