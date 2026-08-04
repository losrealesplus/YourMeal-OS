# MOBILE-RELEASE-01 · Canonical Runner

**Documento:** `MOBILE_RELEASE_01_RUNNER.md`  
**Fecha:** 2026-08-04  
**Estado:** ✅ Runner **FULL PASS** · CERTIFIED_THROUGH = **5** · blocked_at=— · Ready for Internal Testing  
**Spec:** [MOBILE_RELEASE_01_SPEC](../../00-status/MOBILE_RELEASE_01_SPEC.md) **FROZEN**  
**DoR:** [MOBILE_RELEASE_01_DOR](../../00-status/MOBILE_RELEASE_01_DOR.md)  
**Gate:** [MOBILE_RELEASE_01_GATE](./MOBILE_RELEASE_01_GATE.md) · **CLOSED**  
**PASS:** [MOBILE_RELEASE_01_PASS_ACTA](./MOBILE_RELEASE_01_PASS_ACTA.md)  
**Actas:** [001](./MR01_001_MR1_ACTA.md) … [005](./MR01_005_MR5_ACTA.md)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Nivel:** Distribution — private mobile delivery · **not** Production stores

---

## Contrato

```text
MR1 Preparation                     ✅
MR2 Android Build                   ✅
MR3 Android Signing                 ✅
MR4 iOS Archive                     ✅
MR5 Internal Testing Acceptance     ✅
────────────────────────────────────
MOBILE-RELEASE-01                   FULL PASS
```

`CERTIFIED_THROUGH = 5` · `blocked_at=—`

---

## Comandos

```bash
npm run test:mobile-release-005
# → FULL PASS · certified_through=MR5 · blocked_at=— · exit 0

npm run test:mobile-release
# → FULL PASS · certified_through=MR5 · blocked_at=— · exit 0

npm run test:mobile-release:runner-only
# → BLOCKED at MOBILE_RELEASE_MR1_STARTED · exit 2
```

Evidence: `docs/10-validation/mobile-release/evidence/mobile-release-005-canonical-live.json`

---

## Land Check (after merge)

```bash
git restore docs/10-validation/mobile-release/evidence/ 2>/dev/null || true
git pull origin main
npm run test:mobile-release-005   # FULL PASS · exit 0
npm run test:mobile-release:runner-only  # BLOCKED at MR1 · exit 2
# then: git tag -a mobile-release-01-pass -m "MOBILE-RELEASE-01 PASS"
```

Next domain: **STORE-RELEASE-01** DoR (no reabrir MR1–MR5).

---

## End of MOBILE-RELEASE-01 Runner
