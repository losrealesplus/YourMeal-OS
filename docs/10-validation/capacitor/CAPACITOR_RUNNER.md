# Capacitor · Distribution · Canonical Runner

**Documento:** `CAPACITOR_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **CERTIFIED** · CERTIFIED_THROUGH = **1** (C1) · BLOCKED at C2  
**Spec:** [CAPACITOR_SPEC](../../00-status/CAPACITOR_SPEC.md) **FROZEN**  
**DoR:** [CAPACITOR_DOR](../../00-status/CAPACITOR_DOR.md)  
**Gate:** [CAPACITOR_GATE](./CAPACITOR_GATE.md)  
**Acta 001:** [CAPACITOR_001_C1_ACTA](./CAPACITOR_001_C1_ACTA.md)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Nivel:** Distribution — **not** Business · **not** Experience · **not** stores

---

## Contrato

```text
C1 Platform Preparation        ✅ CERTIFIED (CAPACITOR-001)
C2 Native Shell                ⏳ next
C3–C5                          🔒
```

`CERTIFIED_THROUGH = 1` — C1 PASS · full Distribution BLOCKED at C2.

---

## Comandos

```bash
npm run test:capacitor-001
# → PASS through C1 · blocked_at=CAPACITOR_C2_STARTED · exit 0

npm run test:capacitor
# → PASS through C1 · blocked_at=CAPACITOR_C2_STARTED · exit 0

npm run test:capacitor:runner-only
# → BLOCKED at CAPACITOR_C1_STARTED · exit 2
```

Evidence: `docs/10-validation/capacitor/evidence/capacitor-001-canonical-live.json`

---

## Fuera de alcance (CAPACITOR-001)

C2 Native Shell · android/ios certify · stores · push · device APIs · certificados

---

## Land Check (after merge)

```bash
git restore docs/10-validation/capacitor/evidence/ 2>/dev/null || true
git pull origin main
npm run test:capacitor-001   # PASS through C1 · exit 0
npm run test:capacitor:runner-only  # BLOCKED at C1 · exit 2
```

Next: **CAPACITOR-002 · C2 Native Shell** only.

---

## End of Capacitor Runner
