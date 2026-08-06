# Operational Engine — Official Board

**Core frozen:** 2026-08-06 · **Operational Engine v0.8** · ADR [0077](../adr/0077-operational-engine-v08.md)  
**Expansion:** [OPERATIONAL_EXPANSION](./OPERATIONAL_EXPANSION.md) · OPERATIONAL-006 Delivery Architecture · ADR [0078](../adr/0078-delivery-capability.md)  
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
████░░░░░░░░░░░░░░░░░░░░░░
Architecture · OPERATIONAL-006

Operational Flow

FLOW-001
██████████████████████████
Engineering Certified

FLOW-002
░░░░░░░░░░░░░░░░░░░░░░░░░░
Pending (needs Delivery Facade)

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
2. OPERATIONAL-006 Phase 2 Facade (when intentionally opened)
3. FLOW-002 (after Delivery Facade)

══════════════════════════════════════════════
```

---

## Era

```text
Construction → Validation → Operational Expansion
```

v0.8 core remains frozen. Expansion adds Execution/Outcome modules **without** rewriting Foundation.

Android (OPPO): field evidence — [ANDROID_FIELD_VALIDATION_REPORT](../10-validation/ANDROID_FIELD_VALIDATION_REPORT.md).  
Delivery Architecture: [DELIVERY_CAPABILITY](../05-architecture/DELIVERY_CAPABILITY.md).

---

## Gates (precise)

| Gate | Status | Meaning |
|------|--------|---------|
| Delivery **Architecture Freeze** | ✅ Open (ADR 0078) | Contracts only |
| Delivery **Facade / UI / DB** | 🔒 | Phase 2 — intentional open |
| FLOW-002 | 🔒 | After Delivery Facade |
| Engine **FIELD VALIDATED** | 🔒 | Android + iPhone PASS |
| Claiming Production Authorization | 🔒 | Governance |

---

## Immediate next steps (parallel)

1. **IOS-READY / FIELD-VALIDATION-002** — [guide](../10-validation/FIELD_VALIDATION_002_IOS.md)  
2. **OPERATIONAL-006 Phase 2** — only when team opens Facade (not in Architecture PR)
