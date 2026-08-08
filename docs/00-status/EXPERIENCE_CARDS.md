# Experience Cards

**Status:** ▶ **ACTIVE** — user-facing product map for Era 2  
**Declared:** 2026-08-07  
**Manifesto:** [EXPERIENCE_MANIFESTO](./EXPERIENCE_MANIFESTO.md) · ADR [0099](../adr/0099-experience-manifesto-001.md)  
**Missions:** [EXPERIENCE_MISSIONS](./EXPERIENCE_MISSIONS.md)  
**Journeys:** [JOURNEY_CERTIFICATION](./JOURNEY_CERTIFICATION.md)

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
Planned | In Progress | READY | READY WITH IMPROVEMENTS | BLOCKED | Frozen | Journey Certified
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
Frozen · READY WITH IMPROVEMENTS · Journey Certified
(Review 001)
```

Detail: [CUSTOMER_EXPERIENCE_REVIEW](./CUSTOMER_EXPERIENCE_REVIEW.md) · [JOURNEY_CERTIFICATION](./JOURNEY_CERTIFICATION.md) · [005 Growth](./CUSTOMER_EXPERIENCE_005.md) · [004](./CUSTOMER_EXPERIENCE_004.md) · [003](./CUSTOMER_EXPERIENCE_003.md) · [002](./CUSTOMER_EXPERIENCE_002.md) · [001](./CUSTOMER_EXPERIENCE_001.md)

**Living Customer Profile:** *A customer profile should grow with the relationship, never before it.*

**Sequence (closed):**

```text
001 Create     ✅
002 Search     ✅
003 Edit       ✅
004 Organization  ✅
005 Growth     ✅
↓
Review ✅ · Journey Certification ✅ · Freeze
↓
ORDER EXPERIENCE  ✅ Frozen
↓
MENU EXPERIENCE   ← NEXT
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

Phase
Review · Freeze

Mission
Order Journey Certified — Zero Friction Capture → Incident

Primary User
Tenant Operator

Primary KPI
Time-to-Create Order <45 s

Secondary KPIs
Time-to-Find Order <10 s
Time-to-Edit Order <20 s
Time-to-Create a Frequent Order <20 s
Time-to-Record Operational Incident <30 s
Time-to-Route Incident <10 s

Operational Time Saved
Estimated
Capture · Search · Edit · Templates · Incident
≈ 15–40 min / operational day (illustrative)
Observation pending

Status
READY WITH IMPROVEMENTS
Frozen
Journey Certified
```

Detail: [ORDER_EXPERIENCE_REVIEW](./ORDER_EXPERIENCE_REVIEW.md) · [JOURNEY_CERTIFICATION](./JOURNEY_CERTIFICATION.md) · [005 Incident](./ORDER_EXPERIENCE_005.md) · [004 Templates · Zero Friction Order Templates](./ORDER_EXPERIENCE_004.md) · [003 Edit · Zero Friction Order Edit](./ORDER_EXPERIENCE_003.md) · [002 Search](./ORDER_EXPERIENCE_002.md) · [001 Capture · Zero Friction Order Capture](./ORDER_EXPERIENCE_001.md) · Surface `/admin/order-capture`  

Lifecycle: [EXPERIENCE_LIFECYCLE](./EXPERIENCE_LIFECYCLE.md)

**Sequence (adapted — not a Customer clone):**

```text
001 Capture                 ✅
002 Search                  ✅
003 Edit                    ✅
004 Order Templates         ✅
005 Operational Incident    ✅
↓
Experience Review           ✅ READY WITH IMPROVEMENTS
↓
Journey Certification       ✅ Order Journey Certified
↓
Freeze                      ← no new Order missions
↓
Menu Experience             ← NEXT
```

| Phase | Question | Status |
|-------|----------|--------|
| 001 | ¿Puedo crear un pedido mientras hablo en &lt;45s? | ✅ |
| 002 | ¿Puedo encontrar cualquier compromiso en &lt;10s? | ✅ |
| 003 | ¿Puedo corregir un pedido frecuente en &lt;20s? | ✅ |
| 004 | ¿Puedo reutilizar un patrón frecuente en &lt;20s? | ✅ |
| 005 | ¿Puedo registrar y derivar una incidencia en &lt;30s? | ✅ |
| Review | ¿Order Experience funciona como un lunes cualquiera? | READY WITH IMPROVEMENTS |

---

## Menu Experience

```text
EXPERIENCE CARD

Name
Menu Experience

Phase
005 Publish & Preview

Mission
Zero Friction Publish & Preview

Primary User
Tenant Operator

Primary KPI
Time-to-Review-and-Publish-Weekly-Menu <5 min

Secondary KPIs
Time-to-Find-and-Insert Dish <15 s
Time-to-Replace Dish <20 s
Time-to-Adapt Weekly Menu <5 min
Time-to-Find Menu Item <10 s
Time-to-Prepare Weekly Menu <10 min

Operational Time Saved
Estimated
Review→publish ≈ 10–35 min per weekly cycle
Dish insert/replace ≈ 30–105 s
Adaptation ≈ 10–35 min per cycle
Observation pending

