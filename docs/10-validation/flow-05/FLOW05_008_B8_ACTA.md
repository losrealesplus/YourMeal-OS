# FLOW05-008 · B8 History · Acta

**Documento:** `FLOW05_008_B8_ACTA.md`  
**Fecha:** 2026-08-03  
**Entrega:** FLOW05-008  
**Spec:** [FLOW_05_SPEC](../../00-status/FLOW_05_SPEC.md) **FROZEN** (#237)  
**Precondición:** [FLOW05_007_B7_ACTA](./FLOW05_007_B7_ACTA.md) ✅ · Gate ✅ · stack on B7 (`cursor/flow05-007-b7-f54a`)  
**Nivel:** Core Flow · YourMeal OS (tenant-agnostic · no EatClean-only)

> Certifica **una** transición de memoria: Confirmed → **Archived**.  
> No analytics · no billing · no Capacitor · no `flow05-pass` ritual.

---

## Pregunta certificada

> ¿Queda certificado que el pedido deja de ser operativo y pasa a ser histórico (Confirmed → Archived) (B8)?

---

## Contrato observado

```text
FLOW05_B1…B7_COMPLETED   ✔
FLOW05_B8_STARTED        ✔ (exactly once)
FLOW05_B8_COMPLETED      ✔ (exactly once)
```

Spine:

```text
START · Confirmed (outcome B7)
  ↓
Pedido archivado (fuera de cola operativa)
  ↓
Persistencia garantizada (orders query)
  ↓
Disponible para consulta (CAP-007)
  ↓
Visible en Historial (EP-002A.2)
  ↓
Integridad verificada (own customer_id · deleted_at null)
  ↓
END · Archived
```

**Mapeo:** Order State `Archived` ↔ pedido post-confirmación, fuera de operación, persistido y consultable.  
Historial es la **vista**; el contrato termina en **Archived**.

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| B7 CERTIFIED | ✅ |
| Gate autoriza FLOW05-008 | ✅ |
| Pedido fuera de operaciones presente | ✅ |
| Persistencia / consulta presente | ✅ |
| CAP-007 history capability presente | ✅ |
| Superficie Historial presente | ✅ |
| Integridad (own customer) presente | ✅ |
| END Archived (Spec B8) presente | ✅ |
| Sin analytics / billing / Capacitor / flow05-pass | ✅ |
| Runner: FULL PASS · certified_through=B8 | ✅ |

---

## Comandos

```bash
npm run test:flow05-008
# → PASS through B8 · FLOW-05 FULL PASS · blocked_at=— · exit 0

npm run test:flow-05
# → PASS through B8 · FLOW-05 FULL PASS · blocked_at=— · exit 0

npm run test:flow-05:runner-only
# → BLOCKED at FLOW05_B1_STARTED · exit 2
```

---

## Implementación (presencia / integración)

| Pieza | Path |
|-------|------|
| Left operations | `src/modules/operations/domain/operational-status.ts` |
| Persistence query | `src/modules/orders/application/order-queries.ts` |
| CAP-007 hook | `src/hooks/use-customer-orders.ts` |
| Historial surface | `src/routes/_authenticated/app.orders.tsx` |
| Spec END Archived | `docs/00-status/FLOW_05_SPEC.md` §B8 |
| B8 driver | `scripts/lib/flow-05-b8-history.mjs` |
| Runner | `CERTIFIED_THROUGH=8` |
| Evidence | `docs/10-validation/flow-05/evidence/flow-05-008-canonical-live.json` |

---

## Regla

```text
Cada bloque certifica exactamente una transición de estado.
B8: Confirmed → Archived.
No consume flow05-pass · Capacitor · analytics · billing.
```

---

## Siguiente (fuera de este PR)

Land Check desde `main` (tras merge B7 + B8) → tag **`flow05-pass`** · `FLOW_05_PASS_ACTA.md` · Gate CLOSED · Capacitor DoR.

---

## End of FLOW05-008 Acta
