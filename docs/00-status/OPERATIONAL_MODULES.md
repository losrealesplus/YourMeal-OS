# Operational Modules

**Phase:** OPERATIONAL EXPERIENCE  
**Panel:** [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) · [GITHUB_HOUSEKEEPING](./GITHUB_HOUSEKEEPING.md)  
**Era center:** [OPERATIONAL_EXPERIENCE](./OPERATIONAL_EXPERIENCE.md) → Tenant Success

```text
Identity     Context                Engineering Certified
Customers    Business Entity        Engineering Certified + Demo
Orders       Operational Process    Facade (ADR 0063)
Production   Operational Execution  Pending
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

Not `CreateOrder` / `UpdateOrder` / `DeleteOrder`.

## Laws

LAW 001–004 · see [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md)

Next: Order Validate · then Capability Demo · Production Architecture.
