# FLOW-05 · Canonical Runner

**Documento:** `FLOW_05_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **CERTIFIED** · CERTIFIED_THROUGH = **5** (B5) · BLOCKED at B6  
**Spec:** [FLOW_05_SPEC](../../00-status/FLOW_05_SPEC.md) **FROZEN**  
**Gate:** [FLOW_05_GATE](./FLOW_05_GATE.md)  
**Actas:** [001](./FLOW05_001_B1_ACTA.md) · [002](./FLOW05_002_B2_ACTA.md) · [003](./FLOW05_003_B3_ACTA.md) · [004](./FLOW05_004_B4_ACTA.md) · [005](./FLOW05_005_B5_ACTA.md)

---

## Contrato

```text
B1…B4                    ✅
B5 Route Planning        ✅ CERTIFIED (FLOW05-005)
B6 Delivery              ⏳ next
…
→ flow05-pass (futuro)
```

`CERTIFIED_THROUGH = 5` — B1–B5 PASS · full journey BLOCKED at B6.

---

## Comandos

```bash
npm run test:flow05-005
# → PASS through B5 · blocked_at=FLOW05_B6_STARTED · exit 0

npm run test:flow-05
# → PASS through B5 · blocked_at=FLOW05_B6_STARTED · exit 0

npm run test:flow-05:runner-only
# → BLOCKED at FLOW05_B1_STARTED · exit 2
```

Evidence: `docs/10-validation/flow-05/evidence/flow-05-005-canonical-live.json`

---

## Fuera de alcance (FLOW05-005)

Delivery execution · Tracking · Confirmation · History · Billing · Capacitor

---

## Land Check (after merge)

```bash
git restore docs/10-validation/flow-05/evidence/ 2>/dev/null || true
git pull origin main
npm run test:flow05-005   # PASS through B5 · exit 0
npm run test:flow-05:runner-only  # BLOCKED at B1 · exit 2
```

Next: **FLOW05-006 · B6 Delivery** only.

---

## End of FLOW-05 Runner
