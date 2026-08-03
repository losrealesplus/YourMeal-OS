# Capacitor · Distribution · Canonical Runner

**Documento:** `CAPACITOR_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **CERTIFIED** · CERTIFIED_THROUGH = **3** (C3) · BLOCKED at C4  
**Spec:** [CAPACITOR_SPEC](../../00-status/CAPACITOR_SPEC.md) **FROZEN**  
**DoR:** [CAPACITOR_DOR](../../00-status/CAPACITOR_DOR.md)  
**Gate:** [CAPACITOR_GATE](./CAPACITOR_GATE.md)  
**Actas:** [001](./CAPACITOR_001_C1_ACTA.md) · [002](./CAPACITOR_002_C2_ACTA.md) · [003](./CAPACITOR_003_C3_ACTA.md)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Nivel:** Distribution — **not** Business · **not** Experience · **not** stores

---

## Contrato

```text
C1 Platform Preparation        ✅ CERTIFIED (CAPACITOR-001)
C2 Native Shell                ✅ CERTIFIED (CAPACITOR-002)
C3 Android Platform            ✅ CERTIFIED (CAPACITOR-003)
C4 iOS Build                   ⏳ next
C5 Acceptance                  🔒
```

`CERTIFIED_THROUGH = 3` — C1–C3 PASS · full Distribution BLOCKED at C4.

---

## Comandos

```bash
npm run test:capacitor-003
# → PASS through C3 · blocked_at=CAPACITOR_C4_STARTED · exit 0

npm run test:capacitor
# → PASS through C3 · blocked_at=CAPACITOR_C4_STARTED · exit 0

npm run test:capacitor:runner-only
# → BLOCKED at CAPACITOR_C1_STARTED · exit 2
```

Evidence: `docs/10-validation/capacitor/evidence/capacitor-003-canonical-live.json`

---

## Fuera de alcance (CAPACITOR-003)

APK · AAB · Play · emulators · signing · C4 iOS · device APIs · stores

---

## Land Check (after merge)

```bash
git restore docs/10-validation/capacitor/evidence/ 2>/dev/null || true
git pull origin main
npm run test:capacitor-003   # PASS through C3 · exit 0
npm run test:capacitor:runner-only  # BLOCKED at C1 · exit 2
```

Next: **CAPACITOR-004 · C4 iOS Build** only.

---

## End of Capacitor Runner
