# Operational Roadmap

**Permanent · Operational Engine v0.8 frozen · ADR [0077](../adr/0077-operational-engine-v08.md)**  
**Companions:** [OPERATIONAL_ENGINE_V08](./OPERATIONAL_ENGINE_V08.md) · [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md) · [OPERATIONAL_ENGINE_REVIEW](./OPERATIONAL_ENGINE_REVIEW.md) · [OPERATIONAL_VALIDATION_SPRINT](./OPERATIONAL_VALIDATION_SPRINT.md) · [FIELD_VALIDATION_LOG](../10-validation/FIELD_VALIDATION_LOG.md) · [FIELD_VALIDATION_002_IOS](../10-validation/FIELD_VALIDATION_002_IOS.md)

---

## Era

```text
Construction  →  Validation
```

Do not reorder. Do not open Delivery early.

---

## Immediate roadmap (frozen)

```text
1. FLOW-001 Demo
██████████ DONE

↓

2. Operational Engine Review
██████████ DONE

↓

3. Android Build
██████████ DONE

↓

4. OPPO Field Validation
██████████ PASS · 2026-08-06
           → docs/10-validation/ANDROID_FIELD_VALIDATION_REPORT.md

↓

5. iPhone Build
██████████ ← FIELD-VALIDATION-002
           → docs/10-validation/FIELD_VALIDATION_002_IOS.md
           → audit: NOT READY (signing · Preferences SPM · Mac sync)

↓

6. iPhone Field Validation
██████████ Cross-Platform Validation gate

↓

7. Delivery Architecture
          LOCKED until Android + iOS PASS
```

### Method (post-Android PASS)

```text
… → Field Validation → Cross-Platform Validation → Production
```

Android alone ≠ platform-independent. Android + iPhone PASS = Engine FIELD VALIDATED.

---

## Certification phases

```text
PHASE A · Capability Certification     ████████████████ COMPLETE
PHASE B · Operational Flow Validation  ████████████░░░░ FLOW-001 Certified · Demo next
PHASE C · Real Tenant Validation       ░░░░░░░░░░░░░░░░
```

---

## FLOW-001 track

```text
Architecture (ADR 0074)              ✅
Harness (ADR 0075)                   ✅
Engineering Certification (ADR 0076) ✅
Flow Demo                            ← next
```

---

## Success question (field)

> **¿Una persona de EatClean puede recorrer un flujo completo en Android y en iPhone y decir: “Esto me ahorra tiempo y entiendo perfectamente qué tengo que hacer”?**
