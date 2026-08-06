# Customer Smoke Checklist

**OPERATIONAL-002 Phase 3**  
**Companion:** [CUSTOMER_VALIDATION_REPORT](./CUSTOMER_VALIDATION_REPORT.md)

Use after Engineering Certification, when Customer UI (or temporary ops probe) exists.  
Until then: engineering matrix is enough to start UI work under Law 003.

```text
[ ] S1 Staff with customers.read can SearchCustomers (directory visible)
[ ] S2 GetCustomer opens Individual Customer context
[ ] S3 CreateCustomer ensure_for_session (CJ-001 particular path)
[ ] S4 CreateCustomer company_account provision (staff only)
[ ] S5 ArchiveCustomer soft-deletes individual from directory
[ ] S6 GetCompanyAccounts lists B2B demand parties
[ ] S7 GetDeliveryLocations returns company sites
[ ] S8 Missing customers.write → write commands denied
[ ] S9 No session / no tenant → Facade errors (not raw Supabase)
[ ] S10 UI imports only useCustomer / CustomerFacade (Law 002 · 003)

Operator: ____________
Date: ____________
Device: OPPO / Web / Other: ____________
Result: PASS / FAIL
Notes:
```
