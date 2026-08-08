# Experience Cards

**Status:** ▶ **ACTIVE** — user-facing product map for Era 2  
**Declared:** 2026-08-07  
**Manifesto:** [EXPERIENCE_MANIFESTO](./EXPERIENCE_MANIFESTO.md) · ADR [0099](../adr/0099-experience-manifesto-001.md)  
**Missions:** [EXPERIENCE_MISSIONS](./EXPERIENCE_MISSIONS.md)

Not an ADR. Not a Law. A **30-second card** anyone on the team can understand.

The card does **not** describe a screen. It describes **success** — comparable Operational KPIs across Experiences.

When Customer · Orders · Menus · Production · Kitchen · Delivery each have a card, the product map is from the **operator’s** point of view — not Architecture.

---

## Card template

```text
EXPERIENCE CARD

Name
…

Mission
…

Primary User
…

Primary KPI
…

Secondary KPIs
…

Operational Time Saved
Estimated | Measured
…

Status
Planned | In Progress | Dogfood | Observation-ready
```

Every Experience uses the same shape so metrics are comparable.

---

## Customer Experience

```text
EXPERIENCE CARD

Name
Customer Experience

Mission
Zero Friction Customer Management (001–005)

Phase
MVP Complete · Frozen

Primary User
Tenant Operator

Primary KPI
Journey ready for Orders

Secondary KPIs
TTC <30 s · TTF <10 s · TTE <20 s · TTO <45 s · Enrich <30 s
Time-to-Create Customer <30 s
Time-to-Find Customer <10 s
Time-to-Edit Customer <20 s
Time-to-Organization <45 s
Time-to-Complete Frequent Customer Information <30 s

Operational Time Saved
Estimated (see mission docs)
Observation pending

Status
Frozen · READY WITH IMPROVEMENTS
(Review 001)
```

Detail: [CUSTOMER_EXPERIENCE_REVIEW](./CUSTOMER_EXPERIENCE_REVIEW.md) · [005 Growth](./CUSTOMER_EXPERIENCE_005.md) · [004](./CUSTOMER_EXPERIENCE_004.md) · [003](./CUSTOMER_EXPERIENCE_003.md) · [002](./CUSTOMER_EXPERIENCE_002.md) · [001](./CUSTOMER_EXPERIENCE_001.md)

**Living Customer Profile:** *A customer profile should grow with the relationship, never before it.*

**Sequence (closed):**

```text
001 Create     ✅
002 Search     ✅
003 Edit       ✅
004 Organization  ✅
005 Growth     ✅
↓
Review ✅ · Freeze
↓
ORDER EXPERIENCE  ← NEXT
```

**Bulk Operations** is **not** CX006 — see [ACCELERATOR-002](./ACCELERATOR_002_OPERATIONAL_BULK.md).

Measurable questions (answered):

| Phase | Question | Status |
|-------|----------|--------|
| 001 | ¿Puedo crear un cliente en menos de 30 segundos? | ✅ |
| 002 | ¿Puedo encontrar un cliente en menos de 10 segundos? | ✅ |
| 003 | ¿Puedo modificar un cliente frecuente en menos de 20 segundos? | ✅ |
| 004 | ¿Puedo crear una organización y empezar a trabajar en menos de 45 segundos? | ✅ |
| 005 | ¿Puedo enriquecer la ficha en menos de 30 segundos sin parar la operación? | ✅ |
| Review | ¿Customer Experience funciona como un lunes cualquiera? | READY WITH IMPROVEMENTS |

---

## Order Experience

```text
EXPERIENCE CARD

Name
Order Experience

Mission
Create an operational commitment in less than 45 seconds

Primary User
Tenant Operator

Primary KPI
Time-to-Create Order <45 s

Secondary KPIs
Time-to-Find Order <10 s
Time-to-Confirm Commitment <15 s

Operational Time Saved
Estimated
TBD

Status
Planned
```

---

## Menu Experience

```text
EXPERIENCE CARD

Name
Menu Experience

Mission
Plan one operational week in less than two minutes

Primary User
Tenant Operator / Menu planner

Primary KPI
Time-to-Plan Week <2 min

Secondary KPIs
Time-to-Publish Week <30 s

Operational Time Saved
Estimated
TBD

Status
Planned
```

---

## Production Experience

```text
EXPERIENCE CARD

Name
Production Experience

Mission
Generate today's work in less than one minute

Primary User
Production lead

Primary KPI
Time-to-Generate Work <1 min

Secondary KPIs
Time-to-Know Today's Plan <10 s

Operational Time Saved
Estimated
TBD

Status
Planned
```

---

## Kitchen Experience

```text
EXPERIENCE CARD

Name
Kitchen Experience

Mission
Know what to execute in less than ten seconds

Primary User
Kitchen operator

Primary KPI
Time-to-Know Work <10 s

Secondary KPIs
Time-to-Mark Done <3 s

Operational Time Saved
Estimated
TBD

Status
Planned
```

---

## Delivery Experience

```text
EXPERIENCE CARD

Name
Delivery Experience

Mission
Prepare today's routes in less than two minutes

Primary User
Delivery / logistics

Primary KPI
Time-to-Prepare Routes <2 min

Secondary KPIs
Time-to-Dispatch Route <30 s

Operational Time Saved
Estimated
TBD

Status
Planned
```

---

## Related

* [EXPERIENCE_MISSIONS](./EXPERIENCE_MISSIONS.md)  
* [SPRINT_001_TENANT_SUCCESS](./SPRINT_001_TENANT_SUCCESS.md)  
* [CURRENT_PHASE](./CURRENT_PHASE.md)
