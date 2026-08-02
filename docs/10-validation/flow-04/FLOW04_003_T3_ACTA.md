# FLOW04-003 · T3 Sellar consumo · Acta

**Documento:** `FLOW04_003_T3_ACTA.md`  
**Fecha:** 2026-08-02  
**Entrega:** FLOW04-003  
**Spec:** [FLOW_04_INVENTORY_CONSUMPTION_SPEC](../../00-status/FLOW_04_INVENTORY_CONSUMPTION_SPEC.md) **FROZEN** (#163)  
**Precondición:** FLOW04-002 ✅ (#166 → `5fa24aa`)  
**Runner:** [FLOW04_CANONICAL_RUNNER](./FLOW04_CANONICAL_RUNNER.md)

---

## Pregunta certificada

> ¿Queda certificada la transición `applied` → `sealed` (T3)?

---

## Contrato observado

```text
FLOW04_T1_* … FLOW04_T2_*   ✔ (prefix)
FLOW04_T3_STARTED           ✔ (exactly once)
FLOW04_T3_COMPLETED         ✔ (exactly once)
```

Spine:

```text
consumption.status = applied
  ↓
sealConsumption()
  ↓
status = sealed (terminal) · stock estable
```

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| Dominio emite `FLOW04_T3_STARTED` / `COMPLETED` una vez | ✅ |
| Consumption `status=sealed` | ✅ |
| Stock no muta en T3 | ✅ |
| Sin tokens posteriores | ✅ |
| `duplicates=[]` · `missing=[]` · `out_of_order=[]` | ✅ |
| Runner FULL PASS | ✅ |
| Compensaciones / concurrencia / FLOW-05+ | ❌ fuera |

---

## Comando

```bash
npm run test:flow04-003
# → FLOW-04 complete · certified_through=T3 · exit 0

npm run test:flow04-canonical -- --live
# → FULL PASS · exit 0
```

---

## Siguiente

Tag `flow04-pass` · [FLOW04_PASS_ACTA](./FLOW04_PASS_ACTA.md) · [FOPEBA_METRICS](../../00-status/FOPEBA_METRICS.md).