Status
Phases complete · Review pending
```

Detail: [MENU_EXPERIENCE_005](./MENU_EXPERIENCE_005.md) · [004 Dish Library · Zero Friction Dish Library Integration](./MENU_EXPERIENCE_004.md) · [003 Weekly Adaptation · Zero Friction Weekly Adaptation](./MENU_EXPERIENCE_003.md) · [002 Search · Zero Friction Menu Search](./MENU_EXPERIENCE_002.md) · [001 Weekly Planning · Zero Friction Weekly Menu Planning](./MENU_EXPERIENCE_001.md) · Surface `/admin/menu-planning` · [OPERATIONAL_LIBRARIES](./OPERATIONAL_LIBRARIES.md)  

Lifecycle: [EXPERIENCE_LIFECYCLE](./EXPERIENCE_LIFECYCLE.md) · [JOURNEY_CERTIFICATION](./JOURNEY_CERTIFICATION.md)

**Mental model (planning timeline — not conversation):**

```text
Semana → Día → Menú → Platos
```

**Sequence (weekly cycle — not CRUD):**

```text
001 Weekly Planning         ✅
002 Menu Search             ✅
003 Weekly Adaptation       ✅
004 Dish Library Integration ✅
005 Publish & Preview       ✅
↓
Experience Review           ← formal close
↓
Journey Certification
↓
Freeze
↓
Production Experience ▶
```

| Phase | Question | Status |
|-------|----------|--------|
| 001 | ¿Puedo preparar la semana sin empezar desde cero en &lt;10 min? | ✅ |
| 002 | ¿Puedo encontrar cualquier elemento de planificación en &lt;10s? | ✅ |
| 003 | ¿Puedo adaptar la planificación en &lt;5 min sin reconstruirla? | ✅ |
| 004 | ¿Encuentro e inserto un plato de la biblioteca en &lt;15s? | ✅ |
| 005 | ¿Puedo revisar y publicar la semana en &lt;5 min con confianza? | ✅ |

---

## Production Experience

```text
EXPERIENCE CARD

Name
Production Experience

Phase
Journey Certified · Frozen

Mission
Zero Friction Production Journey (PE001–PE006)

Primary User
Production Operator

Secondary User
Kitchen Operator (handoff consumer)

Primary KPI
Time-to-Prepare-Kitchen-Handoff <5 min
(journey targets retained: TPP · TTFPW · TAPP · TIRP · TTPR)

Secondary KPIs
Time-to-Understand-Kitchen-Work <10 s
Time-to-Detect-Production-Risk <10 s
Time-to-Understand-Deadline <5 s
Time-to-Identify-Required-Preps <15 s
Time-to-Understand-Prep-Deadline <10 s
Time-to-Adapt-Production-Plan <5 min
Time-to-Find-Production-Work <10 s
Time-to-Prepare-Production-Plan <10 min

Operational Time Saved
Estimated — not measured
Illustrative weekly return ≈ 40–155 min
Observation Sprint pending

Status
Journey Certified · Frozen · READY WITH IMPROVEMENTS
```

Detail: [PRODUCTION_JOURNEY_CERTIFICATION](../tenant-success/PRODUCTION_JOURNEY_CERTIFICATION.md) · [PRODUCTION_EXPERIENCE_REVIEW](../tenant-success/PRODUCTION_EXPERIENCE_REVIEW.md) · [006 Kitchen Handoff · Zero Friction Kitchen Handoff](./PRODUCTION_EXPERIENCE_006.md) · [005 Alerts · Zero Friction Production Alerts & Deadlines](./PRODUCTION_EXPERIENCE_005.md) · [004 Pre-Preparations · Zero Friction Production Pre-Preparations](./PRODUCTION_EXPERIENCE_004.md) · [003 Adaptation · Zero Friction Production Adaptation](./PRODUCTION_EXPERIENCE_003.md) · [002 Search · Zero Friction Production Search](./PRODUCTION_EXPERIENCE_002.md) · [001 Production Planning · Zero Friction Production Planning](./PRODUCTION_EXPERIENCE_001.md) · Surface `/admin/production-planning` · Source: published Menu week  

Lifecycle: [EXPERIENCE_LIFECYCLE](./EXPERIENCE_LIFECYCLE.md) · [JOURNEY_CERTIFICATION](./JOURNEY_CERTIFICATION.md)

**Mental model (physical work — not order admin):**

```text
Semana → Día → Trabajo → Cantidad → Deadline → Kitchen
```

**Sequence (adapted to physical work):**

```text
001 Production Planning        ✅
002 Production Search          ✅
003 Production Adaptation      ✅
004 Pre-Preparations           ✅
005 Alerts & Deadlines         ✅
006 Kitchen Handoff            ✅
↓
Experience Review              ✅ READY WITH IMPROVEMENTS
↓
Journey Certification          ✅ CERTIFIED
↓
Freeze                         ✅
↓
Kitchen Experience             ← NEXT (eligible)
```

| Phase | Question | Status |
|-------|----------|--------|
| 001 | ¿Transformo una semana publicada en plan de producción en &lt;10 min? | ✅ |
| 002 | ¿Localizo el trabajo de producción correcto en &lt;10s? | ✅ |
| 003 | ¿Adapto el plan en &lt;5 min sin regenerarlo? | ✅ |
| 004 | ¿Veo las pre-preparaciones requeridas en &lt;15s? | ✅ |
| 005 | ¿Veo alertas y deadlines a tiempo (&lt;10s)? | ✅ |
| 006 | ¿Kitchen recibe un handoff claro (&lt;5 min)? | ✅ |
| Review | ¿El viaje completo está listo para certificar? | ✅ READY WITH IMPROVEMENTS |
| Certification | ¿El Journey Production está certificado? | ✅ CERTIFIED · Frozen |

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
Eligible · NEXT after Production Certification
```

Input: Production Kitchen Handoff (Ready / Ready with warnings) — Kitchen executes, does not re-plan.

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
