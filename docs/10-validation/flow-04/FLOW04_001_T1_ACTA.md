# FLOW04-001 · T1 Planificar consumo · Acta

**Documento:** `FLOW04_001_T1_ACTA.md`  
**Fecha:** 2026-08-02  
**Entrega:** FLOW04-001  
**Spec:** [FLOW_04_INVENTORY_CONSUMPTION_SPEC](../../00-status/FLOW_04_INVENTORY_CONSUMPTION_SPEC.md) **FROZEN** (#163)  
**Runner:** [FLOW04_CANONICAL_RUNNER](./FLOW04_CANONICAL_RUNNER.md) · Gate ✅ (#164 → `a99f6fd`)

---

## Pregunta certificada

> ¿Queda certificada la transición → consumption `planned` (T1)?

---

## Contrato observado

```text
FLOW04_T1_STARTED     ✔ (exactly once)
FLOW04_T1_COMPLETED   ✔ (exactly once)
FLOW04_T2_STARTED     BLOCKED (no emitido — fuera de alcance)
```

Spine:

```text
production source (tenantId, deliveryDate)
  ↓
planConsumptionFromProduction()
  ↓
consumption.status = planned · lines ≥ 1 · stock intacto
```

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| Dominio emite `FLOW04_T1_STARTED` una vez | ✅ |
| Dominio emite `FLOW04_T1_COMPLETED` una vez | ✅ |
| Consumption `status=planned` · ≥1 línea | ✅ |
| Sin mutación de stock | ✅ |
| Sin eventos T2 / T3 | ✅ |
| Sin `applyConsumption` / `sealConsumption` | ✅ |
| `duplicates=[]` | ✅ |
| `out_of_order=[]` | ✅ |
| Runner: PASS through T1 · BLOCKED at T2 | ✅ |
| Apply / seal / UI / Supabase stock | ❌ fuera de alcance |

---

## Comando

```bash
npm run test:flow04-001
# alias: npm run test:flow04-canonical -- --live --through=T1
```

Resultado esperado:

```text
status=PASS
delivery_status=PASS
flow_status=BLOCKED
certified_through=T1
blocked_at=FLOW04_T2_STARTED
duplicates=[]
missing=[]
out_of_order=[]
```

Exit code **0** (delivery PASS scoped).  
Full FLOW-04 remains BLOCKED at T2 — intencional.

```bash
npm run test:flow04-canonical -- --live
# → PASS through T1 · BLOCKED at FLOW04_T2_STARTED · exit 2
```

---

## Implementación

| Pieza | Path |
|-------|------|
| Evidence | `src/modules/inventory/application/flow04-evidence.ts` |
| Emisión T1 | `InventoryService.planConsumptionFromProduction` |
| Domain | `src/modules/inventory/domain/inventory-consumption.ts` |
| Store (no Supabase / no stock) | `src/modules/inventory/infrastructure/inventory-repository.ts` |
| Live driver | `src/modules/inventory/application/flow04-live.driver.spec.ts` |
| Domain driver | `scripts/lib/flow04-domain-driver.mjs` |
| Evidence JSON | `docs/10-validation/flow-04/evidence/flow04-001-canonical-live.json` |

---

## Siguiente

FLOW04-002 · T2 únicamente (`planned` → `applied` + stock · FLOW04-I2).
