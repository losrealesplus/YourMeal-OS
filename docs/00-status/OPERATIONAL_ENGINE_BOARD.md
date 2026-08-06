# Operational Engine — Official Board

**Core frozen:** 2026-08-06 · **Operational Engine v0.8** · ADR [0077](../adr/0077-operational-engine-v08.md)  
**Expansion:** [OPERATIONAL_EXPANSION](./OPERATIONAL_EXPANSION.md) · OPERATIONAL-006 Delivery Facade · ADR [0078](../adr/0078-delivery-capability.md) · [0079](../adr/0079-delivery-facade.md)  
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
████████░░░░░░░░░░░░░░░░░░
Facade · OPERATIONAL-006

Operational Flow

FLOW-001
██████████████████████████
Engineering Certified

FLOW-002
░░░░░░░░░░░░░░░░░░░░░░░░░░
Pending (needs Delivery Certification)

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
2. OPERATIONAL-006 Phase 3 Engineering Certification
3. FLOW-002 (after Delivery Certification · prefer Demo)

══════════════════════════════════════════════
```

---

## Era

```text
Construction → Validation → Operational Expansion
```

v0.8 core remains frozen. Expansion adds Execution/Outcome modules **without** rewriting Foundation.

Android (OPPO): field evidence — [ANDROID_FIELD_VALIDATION_REPORT](../10-validation/ANDROID_FIELD_VALIDATION_REPORT.md).  
Delivery Facade: [DELIVERY_CAPABILITY](../05-architecture/DELIVERY_CAPABILITY.md) · `src/delivery/`.

---

## No Delivery until

Facade Soft-Live (ADR 0079) is open. The remaining gate before FLOW-002 / Product UI:

```text
Delivery Engineering Certification
Delivery Capability Demo (prefer)
FLOW-001 Demo (prefer)
Roadmap Review (Engine Review)
Android APK / OPPO Field Validation ✅
iPhone Field Validation (parallel · not blocking Facade)
```

**No Delivery until** Certification — do not open FLOW-002 Harness, Delivery Product UI, or Billing Architecture before Delivery Engineering Certification (prefer Demo).

---

## Gates (precise)

| Gate | Status | Meaning |
|------|--------|---------|
| Delivery **Architecture Freeze** | ✅ ADR 0078 |
| Delivery **Facade** | ✅ ADR 0079 · `src/delivery/` |
| Delivery **Certification / Demo** | 🔒 Phase 3–4 |
| FLOW-002 | 🔒 After Certification preferido |
| Engine **FIELD VALIDATED** | 🔒 | Android + iPhone PASS |
| Claiming Production Authorization | 🔒 | Governance |

---

## Immediate next steps (parallel)

1. **OPERATIONAL-006 Phase 3** — Engineering Certification matrix  
2. **IOS-READY / FIELD-VALIDATION-002** — [guide](../10-validation/FIELD_VALIDATION_002_IOS.md)  
3. **FLOW-002** — only after Delivery Certification (prefer Demo)
