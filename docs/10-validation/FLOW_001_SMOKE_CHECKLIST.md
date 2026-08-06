# FLOW-001 Smoke Checklist

**OPERATIONAL-FLOW-001 Phase 3 · Engineering Certification**  
**Companion:** [FLOW_001_VALIDATION_REPORT](./FLOW_001_VALIDATION_REPORT.md)

Use after Engineering Certification, when Flow Demo (or temporary ops probe) exists.  
Until then: engineering matrix is enough to start Flow Demo.

```text
[ ] S1 Authenticated operator with tenant can run FLOW-001 for a day
[ ] S2 Order hop returns commitments via OrderFacade only (not Kitchen)
[ ] S3 Production hop produces plan/queue via ProductionFacade only
[ ] S4 Kitchen hop returns ExecutionUnits via KitchenExecutionFacade only
[ ] S5 Evidence steps show Identity → Order → Production → Kitchen → Complete
[ ] S6 Missing session / tenant fails at IdentityGate (not raw Supabase)
[ ] S7 Empty execution day completes honestly without inventing work
[ ] S8 Flow Demo (when built) uses useFlow001 / Harness only — no business logic in UI
[ ] S9 Never open Delivery Capability until FLOW-001 Demo · Roadmap Review · Android · OPPO · iPhone
[ ] S10 FLOW validates transitions — not “does Orders work?”

Operator: ____________
Date: ____________
Device: OPPO / Web / Other: ____________
Result: PASS / FAIL
Notes:
```
