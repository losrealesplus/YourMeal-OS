# Operational Validation Sprint

**Status:** ▶ **ACTIVE** (declared 2026-08-06)  
**Prerequisite:** Operational Engine v0.8 landed on `main`  
**Companions:** [OPERATIONAL_ENGINE_V08](./OPERATIONAL_ENGINE_V08.md) · [OPERATIONAL_ROADMAP](./OPERATIONAL_ROADMAP.md) · [FIELD_VALIDATION_LOG](../10-validation/FIELD_VALIDATION_LOG.md)

```text
══════════════════════════════════════════════
SPRINT

Operational Validation Sprint

Objetivo

□ FLOW-001 Demo
□ Operational Engine Review
□ Android APK
□ OPPO Validation
□ iPhone Build
□ iPhone Validation

Definition of Done

The Operational Engine has been successfully
used on real mobile devices.

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
Stable

↓

Product Core Foundation
██████████████████
Stable

↓

Operational Engine v0.8
██████████████████
Stable

↓

Construction
██████████████████
Complete

↓

Validation
████░░░░░░░░░░░░░
Current Phase
```

---

## Work rhythm (this era)

| Until Construction | From Validation |
| ------------------ | --------------- |
| Architecture → Code → Tests | **Experience → Validation → Iteration** |

---

## Sprint order (do not reorder)

1. **FLOW-001 Demo** — close the last engineering gap (~95% done).
2. **Operational Engine Review** — Registry, Flows, Foundation, naming, debt, performance, UX. Declare `REVIEWED`. No new code required.
3. **Android APK** — `git pull` → `doctor:env` → `doctor` → `build` → `cap sync android` → assemble → install.
4. **OPPO Validation** — field experience (clarity, navigation, trust, friction). Log in [FIELD_VALIDATION_LOG](../10-validation/FIELD_VALIDATION_LOG.md).
5. **iPhone Build** — same checklist when Android is stable.
6. **iPhone Validation** — same field questions.

**After that:** open Delivery Architecture. Not before.

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
