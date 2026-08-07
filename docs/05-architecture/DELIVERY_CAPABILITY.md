# Delivery Capability

**OPERATIONAL-006 · Phase 3 — Engineering Certification**  
**ADR:** [0078](../adr/0078-delivery-capability.md) · [0079](../adr/0079-delivery-facade.md) · [0080](../adr/0080-delivery-engineering-certification.md)  
**Status:** **Engineering Certified** (Architecture → Facade → Certification)  
**Depends on:** Kitchen Execution (Engineering Certified + Demo) · Orders (Engineering Certified + Demo)  
**Provides toward:** Billing · FLOW-002  
**Tenant lens:** any meal-prep / catering tenant with operational commitments to fulfill physically  
**EatClean lens:** weekly meal prep · confirm that prepared work reaches the right stop  
**Layer / Type:** **Operational Execution** (second Execution capability after Kitchen)  
**Maturity:** Architecture → Facade → **Engineering Certified** → Field Validated → Production Ready  
**Completeness:** Architecture ✅ · Facade ✅ · **Engineering Certification ✅** · Capability Demo ⏳ · Product UI ⏳ · Field ⏳  
**Laws:** 001–007 · [FOUNDATION_LOCK](./FOUNDATION_LOCK.md)  
**Package:** `src/delivery/` · `DeliveryFacade` · `useDelivery`  
**Validation:** [DELIVERY_VALIDATION_REPORT](../10-validation/DELIVERY_VALIDATION_REPORT.md) · [DELIVERY_SMOKE_CHECKLIST](../10-validation/DELIVERY_SMOKE_CHECKLIST.md)  
**Dictionary:** [OPERATIONAL_LANGUAGE_DICTIONARY](../00-status/OPERATIONAL_LANGUAGE_DICTIONARY.md)

```text
Delivery = asignar · rutear · confirmar · evidenciar · exceptuar

Delivery does NOT drive.
The physical courier / fleet drives.
Delivery OS orchestrates fulfillment confirmation.
```

---

## Purpose

Define the **canonical Delivery Capability** for YourMeal OS.

Delivery is a **business capability**, not a navigation app and not a billing module.

> **What is Delivery inside YourMeal OS?**

**One canonical answer:**

```text
Delivery is the operational coordination that takes
releasable / completed Kitchen work (and Order commitment facts)
and decides what must be fulfilled now:

assignments · routes · stops · confirmation · evidence · exceptions.
```

**Canonical question (LAW 006 — one only):**

```text
¿Qué compromisos operativos deben entregarse ahora
y cómo confirmamos su ejecución?
```

```text
Which operational commitments must be fulfilled now,
and how do we confirm that fulfillment?
```

EatClean does not need Delivery OS to own GPS turn-by-turn.  
EatClean needs Delivery OS to **know what leaves, where it goes, and whether it arrived**.

---

## Critical separation

| Capability | Layer | Owns | Does not own |
|------------|-------|------|--------------|
| **Orders** | Planning | Operational commitment for a week | Routes · POD |
| **Production** | Planning | Batches · schedule · readiness | Delivery stops |
| **Kitchen Execution** | Execution | ExecutionUnit lifecycle · floor orchestration | Routes · confirmation |
| **Delivery** | Execution | Assignment · route · stop · confirmation · evidence · exception | Driving · billing · cooking · replanning |
| **Billing** | Outcome | Invoices · settlement | Delivery status ownership |

```text
Order               →  ¿Qué compromiso existe?
Production          →  ¿Qué trabajo debemos generar?
Kitchen Execution   →  ¿Qué trabajo debe ejecutarse ahora?
Delivery            →  ¿Qué compromisos deben entregarse ahora y cómo se confirma?
Billing             →  ¿Qué trabajo puede cerrarse y facturarse?
```

**FOUNDATION LAW 006-A:** Delivery never answers Kitchen’s or Billing’s question.

If a feature makes Delivery “cook / plate”, it belongs in **Kitchen**.  
If a feature makes Delivery “invoice”, it belongs in **Billing**.  
If a feature makes Delivery “replan the production day”, it belongs in **Production**.

---

## Delivery does NOT drive

```text
Kitchen never cooks.     Kitchen orchestrates ExecutionUnits.
Delivery never drives.   Delivery orchestrates fulfillment.
The physical world moves goods and confirms arrival.
```

| Delivery owns | Delivery never owns |
|---------------|---------------------|
| DeliveryAssignment | Turn-by-turn GPS / map SDK as core domain |
| DeliveryRoute | Vehicle telemetry as source of truth |
| DeliveryStop | Cooking / plating |
| DeliveryConfirmation | Invoices · payments |
| DeliveryEvidence | Mutating Order commitments |
| DeliveryStatus | Generating Production batches |
| DeliveryException | Kitchen ExecutionUnit lifecycle |

