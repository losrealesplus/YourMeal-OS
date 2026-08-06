# Production Smoke Checklist

**OPERATIONAL-004 Phase 3 · Engineering Certification**  
**Companion:** [PRODUCTION_VALIDATION_REPORT](./PRODUCTION_VALIDATION_REPORT.md)

Use after Engineering Certification, when Production Workspace Demo (or temporary ops probe) exists.  
Until then: engineering matrix is enough to start Demo under Law 003–004.

```text
[ ] S1 Staff with kitchen.operate / production.read can GetProductionPlan for a day
[ ] S2 GenerateProductionPlan returns Work batches (dish · portions) — not an Order table
[ ] S3 GetProductionQueue / GetProductionLoad reflect the same day board
[ ] S4 MarkBatchReady advances lot toward kitchen work
[ ] S5 CloseBatch reaches done / finished
[ ] S6 GetProductionCalendar lists delivery days via Order commitments
[ ] S7 GetProductionCapacity / AssignBatch / RescheduleBatch show UNIMPLEMENTED honestly
[ ] S8 Missing session / tenant → Facade errors (not raw Supabase)
[ ] S9 UI imports only useProduction / ProductionFacade (Law 002 · 003 · 004)
[ ] S10 Kitchen screens (when built) consume ProductionFacade — never replan from raw Orders

Operator: ____________
Date: ____________
Device: OPPO / Web / Other: ____________
Result: PASS / FAIL
Notes:
```
