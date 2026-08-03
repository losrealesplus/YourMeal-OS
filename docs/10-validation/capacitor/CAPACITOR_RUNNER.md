# Capacitor · Distribution · Canonical Runner

**Documento:** `CAPACITOR_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **CERTIFIED** (este PR) · CERTIFIED_THROUGH = **0** · BLOCKED at C1  
**Spec:** [CAPACITOR_SPEC](../../00-status/CAPACITOR_SPEC.md) **READY FOR FREEZE** → Freeze on merge to `main`  
**DoR:** [CAPACITOR_DOR](../../00-status/CAPACITOR_DOR.md)  
**Gate:** [CAPACITOR_GATE](./CAPACITOR_GATE.md)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Nivel:** Distribution — **not** Business · **not** Experience · **not** stores

> Pregunta que responde este runner:  
> **¿Existe un contrato ejecutable para Capacitor (Distribution)?**  
> No: ¿install? · ¿Android Studio? · ¿Xcode? · ¿App Store? · ¿push?

---

## Regla de nivel

| Dominio | Certifica |
|---------|-----------|
| **Platform / Business / Experience** | Core SaaS · Flows · producto |
| **Distribution (este runner)** | Shell nativo · builds reproducibles |

**Core Integrity Rule:** Distribution no altera el comportamiento funcional del Core.

```text
Core SaaS → Capacitor → Android / iOS
```

---

## Contrato

```text
CAPACITOR
CAPACITOR_C1_STARTED      → Platform Preparation
    ↓
CAPACITOR_C1_COMPLETED
    ↓
CAPACITOR_C2_STARTED      → Native Shell
    ↓
CAPACITOR_C2_COMPLETED
    ↓
CAPACITOR_C3_STARTED      → Android Build
    ↓
CAPACITOR_C3_COMPLETED
    ↓
CAPACITOR_C4_STARTED      → iOS Build
    ↓
CAPACITOR_C4_COMPLETED
    ↓
CAPACITOR_C5_STARTED      → Acceptance
    ↓
CAPACITOR_C5_COMPLETED
    ↓
PASS → Distribution Certified
```

`CERTIFIED_THROUGH = 0` — ningún driver de bloque · empty → BLOCKED at C1.

---

## Comandos

```bash
npm run test:capacitor
# → BLOCKED at CAPACITOR_C1_STARTED · exit 2

npm run test:capacitor:runner-only
# → BLOCKED at CAPACITOR_C1_STARTED · exit 2

npm run test:capacitor:unit
# → pipeline unit tests PASS
```

Evidence: `docs/10-validation/capacitor/evidence/capacitor-canonical.json`

---

## Baseline esperado

```text
CAPACITOR

BLOCKED

blocked_at=CAPACITOR_C1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}

exit 2
```

---

## Fuera de alcance (este PR)

C1–C5 drivers · Capacitor install · Android / iOS builds · stores · push · device APIs · certificados

---

## Land Check (after merge)

```bash
git restore docs/10-validation/capacitor/evidence/ 2>/dev/null || true
git pull origin main
npm run test:capacitor
# → BLOCKED at CAPACITOR_C1_STARTED · exit 2
```

Next: **CAPACITOR-001 · C1 Platform Preparation** only (tras Gate READY en `main`).

---

## End of Capacitor Runner
