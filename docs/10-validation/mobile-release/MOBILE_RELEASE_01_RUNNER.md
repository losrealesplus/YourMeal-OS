# MOBILE-RELEASE-01 · Canonical Runner

**Documento:** `MOBILE_RELEASE_01_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **institucionalizado** · CERTIFIED_THROUGH = **0** · BLOCKED at MR1  
**Spec:** [MOBILE_RELEASE_01_SPEC](../../00-status/MOBILE_RELEASE_01_SPEC.md) **FROZEN** (#260)  
**DoR:** [MOBILE_RELEASE_01_DOR](../../00-status/MOBILE_RELEASE_01_DOR.md) ✅ (#259)  
**Gate:** [MOBILE_RELEASE_01_GATE](./MOBILE_RELEASE_01_GATE.md) · READY  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Nivel:** Distribution — private mobile delivery · **not** Business · **not** Production stores

---

## Contrato

```text
MR1 Preparation                     🔒 (no driver)
MR2 Android Build                   🔒
MR3 Android Signing                 🔒
MR4 iOS Archive                     🔒
MR5 Internal Testing Acceptance     🔒
```

`CERTIFIED_THROUGH = 0` — pipeline institucionalizado · bloques no implementados · BLOCKED at MR1.

---

## Comandos

```bash
npm run test:mobile-release
# → BLOCKED at MOBILE_RELEASE_MR1_STARTED · exit 2

npm run test:mobile-release:runner-only
# → BLOCKED at MOBILE_RELEASE_MR1_STARTED · exit 2

npm run test:mobile-release:unit
# → unit PASS (pipeline contract)
```

Evidence: `docs/10-validation/mobile-release/evidence/mobile-release-canonical.json`

---

## Baseline esperado

```text
MOBILE-RELEASE

BLOCKED

blocked_at=MOBILE_RELEASE_MR1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

---

## Fuera de alcance (este PR)

MR1…MR5 drivers · APK · AAB · Archive · signing · CI · stores · device APIs

---

## Land Check (after merge)

```bash
git restore docs/10-validation/mobile-release/evidence/ 2>/dev/null || true
git pull origin main
npm run test:mobile-release:runner-only
# → BLOCKED at MOBILE_RELEASE_MR1_STARTED · exit 2
```

Next: **MR01-001 · MR1 Preparation** only (tras Gate READY · Land Check).

---

## End of MOBILE-RELEASE-01 Runner
