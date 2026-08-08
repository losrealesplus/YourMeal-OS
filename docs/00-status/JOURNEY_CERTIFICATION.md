# Journey Certification

**Status:** ▶ **ACTIVE** — Era 2 Experience standard  
**Declared:** 2026-08-08  
**Layer:** Experience (not Foundation · not Product Law · not ADR)  
**Companions:** [EXPERIENCE_LIFECYCLE](./EXPERIENCE_LIFECYCLE.md) · [EXPERIENCE_MISSIONS](./EXPERIENCE_MISSIONS.md) · [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md)

```text
We do not certify screens.
We certify operational journeys.
```

---

## Why this step exists

Review answers: *is the Experience ready?*  
**Journey Certification** answers: *can the operator finish the work end-to-end?*

Five green phases are not enough if the day still breaks between them.

```text
Experience phases (001…N)
        ↓
Experience Review
        ↓
Journey Certification   ← THIS
        ↓
Experience Freeze
        ↓
Observation Sprint
```

---

## What “Certified” means

| Certified means | Certified does **not** mean |
|-----------------|-----------------------------|
| One operational day flows without dead ends | Every write is durable |
| Clear next action at every step | Perfect accessibility audit |
| Context preserved across the journey | Accelerators already built |
| Software stays out of the conversation | Observation numbers already measured |
| Honesty gaps are listed, not hidden | Clean READY with zero improvements |

Verdicts that authorize certification: **READY** or **READY WITH IMPROVEMENTS**.  
**BLOCKED** never certifies.

---

## Registry

| Journey | Status | Review | Notes |
|---------|--------|--------|-------|
| **Customer Journey** | ✅ **Certified** | [CUSTOMER_EXPERIENCE_REVIEW](./CUSTOMER_EXPERIENCE_REVIEW.md) | READY WITH IMPROVEMENTS · Frozen |
| **Order Journey** | ✅ **Certified** | [ORDER_EXPERIENCE_REVIEW](./ORDER_EXPERIENCE_REVIEW.md) | READY WITH IMPROVEMENTS · Frozen |
| **Menu Journey** | ⏳ In progress (ME002) | — | Timeline Semana → Día → Menú → Platos |
| **Production Journey** | ⏳ Pending | — | After Menu |
| **Kitchen Journey** | ⏳ Pending | — | After Production |
| **Delivery Journey** | ⏳ Pending | — | After Kitchen |
| **Operational Journey** | ⏳ Pending | — | Cross-domain review after Delivery |

```text
Customer Journey      ✅ Certified
Order Journey         ✅ Certified
Menu Journey          ⏳ ME002 Search (ME001 ✅)
Production Journey    ⏳
Kitchen Journey       ⏳
Delivery Journey      ⏳
↓
Operational Journey Review
↓
Observation Sprint
↓
Evidence
↓
Operational Accelerators
```

Menu Experience is structured by the **weekly operational cycle**, not CRUD.  
Mental model for the whole Menu → Production chain:

```text
Semana → Día → Menú → Platos
```

```text
001 Weekly Planning → 002 Search → 003 Edit → 004 Dish Library → 005 Publish & Preview
```

---

## Rules

1. Certify the **journey**, never a single phase in isolation.  
2. Certification follows Review — never before.  
3. Freeze follows Certification — never skip.  
4. Retroactive certification is allowed when a prior Review + Freeze already happened (Customer).  
5. Accelerators wait for evidence across **certified** journeys — not intuition.

---

## Related

* [EXPERIENCE_LIFECYCLE](./EXPERIENCE_LIFECYCLE.md)  
* [ORDER_EXPERIENCE_REVIEW](./ORDER_EXPERIENCE_REVIEW.md)  
* [CUSTOMER_EXPERIENCE_REVIEW](./CUSTOMER_EXPERIENCE_REVIEW.md)  
* [OPERATIONAL_ACCELERATORS](./OPERATIONAL_ACCELERATORS.md)
