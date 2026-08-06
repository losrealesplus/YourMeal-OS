# Operational Engine — Official Board

**Core frozen:** 2026-08-06 · **Operational Engine v0.8** · ADR [0077](../adr/0077-operational-engine-v08.md)  
**Expansion:** [OPERATIONAL_EXPANSION](./OPERATIONAL_EXPANSION.md) · Delivery **Engineering Certified** · FLOW-002 **Harness** · ADR [0081](../adr/0081-operational-flow-002.md) · [0082](../adr/0082-operational-flow-002-harness.md)  
**Behaviours:** [OPERATIONAL_BEHAVIOURS](../05-architecture/OPERATIONAL_BEHAVIOURS.md) · BH-001 Fulfill Weekly Commitment  
**Language:** [OPERATIONAL_LANGUAGE_DICTIONARY](./OPERATIONAL_LANGUAGE_DICTIONARY.md)  
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

Delivery
██████████████████████████
Engineering Certified

Operational Flow

FLOW-001
██████████████████████████
Engineering Certified

FLOW-002 · Operational Fulfillment
████████░░░░░░░░░░░░░░░░░░
Harness · ADR 0082 · BH-001

══════════════════════════════════════════════

FIELD

Android / OPPO
██████████████████████████
PASS · 2026-08-06

iPhone
░░░░░░░░░░░░░░░░░░░░░░░░░░
FIELD-VALIDATION-002

══════════════════════════════════════════════

PARALLEL TRACKS

1. Cross-Platform Validation (iPhone PASS)
2. FLOW-002 Phase 3 Engineering Certification
3. Delivery / FLOW-001 Demos (parallel)

══════════════════════════════════════════════
```

---

## Era

```text
Construction → Validation → Operational Expansion
```

v0.8 core remains frozen. Expansion adds Execution/Outcome modules **without** rewriting Foundation.

Android (OPPO): field evidence — [ANDROID_FIELD_VALIDATION_REPORT](../10-validation/ANDROID_FIELD_VALIDATION_REPORT.md).  
Delivery Certification: [DELIVERY_VALIDATION_REPORT](../10-validation/DELIVERY_VALIDATION_REPORT.md) · ADR 0080.  
FLOW-002 Architecture: [OPERATIONAL_FLOW_002](../05-architecture/OPERATIONAL_FLOW_002.md) · ADR 0081.

---

## No Delivery until

Delivery is **Engineering Certified** (ADR 0080). FLOW-002 **Architecture** is frozen (ADR 0081). Remaining gate before Harness / Product UI / Billing:

```text
Delivery Capability Demo (prefer)
FLOW-001 Demo (prefer)
Roadmap Review (Engine Review)
Android APK / OPPO Field Validation ✅
iPhone Field Validation (parallel · not blocking Architecture)
```

**No Delivery until** Demo preferido for Harness — do not open FLOW-002 Harness, Delivery Product UI, or Billing Architecture before Delivery Capability Demo (prefer). Architecture Freeze does not implement code.

---

## Gates (precise)

| Gate | Status | Meaning |
|------|--------|---------|
| Delivery **Architecture Freeze** | ✅ ADR 0078 |
| Delivery **Facade** | ✅ ADR 0079 · `src/delivery/` |
| Delivery **Engineering Certification** | ✅ ADR 0080 · FAIL=0 |
| Delivery **Capability Demo** | 🔒 Phase 4 |
| FLOW-002 **Architecture Freeze** | ✅ ADR 0081 |
| FLOW-002 **Harness** | ✅ ADR 0082 · `src/flows/flow-002/` |
| FLOW-002 **Engineering Certification** | 🔒 Phase 3 |
| FLOW-003 / Billing Architecture | 🔒 After FLOW-002 |
| Engine **FIELD VALIDATED** | 🔒 | Android + iPhone PASS |
| Claiming Production Authorization | 🔒 | Governance |

---

## Immediate next steps (parallel)

1. **FLOW-002 Phase 3** — Engineering Certification matrix  
2. **OPERATIONAL-006 Phase 4** — Delivery Capability Demo (`useDelivery` only)  
3. **IOS-READY / FIELD-VALIDATION-002** — [guide](../10-validation/FIELD_VALIDATION_002_IOS.md)
