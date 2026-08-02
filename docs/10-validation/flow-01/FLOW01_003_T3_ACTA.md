# FLOW01-003 · T3 Packaging → Delivery · Acta

**Documento:** `FLOW01_003_T3_ACTA.md`  
**Fecha:** 2026-08-02  
**Entrega:** FLOW01-003  
**Spec:** [FLOW_01_KITCHEN_DELIVERY_SPEC](../../00-status/FLOW_01_KITCHEN_DELIVERY_SPEC.md) **FROZEN**  
**Plan:** [FLOW_01_DELIVERY_PLAN](../../00-status/FLOW_01_DELIVERY_PLAN.md)  
**Precondición:** FLOW01-002 ✅ MERGED (#144)

---

## Pregunta certificada

> ¿La transición T3 (Packaging → Delivery handoff) está certificada?

---

## Contrato observado

```text
FLOW01_T1_*           ✔
FLOW01_T2_*           ✔
FLOW01_T3_STARTED     ✔ (exactly once)
FLOW01_T3_COMPLETED   ✔ (exactly once)
FLOW01_T4_STARTED     BLOCKED
```

Dominio (alineado a Spec — **no** `out_for_delivery`; eso es T4):

```text
PackagingBatch IN_PROGRESS
        │  completePackaging
        ▼
PackagingBatch CLOSED (vía READY)
        │  assignDelivery
        ▼
orders.status = ready_for_delivery
+ DeliveryAssignment ASSIGNED
```

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| `FLOW01_T3_STARTED` una vez | ✅ |
| `FLOW01_T3_COMPLETED` una vez | ✅ |
| Sin tokens T4 | ✅ |
| `duplicates=[]` · `out_of_order=[]` | ✅ |
| PASS through T3 · BLOCKED at T4 | ✅ |
| Confirmación de entrega / `delivered` | ❌ FLOW01-004 |

---

## Comandos

```bash
npm run test:flow01-canonical -- --live
# certified_through=T3 · blocked_at=FLOW01_T4_STARTED · exit 2

npm run test:flow01-003
# --through=T3 · delivery PASS · exit 0
```

---

## Implementación

| Pieza | Path |
|-------|------|
| `completePackaging` | PackagingBatch → `CLOSED` · T3_STARTED |
| `assignDelivery` | `prepared`→`ready_for_delivery` + assignment · T3_COMPLETED |
| Assignment | `domain/delivery-assignment.ts` |

---

## Fuera de alcance

T4 (`out_for_delivery` / `delivered`) · facturación · incidencias de reparto
