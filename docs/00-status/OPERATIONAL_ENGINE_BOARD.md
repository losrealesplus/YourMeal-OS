# Operational Engine — Official Board

**Core frozen:** 2026-08-06 · **Operational Engine v0.8** · ADR [0077](../adr/0077-operational-engine-v08.md)  
**Expansion:** [OPERATIONAL_EXPANSION](./OPERATIONAL_EXPANSION.md) · FLOW-002 **Engineering Certified** · ADR [0083](../adr/0083-operational-flow-002-engineering-certification.md)  
**Behaviours:** [OPERATIONAL_BEHAVIOUR_BOARD](./OPERATIONAL_BEHAVIOUR_BOARD.md) · BH-001 Certified  
**Scenarios:** [OPERATIONAL_SCENARIO_REGISTRY](./OPERATIONAL_SCENARIO_REGISTRY.md) · RESERVED  
**Language:** [OPERATIONAL_LANGUAGE_DICTIONARY](./OPERATIONAL_LANGUAGE_DICTIONARY.md)  
**Detail:** [OPERATIONAL_ENGINE_V08](./OPERATIONAL_ENGINE_V08.md) · [OPERATIONAL_FLOW_REGISTRY](./OPERATIONAL_FLOW_REGISTRY.md)

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
██████████████████████████
Engineering Certified · BH-001

══════════════════════════════════════════════

BEHAVIOURS

BH-001 Fulfill Weekly Commitment
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

PARALLEL TRACKS

1. Cross-Platform Validation (iPhone PASS)
2. FLOW-002 Flow Demo (Phase 4)
3. FLOW-003 / Billing Architecture gated

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

Delivery is **Engineering Certified** (ADR 0080). FLOW-002 is **Engineering Certified** (ADR 0083). Remaining gate before Product UI / Billing / Scenarios:

```text
FLOW-002 Flow Demo (prefer)
FLOW-001 Demo (prefer)
Roadmap Review (Engine Review)
Android APK / OPPO Field Validation ✅
iPhone Field Validation (parallel · not blocking Certification)
```

**No Delivery until** Demo preferido for Product UI — do not open Delivery Product UI, Billing Architecture, or Scenarios before FLOW-002 Flow Demo (prefer).

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
| FLOW-002 **Engineering Certification** | ✅ ADR 0083 · FAIL=0 |
| BH-001 **Behaviour Certified** | ✅ via FLOW-002 |
| FLOW-002 **Flow Demo** | 🔒 Phase 4 |
| FLOW-003 / Billing Architecture | 🔒 After FLOW-002 Demo preferido |
| Scenarios | 🔒 RESERVED |
| Engine **FIELD VALIDATED** | 🔒 | Android + iPhone PASS |
| Claiming Production Authorization | 🔒 | Governance |

---

## Immediate next steps (parallel)

1. **FLOW-002 Phase 4** — Flow Demo (`useFlow002` only)  
2. **IOS-READY / FIELD-VALIDATION-002** — [guide](../10-validation/FIELD_VALIDATION_002_IOS.md)  
3. **FLOW-003 / Billing** — only after FLOW-002 Demo preferido
