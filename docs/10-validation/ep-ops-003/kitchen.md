# Kitchen · Workspace Operational Journey

**Workspace:** Kitchen  
**Landing:** `/admin/kitchen`  
**Epic:** EP-OPS-003  
**Estado:** **CERTIFIED** (with OBSERVATIONS)  
**Gate:** **OBSERVATIONS**  
**Outcome:** **Production Ready**  
**Fecha:** 2026-07-28  

**Pack de evidencia:** [kitchen/](./kitchen/)

| Artefacto | Path |
|-----------|------|
| Journey KJ-01…04 | [KITCHEN_JOURNEY.md](./kitchen/KITCHEN_JOURNEY.md) |
| Validation / Gate | [KITCHEN_VALIDATION.md](./kitchen/KITCHEN_VALIDATION.md) |
| Negative Cases | [KITCHEN_NEGATIVE_CASES.md](./kitchen/KITCHEN_NEGATIVE_CASES.md) |
| Observations | [KITCHEN_OBSERVATIONS.md](./kitchen/KITCHEN_OBSERVATIONS.md) |

---

## Pregunta maestra

> ¿Puede Kitchen completar todo su trabajo operativo y entregar una producción lista para Delivery sin abandonar su Workspace?

**Sí** — actor `kitchen` · Outcome **Production Ready**.

---

## Objetivo operacional

Transformar demanda de pedidos en producción preparada para Delivery, íntegramente desde el Kitchen Workspace.

---

## Actor certificado

| Rol | Rol en Gate |
|-----|-------------|
| `kitchen` | **Actor de jornada CERTIFIED** |
| `operations_manager` / `company_admin` | Supervisión (tienen `kitchen.operate`) |
| `production` | **No** actor de este Gate (falta `kitchen.operate`) — OBS-K-03 |

---

## Journey (resumen)

```text
KJ-01 Recepción     → /admin/kitchen
KJ-02 Preparación   → /admin/production-sheet
KJ-03 Producción    → /admin/kitchen-execution + transiciones pedido
KJ-04 Finalización  → prepared → ready_for_delivery  = Production Ready
```

---

## Evidence Gate · Kitchen

```text
STATUS: CERTIFIED (with OBSERVATIONS)
Gate: OBSERVATIONS
Outcome: Production Ready

Evidence
  ☑ Journey completo
  ☑ Validation
  ☑ Negative Cases
  ☑ Observations / Risks
```

**Siguiente pack:** Delivery (Orders Delivered) — depende de Production Ready.
