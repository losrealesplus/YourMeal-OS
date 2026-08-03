# Capacitor · Distribution · Canonical Runner

**Documento:** `CAPACITOR_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **CERTIFIED** · CERTIFIED_THROUGH = **4** (C4) · BLOCKED at C5  
**Spec:** [CAPACITOR_SPEC](../../00-status/CAPACITOR_SPEC.md) **FROZEN**  
**DoR:** [CAPACITOR_DOR](../../00-status/CAPACITOR_DOR.md)  
**Gate:** [CAPACITOR_GATE](./CAPACITOR_GATE.md)  
**Actas:** [001](./CAPACITOR_001_C1_ACTA.md) · [002](./CAPACITOR_002_C2_ACTA.md) · [003](./CAPACITOR_003_C3_ACTA.md) · [004](./CAPACITOR_004_C4_ACTA.md)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Nivel:** Distribution — **not** Business · **not** Experience · **not** stores

---

## Contrato

```text
C1 Platform Preparation        ✅ CERTIFIED (CAPACITOR-001)
C2 Native Shell                ✅ CERTIFIED (CAPACITOR-002)
C3 Android Platform            ✅ CERTIFIED (CAPACITOR-003)
C4 iOS Platform                ✅ CERTIFIED (CAPACITOR-004)
C5 Acceptance                  🔒
```

`CERTIFIED_THROUGH = 4` — C1–C4 PASS · full Distribution BLOCKED at C5.

---

## Comandos

```bash
npm run test:capacitor-004
# → PASS through C4 · blocked_at=CAPACITOR_C5_STARTED · exit 0

npm run test:capacitor
# → PASS through C4 · blocked_at=CAPACITOR_C5_STARTED · exit 0

npm run test:capacitor:runner-only
# → BLOCKED at CAPACITOR_C1_STARTED · exit 2
```

Evidence: `docs/10-validation/capacitor/evidence/capacitor-004-canonical-live.json`

---

## Fuera de alcance (CAPACITOR-004)

IPA · simuladores · iPhone · App Store · certificados · provisioning · TestFlight · device APIs · C5 Acceptance

---

## Land Check (after merge)

```bash
git restore docs/10-validation/capacitor/evidence/ 2>/dev/null || true
git pull origin main
npm run test:capacitor-004   # PASS through C4 · exit 0
npm run test:capacitor:runner-only  # BLOCKED at C1 · exit 2
```

Next: **CAPACITOR-005 · C5 Acceptance** only.

---

## End of Capacitor Runner