---

## Naming (ubiquitous language)

| Term | Meaning |
|------|---------|
| **Delivery** | Operational Execution capability (fulfillment coordination) |
| **DeliveryAssignment** | Binding of releasable work + destination + responsible actor/window |
| **DeliveryRoute** | Ordered set of stops for a fulfillment window / actor |
| **DeliveryStop** | One destination / handoff point on a route |
| **DeliveryConfirmation** | Structured claim that a stop / assignment was fulfilled |
| **DeliveryEvidence** | Attachments / proofs supporting confirmation (photo · signature · note) — abstract, not a media product |
| **DeliveryStatus** | Lifecycle state of assignment / stop / route |
| **DeliveryException** | Structured failure or deviation (failed attempt · refusal · missing unit) |
| **DeliveryContext** | Canonical read model: assignments + routes + stops + permissions for a scope |

**Do not confuse:**

| Concept | Question |
|---------|----------|
| Order Status | ¿Dónde está el compromiso? |
| Kitchen Execution Status | ¿Dónde está la unidad en cocina? |
| Delivery Status | ¿Dónde está la asignación / parada en logística? |
| Billing Status | ¿Dónde está el cierre económico? |

---

## Lifecycle (frozen)

```text
Planned
   ↓
Assigned
   ↓
InTransit
   ↓
Delivered
   ↓
Confirmed
```

| Status | Meaning |
|--------|---------|
| **Planned** | Fulfillment intent exists; not yet bound to actor/window |
| **Assigned** | Bound to actor / route / window |
| **InTransit** | Fulfillment in progress |
| **Delivered** | Physical handoff claimed |
| **Confirmed** | Confirmation (+ optional evidence) accepted for downstream Outcome |

Exceptions may branch from `Assigned` / `InTransit` / `Delivered` without inventing a parallel product.

---

## Public contracts (Phase 1 freeze)

TypeScript shapes are **contracts**, not an implementation package.

### DeliveryStatus

```ts
type DeliveryStatus =
  | "Planned"
  | "Assigned"
  | "InTransit"
  | "Delivered"
  | "Confirmed";
```

### DeliveryAssignment

```ts
type DeliveryAssignment = {
  id: string;
  tenantId: string;
  /** Commitment reference — Order line / week scope via OrderFacade facts */
  commitmentRef: string;
  /** Upstream releasable work — Kitchen ExecutionUnit / release id when applicable */
  executionRef: string | null;
  stopId: string | null;
  routeId: string | null;
  status: DeliveryStatus;
  windowStart: string | null; // ISO
  windowEnd: string | null;
};
```

### DeliveryStop

```ts
type DeliveryStop = {
  id: string;
  tenantId: string;
  routeId: string | null;
  sequence: number;
  /** Destination / party facts resolved via Facades — not raw geo ownership */
  destinationLabel: string;
  status: DeliveryStatus;
  assignmentIds: string[];
};
```

### DeliveryRoute

```ts
type DeliveryRoute = {
  id: string;
  tenantId: string;
  label: string;
  status: DeliveryStatus;
  stopIds: string[]; // ordered
  operationalDay: string; // ISO date
};
```

### DeliveryConfirmation

```ts
type DeliveryConfirmation = {
  id: string;
  tenantId: string;
  assignmentId: string;
  stopId: string | null;
  confirmedAt: string; // ISO
  confirmedBy: string; // Identity actor id
  outcome: "success" | "partial" | "failed";
  note: string | null;
};
```

### DeliveryEvidence

```ts
type DeliveryEvidence = {
  id: string;
  confirmationId: string;
  kind: "photo" | "signature" | "note" | "other";
  /** Opaque reference — storage adapter later; not filesystem paths in domain */
  ref: string;
};
```

### DeliveryException

```ts
type DeliveryException = {
  id: string;
  tenantId: string;
  assignmentId: string | null;
  stopId: string | null;
  code: string;
  message: string;
  occurredAt: string; // ISO
};
```

### DeliveryContext

```ts
type DeliveryContext = {
  tenantId: string;
  operationalDay: string;
  assignments: DeliveryAssignment[];
  routes: DeliveryRoute[];
  stops: DeliveryStop[];
  permissions: {
    canAssign: boolean;
    canConfirm: boolean;
    canViewEvidence: boolean;
  };
};
```

---

## Responsibilities

Delivery owns:

