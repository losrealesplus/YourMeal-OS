# Operational Modules

**Phase:** OPERATIONAL EXPERIENCE · Operational Execution begins  
**Panel:** [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) · [OPERATIONAL_ROADMAP](./OPERATIONAL_ROADMAP.md) · [OPERATIONAL_ENGINE](./OPERATIONAL_ENGINE.md) · [PLATFORM_STATUS](./PLATFORM_STATUS.md) · [FOUNDATION_STATUS](./FOUNDATION_STATUS.md)

```text
YourMeal OS
══════════════════════════════════════
Platform                        100%
Foundation                      100%
Operational Capabilities
  001 Identity                  Engineering Certified
  002 Customers                 Engineering Certified + Demo
  003 Orders                    Engineering Certified + Demo
  004 Production                Facade (ADR 0067)
══════════════════════════════════════
Operational Experience
  Customer Workspace            Capability Demo
  Order Workspace               Capability Demo
══════════════════════════════════════
Operational Execution
  Production                    Facade (planning API)
  Kitchen                       Pending (after Production Validate+Demo)
  Delivery                      Pending
  Billing                       Pending (Outcome)
```

## Work language (not Order CRUD)

```text
GenerateProductionPlan → GetProductionQueue → ProductionLoad
MarkBatchReady → CloseBatch
```

## Separation

```text
Order        → compromiso
Production   → trabajo planificado
Kitchen      → trabajo ejecutado
```

```text
Production never cooks.
Kitchen executes.
```

## Discipline

Complete Architecture → Facade → Validation → Demo **before** opening Kitchen.

## Laws

LAW 001–004 · see [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md)

Next: **certify Production Validation** (OPERATIONAL-004 Phase 3).  
Milestone: [Operational Engine v1.0](./OPERATIONAL_ENGINE.md).
