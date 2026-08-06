# Operational Modules

**Phase:** Operational Engine exists · Engine Completion · Kitchen Execution Facade  
**Board:** [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md) · [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md)

```text
Platform / Foundation           Stable
Context · Identity              Engineering Certified
Business Entity · Customers     Engineering Certified + Demo
Operational Planning
  Orders                        Engineering Certified + Demo
  Production                    Engineering Certified + Demo
Operational Execution
  Kitchen Execution             Facade (ADR 0071)
  Delivery                      Pending
Operational Outcome
  Billing                       Pending
```

## Engine Completion

```text
Context                 ████████████████
Business Entity         ████████████████
Operational Planning    ████████████████
Operational Execution   ████░░░░░░░░░░░░
Operational Outcome     ░░░░░░░░░░░░░░░░
```

## Separation (LAW 005 · 006)

```text
Production → planifica · Batches
Kitchen Execution → orquesta · ExecutionUnits
```

Next: **OPERATIONAL-005 Phase 3 · Kitchen Execution Engineering Certification**.
