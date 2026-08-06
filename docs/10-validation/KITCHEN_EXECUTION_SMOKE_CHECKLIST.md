# Kitchen Execution Smoke Checklist

**OPERATIONAL-005 Phase 3 · Engineering Certification**  
**Companion:** [KITCHEN_EXECUTION_VALIDATION_REPORT](./KITCHEN_EXECUTION_VALIDATION_REPORT.md)

Use after Engineering Certification, when Kitchen Workspace Demo (or temporary ops probe) exists.  
Until then: engineering matrix is enough to start Demo under Law 003–006-A.

```text
[ ] S1 Staff with kitchen.operate can GetExecutionQueue for a day
[ ] S2 Queue returns ExecutionUnits (label · portions · status) — not Order rows · not Production plan UI
[ ] S3 GetExecutionUnits / GetExecutionProgress reflect the same day
[ ] S4 MarkExecutionReady advances unit toward READY via Production release
[ ] S5 CompleteExecution reaches COMPLETED
[ ] S6 Start / Pause / Resume / Assign / Block show UNIMPLEMENTED honestly
[ ] S7 Missing session / tenant → Facade errors (not raw Supabase)
[ ] S8 UI imports only useKitchenExecution / KitchenExecutionFacade (Law 002 · 003 · 004)
[ ] S9 Kitchen never shows “what should we produce?” (Law 006-A — Production owns that)
[ ] S10 Delivery screens (when built) consume KitchenExecutionFacade — never invent kitchen queues

Operator: ____________
Date: ____________
Device: OPPO / Web / Other: ____________
Result: PASS / FAIL
Notes:
```
