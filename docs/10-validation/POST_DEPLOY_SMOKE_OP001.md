# Post-deploy smoke — OP-001 (quick)

**When:** Immediately after DV-001 PASS (stack on Lovable publish branch + new `x-deployment-id`).  
**Not** full Day-0 / CHECK-IT 05 — only proves the **correct build** is live.

Record Expected SHA + deployment-id first: [DEPLOYMENT_VERIFICATION.md](./DEPLOYMENT_VERIFICATION.md).

---

## Smoke checklist

| # | Check | Expected | Actual | Pass |
|---|-------|----------|--------|------|
| 1 | Dish Library placeholder gone | No “Module 01 / Foundation Lock” placeholder panel | | ☐ |
| 2 | Dish CRUD real | Can create/list active dish | | ☐ |
| 3 | Weekly menus | Draft / slots / publish available | | ☐ |
| 4 | Staff invite | Invite kitchen/delivery without SQL | | ☐ |
| 5 | Centro de Operaciones → tenant ops | Opens `/admin` (or auth→admin) for staff | | ☐ |
| 6 | `/saas` for `saas_admin` | Lands / can open Platform Ops | | ☐ |

---

## Decision

| Result | Next |
|--------|------|
| All 6 PASS | Start Day-0 checklist → ORR → CHECK-IT 05 |
| Any FAIL | Functional investigation on **this** deploy (not AUD-001 class) |
| Cannot run | DV-001 / access BLOCKED |

Verdict: _______________  
SHA: _______________  
`x-deployment-id`: _______________  
Operator: _______________  
Date: _______________
