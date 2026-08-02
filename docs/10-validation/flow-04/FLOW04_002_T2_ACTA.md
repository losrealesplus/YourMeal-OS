# FLOW04-002 · T2 Aplicar consumo · Acta

**Documento:** `FLOW04_002_T2_ACTA.md`  
**Fecha:** 2026-08-02  
**Entrega:** FLOW04-002  
**Spec:** [FLOW_04_INVENTORY_CONSUMPTION_SPEC](../../00-status/FLOW_04_INVENTORY_CONSUMPTION_SPEC.md) **FROZEN** (#163)  
**Precondición:** FLOW04-001 ✅ (#165 → `8020abf`)  
**Runner:** [FLOW04_CANONICAL_RUNNER](./FLOW04_CANONICAL_RUNNER.md)

---

## Pregunta certificada

> ¿Queda certificada la transición `planned` → `applied` (T2)?

---

## Contrato observado

```text
FLOW04_T1_STARTED     ✔ (prefix)
FLOW04_T1_COMPLETED   ✔ (prefix)
FLOW04_T2_STARTED     ✔ (exactly once)
FLOW04_T2_COMPLETED   ✔ (exactly once)
FLOW04_T3_STARTED     BLOCKED (no emitido — fuera de alcance)
```

Spine:

```text
consumption.status = planned
  ↓
applyConsumption()
  ↓
status = applied · stock decrementado (I2 · I3)
```

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| Dominio emite `FLOW04_T2_STARTED` una vez | ✅ |
| Dominio emite `FLOW04_T2_COMPLETED` una vez | ✅ |
| Consumption `status=applied` | ✅ |
| Stock = previo − plan | ✅ |
| FLOW04-I2 Single Apply (sin doble decremento) | ✅ |
| FLOW04-I3 rechaza stock negativo | ✅ |
| Sin eventos T3 / `sealed` | ✅ |
| `duplicates=[]` · `out_of_order=[]` | ✅ |
| Runner: PASS through T2 · BLOCKED at T3 | ✅ |
| Seal / UI / compensaciones / concurrencia | ❌ fuera de alcance |

---

## Comando

```bash
npm run test:flow04-002
# alias: npm run test:flow04-canonical -- --live --through=T2
```

Resultado esperado:

```text
status=PASS
delivery_status=PASS
flow_status=BLOCKED
certified_through=T2
blocked_at=FLOW04_T3_STARTED
duplicates=[]
missing=[]
out_of_order=[]
```

Exit code **0**.  
Full FLOW-04 remains BLOCKED at T3 — intencional.

```bash
npm run test:flow04-canonical -- --live
# → PASS through T2 · BLOCKED at FLOW04_T3_STARTED · exit 2
```

---

## Implementación

| Pieza | Path |
|-------|------|
| Emisión T2 | `InventoryService.applyConsumption` |
| Stock apply (I2/I3) | `inventory-repository.applyConsumption` |
| Live driver | `flow04-live.driver.spec.ts` (through≥2) |
| Evidence JSON | `docs/10-validation/flow-04/evidence/flow04-002-canonical-live.json` |

---

## Siguiente

FLOW04-003 · T3 únicamente (`applied` → `sealed`).
