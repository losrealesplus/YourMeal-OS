# MOBILE-RELEASE-01 · Canonical Runner

**Documento:** `MOBILE_RELEASE_01_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **CERTIFIED** · CERTIFIED_THROUGH = **1** (MR1) · BLOCKED at MR2  
**Spec:** [MOBILE_RELEASE_01_SPEC](../../00-status/MOBILE_RELEASE_01_SPEC.md) **FROZEN**  
**DoR:** [MOBILE_RELEASE_01_DOR](../../00-status/MOBILE_RELEASE_01_DOR.md)  
**Gate:** [MOBILE_RELEASE_01_GATE](./MOBILE_RELEASE_01_GATE.md)  
**Acta:** [001](./MR01_001_MR1_ACTA.md)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Nivel:** Distribution — private mobile delivery · **not** Business · **not** Production stores

---

## Contrato

```text
MR1 Preparation                     ✅ CERTIFIED (MR01-001)
MR2 Android Build                   ⏳ next
MR3 Android Signing                 🔒
MR4 iOS Archive                     🔒
MR5 Internal Testing Acceptance     🔒
```

`CERTIFIED_THROUGH = 1` — MR1 PASS · full MOBILE-RELEASE BLOCKED at MR2.

---

## Comandos

```bash
npm run test:mobile-release-001
# → PASS through MR1 · blocked_at=MOBILE_RELEASE_MR2_STARTED · exit 0

npm run test:mobile-release
# → PASS through MR1 · blocked_at=MOBILE_RELEASE_MR2_STARTED · exit 0

npm run test:mobile-release:runner-only
# → BLOCKED at MOBILE_RELEASE_MR1_STARTED · exit 2
```

Evidence: `docs/10-validation/mobile-release/evidence/mobile-release-001-canonical-live.json`

---

## Fuera de alcance (MR01-001)

APK Release final · AAB · Signing · CI · stores · iOS Archive · MR2+

---

## Land Check (after merge)

```bash
git restore docs/10-validation/mobile-release/evidence/ 2>/dev/null || true
git pull origin main
npm run test:mobile-release-001   # PASS through MR1 · exit 0
npm run test:mobile-release:runner-only  # BLOCKED at MR1 · exit 2
```

Next: **MR01-002 · MR2 Android Build** only.

---

## End of MOBILE-RELEASE-01 Runner
