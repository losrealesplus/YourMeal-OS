# FLOW-05 · Canonical Runner

**Documento:** `FLOW_05_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **CERTIFIED** · CERTIFIED_THROUGH = **7** (B7) · BLOCKED at B8  
**Spec:** [FLOW_05_SPEC](../../00-status/FLOW_05_SPEC.md) **FROZEN**  
**Gate:** [FLOW_05_GATE](./FLOW_05_GATE.md)  
**Actas:** [001](./FLOW05_001_B1_ACTA.md) · [002](./FLOW05_002_B2_ACTA.md) · [003](./FLOW05_003_B3_ACTA.md) · [004](./FLOW05_004_B4_ACTA.md) · [005](./FLOW05_005_B5_ACTA.md) · [006](./FLOW05_006_B6_ACTA.md) · [007](./FLOW05_007_B7_ACTA.md)

---

## Contrato

```text
B1…B6                           ✅
B7 Delivery Confirmation        ✅ CERTIFIED (FLOW05-007)
B8 History                      ⏳ next
→ flow05-pass (futuro)
```

`CERTIFIED_THROUGH = 7` — B1–B7 PASS · full journey BLOCKED at B8.

---

## Comandos

```bash
npm run test:flow05-007
# → PASS through B7 · blocked_at=FLOW05_B8_STARTED · exit 0

npm run test:flow-05
# → PASS through B7 · blocked_at=FLOW05_B8_STARTED · exit 0

npm run test:flow-05:runner-only
# → BLOCKED at FLOW05_B1_STARTED · exit 2
```

Evidence: `docs/10-validation/flow-05/evidence/flow-05-007-canonical-live.json`

---

## Fuera de alcance (FLOW05-007)

History · Archive · Reports · Billing · Analytics · Incidents · Notifications · Capacitor

---

## Land Check (after merge)

```bash
git restore docs/10-validation/flow-05/evidence/ 2>/dev/null || true
git pull origin main
npm run test:flow05-007   # PASS through B7 · exit 0
npm run test:flow-05:runner-only  # BLOCKED at B1 · exit 2
```

Next: **FLOW05-008 · B8 History** only.

---

## End of FLOW-05 Runner
