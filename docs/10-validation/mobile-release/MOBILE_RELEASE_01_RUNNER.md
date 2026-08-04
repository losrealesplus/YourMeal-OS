# MOBILE-RELEASE-01 · Canonical Runner

**Documento:** `MOBILE_RELEASE_01_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **CERTIFIED** · CERTIFIED_THROUGH = **3** (MR1–MR3) · BLOCKED at MR4  
**Spec:** [MOBILE_RELEASE_01_SPEC](../../00-status/MOBILE_RELEASE_01_SPEC.md) **FROZEN**  
**DoR:** [MOBILE_RELEASE_01_DOR](../../00-status/MOBILE_RELEASE_01_DOR.md)  
**Gate:** [MOBILE_RELEASE_01_GATE](./MOBILE_RELEASE_01_GATE.md)  
**Actas:** [001](./MR01_001_MR1_ACTA.md) · [002](./MR01_002_MR2_ACTA.md) · [003](./MR01_003_MR3_ACTA.md)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Nivel:** Distribution — private mobile delivery · **not** Business · **not** Production stores

---

## Contrato

```text
MR1 Preparation                     ✅ CERTIFIED (MR01-001)
MR2 Android Build                   ✅ CERTIFIED (MR01-002)
MR3 Android Signing                 ✅ CERTIFIED (MR01-003)
MR4 iOS Archive                     ⏳ next
MR5 Internal Testing Acceptance     🔒
```

`CERTIFIED_THROUGH = 3` — MR1–MR3 PASS · full MOBILE-RELEASE BLOCKED at MR4.

---

## Comandos

```bash
npm run test:mobile-release-003
# → PASS through MR3 · blocked_at=MOBILE_RELEASE_MR4_STARTED · exit 0

npm run test:mobile-release
# → PASS through MR3 · blocked_at=MOBILE_RELEASE_MR4_STARTED · exit 0

npm run test:mobile-release:runner-only
# → BLOCKED at MOBILE_RELEASE_MR1_STARTED · exit 2
```

Evidence: `docs/10-validation/mobile-release/evidence/mobile-release-003-canonical-live.json`  
Signing fingerprint: `docs/10-validation/mobile-release/evidence/mr3-android-signing.json`

---

## Fuera de alcance (MR01-003)

Play · Play App Signing · Internal Testing · iOS Archive · CI · MR4+

---

## Land Check (after merge)

```bash
git restore docs/10-validation/mobile-release/evidence/ 2>/dev/null || true
git pull origin main
npm run test:mobile-release-003   # PASS through MR3 · exit 0
npm run test:mobile-release:runner-only  # BLOCKED at MR1 · exit 2
```

Next: **MR01-004 · MR4 iOS Archive** only.

---

## End of MOBILE-RELEASE-01 Runner
