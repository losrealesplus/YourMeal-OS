# Experience Lifecycle

**Status:** ▶ **ACTIVE** — Era 2 Experience standard  
**Declared:** 2026-08-08  
**Layer:** Experience (not Foundation · not Product Law · not ADR)  
**Companions:** [EXPERIENCE_MANIFESTO](./EXPERIENCE_MANIFESTO.md) · [EXPERIENCE_MISSIONS](./EXPERIENCE_MISSIONS.md) · [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · [JOURNEY_CERTIFICATION](./JOURNEY_CERTIFICATION.md)

```text
EXPERIENCE LIFECYCLE

Observe
    ↓
Mission
    ↓
Create / Capture
    ↓
Search
    ↓
Edit
    ↓
Domain-specific Phases
    ↓
Review
    ↓
Journey Certification
    ↓
Freeze
    ↓
Observation Sprint
```

Customer taught us the method.  
Order confirmed it.  
We do **not** copy Customer module-by-module.  
We **adapt** this lifecycle to each domain.

---

## Why this exists

Without a lifecycle, every Experience reinvents its process.

With it:

* Missions stay comparable  
* Review / Journey Certification / Freeze are expected, not optional  
* Accelerators wait for **evidence across certified journeys**, not intuition  

---

## Development rhythm (Era 2)

```text
Capability (Frozen)
        ↓
Experience
        ↓
Experience Review
        ↓
Journey Certification
        ↓
Experience Freeze
        ↓
Observation Sprint
        ↓
Evidence
        ↓
Operational Accelerators (if a pattern repeats)
```

```text
We do not certify screens.
We certify operational journeys.
```

Accelerators are **discovered**, not invented.

OCC · Quick Capture · Import · Bulk appeared because friction repeated across work — not because someone asked for a feature.

---

## Domain adaptation

| Lifecycle step | Customer | Order (adapted) | Menu (weekly cycle) |
|----------------|----------|-----------------|---------------------|
| Create / Capture | CX001 Create | **OE001 Capture** | **ME001 Weekly Planning** |
| Search | CX002 Search | **OE002 Search** | ME002 Menu Search |
| Edit / Adapt | CX003 Edit | **OE003 Edit** | **ME003 Weekly Adaptation** |
| Domain phases | Org · Growth | Templates · Incident | Dish Library ✅ · Publish ✅ |
| Review | CX Review ✅ | Order Review ✅ | Menu Review ✅ |
| Journey Certification | Customer Journey ✅ | Order Journey ✅ | Menu Journey ✅ · Production Journey ✅ · Kitchen Journey ✅ |
| Freeze | Customer Frozen | Order Frozen | Menu Freeze · Production Frozen · Kitchen Frozen |

| Lifecycle step | Production (physical work) |
|----------------|----------------------------|
| Create / Capture | **PE001 Production Planning** ✅ |
| Search | **PE002 Production Search** ✅ |
| Edit / Adapt | **PE003 Production Adaptation** ✅ |
| Domain phases | PE004 Preps ✅ · PE005 Alerts ✅ · PE006 Kitchen Handoff ✅ |
| Review | **Production Review ✅** · READY WITH IMPROVEMENTS |
| Journey Certification | **Production Journey ✅ CERTIFIED** |
| Freeze | **Production Frozen** |

| Lifecycle step | Kitchen (daily execution) |
|----------------|---------------------------|
| Create / Capture | **KE001 Today's Work** ✅ (receives Handoff) |
| Search | **KE002 Execution Search** ✅ |
| Edit / Adapt | **KE003 Execution Adaptation** ✅ |
| Domain phases | KE004 Labels ✅ · KE005 Progress ✅ · KE006 Completion ✅ |
| Review | **Kitchen Review ✅** · READY WITH IMPROVEMENTS |
| Journey Certification | **Kitchen Journey ✅ CERTIFIED** |
| Freeze | **Kitchen Frozen** |

| Lifecycle step | Delivery (controlled transfer) |
|----------------|--------------------------------|
| Create / Capture | **DE001 Today's Delivery Day** ✅ (receives ready work) |
| Search | **DE002 Delivery Search** ✅ |
| Edit / Adapt | **DE003 Delivery Adaptation** ✅ |
| Domain phases | DE004 Responsibility ✅ · DE005 Route Preparation ✅ · DE006 Completion ✅ |
| Review | **Delivery Review ✅** · READY WITH IMPROVEMENTS |
| Journey Certification | Pending ← NEXT |
| Freeze | Pending |

Order does **not** need Company or Growth.  
Order needs **Templates** and **Operational Incident**.  
Menu does **not** need CRUD of “menus as entities”.  
Menu needs the **weekly planning cycle**: reuse → adapt → publish.  
Production does **not** administer Orders.  
Production transforms a **published week** into executable work.  
Kitchen does **not** re-plan Production.  
Kitchen executes transferred work and closes honestly.  
Delivery does **not** create the commitment — it prepares controlled transfer.  
Delivery Day comes before routes / maps / optimization.

---

## Rules

1. One Experience at a time — one measurable TTA  
2. No Capability / Facade / Engine changes inside an Experience PR  
3. Domain phases are chosen by the domain — never copy blindly  
4. Review evaluates the **journey**, not screens  
5. Journey Certification follows Review — freeze never skips it  
6. Freeze until Observation (or explicit Product reopen)  
7. Accelerators stay Reserved until evidence across certified journeys  

---

## Related

* [JOURNEY_CERTIFICATION](./JOURNEY_CERTIFICATION.md) — registry  
* [CUSTOMER_EXPERIENCE_REVIEW](./CUSTOMER_EXPERIENCE_REVIEW.md) — first lifecycle completion  
* [ORDER_EXPERIENCE_REVIEW](./ORDER_EXPERIENCE_REVIEW.md) — second lifecycle completion  
* [ORDER_EXPERIENCE_001](./ORDER_EXPERIENCE_001.md) · [ORDER_EXPERIENCE_002](./ORDER_EXPERIENCE_002.md)  
* [OPERATIONAL_LIBRARIES](./OPERATIONAL_LIBRARIES.md) — reuse catalogs, not admin workplaces  
* [OPERATIONAL_ACCELERATORS](./OPERATIONAL_ACCELERATORS.md)
