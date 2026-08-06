# Operational Engine v0.8

**Status:** ✅ **DECLARED / FROZEN** — 2026-08-06  
**ADR:** [0077](../adr/0077-operational-engine-v08.md)  
**Board:** [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md)  
**Sprint:** [OPERATIONAL_VALIDATION_SPRINT](./OPERATIONAL_VALIDATION_SPRINT.md)  
**Field:** [FIELD_VALIDATION_MILESTONE](../10-validation/FIELD_VALIDATION_MILESTONE.md) · [ANDROID_FIELD_VALIDATION_REPORT](../10-validation/ANDROID_FIELD_VALIDATION_REPORT.md) · [FIELD_VALIDATION_LOG](../10-validation/FIELD_VALIDATION_LOG.md)  
**Android field:** ✅ **PASS** (OPPO · 2026-08-06) · iPhone ⏳ · Engine FIELD VALIDATED 🔒  
**Expansion:** [OPERATIONAL_EXPANSION](./OPERATIONAL_EXPANSION.md) · Delivery Architecture ✅ (ADR 0078) · Facade 🔒  
**Era:** Construction → Validation → **Operational Expansion**

```text
══════════════════════════════════════════════

YOURMEAL OS

Operational Engine v0.8

══════════════════════════════════════════════

Platform
██████████████████████████
Stable

Foundation
██████████████████████████
Stable

Capabilities

Identity
██████████████████████████
Engineering Certified

Customers
██████████████████████████
Engineering Certified

Orders
██████████████████████████
Engineering Certified

Production
██████████████████████████
Engineering Certified

Kitchen
██████████████████████████
Engineering Certified

Operational Flow

FLOW-001
██████████████████████████
Engineering Certified

══════════════════════════════════════════════

NEXT

FLOW Demo
    ↓
Operational Engine Review
    ↓
Android
    ↓
OPPO
    ↓
iPhone
    ↓
Real Tenant Validation
    ↓
Delivery

══════════════════════════════════════════════
```

---

## Meaning

```text
v0.8 = certified operational core
      (Identity → Customer → Orders → Production → Kitchen)
      + first Operational Flow (FLOW-001)

Not complete (no Delivery · no Billing · not v1.0).
Complete enough to validate on real devices.
```

This is the **grammar book** frozen.  
What follows writes **sentences in the field** — not more chapters of architecture.

---

## What v0.8 consolidates

| Asset | Status |
|-------|--------|
| Developer Platform v1.0 | ✅ |
| Product Core Foundation | ✅ |
| Operational Model | ✅ |
| Capability Registry | ✅ |
| Operational Flow Registry | ✅ |
| Operational Dependency Graph | ✅ |
| Operational Engine Board | ✅ |
| Foundation Laws 001–007 | ✅ Stable (no new laws this era) |
| Repeatable method | ✅ Architecture → Facade/Harness → Certification → Demo |
| First Flow certified | ✅ FLOW-001 |

More valuable than ten new screens.

---

## Era change

| Until now | From now |
|-----------|----------|
| ¿Está bien diseñada? | ¿Funciona bien cuando alguien la usa? |
| Construction | **Validation** |
| More Capabilities | Field evidence on Android / iPhone |
| Delivery temptation | **Contained** — gated |

---

## Immediate roadmap (frozen · do not reorder)

```text
1. FLOW-001 Demo              ✅
2. Operational Engine Review  ✅
3. Android Build              ✅
4. OPPO Field Validation      ✅ PASS · 2026-08-06
5. iPhone Build               ← FIELD-VALIDATION-002 ([guide](../10-validation/FIELD_VALIDATION_002_IOS.md) · audit NOT READY)
6. iPhone Field Validation
7. Delivery Architecture      LOCKED
```

Field artefacts: [ANDROID_FIELD_VALIDATION_REPORT](../10-validation/ANDROID_FIELD_VALIDATION_REPORT.md) · [FIELD_VALIDATION_002_IOS](../10-validation/FIELD_VALIDATION_002_IOS.md)

---

## Success phrase (field)

> *"Esto me ahorra tiempo y entiendo perfectamente qué tengo que hacer."*

When an EatClean operator says that on OPPO and then on iPhone, v0.8 has done its job.
