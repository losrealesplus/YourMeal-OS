# FLOW02-001 · T1 Registrar incidencia · Acta

**Documento:** `FLOW02_001_T1_ACTA.md`  
**Fecha:** 2026-08-02  
**Entrega:** FLOW02-001  
**Spec:** [FLOW_02_DELIVERY_INCIDENTS_SPEC](../../00-status/FLOW_02_DELIVERY_INCIDENTS_SPEC.md) **FROZEN**  
**Runner:** [FLOW02_CANONICAL_RUNNER](./FLOW02_CANONICAL_RUNNER.md)

---

## Pregunta certificada

> ¿Queda certificada la transición `out_for_delivery` → `delivery_issue`?

---

## Contrato observado

```text
FLOW02_T1_STARTED     ✔ (exactly once)
FLOW02_T1_COMPLETED   ✔ (exactly once)
FLOW02_T2_STARTED     BLOCKED (no emitido — fuera de alcance)
```

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| Dominio emite `FLOW02_T1_STARTED` una vez | ✅ |
| Dominio emite `FLOW02_T1_COMPLETED` una vez | ✅ |
| Sin eventos T2 / T3 | ✅ |
| Sin `delivered` en T1 | ✅ |
| `duplicates=[]` | ✅ |
| `out_of_order=[]` | ✅ |
| Runner: PASS through T1 · BLOCKED at T2 | ✅ |
| Reintentos / facturación / inventario | ❌ fuera de alcance |

---

## Comando

```bash
npm run test:flow02-001
# alias: npm run test:flow02-canonical -- --live --through=T1
```

Resultado esperado:

```text
status=PASS
delivery_status=PASS
flow_status=BLOCKED
certified_through=T1
blocked_at=FLOW02_T2_STARTED
duplicates=[]
missing=[]
out_of_order=[]
```

Exit code **0** (delivery PASS scoped).  
Full FLOW-02 remains BLOCKED at T2 — intencional.

Sin `--through`:

```bash
npm run test:flow02-canonical -- --live
# exit 2 · flow BLOCKED at FLOW02_T2_STARTED · certified_through=T1
```

---

## Implementación

| Pieza | Path |
|-------|------|
| Evidence | `src/modules/operations/application/flow02-evidence.ts` |
| Emisión T1 | `OperationsService.transition` · delivery `out_for_delivery`→`delivery_issue` |
| Entry as-built | `DeliveryService.recordAttempt({ outcome: "issue" })` |
| Live driver | `scripts/lib/flow02-domain-driver.mjs` + `flow02-t1-live.driver.spec.ts` |
| Evidencia | `docs/10-validation/flow-02/evidence/flow02-001-canonical-live.json` |

---

## Fuera de alcance (explícito)

- T2 retry · T3 delivered  
- Packaging · Billing · Inventory  
- Nueva entidad Incident  
- Cambios de semántica del runner / contrato `FLOW02_*`  
