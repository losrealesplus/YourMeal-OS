# MOBILE-RELEASE-01 · Canonical Runner

**Documento:** `MOBILE_RELEASE_01_RUNNER.md`  
**Fecha:** 2026-08-04  
**Estado:** ✅ Runner **CERTIFIED** · CERTIFIED_THROUGH = **4** (MR1–MR4) · BLOCKED at MR5  
**Spec:** [MOBILE_RELEASE_01_SPEC](../../00-status/MOBILE_RELEASE_01_SPEC.md) **FROZEN**  
**DoR:** [MOBILE_RELEASE_01_DOR](../../00-status/MOBILE_RELEASE_01_DOR.md)  
**Gate:** [MOBILE_RELEASE_01_GATE](./MOBILE_RELEASE_01_GATE.md)  
**Actas:** [001](./MR01_001_MR1_ACTA.md) · [002](./MR01_002_MR2_ACTA.md) · [003](./MR01_003_MR3_ACTA.md) · [004](./MR01_004_MR4_ACTA.md)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Nivel:** Distribution — private mobile delivery · **not** Business · **not** Production stores

---

## Contrato

```text
MR1 Preparation                     ✅ CERTIFIED (MR01-001)
MR2 Android Build                   ✅ CERTIFIED (MR01-002)
MR3 Android Signing                 ✅ CERTIFIED (MR01-003)
MR4 iOS Archive                     ✅ CERTIFIED (MR01-004)
MR5 Internal Testing Acceptance     ⏳ next
```

`CERTIFIED_THROUGH = 4` — MR1–MR4 PASS · full MOBILE-RELEASE BLOCKED at MR5.

---

## Comandos

```bash
npm run test:mobile-release-004
# → PASS through MR4 · blocked_at=MOBILE_RELEASE_MR5_STARTED · exit 0

npm run test:mobile-release
# → PASS through MR4 · blocked_at=MOBILE_RELEASE_MR5_STARTED · exit 0

npm run test:mobile-release:runner-only
# → BLOCKED at MOBILE_RELEASE_MR1_STARTED · exit 2
```

Evidence: `docs/10-validation/mobile-release/evidence/mobile-release-004-canonical-live.json`  
Archive fingerprint: `docs/10-validation/mobile-release/evidence/mr4-ios-archive.json`

---

## Fuera de alcance (MR01-004)

IPA · TestFlight · App Store · distribución · CI · MR5

---

## Land Check (after merge)

```bash
git restore docs/10-validation/mobile-release/evidence/ 2>/dev/null || true
git pull origin main
npm run test:mobile-release-004   # PASS through MR4 · exit 0
npm run test:mobile-release:runner-only  # BLOCKED at MR1 · exit 2
```

Next: **MR01-005 · MR5 Internal Testing Acceptance** only.

---

## End of MOBILE-RELEASE-01 Runner
