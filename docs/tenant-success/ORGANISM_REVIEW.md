# OBSERVATION-ORGANISM-001 · Operational Organism Review

**Track:** TENANT-SUCCESS · Observation Sprint  
**Status:** ▶ **INSTRUMENTED** — protocol ready · sessions not yet run  
**Declared:** 2026-08-08  
**Mission:** Operational Organism Review  
**Era:** Era 2 · Return Time  
**Laws:** PRODUCT LAW 001 · PRODUCT LAW 002 · TENANT SUCCESS LAW 001 · **001-A** · TEAM LAW 001  
**Playbook:** [TENANT_SUCCESS_PLAYBOOK](../00-status/TENANT_SUCCESS_PLAYBOOK.md)  
**Framework:** [OBSERVATION_FRAMEWORK](./OBSERVATION_FRAMEWORK.md)  
**Template:** [ORGANISM_OBSERVATION_TEMPLATE](./ORGANISM_OBSERVATION_TEMPLATE.md)  
**Friction:** [FRICTION_CATALOG](./FRICTION_CATALOG.md)  
**Journeys:** [JOURNEY_CERTIFICATION](../00-status/JOURNEY_CERTIFICATION.md)

```text
Do NOT build another Experience.
Do NOT open a new Capability.
Do NOT create an Accelerator.
Do NOT modify the Engine.
Do NOT modify Facades.
Do NOT optimize based on intuition.

This phase is Observation.
```

```text
ERA 1 · BUILD THE ENGINE          COMPLETE
ERA 2 · RETURN TIME
        Customer      ✅ CERTIFIED · FROZEN
        Order         ✅ CERTIFIED · FROZEN
        Menu          ✅ CERTIFIED · FROZEN
        Production    ✅ CERTIFIED · FROZEN
        Kitchen       ✅ CERTIFIED · FROZEN
        Delivery      ✅ CERTIFIED · FROZEN
        ↓
OBSERVATION  ← THIS
        ↓
ORGANISM REVIEW
        ↓
EVIDENCE
        ↓
PRODUCT DECISION
```

---

## 1. Purpose

Determine where **operational continuity** breaks across the complete tenant workflow.

The unit of observation is **not a screen**.

The unit of observation is a **work transfer** between responsibilities.

Primary question:

> Where does the real operational workflow break, slow down, duplicate work, lose information, or require human intervention between certified Journeys?

Secondary question:

> Where does a tenant leave the product because the existing real-world workflow is faster, easier, safer, or more familiar?

Do **not** assume Excel · WhatsApp · paper · PDF · external calculators occur.  
**Observe them.**

---

## 2. Certified Journeys

| Journey | Status | Certification |
|---------|--------|---------------|
| Customer | ✅ CERTIFIED · FROZEN | [CUSTOMER_EXPERIENCE_REVIEW](../00-status/CUSTOMER_EXPERIENCE_REVIEW.md) |
| Order | ✅ CERTIFIED · FROZEN | [ORDER_EXPERIENCE_REVIEW](../00-status/ORDER_EXPERIENCE_REVIEW.md) |
| Menu | ✅ CERTIFIED · FROZEN | [MENU_EXPERIENCE_005](../00-status/MENU_EXPERIENCE_005.md) |
| Production | ✅ CERTIFIED · FROZEN | [PRODUCTION_JOURNEY_CERTIFICATION](./PRODUCTION_JOURNEY_CERTIFICATION.md) |
| Kitchen | ✅ CERTIFIED · FROZEN | [KITCHEN_JOURNEY_CERTIFICATION](./KITCHEN_JOURNEY_CERTIFICATION.md) |
| Delivery | ✅ CERTIFIED · FROZEN | [DELIVERY_JOURNEY_CERTIFICATION](./DELIVERY_JOURNEY_CERTIFICATION.md) |
| Operational Engine v1.0 | ✅ CERTIFIED · FROZEN | [OPERATIONAL_ENGINE_V1](../00-status/OPERATIONAL_ENGINE_V1.md) |
| Architecture | FROZEN | [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md) |

