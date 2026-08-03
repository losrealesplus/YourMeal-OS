# FLOW-05 · Canonical Runner

**Documento:** `FLOW_05_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **CERTIFIED** · CERTIFIED_THROUGH = **8** (B8) · **FULL PASS** · Gate **CLOSED**  
**Spec:** [FLOW_05_SPEC](../../00-status/FLOW_05_SPEC.md) **FROZEN**  
**Gate:** [FLOW_05_GATE](./FLOW_05_GATE.md) · CLOSED  
**PASS Acta:** [FLOW_05_PASS_ACTA](./FLOW_05_PASS_ACTA.md)  
**Actas:** [001](./FLOW05_001_B1_ACTA.md) · [002](./FLOW05_002_B2_ACTA.md) · [003](./FLOW05_003_B3_ACTA.md) · [004](./FLOW05_004_B4_ACTA.md) · [005](./FLOW05_005_B5_ACTA.md) · [006](./FLOW05_006_B6_ACTA.md) · [007](./FLOW05_007_B7_ACTA.md) · [008](./FLOW05_008_B8_ACTA.md)

---

## Contrato

```text
B1…B8                           ✅ CERTIFIED
FLOW-05 FULL PASS               ✅ tag flow05-pass
→ Capacitor DoR (siguiente milestone · fuera de este runner)
```

`CERTIFIED_THROUGH = 8` — B1–B8 FULL PASS · `blocked_at=—`.

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

Evidence: `docs/10-validation/flow-05/evidence/flow-05-008-canonical-live.json`

---

## End of FLOW-05 Runner
