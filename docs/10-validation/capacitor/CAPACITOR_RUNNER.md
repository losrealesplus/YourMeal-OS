# Capacitor · Distribution · Canonical Runner

**Documento:** `CAPACITOR_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **CERTIFIED** · CERTIFIED_THROUGH = **5** (C5) · **FULL PASS** · blocked_at=—  
**Spec:** [CAPACITOR_SPEC](../../00-status/CAPACITOR_SPEC.md) **FROZEN**  
**DoR:** [CAPACITOR_DOR](../../00-status/CAPACITOR_DOR.md)  
**Gate:** [CAPACITOR_GATE](./CAPACITOR_GATE.md) · CLOSED  
**PASS Acta:** [CAPACITOR_PASS_ACTA](./CAPACITOR_PASS_ACTA.md)  
**Actas:** [001](./CAPACITOR_001_C1_ACTA.md) · [002](./CAPACITOR_002_C2_ACTA.md) · [003](./CAPACITOR_003_C3_ACTA.md) · [004](./CAPACITOR_004_C4_ACTA.md) · [005](./CAPACITOR_005_C5_ACTA.md)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Nivel:** Distribution — **not** Business · **not** Experience · **not** stores

---

## Contrato

```text
C1 Platform Preparation        ✅ CERTIFIED (CAPACITOR-001)
C2 Native Shell                ✅ CERTIFIED (CAPACITOR-002)
C3 Android Platform            ✅ CERTIFIED (CAPACITOR-003)
C4 iOS Platform                ✅ CERTIFIED (CAPACITOR-004)
C5 Acceptance (operational)    ✅ CERTIFIED (CAPACITOR-005)
```

`CERTIFIED_THROUGH = 5` — C1–C5 PASS · Distribution Certified · blocked_at=—.

---

## Comandos

```bash
npm run test:capacitor-005
# → PASS through C5 · CAPACITOR FULL PASS · blocked_at=— · exit 0

npm run test:capacitor
# → PASS through C5 · CAPACITOR FULL PASS · blocked_at=— · exit 0

npm run test:capacitor:runner-only
# → BLOCKED at CAPACITOR_C1_STARTED · exit 2
```

Evidence: `docs/10-validation/capacitor/evidence/capacitor-005-canonical-live.json`

---

## Fuera de alcance (CAPACITOR v1 cerrado)

IPA · APK publishing · stores · certificados · TestFlight · device APIs · push

---

## Land Check (after merge)

```bash
git restore docs/10-validation/capacitor/evidence/ 2>/dev/null || true
git pull origin main
npm run test:capacitor-005   # FULL PASS · exit 0
npm run test:capacitor:runner-only  # BLOCKED at C1 · exit 2
# Terminal: annotate tag capacitor-pass on merge commit
```

Next: capacidades de plataforma posteriores (Play · App Store · …) — fuera de Capacitor v1.

---

## End of Capacitor Runner