TENANT SUCCESS LAW 001-A is satisfied for organism observation: journeys are realistically usable end-to-end.  
**Estimated OTS ≠ Measured** remains true until sessions produce stopwatch evidence.

---

## 3. Organism Map

```text
Customer
  ↓
Order
  ↓
Menu
  ↓
Production
  ↓
Kitchen
  ↓
Delivery
  ↓
Outcome
```

Outcome may include billing, customer service follow-up, or operational close — **only when the tenant actually performs that step**.

Optional lateral transfers (observe only when they exist):

| Transfer | When to observe |
|----------|-----------------|
| Customer → Customer Management | Tenant maintains a separate CM role / tool |
| Order → Customer Service | Incidents / changes routed to CS |
| Delivery → Customer Service | Failed / delayed delivery follow-up |
| Delivery → Billing | Certification / ready-for-billing handoff |

Do not assume every tenant has the same organization. Record **actual responsibility**.

---

## 4. Observation Protocol

### Principle

```text
Observe without influencing.
Do not suggest a solution.
Do not teach the tenant how to use the product.
```

### Ask

| Ask | Do not ask |
|-----|------------|
| What do you do now? | Would a button help? |
| Show me. | Would an import help? |
| Why do you do it that way? | Would an AI assistant help? |
| What happens next? | Would an Excel upload help? |
| What information do you need? | |
| Where did that information come from? | |
| Do you have to enter this again? | |
| What happens if it changes? | |

### Subjects

Observe real work performed by (roles as they exist):

* Tenant / Operations  
* Customer Management  
* Order Management  
* Menu Planning  
* Production  
* Kitchen  
* Delivery  
* Administration / Billing  

### Ethics

Sit beside. Watch first. Speak second.  
Thank them for interruption cost.  
No PII in public docs beyond tenant authorization.

Full ethics: [OBSERVATION_FRAMEWORK](./OBSERVATION_FRAMEWORK.md).

---

## 5. Work Transfer Map

For every primary transition, record one organism observation (template below).

### Primary transitions

```text
1. Customer → Order
2. Order → Menu
3. Menu → Production
4. Production → Kitchen
5. Kitchen → Delivery
6. Delivery → Outcome
```

| # | Transfer | Probe questions |
|---|----------|-----------------|
| 1 | Customer → Order | Does Sara retype anything? Does Order already see what Customer captured? |
| 2 | Order → Menu | Does Menu receive order commitments, or reconstruct them? |
| 3 | Menu → Production | Does Production receive a prepared week, or rebuild it? |
| 4 | Production → Kitchen | Does Kitchen receive executable work with quantities / specials / deadlines? |
| 5 | Kitchen → Delivery | Does Delivery receive an executable responsibility, or re-prepare information? |
| 6 | Delivery → Outcome | Is delivery certified for the next step (billing / CS / close)? |

### Continuity dimensions (per transfer)

Evaluate each as **PASS** · **FRICTION** · **BREAK** · **UNKNOWN**:

| Dimension | Meaning |
|-----------|---------|
| **Information continuity** | Required facts exist where the next role needs them |
| **Responsibility continuity** | Ownership of the next action is clear |
| **Context continuity** | Why / constraints / specials travel with the work |
| **Execution continuity** | The next role can act without reconstructing the job |

Do **not** invent a numerical organism score unless a later framework defines one.

---

## 6. Measurement Method

### TENANT SUCCESS LAW 001

```text
No observation is accepted until it has been measured.
No solution is accepted until the improvement has been measured again.
```

### Measure the real operational task

Not only “click time” inside YourMeal OS.

Example:

```text
Route preparation:
  2 min in YourMeal OS
+ 8 min in Excel
+ 4 min in WhatsApp
= 14 min operational task
```

Report **14 minutes**, not only the 2 minutes in-product.

### Required measurements

