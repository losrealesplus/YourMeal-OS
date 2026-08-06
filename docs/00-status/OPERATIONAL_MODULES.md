# Operational Modules

**Phase:** Phase A COMPLETE · FLOW-001 Harness (Phase B)  
**Board:** [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md) · [OPERATIONAL_FLOW_REGISTRY](./OPERATIONAL_FLOW_REGISTRY.md)

```text
PHASE A · Capability Certification     ████████████████ COMPLETE
PHASE B · Operational Flow Validation  ████████░░░░░░░░ FLOW-001 Harness
PHASE C · Real Tenant Validation       ░░░░░░░░░░░░░░░░
```

## Capabilities

```text
Identity · Customers · Orders · Production · Kitchen   Certified (+ Demos)
Delivery · Billing                                     Pending (via flows)
```

## Operational Flows

```text
FLOW-001  Orders → Production → Kitchen     Harness (ADR 0075)
FLOW-002  Production → Kitchen → Delivery   Pending
FLOW-003  Delivery → Billing                Pending
```

## Definitions

```text
FLOW validates transitions. NOT validate Capabilities.
Harnesses orchestrate certified Facades — never business logic.
```

## Method (unchanged)

```text
Observe → Design → Freeze → Harness → Engineering Certification → Demo
```

Next: **OPERATIONAL-FLOW-001 Phase 3 · Engineering Certification**.
