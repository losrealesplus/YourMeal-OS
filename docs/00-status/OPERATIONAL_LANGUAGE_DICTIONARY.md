# Operational Language Dictionary

**Status:** ▶ **ACTIVE** · permanent domain vocabulary  
**Companions:** [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) · [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md) · LAW 006  
**Rule:** One Capability · one canonical question. Screens change; these questions do not.

```text
This dictionary is the official operational language of YourMeal OS.
New modules must not invent competing nouns for the same question.
```

---

## Context

### Identity

```text
Who is operating?
¿Quién está operando?
```

Owns: session · tenant · roles · permissions · workspace · branding provenance.  
Never owns: customer CRM · order lines · kitchen queues.

---

## Business Entity

### Customer

```text
Who creates demand?
¿Quién genera la demanda?
```

Owns: party / account demand actors.  
Never owns: weekly commitments (Orders) · execution.

---

## Operational Planning

### Order

```text
What commitment exists?
¿Qué compromiso operativo existe?
```

Owns: tenant commitment for a concrete week.  
Never owns: production batches · delivery confirmation · invoices.

### Production

```text
What work must be generated?
¿Qué trabajo debe generarse para cumplir los compromisos?
```

Owns: plan · batches · load · schedule · readiness.  
Never owns: cooking · delivery routes. **Production never cooks.**

---

## Operational Execution

### Kitchen

```text
What work is being executed?
¿Qué trabajo debe ejecutarse ahora?
```

Owns: ExecutionUnit lifecycle · queues · progress · operators.  
Never owns: recipes · replanning · delivery. **Kitchen never cooks.**

### Delivery

```text
What commitments must be delivered now, and how do we confirm fulfillment?
¿Qué compromisos operativos deben entregarse ahora y cómo confirmamos su ejecución?
```

```text
Delivery is the controlled transfer of responsibility
from internal tenant operations to the customer.
Not the courier. Not GPS. Not Billing.
```

Owns: Assignment · Route · Stop · Confirmation · Evidence · Exception.  
Never owns: GPS navigation · cooking · billing. **Delivery never drives / cooks / bills.**  
Avoid: Shipment · Parcel · Package · Courier.

---

## Operational Outcome

### Billing

```text
What financial outcome must be produced
from successfully completed operational work?

¿Qué resultado financiero debe producirse
a partir del trabajo operativo completado con éxito?
```

Owns: Invoice · Credit Note · Payment Status · Billing Evidence · Financial Outcome  
([BILLING_CAPABILITY](../05-architecture/BILLING_CAPABILITY.md) · ADR 0087 · Architecture Freeze).  
Never owns: delivery status · kitchen units · ERP ledger · bank rails.

**Final Operational Engine Capability** — Engine ends at Outcome.  
Institutional close: [OPERATIONAL_ENGINE_001_RESERVED](./OPERATIONAL_ENGINE_001_RESERVED.md).

---

## Operational Intelligence (future)

### Analytics

```text
What patterns should the operation learn from?
```

Pending — must not steal Execution or Outcome questions.

---

## Operational Flows (collaboration · LAW 007)

Flows do not own business questions. They own lawful transitions between certified Capabilities.

### FLOW-001 · Commitment → Executed Work

```text
Can an operational commitment become executed work
without violating any Foundation Law?
```

Ends at: Kitchen Execution Completed.

### FLOW-002 · Operational Fulfillment

```text
Can an operational commitment become a confirmed delivery
without violating any Foundation Law?
```

Ends at: **Delivery Confirmation** — never Invoice.  
Behaviour: **BH-001 Fulfill Weekly Commitment** → Outcome: Operational Commitment Fulfilled.  
See [OPERATIONAL_BEHAVIOURS](../05-architecture/OPERATIONAL_BEHAVIOURS.md).

### FLOW-003 · Confirmation → Outcome (future)

```text
What economic outcome must be recorded
after an operational commitment has been confirmed?
```

Billing’s question — after FLOW-002.

---

## Anti-patterns (forbidden)

| Forbidden | Why |
|-----------|-----|
| `Delivery.calculateInvoice()` | Billing’s question |
| `Delivery.prepareMeals()` | Kitchen / Production |
| `Delivery.assignKitchen()` | Kitchen’s question |
| `Kitchen.planBatches()` | Production’s question |
| `Order.startCooking()` | Kitchen’s question |

---

## Usage

1. Before a new method / screen / ADR — find the matching question here.  
2. If none fits, you may be inventing a Capability (Observe → Design → Freeze first).  
3. Cross-layer work goes **only** through Facades (LAW 005 · 007).
