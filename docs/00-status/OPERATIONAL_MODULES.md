# Operational Modules

**Phase:** OPERATIONAL EXPERIENCE · Operational Validation  
**Panel:** [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) · [OPERATIONAL_ROADMAP](./OPERATIONAL_ROADMAP.md) · [PLATFORM_STATUS](./PLATFORM_STATUS.md) · [FOUNDATION_STATUS](./FOUNDATION_STATUS.md)

```text
Identity     Context                Engineering Certified
Customers    Business Entity        Engineering Certified + Demo
Orders       Operational Process    Engineering Certified (ADR 0064)
Production   Operational Execution  Pending (authorized)
Kitchen      Operational Execution  Pending
Delivery     Operational Execution  Pending
Billing      Operational Outcome    Pending
```

## Method (permanent)

```text
Observe → Design → Freeze → Facade → Validate → Capability Demo
→ Operational Experience → Field Validation → Production
```

## Order process language

```text
PlanWeeklyOrder → ConfirmOrder → ScheduleProduction
→ ReadyForKitchen → ReadyForDelivery → CompleteDelivery
```

```text
Order = compromiso operativo del tenant para una semana concreta.
```

Not `CreateOrder` / `UpdateOrder` / `DeleteOrder`.

## Laws

LAW 001–004 · see [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md)

Next: Order Workspace Demo · then Production Capability Architecture.
