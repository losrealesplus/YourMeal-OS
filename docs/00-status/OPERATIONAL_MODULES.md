# Operational Modules

**Phase:** Operational Engine exists · Kitchen Execution Architecture frozen  
**Board:** [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md) · [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) · [GITHUB_HOUSEKEEPING](./GITHUB_HOUSEKEEPING.md)

```text
Platform / Foundation           Stable
Context · Identity              Engineering Certified
Business Entity · Customers     Engineering Certified + Demo
Operational Planning
  Orders                        Engineering Certified + Demo
  Production                    Engineering Certified + Demo
Operational Execution
  Kitchen Execution             Architecture (ADR 0070)
  Delivery                      Pending
Operational Outcome
  Billing                       Pending
```

## Rhythm

```text
Architecture → Facade → Engineering Certification → Capability Demo
```

## Separation (LAW 005)

```text
Production → planifica   (Operational Planning)
Kitchen Execution → orquesta ejecución   (Operational Execution)
```

```text
Kitchen = coordinar · priorizar · confirmar · pausar · reanudar · terminar
Kitchen never cooks.
```

Next: **OPERATIONAL-005 Phase 2 · Kitchen Execution Facade**.
