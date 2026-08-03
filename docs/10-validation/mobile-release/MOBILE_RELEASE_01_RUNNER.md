# MOBILE-RELEASE-01 · Canonical Runner

**Documento:** `MOBILE_RELEASE_01_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **CERTIFIED** · CERTIFIED_THROUGH = **2** (MR1+MR2) · BLOCKED at MR3  
**Spec:** [MOBILE_RELEASE_01_SPEC](../../00-status/MOBILE_RELEASE_01_SPEC.md) **FROZEN**  
**DoR:** [MOBILE_RELEASE_01_DOR](../../00-status/MOBILE_RELEASE_01_DOR.md)  
**Gate:** [MOBILE_RELEASE_01_GATE](./MOBILE_RELEASE_01_GATE.md)  
**Actas:** [001](./MR01_001_MR1_ACTA.md) · [002](./MR01_002_MR2_ACTA.md)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Nivel:** Distribution — private mobile delivery · **not** Business · **not** Production stores

---

## Contrato

```text
MR1 Preparation                     ✅ CERTIFIED (MR01-001)
MR2 Android Build                   ✅ CERTIFIED (MR01-002)
MR3 Android Signing                 ⏳ next
MR4 iOS Archive                     🔒
MR5 Internal Testing Acceptance     🔒
```

`CERTIFIED_THROUGH = 2` — MR1+MR2 PASS · full MOBILE-RELEASE BLOCKED at MR3.

---

## Comandos

```bash
npm run test:mobile-release-002
# → PASS through MR2 · blocked_at=MOBILE_RELEASE_MR3_STARTED · exit 0

npm run test:mobile-release
# → PASS through MR2 · blocked_at=MOBILE_RELEASE_MR3_STARTED · exit 0

npm run test:mobile-release:runner-only
# → BLOCKED at MOBILE_RELEASE_MR1_STARTED · exit 2
```

Evidence: `docs/10-validation/mobile-release/evidence/mobile-release-002-canonical-live.json`  
Artifacts fingerprint: `docs/10-validation/mobile-release/evidence/mr2-android-artifacts.json`

---

## Fuera de alcance (MR01-002)

Signing · Keystore · Play · Internal Testing · iOS Archive · CI · MR3+

---

## Land Check (after merge)

```bash
git restore docs/10-validation/mobile-release/evidence/ 2>/dev/null || true
git pull origin main
npm run test:mobile-release-002   # PASS through MR2 · exit 0
npm run test:mobile-release:runner-only  # BLOCKED at MR1 · exit 2
```

Next: **MR01-003 · MR3 Android Signing** only.

---

## End of MOBILE-RELEASE-01 Runner
