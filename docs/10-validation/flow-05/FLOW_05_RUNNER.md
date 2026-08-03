# FLOW-05 · Canonical Runner

**Documento:** `FLOW_05_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **CERTIFIED** · CERTIFIED_THROUGH = **3** (B3) · BLOCKED at B4 · Gate ✅  
**Spec:** [FLOW_05_SPEC](../../00-status/FLOW_05_SPEC.md) **FROZEN**  
**DoR:** [FLOW_05_CUSTOMER_EXPERIENCE_DOR](../../00-status/FLOW_05_CUSTOMER_EXPERIENCE_DOR.md)  
**Gate:** [FLOW_05_GATE](./FLOW_05_GATE.md)  
**Actas:** [001](./FLOW05_001_B1_ACTA.md) · [002](./FLOW05_002_B2_ACTA.md) · [003](./FLOW05_003_B3_ACTA.md)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)

---

## Contrato

```text
FLOW-05
B1 Registration          ✅ CERTIFIED (FLOW05-001)
B2 Authentication        ✅ CERTIFIED (FLOW05-002)
B3 Order Creation        ✅ CERTIFIED (FLOW05-003)
B4 Production            ⏳ next
…
B8 History
→ flow05-pass (futuro)
```

`CERTIFIED_THROUGH = 3` — B1–B3 PASS · full journey BLOCKED at B4.

---

## Comandos

```bash
npm run test:flow05-003
# → PASS through B3 · blocked_at=FLOW05_B4_STARTED · exit 0

npm run test:flow-05
# → PASS through B3 · blocked_at=FLOW05_B4_STARTED · exit 0

npm run test:flow-05:runner-only
# → BLOCKED at FLOW05_B1_STARTED · exit 2
```

Exit code live/003: **0**. Runner-only: **2**.  
Evidence: `docs/10-validation/flow-05/evidence/flow-05-003-canonical-live.json`

---

## Fuera de alcance (FLOW05-003)

- B4 Production · cocina · calendario productivo  
- Inventory · Routes · Delivery · History · Billing  
- Capacitor · Stores  

---

## Evidencia

| Artefacto | Path |
|-----------|------|
| CLI | `scripts/flow-05-canonical.mjs` · `CERTIFIED_THROUGH=3` |
| B3 driver | `scripts/lib/flow-05-b3-order-creation.mjs` |
| Live 003 | `docs/10-validation/flow-05/evidence/flow-05-003-canonical-live.json` |

---

## Land Check (after merge)

```bash
git restore docs/10-validation/flow-05/evidence/ 2>/dev/null || true
git pull origin main
npm run test:flow05-003   # PASS through B3 · blocked_at=B4 · exit 0
npm run test:flow-05:runner-only  # BLOCKED at B1 · exit 2
```

Next: **FLOW05-004 · B4 Production** only.

---

## End of FLOW-05 Runner
