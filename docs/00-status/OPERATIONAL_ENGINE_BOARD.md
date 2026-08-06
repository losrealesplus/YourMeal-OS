# Operational Engine — Official Board

**Frozen:** 2026-08-06 · **Operational Engine v0.8** · ADR [0077](../adr/0077-operational-engine-v08.md)  
**Detail:** [OPERATIONAL_ENGINE_V08](./OPERATIONAL_ENGINE_V08.md) · [OPERATIONAL_ENGINE_REVIEW](./OPERATIONAL_ENGINE_REVIEW.md) · [OPERATIONAL_FLOW_REGISTRY](./OPERATIONAL_FLOW_REGISTRY.md)

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

FIELD

Android / OPPO
██████████████████████████
PASS · 2026-08-06

iPhone
░░░░░░░░░░░░░░░░░░░░░░░░░░
FIELD-VALIDATION-002

══════════════════════════════════════════════

NEXT

iPhone Build + Field Validation

↓

Engine v0.8 FIELD VALIDATED (both platforms)

↓

Real Tenant Validation

↓

Delivery

══════════════════════════════════════════════
```

---

## Era

```text
Construction  →  Validation
```

Question until now: *¿Está bien diseñada?*  
Question from now: *¿Funciona bien cuando alguien la usa?*

Android (OPPO): answered with evidence — [ANDROID_FIELD_VALIDATION_REPORT](../10-validation/ANDROID_FIELD_VALIDATION_REPORT.md).

---

## No Delivery until

```text
FLOW-001 Demo                 ✅
Roadmap Review (Engine Review) ✅
Android APK                   ✅
OPPO Field Validation         ✅
iPhone Field Validation       ⏳
```

Do not open Delivery / FLOW-002 Architecture before this gate is complete.

---

**Immediate next step**

**FIELD-VALIDATION-002 · iOS** — official guide: [FIELD_VALIDATION_002_IOS](../10-validation/FIELD_VALIDATION_002_IOS.md)  
Audit verdict: **NOT READY** for install today · clear signing + Preferences SPM + `sync:mobile`, then physical iPhone session.
