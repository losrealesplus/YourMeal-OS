# FLOW05-005 · B5 Route Planning · Acta

**Documento:** `FLOW05_005_B5_ACTA.md`  
**Fecha:** 2026-08-03  
**Entrega:** FLOW05-005  
**Spec:** [FLOW_05_SPEC](../../00-status/FLOW_05_SPEC.md) **FROZEN** (#237)  
**Precondición:** [FLOW05_004_B4_ACTA](./FLOW05_004_B4_ACTA.md) ✅ · Gate ✅ · Land Check from `main` @ `1181c21`  
**Nivel:** Core Flow · YourMeal OS (tenant-agnostic · no EatClean-only)

> Certifica **una** transición: Ready for Route Planning → **Ready for Delivery**.  
> No salida a reparto · no tracking · no confirmación · no B6+.

---

## Pregunta certificada

> ¿Queda certificada la transición Ready for Route Planning → ruta operable lista para entrega (B5)?

---

## Contrato observado

```text
FLOW05_B1…B4_COMPLETED   ✔
FLOW05_B5_STARTED        ✔ (exactly once)
FLOW05_B5_COMPLETED      ✔ (exactly once)
FLOW05_B6_STARTED        BLOCKED (no emitido — fuera de alcance)
```

Spine:

```text
START · Ready for Route Planning (outcome B4)
  ↓
Pedido elegible (prepared → ready_for_delivery)
  ↓
Asignación logística (assignDeliveryOrder)
  ↓
Ruta planned · driver · secuencia (addStop)
  ↓
Ruta validada (nextRouteStatuses)
  ↓
END · Ready for Delivery (edge before out_for_delivery)
```

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| B4 CERTIFIED | ✅ |
| Gate autoriza FLOW05-005 | ✅ |
| Route planning entry presente | ✅ |
| Eligibility presente | ✅ |
| Delivery assignment presente | ✅ |
| Route · driver · sequence presentes | ✅ |
| Route validated presente | ✅ |
| Ready for Delivery presente | ✅ |
| Sin B6 Delivery execution / tracking | ✅ |
| Runner: PASS through B5 · BLOCKED at B6 | ✅ |

---

## Comandos

```bash
npm run test:flow05-005
# → PASS through B5 · blocked_at=FLOW05_B6_STARTED · exit 0

npm run test:flow-05
# → PASS through B5 · blocked_at=FLOW05_B6_STARTED · exit 0

npm run test:flow-05:runner-only
# → BLOCKED at FLOW05_B1_STARTED · exit 2
```

---

## Implementación (presencia / integración)

| Pieza | Path |
|-------|------|
| assignDelivery | `src/modules/operations/application/operations-service.ts` |
| Status eligibility / END edge | `src/modules/operations/domain/operational-status.ts` |
| Assignment composition | `src/modules/operations/domain/delivery-assignment.ts` |
| Route · driver · stops | `src/modules/delivery/application/route-service.ts` |
| Route status machine | `src/modules/delivery/domain/route-status.ts` |
| B5 driver | `scripts/lib/flow-05-b5-route-planning.mjs` |
| Runner | `CERTIFIED_THROUGH=5` |
| Evidence | `docs/10-validation/flow-05/evidence/flow-05-005-canonical-live.json` |

---

## Clasificación de estados (plataforma)

```text
Identity States     · Anonymous → Registered → Authenticated
Order States        · Draft → Ready for Production → … → Ready for Delivery  ← FLOW-05
Operational States  · Queued · In Production · On Route (internos)
```

FLOW-05 certifica **Order States**. Los Operational States pueden evolucionar sin reabrir el Spec.

---

## Regla

```text
Cada bloque certifica exactamente una transición de estado.
B5: Ready for Route Planning → Ready for Delivery.
No consume B6.
```

---

## Siguiente

Land Check desde `main` → **FLOW05-006 · B6 Delivery** only.

---

## End of FLOW05-005 Acta
