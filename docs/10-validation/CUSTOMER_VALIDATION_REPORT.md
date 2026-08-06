# OPERATIONAL-002 · Customer Validation Report

**Track:** OPERATIONAL-002 · Phase 3  
**Date:** 2026-08-06  
**ADR:** [0060 — Customer Validation](../adr/0060-customer-validation.md)  
**Status:** **ENGINEERING CERTIFIED** · Field smoke → operator handoff  
**Depends on:** ADR [0058](../adr/0058-customer-capability.md) · [0059](../adr/0059-customer-facade.md) · Identity [0057](../adr/0057-identity-validation.md)

---

## Declaration

```text
Customer Capability
──────────────────────────────────────
Architecture (ADR 0058)     ✅
Facade (ADR 0059)           ✅
Validation matrix           ✅ ENGINEERING
UI                          ⏳ After certification (Law 003)
Field smoke                 ⏳ Operator checklist
──────────────────────────────────────
First writable Operational Capability — Engineering Certified.
Screens may now be built exclusively on CustomerFacade.
```

Customer is certified for **engineering use**.  
We do **not** invent a device or EatClean field PASS.

Business question answered: **¿Quién genera la demanda?**

---

## Validation matrix

| ID | Case | Expected | Observed | Evidence | Verdict |
|----|------|----------|----------|----------|---------|
| V01 | CreateCustomer | ok · ensureIndividualCustomer | party=individual:c1 | `createCustomer(ensure_for_session)` | **PASS** |
| V02 | UpdateCustomer | UNIMPLEMENTED intent | code=UNIMPLEMENTED · recoverable | `updateCustomer` | **UNIMPLEMENTED** |
| V03 | ArchiveCustomer | delegates directory.archive | archive called with id | `archiveCustomer` | **PASS** |
| V04 | RestoreCustomer | UNIMPLEMENTED intent | code=UNIMPLEMENTED | `restoreCustomer` | **UNIMPLEMENTED** |
| V05 | SearchCustomers | individual + company summaries | n=2 both kinds | `searchCustomers` | **PASS** |
| V06 | GetCustomer | CustomerContext + permissions | profile · canWrite | `getCustomer` | **PASS** |
| V07 | ListRecentCustomers | non-empty summaries | ok · n>0 | `listRecentCustomers` | **PASS** |
| V08 | Company Accounts | only company_account | kind=company_account | `getCompanyAccounts` | **PASS** |
| V09 | Delivery Locations | company sites · individual gap | sites + CJ-002 UNIMPLEMENTED | `getDeliveryLocations` | **PASS** |
| V10 | Identity integration | AUTH/TENANT errors | PERMISSION_DENIED · TENANT_MISMATCH | resolveContext | **PASS** |
| V11 | Permission checks | caps → canRead/Write/Support | read-only staff mapped | capabilityBits | **PASS** |
| V12 | Bootstrap interaction | Identity consume · no Bootstrap own | useIdentity · no BootstrapOrchestrator | source inspection | **PASS** |
| V13 | Facade integrity | execute/query routing | Create ok · Merge UNIMPLEMENTED | `execute` / `query` | **PASS** |
| V14 | Repository delegation | Directory + CompanyAccount only | spies on list/archive/provision/sites | injected deps | **PASS** |
| V15 | Foundation Law 002 | Facade-only public API | index · useCustomer · Law doc | static + docs | **PASS** |
| V16 | CreateCustomer company | provisionCompany | company_account + site delivery | `createCustomer(provision)` | **PASS** |

**Summary:** PASS **14** · UNIMPLEMENTED **2** (expected) · WARNING **0** · FAIL **0**

Automated runner: `src/customer/customer-validation.spec.ts` (16 tests green).

---

## Expected UNIMPLEMENTED (honest substrate)

| Item | Follow-up |
|------|-----------|
| V02 UpdateCustomer | Wire patch substrate behind command — no invented CRM |
| V04 RestoreCustomer | Pair with soft-delete restore in Directory |
| V09 individual addresses | CJ-002 address CRUD behind GetDeliveryLocations |

These do **not** block Engineering Certification. They block claiming “complete writable CRM”. Intent is frozen; implementation waits.

---

## Capability Completeness (second dimension)

```text
Architecture ✅ → Facade ✅ → Validation ✅ → UI ⏳ → Field ⏳ → Production ⏳
```

Customers is **validated** and still **without Product UI**. That is correct: consumable via Facade for modules; screens come next under Law 003.

---

## Smoke checklist (operator)

See [CUSTOMER_SMOKE_CHECKLIST](./CUSTOMER_SMOKE_CHECKLIST.md).

When field steps PASS, append:

```text
Field smoke          ✅
Customers            FIELD VALIDATED
```

---

## Rule unlocked

```text
FOUNDATION LAW 003

A screen never owns business logic.
Screens orchestrate user interaction.
Capabilities own business behaviour.
```

Customer UI may now be designed — exclusively on `CustomerFacade` / `useCustomer()`.

---

## Non-goals (honored)

- No Product UI  
- No routing  
- No feature / CRUD screens  
- No invented Update/Restore substrate  
