# Order Smoke Checklist

**OPERATIONAL-003 Phase 3**  
**Companion:** [ORDER_VALIDATION_REPORT](./ORDER_VALIDATION_REPORT.md)

Use after Engineering Certification, when Order Workspace Demo (or temporary ops probe) exists.  
Until then: engineering matrix is enough to start Demo / Production Architecture under Law 003–004.

```text
[ ] S1 Staff with orders.read can SearchOrders / GetOrdersByWeek
[ ] S2 GetOrder shows partyRef (Customer) + weekStart + status
[ ] S3 PlanWeeklyOrder creates draft for a concrete week
[ ] S4 ConfirmOrder advances draft → confirmed
[ ] S5 ScheduleProduction → ReadyForKitchen → ReadyForDelivery path
[ ] S6 CompleteDelivery reaches delivered
[ ] S7 GetKitchenQueue / GetOrdersReadyForDelivery for a Delivery Day
[ ] S8 GetOperationalCalendar lists week orderIds + deliveryDays
[ ] S9 Missing session / tenant → Facade errors (not raw Supabase)
[ ] S10 UI imports only useOrder / OrderFacade (Law 002 · 003 · 004)
[ ] S11 Production / Kitchen / Delivery screens do not import repositories

Operator: ____________
Date: ____________
Device: OPPO / Web / Other: ____________
Result: PASS / FAIL
Notes:
```
