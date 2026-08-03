# FLOW05-006 · B6 Delivery · Acta

**Documento:** `FLOW05_006_B6_ACTA.md`  
**Fecha:** 2026-08-03  
**Entrega:** FLOW05-006  
**Spec:** [FLOW_05_SPEC](../../00-status/FLOW_05_SPEC.md) **FROZEN** (#237)  
**Precondición:** [FLOW05_005_B5_ACTA](./FLOW05_005_B5_ACTA.md) ✅ · Gate ✅ · Land Check from `main` @ `f0e1ebc`  
**Nivel:** Core Flow · YourMeal OS (tenant-agnostic · no EatClean-only)

> Certifica **una** transición: Ready for Delivery → **Delivered**.  
> No confirmación del cliente · no firma/PIN/QR · no B7+.

---

## Pregunta certificada

> ¿Queda certificada la transición Ready for Delivery → entrega física → Delivered (B6)?

---

## Contrato observado

```text
FLOW05_B1…B5_COMPLETED   ✔
FLOW05_B6_STARTED        ✔ (exactly once)
FLOW05_B6_COMPLETED      ✔ (exactly once)
FLOW05_B7_STARTED        BLOCKED (no emitido — fuera de alcance)
```

Spine:

```text
START · Ready for Delivery (outcome B5)
  ↓
Cola / preparado para salida
  ↓
Salida a reparto (startOutForDelivery)
  ↓
Entrega física (recordAttempt · stop stamp)
  ↓
Estado actualizado (completeDelivery)
  ↓
END · Delivered
```

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| B5 CERTIFIED | ✅ |
| Gate autoriza FLOW05-006 | ✅ |
| Delivery queue / ready presente | ✅ |
| Departure prepared presente | ✅ |
| Out for delivery presente | ✅ |
| Physical delivery presente | ✅ |
| Stop delivered stamp presente | ✅ |
| completeDelivery presente | ✅ |
| Delivered end transition presente | ✅ |
| Sin B7 Confirmation / incidents / history | ✅ |
| Runner: PASS through B6 · BLOCKED at B7 | ✅ |

---

## Comandos

```bash
npm run test:flow05-006
# → PASS through B6 · blocked_at=FLOW05_B7_STARTED · exit 0

npm run test:flow-05
# → PASS through B6 · blocked_at=FLOW05_B7_STARTED · exit 0

npm run test:flow-05:runner-only
# → BLOCKED at FLOW05_B1_STARTED · exit 2
```

---

## Implementación (presencia / integración)

| Pieza | Path |
|-------|------|
| Queue · transitions | `src/modules/operations/domain/operational-status.ts` |
| startOutForDelivery · completeDelivery | `src/modules/operations/application/operations-service.ts` |
| recordAttempt | `src/modules/delivery/application/delivery-service.ts` |
| markOrderStopsDelivered | `src/modules/delivery/application/route-service.ts` |
| B6 driver | `scripts/lib/flow-05-b6-delivery.mjs` |
| Runner | `CERTIFIED_THROUGH=6` |
| Evidence | `docs/10-validation/flow-05/evidence/flow-05-006-canonical-live.json` |

---

## Estados (plataforma)

```text
Order States (FLOW-05)     · … → ReadyForDelivery → Delivered  ← END B6
Operational States         · Loaded · InTransit · Arrived (internos · no reabren Spec)
```

B6 certifica el **Order State** `Delivered`. No consume B7 (`Confirmed`).

---

## Regla

```text
Cada bloque certifica exactamente una transición de estado.
B6: Ready for Delivery → Delivered.
No consume B7.
```

---

## Siguiente

Land Check desde `main` → **FLOW05-007 · B7 Delivery Confirmation** only.

---

## End of FLOW05-006 Acta
