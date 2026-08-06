# Operational Modules

**Phase:** Phase A COMPLETE · FLOW-001 Architecture (Phase B)  
**Board:** [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md) · [OPERATIONAL_FLOW_REGISTRY](./OPERATIONAL_FLOW_REGISTRY.md)

```text
PHASE A · Capability Certification     ████████████████ COMPLETE
PHASE B · Operational Flow Validation  ████░░░░░░░░░░░░ FLOW-001 Architecture
PHASE C · Real Tenant Validation       ░░░░░░░░░░░░░░░░
```

## Capabilities

```text
Identity · Customers · Orders · Production · Kitchen   Certified (+ Demos)
Delivery · Billing                                     Pending (via flows)
```

## Operational Flows

```text
FLOW-001  Orders → Production → Kitchen     Architecture (ADR 0074)
FLOW-002  Production → Kitchen → Delivery   Pending
FLOW-003  Delivery → Billing                Pending
```

## Method (unchanged)

```text
Observe → Design → Freeze → Facade → Engineering Certification → Demo
```

Applied to Flows the same way as Capabilities. No methodology change.

Next: **OPERATIONAL-FLOW-001 Phase 2 · Facade / harness**.
