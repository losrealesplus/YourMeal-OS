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
| **Menu Journey** | ✅ **Certified** | [MENU_EXPERIENCE_005](./MENU_EXPERIENCE_005.md) | ME001–005 · published week handoff |
| **Production Journey** | ✅ **Certified** | [PRODUCTION_JOURNEY_CERTIFICATION](../tenant-success/PRODUCTION_JOURNEY_CERTIFICATION.md) · [Review](../tenant-success/PRODUCTION_EXPERIENCE_REVIEW.md) | READY WITH IMPROVEMENTS · **Frozen** · PE001–006 |
| **Kitchen Journey** | ✅ **Certified** | [KITCHEN_JOURNEY_CERTIFICATION](../tenant-success/KITCHEN_JOURNEY_CERTIFICATION.md) · [Review](../tenant-success/KITCHEN_EXPERIENCE_REVIEW.md) | READY WITH IMPROVEMENTS · **Frozen** · KE001–006 |
| **Delivery Journey** | ⏳ Review ✅ READY WITH IMPROVEMENTS | [DELIVERY_EXPERIENCE_REVIEW](../tenant-success/DELIVERY_EXPERIENCE_REVIEW.md) · [006](./DELIVERY_EXPERIENCE_006.md) · [005](./DELIVERY_EXPERIENCE_005.md) · [004](./DELIVERY_EXPERIENCE_004.md) · [003](./DELIVERY_EXPERIENCE_003.md) · [002](./DELIVERY_EXPERIENCE_002.md) · [001](./DELIVERY_EXPERIENCE_001.md) | Certification NEXT · Required before Cert: None |
| **Operational Journey** | ⏳ Pending | — | Cross-domain review after Delivery |

```text
Customer Journey      ✅ Certified · Frozen
Order Journey         ✅ Certified · Frozen
Menu Journey          ✅ Certified
Production Journey    ✅ Certified · Frozen
Kitchen Journey       ✅ Certified · Frozen
Delivery Journey      ⏳ Review ✅ READY WITH IMPROVEMENTS (DE001–006 ✅) · Certification ▶
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
Production Experience transforms the **published week** into work — not order admin.  
Kitchen Experience executes transferred work — it does not re-plan Production.  
Kitchen Journey is **Certified and Frozen** — Delivery Experience 001 is eligible.

```text
MENU
Semana → Día → Menú → Platos

PRODUCTION
Semana → Día → Trabajo → Cantidad → Deadline → Kitchen

HANDOFF
Responsibility transfer (Ready · warnings · Blocked)
```

Dish Library is an **Operational Library** — consumed in planning, not administered as the day’s work.  
See [OPERATIONAL_LIBRARIES](./OPERATIONAL_LIBRARIES.md) · [PRODUCTION_JOURNEY_CERTIFICATION](../tenant-success/PRODUCTION_JOURNEY_CERTIFICATION.md).

```text
Menu: 001 → 002 → 003 → 004 → 005 ✅ Certified
Production: 001–006 ✅ → Review ✅ → Certification ✅ CERTIFIED · Frozen
Kitchen: 001–006 ✅ → Review ✅ → Certification ✅ CERTIFIED · Frozen
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
* [KITCHEN_JOURNEY_CERTIFICATION](../tenant-success/KITCHEN_JOURNEY_CERTIFICATION.md)  
* [KITCHEN_EXPERIENCE_REVIEW](../tenant-success/KITCHEN_EXPERIENCE_REVIEW.md)  
* [PRODUCTION_JOURNEY_CERTIFICATION](../tenant-success/PRODUCTION_JOURNEY_CERTIFICATION.md)  
* [PRODUCTION_EXPERIENCE_REVIEW](../tenant-success/PRODUCTION_EXPERIENCE_REVIEW.md)  
* [ORDER_EXPERIENCE_REVIEW](./ORDER_EXPERIENCE_REVIEW.md)  
* [CUSTOMER_EXPERIENCE_REVIEW](./CUSTOMER_EXPERIENCE_REVIEW.md)  
* [OPERATIONAL_ACCELERATORS](./OPERATIONAL_ACCELERATORS.md)
