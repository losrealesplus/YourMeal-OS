# Delivery Smoke Checklist

**OPERATIONAL-006 Phase 3 · Engineering Certification**  
**Companion:** [DELIVERY_VALIDATION_REPORT](./DELIVERY_VALIDATION_REPORT.md)

Use after Engineering Certification, when Delivery Workspace Demo (or temporary ops probe) exists.  
Until then: engineering matrix is enough to start Demo under Law 003–006-A.

```text
[ ] S1 Staff with logistics.operate can GetDeliveryContext for an operational day
[ ] S2 Context returns DeliveryAssignments / Stops — not Order CRUD rows · not GPS maps
[ ] S3 GetDeliveryAssignments filters by DeliveryStatus
[ ] S4 ConfirmDelivery reaches Confirmed via OrderFacade.completeDelivery
[ ] S5 GetCompletedDeliveries reflects delivered commitments (+ Kitchen touch)
[ ] S6 Assign / Start / Exception / Close / Routes show UNIMPLEMENTED honestly
[ ] S7 Missing session / tenant → Facade errors (not raw Supabase)
[ ] S8 UI imports only useDelivery / DeliveryFacade (Law 002 · 003 · 004)
[ ] S9 Delivery never shows “what should we cook?” or “what should we invoice?” (Law 006-A)
[ ] S10 FLOW-002 (when built) consumes DeliveryFacade — never invents fulfillment queues

Operator: ____________
Date: ____________
Device: OPPO / Web / Other: ____________
Result: PASS / FAIL
Notes:
```
