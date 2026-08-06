# Operational Validation Sprint

**Status:** ▶ **ACTIVE** — Android PASS · iPhone next  
**Declared:** 2026-08-06  
**Prerequisite:** Operational Engine v0.8 on `main`  
**Companions:** [OPERATIONAL_ENGINE_V08](./OPERATIONAL_ENGINE_V08.md) · [OPERATIONAL_ROADMAP](./OPERATIONAL_ROADMAP.md) · [FIELD_VALIDATION_MILESTONE](../10-validation/FIELD_VALIDATION_MILESTONE.md) · [ANDROID_FIELD_VALIDATION_REPORT](../10-validation/ANDROID_FIELD_VALIDATION_REPORT.md) · [FIELD_VALIDATION_LOG](../10-validation/FIELD_VALIDATION_LOG.md)

```text
══════════════════════════════════════════════
SPRINT

Operational Validation Sprint

Objetivo

☑ FLOW-001 Demo
☑ Operational Engine Review
☑ Android APK
☑ OPPO Validation          ← PASS 2026-08-06
□ iPhone Build
□ iPhone Validation        ← FIELD-VALIDATION-002

Definition of Done

The Operational Engine has been successfully
used on real mobile devices (Android + iOS).

No new architecture.
No new Capabilities.
No Delivery.

Focus exclusively on validation and experience.
══════════════════════════════════════════════
```

---

## Where we are

```text
Developer Platform
██████████████████
Stable · 100%

↓

Product Core Foundation
██████████████████
Stable · 100%

↓

Operational Engine v0.8
████████████████░░
Stable · Android field PASS

↓

Construction
██████████████████
Complete

↓

Validation
████████████░░░░░░
Android PASS · iPhone next
```

---

## Work rhythm (this era)

| Until Construction | From Validation |
| ------------------ | --------------- |
| Architecture → Code → Tests | **Experience → Validation → Iteration** |

Method proven on OPPO:

```text
Evidence → Hypothesis → Validation → Minimal Fix → Regression Tests → Field PASS
```

---

## Sprint order (do not reorder)

1. **FLOW-001 Demo** — ✅
2. **Operational Engine Review** — ✅
3. **Android APK** — ✅
4. **OPPO Validation** — ✅ [report](../10-validation/ANDROID_FIELD_VALIDATION_REPORT.md)
5. **iPhone Build** — next
6. **iPhone Validation** — FIELD-VALIDATION-002 (same discipline)

**After Android + iOS PASS:** declare Operational Engine v0.8 **FIELD VALIDATED**.  
**Then** open Delivery Architecture. Not before.

---

## Explicitly out of scope

- Delivery Capability / FLOW-002
- Billing
- New Foundation Laws
- New Operational Capabilities
- Stacked architecture PRs

---

## Success

> An EatClean operator on OPPO (then iPhone) can complete a real operational path and say:  
> *“Esto me ahorra tiempo y entiendo perfectamente qué tengo que hacer.”*

Android side of that question: **answered with evidence** (2026-08-06).