| Metric | Required |
|--------|----------|
| Start time | Yes |
| End time | Yes |
| Active work time | Yes |
| Waiting time | Yes |
| Number of repetitions | Yes |
| Number of people involved | Yes |
| Number of systems / tools involved | Yes |
| Number of manual entries | Yes |
| Number of handoffs | Yes |

Until measured, label any prior OTS figures as **Estimated** — never as Evidence.

### Time Saved

Record only:

* CURRENT MEASURED TIME  
* CURRENT PROCESS  
* FRICTION  

Do **not** calculate theoretical time savings from an unmeasured problem.  
NEW MEASURED TIME / TIME RECOVERED appear only after a candidate solution exists and is re-measured.

---

## 7. Friction Categories

Classify observed friction using organism transfer categories (mapped to [FRICTION_CATALOG](./FRICTION_CATALOG.md) F-XX):

| Organism category | Typical F-XX |
|-------------------|--------------|
| DUPLICATE_ENTRY | F-01 · F-06 · F-19 |
| MANUAL_CALCULATION | F-07 |
| SEARCH | F-02 · F-05 |
| RECONCILIATION | F-06 · F-13 |
| HANDOFF | F-21 |
| WAITING | F-04 |
| CONTEXT_SWITCH | F-15 |
| MISSING_INFORMATION | F-16 · F-23 |
| REPEATED_INFORMATION | F-01 · F-19 |
| EXTERNAL_TOOL | F-09 · F-10 · F-14 · F-08 |
| REWORK | F-17 |
| ERROR_CORRECTION | F-17 |
| UNSUPPORTED_OPERATION | F-22 |
| UNAVAILABLE_SUBSTRATE | F-23 |
| OTHER | — |

**Human bridge** (a person becomes the bridge between two parts of the system) is a first-class signal — usually **HANDOFF** (F-21), often with EXTERNAL_TOOL or DUPLICATE_ENTRY.

Do not force a category if the observation does not fit.

---

## 8. Observation Records

Store dated files under `docs/tenant-success/observations/`.

Naming:

```text
YYYY-MM-DD-<tenant>-organism-<from>-to-<to>.md
```

Example: `2026-08-15-eatclean-organism-kitchen-to-delivery.md`

Use [ORGANISM_OBSERVATION_TEMPLATE](./ORGANISM_OBSERVATION_TEMPLATE.md) for work transfers.  
Use [TENANT_OBSERVATION_TEMPLATE](./TENANT_OBSERVATION_TEMPLATE.md) for single-task deep dives inside one responsibility.

### Evidence record (required fields)

Every organism observation must contain:

| Field | |
|-------|--|
| Observation ID | |
| Date | |
| Tenant role | |
| Workflow | |
| From | |
| To | |
| Task | |
| Start | |
| End | |
| Active time | |
| Waiting time | |
| Tools used | |
| Manual steps | |
| Repeated entries | |
| Friction category | |
| Observed friction | |
| Workaround | |
| Impact | |
| Evidence | |
| Confidence | |

**No solution fields** in the first pass.

---

## 9. Cross-Journey Friction

After primary transfers are recorded, look for patterns that span more than one boundary:

* Same data re-entered at multiple transfers  
* Same external tool used as the real system of record  
* Same person bridging several departments  
* Waiting chains (A waits for B who waits for C)  
* Context that dies after one hop  

Cross-journey notes go in the Organism Review evidence section after sessions — **not invented here**.

---

## 10. External Workflow Dependencies

Observe only when used. Candidates (not assumptions):

| Dependency | Signal |
|------------|--------|
| Excel | Parallel operational truth |
| PDF | Menus / lists retyped |
| Paper | Labels · checklists · route sheets |
| WhatsApp / chat | Coordination only in chat |
| Email | Handoffs / confirmations |
| Manual calculations | Portions · totals · nutrition |
| Copy / paste | Between product and other tools |
| External route planning | Maps · GPS · carrier tools |
| Manual labels | Kitchen / delivery packaging |
| External customer / menu DBs | Parallel masters |
| External nutrition / allergy records | Re-asked or retyped |

