# FLOW01-001 · T1 Kitchen → Production · Acta

**Documento:** `FLOW01_001_T1_ACTA.md`  
**Fecha:** 2026-08-02  
**Entrega:** FLOW01-001  
**Spec:** [FLOW_01_KITCHEN_DELIVERY_SPEC](../../00-status/FLOW_01_KITCHEN_DELIVERY_SPEC.md) **FROZEN**  
**Plan:** [FLOW_01_DELIVERY_PLAN](../../00-status/FLOW_01_DELIVERY_PLAN.md)

---

## Pregunta certificada

> ¿Queda certificada la transición Kitchen → Production (`confirmed` → `in_production`)?

---

## Contrato observado

```text
FLOW01_T1_STARTED     ✔ (exactly once)
FLOW01_T1_COMPLETED   ✔ (exactly once)
FLOW01_T2_STARTED     BLOCKED (no emitido — fuera de alcance)
```

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| Dominio emite `FLOW01_T1_STARTED` una vez | ✅ |
| Dominio emite `FLOW01_T1_COMPLETED` una vez | ✅ |
| Sin duplicados | ✅ `duplicates=[]` |
| Sin eventos T2 | ✅ |
| `out_of_order=[]` | ✅ |
| Evidencia JSON: PASS through T1 · BLOCKED at T2 | ✅ |
| Packaging / Delivery / facturación | ❌ fuera de alcance |

---

## Comando

```bash
npm run test:flow01-canonical -- --live
```

Resultado esperado:

```text
status=BLOCKED
delivery_status=PASS
certified_through=T1
blocked_at=FLOW01_T2_STARTED
```

Exit code **2 (BLOCKED)** = FLOW-01 incompleto de forma intencionada.  
No es FAIL.

Entrega scoped:

```bash
npm run test:flow01-canonical -- --live --through=T1
# exit 0 · delivery PASS · flow BLOCKED at T2
```

---

## Implementación

| Pieza | Path |
|-------|------|
| Evidence | `src/modules/operations/application/flow01-evidence.ts` |
| `startProduction` | `OperationsService.startProduction` → `confirmed`→`in_production` |
| Live driver | `scripts/lib/flow01-t1-domain-driver.mjs` + `flow01-t1-live.driver.spec.ts` |
| Evidencia | `docs/10-validation/flow-01/evidence/flow01-canonical-live.json` |

---

## Fuera de alcance (explícito)

Packaging · Delivery · Facturación · Optimizaciones · Excepciones de incidencia · T2–T4