| Concept | Meaning |
|---------|---------|
| Assignment | What must go out, bound to window / actor |
| Route / Stop | Ordered fulfillment structure |
| Confirmation | How we know it was fulfilled |
| Evidence | Supporting proofs (abstract) |
| Exception | Structured deviation |
| Status | Lifecycle of the above |
| Visibility | Operational read of “what is out / pending / confirmed” |

Delivery does **not** own:

| Anti-scope | Belongs to |
|------------|------------|
| Turn-by-turn navigation | External apps / future optional adapter — not core question |
| Kitchen queues / ExecutionUnits | Kitchen Execution |
| Order line editing | Orders |
| Batch planning | Production |
| Invoicing | Billing |
| Fleet HR / payroll | Outside Operational Engine core |

---

## Relationships (Facades only · LAW 001 · 005 · 007)

```text
Identity Capability
        │ authorizes · tenant · actor
        ▼
OrderFacade ──────────────────────────────┐
        │ commitment / destination facts  │
        ▼                                 │
ProductionFacade                          │
        ▼                                 │
KitchenExecutionFacade                    │
        │ releasable / completed work     │
        ▼                                 │
DeliveryFacade  ◀─────────────────────────┘
        │
        ▼
BillingFacade (future Outcome consumer)
```

```text
OrderFacade
   ↓
ProductionFacade
   ↓
KitchenExecutionFacade
   ↓
DeliveryFacade
```

**UI → DeliveryFacade only (LAW 002).**  
**Screens never own delivery business logic (LAW 003).**  
**Flows (FLOW-002) orchestrate Facades — never bypass them (LAW 007).**

---

## EatClean first · SaaS forever

| Daily question | Delivery Capability must answer |
|----------------|---------------------------------|
| ¿Qué sale hoy? | Assignments for operational day |
| ¿A dónde? | Stops / destination labels from commitment facts |
| ¿En qué orden? | Route sequences |
| ¿Quién lo lleva? | Assignment binding (actor abstract) |
| ¿Llegó? | Confirmation |
| ¿Cómo lo pruebo? | Evidence (optional) |
| ¿Qué falló? | Exception |

Design for **any tenant** with operational commitments to fulfill — EatClean is the first lens, not the ontology.

If a feature does not reduce “lost deliveries”, confirmation time, or operator confusion → **wait**.

---

## Phase plan (do not skip)

| Phase | Output | Status |
|-------|--------|--------|
| **1 · Architecture Freeze** | This document · ADR 0078 · Registry | ✅ |
| **2 · Facade** | `DeliveryFacade` · Commands / Queries · ADR 0079 | ✅ |
| **3 · Engineering Certification** | Validation matrix · ADR 0080 | ✅ |
| 4 · Capability Demo | `/admin/delivery-workspace` (name TBD) | Next |
| 5 · FLOW-002 | Order → Production → Kitchen → Delivery → Confirmation | After Certification (+ prefer Demo) |

### Facade substrate (Phase 2)

| Intent | Composition |
|--------|-------------|
| ConfirmDelivery | `OrderFacade.completeDelivery` |
| GetDeliveryContext / Assignments / Stops | `OrderFacade.getOrdersReadyForDelivery` |
| GetCompletedDeliveries | `OrderFacade.searchOrders(delivered)` + Kitchen completed touch |
| Assign / Start / Exception / Close / Routes | **UNIMPLEMENTED** (visible gaps) |

---

## Explicit non-goals (Phase 2 still)

- No UI / CRUD screens  
- No database migrations  
- No GPS / maps SDK  
- No Billing Capability  
- No FLOW-002 Harness  
- No changes to Platform · Foundation · Bootstrap · Identity · Orders · Production · Kitchen code  

---

## Registry / Board impact

| Panel | Change |
|-------|--------|
| Capability Registry | Delivery → **Engineering Certified** · OPERATIONAL-006 · ADR 0080 |
| Dependency Graph | Delivery node Engineering Certified |
| Operational Expansion | Certification ✅ · Demo next |
| Language Dictionary | Delivery question locked |
| FLOW-002 | Unlocked for design after Certification · prefer Demo |
| Engine v0.8 | Unchanged core freeze · Expansion is additive |

---

## Success of Phase 3

Phase 3 succeeds when the validation matrix is FAIL=0, expected gaps are UNIMPLEMENTED (not FAIL), and Registry maturity is Engineering Certified.

## Success of Phase 2

Phase 2 succeeds when consumers call `DeliveryFacade` / `useDelivery()` only, commands speak operational language, and unimplemented gaps stay visible.

## Success of Phase 1

Phase 1 succeeds when the team can answer without ambiguity:

> **Delivery in YourMeal OS is the capability that decides which operational commitments must be fulfilled now and how that fulfillment is confirmed — nothing else.**
