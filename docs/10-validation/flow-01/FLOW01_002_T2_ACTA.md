# FLOW01-002 · T2 Production → Packaging · Acta

**Documento:** `FLOW01_002_T2_ACTA.md`  
**Fecha:** 2026-08-02  
**Entrega:** FLOW01-002  
**Spec:** [FLOW_01_KITCHEN_DELIVERY_SPEC](../../00-status/FLOW_01_KITCHEN_DELIVERY_SPEC.md) **FROZEN**  
**Plan:** [FLOW_01_DELIVERY_PLAN](../../00-status/FLOW_01_DELIVERY_PLAN.md)  
**Precondición:** FLOW01-001 ✅ CERTIFIED (#143)

---

## Pregunta certificada

> ¿La transición T2 (Production → Packaging) está certificada?

---

## Contrato observado

```text
FLOW01_T1_STARTED     ✔
FLOW01_T1_COMPLETED   ✔
FLOW01_T2_STARTED     ✔ (exactly once)
FLOW01_T2_COMPLETED   ✔ (exactly once)
FLOW01_T3_STARTED     BLOCKED
```

Dominio:

```text
in_production  →  prepared  (+ PackagingBatch IN_PROGRESS)
completeProduction        startPackaging
```

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| `FLOW01_T2_STARTED` una vez | ✅ |
| `FLOW01_T2_COMPLETED` una vez | ✅ |
| T1 sigue once-only | ✅ |
| Sin tokens T3 | ✅ |
| `duplicates=[]` · `out_of_order=[]` | ✅ |
| Evidencia: PASS through T2 · BLOCKED at T3 | ✅ |
| Delivery / facturación / complete Packaging | ❌ fuera de alcance |

---

## Comandos

```bash
npm run test:flow01-canonical -- --live
# certified_through=T2 · blocked_at=FLOW01_T3_STARTED · exit 2

npm run test:flow01-002
# --live --through=T2 · delivery PASS · exit 0
```

---

## Implementación

| Pieza | Path |
|-------|------|
| `completeProduction` | `OperationsService` · `in_production`→`prepared` · T2_STARTED |
| `startPackaging` | PackagingBatch `IN_PROGRESS` · T2_COMPLETED |
| Lifecycle | `domain/packaging-batch.ts` |
| Live driver | `flow01-live.driver.spec.ts` |

---

## Fuera de alcance

T3 handoff a Delivery · `READY`/`CLOSED` packaging · rutas · facturación
