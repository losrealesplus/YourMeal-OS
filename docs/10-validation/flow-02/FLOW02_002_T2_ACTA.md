# FLOW02-002 · T2 Reintento · Acta

**Documento:** `FLOW02_002_T2_ACTA.md`  
**Fecha:** 2026-08-02  
**Entrega:** FLOW02-002  
**Spec:** [FLOW_02_DELIVERY_INCIDENTS_SPEC](../../00-status/FLOW_02_DELIVERY_INCIDENTS_SPEC.md) **FROZEN**  
**Runner:** [FLOW02_CANONICAL_RUNNER](./FLOW02_CANONICAL_RUNNER.md)  
**Precondición:** FLOW02-001 ✅ · [FLOW02_001_T1_ACTA](./FLOW02_001_T1_ACTA.md)

---

## Pregunta certificada

> ¿Queda certificada la transición `delivery_issue` → `out_for_delivery` (reintento)?

---

## Contrato observado

```text
FLOW02_T1_STARTED     ✔
FLOW02_T1_COMPLETED   ✔
FLOW02_T2_STARTED     ✔ (exactly once)
FLOW02_T2_COMPLETED   ✔ (exactly once)
FLOW02_T3_STARTED     BLOCKED (no emitido — fuera de alcance)
```

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| T1 tokens preservados | ✅ |
| `FLOW02_T2_STARTED` / `_COMPLETED` una vez | ✅ |
| Sin eventos T3 | ✅ |
| `duplicates=[]` · `missing=[]` · `out_of_order=[]` | ✅ |
| Runner: PASS through T2 · BLOCKED at T3 | ✅ |
| T3 / facturación / inventario | ❌ fuera de alcance |

---

## Comando

```bash
npm run test:flow02-002
# alias: npm run test:flow02-canonical -- --live --through=T2
```

Resultado esperado:

```text
status=PASS
delivery_status=PASS
flow_status=BLOCKED
certified_through=T2
blocked_at=FLOW02_T3_STARTED
duplicates=[]
missing=[]
out_of_order=[]
```

Exit code **0** (delivery PASS scoped).

Regresión T1:

```bash
npm run test:flow02-001
# sigue PASS through T1 · BLOCKED at T2
```

---

## Implementación

| Pieza | Path |
|-------|------|
| Emisión T2 | `OperationsService.transition` · delivery `delivery_issue`→`out_for_delivery` |
| Prefijo | Requiere `FLOW02_T1_*` COMPLETED (Regla evidencia) |
| Entry as-built | UI `admin.routes.incidents` retry → `transitionDelivery(…, "out_for_delivery")` |
| Live driver | `flow02-live.driver.spec.ts` · `FLOW02_LIVE_THROUGH=2` |
| Evidencia | `docs/10-validation/flow-02/evidence/flow02-002-canonical-live.json` |

---

## Fuera de alcance (explícito)

- T3 delivered  
- Billing · Inventory  
- Cambios de semántica del contrato `FLOW02_*`  
