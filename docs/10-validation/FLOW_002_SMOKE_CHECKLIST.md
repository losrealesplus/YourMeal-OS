# FLOW-002 Smoke Checklist

**OPERATIONAL-FLOW-002 Phase 3 · Engineering Certification**  
**Companion:** [FLOW_002_VALIDATION_REPORT](./FLOW_002_VALIDATION_REPORT.md)  
**Behaviour:** BH-001 Fulfill Weekly Commitment

Use after Engineering Certification, when Flow Demo (or temporary ops probe) exists.  
Until then: engineering matrix is enough to start Flow Demo.

```text
[ ] S1 Authenticated operator with tenant can run FLOW-002 for a day
[ ] S2 Order → Production → Kitchen hops via Facades only
[ ] S3 Delivery hop returns assignments via DeliveryFacade only
[ ] S4 Confirmation hop reaches Confirmed via ConfirmDelivery
[ ] S5 Evidence steps show full chain through ConfirmationHop
[ ] S6 Failed hop reports which transition failed (not business why)
[ ] S7 Missing session / tenant fails at IdentityGate
[ ] S8 Empty assignment day completes honestly without inventing Confirm
[ ] S9 Flow Demo (when built) uses useFlow002 / Harness only
[ ] S10 Never open Billing / FLOW-003 until FLOW-002 Demo preferido
[ ] S11 FLOW validates transitions — not “does Delivery work?”
[ ] S12 Behaviour outcome readable: Operational Commitment Fulfilled

Operator: ____________
Date: ____________
Device: OPPO / Web / Other: ____________
Result: PASS / FAIL
Notes:
```
