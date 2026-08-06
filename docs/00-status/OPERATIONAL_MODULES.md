# Operational Modules

**Phase:** Phase A complete through Kitchen Demo · Phase B authorized  
**Board:** [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md) · [OPERATIONAL_CERTIFICATION_PHASES](./OPERATIONAL_CERTIFICATION_PHASES.md)

```text
Platform / Foundation           Stable
Context · Identity              Engineering Certified
Business Entity · Customers     Engineering Certified + Demo
Operational Planning
  Orders                        Engineering Certified + Demo
  Production                    Engineering Certified + Demo
Operational Execution
  Kitchen Execution             Engineering Certified + Demo
  Delivery                      Pending (FLOW-002)
Operational Outcome
  Billing                       Pending (FLOW-003)
```

## Certification phases

```text
PHASE A · Capability Certification     ████████████████
PHASE B · Operational Flow Validation  ████░░░░░░░░░░░░
PHASE C · Real Tenant Validation       ░░░░░░░░░░░░░░░░
```

## Separation (LAW 005 · 006 · 006-A · 007)

```text
Production → planifica · Batches
Kitchen Execution → orquesta · ExecutionUnits
Flows → never bypass Facades
```

Next: **OPERATIONAL-FLOW-001** (Orders → Production → Kitchen).