PRODUCT LAW 002: do not force recreation of what the tenant already owns — **after** evidence shows ownership and reuse cost.

---

## 11. Evidence

| Class | Status |
|-------|--------|
| Journey certifications | ✅ Complete (see §2) |
| Organism observation sessions | ⏳ Not yet run |
| Measured transfer times | ⏳ Pending |
| Estimated Journey OTS | Illustrative only · Estimated ≠ Measured |

This document is an **instrument**. It is not evidence of friction.

---

## 12. Candidate Patterns

A candidate may emerge from evidence. Examples (registered ideas — **not opened**):

| Candidate | Status |
|-----------|--------|
| Bulk | Registered — wait for evidence |
| Import Pipeline | Reserved |
| Quick Capture | Reserved |
| Operational Command Center | Reserved |
| Route tooling | Idea only |
| Durable Execution | Gap noted in Kitchen cert |
| Labels | Gap / honesty notes |
| Notification | Idea only |
| Automation | Idea only |
| New Capability | Only if substrate missing |

```text
Observation → Measurement → Pattern → Evidence → Product Decision
Then: Experience · Capability · Accelerator · or Do Nothing
```

Do **not** open any candidate during this phase.  
An idea that does not survive observation is **method success**, not failure.

---

## 13. Measurement Gaps

Known gaps **before** organism sessions:

| Gap | Source |
|-----|--------|
| All Journey OTS figures are Estimated | Certification docs |
| AssignDelivery / ReportDeliveryException unimplemented | Delivery cert |
| POD / Billing outcomes unavailable | Delivery cert |
| Durable ExecutionUnit progress | Kitchen cert |
| No dated organism observation files yet | `observations/` |

Sessions must close these with measured data or explicit UNKNOWN — not with intuition.

---

## 14. Product Decision Queue

Empty until evidence exists.

| ID | Transfer | Friction | Measured time | Priority signals | Decision |
|----|----------|----------|---------------|------------------|----------|
| — | — | — | — | — | — |

### Prioritization (when evidence exists)

Rank by: Frequency · Duration · People affected · Operational impact · Repetition · Error risk · Dependency · Cross-department impact.

Do **not** prioritize by technical difficulty or how exciting the feature sounds.

### Product Decision Rule

```text
Observation
  ↓
Measurement
  ↓
Pattern
  ↓
Evidence
  ↓
Product Decision
  ↓
Experience · Capability · Accelerator · Do Nothing
```

---

## Critical rules (reminder)

| Law | Statement |
|-----|-----------|
| TENANT SUCCESS LAW 001 | No observation accepted until measured; no solution until re-measured |
| PRODUCT LAW 001 | Product Core must demonstrably reduce operational time |
| PRODUCT LAW 002 | Do not force recreation of knowledge the tenant already owns |
| TEAM LAW 001 | Engineering time is investment · Tenant time is the product |

```text
Do not build.
Do not optimize.
Do not prescribe.
Observe.
Measure.
Understand.
Then decide.

Time saved is the product.
```

---

## Related

* [ORGANISM_OBSERVATION_TEMPLATE](./ORGANISM_OBSERVATION_TEMPLATE.md)  
* [TENANT_OBSERVATION_TEMPLATE](./TENANT_OBSERVATION_TEMPLATE.md)  
* [OBSERVATION_FRAMEWORK](./OBSERVATION_FRAMEWORK.md)  
* [FRICTION_CATALOG](./FRICTION_CATALOG.md)  
* [TIME_SAVINGS_SCORE](./TIME_SAVINGS_SCORE.md)  
* [JOURNEY_CERTIFICATION](../00-status/JOURNEY_CERTIFICATION.md)  
* [TENANT_SUCCESS_PLAYBOOK](../00-status/TENANT_SUCCESS_PLAYBOOK.md)  
* [OPERATIONAL_ACCELERATORS](../00-status/OPERATIONAL_ACCELERATORS.md) (candidates only — not opened here)
