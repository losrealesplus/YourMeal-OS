# Operational Modules

**Phase:** Kitchen Execution Engineering Certified · Demo next  
**Board:** [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md) · [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md)

```text
Platform / Foundation           Stable
Context · Identity              Engineering Certified
Business Entity · Customers     Engineering Certified + Demo
Operational Planning
  Orders                        Engineering Certified + Demo
  Production                    Engineering Certified + Demo
Operational Execution
  Kitchen Execution             Engineering Certified (ADR 0072)
  Delivery                      Pending (after Kitchen Demo)
Operational Outcome
  Billing                       Pending
```

## Engine Completion

```text
Context                 ████████████████
Business Entity         ████████████████
Operational Planning    ████████████████
Operational Execution   ████████░░░░░░░░
Operational Outcome     ░░░░░░░░░░░░░░░░
```

## Separation (LAW 005 · 006 · 006-A)

```text
Production → planifica · Batches
Kitchen Execution → orquesta · ExecutionUnits
```

Kitchen never answers Production's question.

Next: **OPERATIONAL-005 Phase 4 · Kitchen Capability Demo**  
Then: **Operational Flow Validation** (Production → Kitchen → Delivery).
