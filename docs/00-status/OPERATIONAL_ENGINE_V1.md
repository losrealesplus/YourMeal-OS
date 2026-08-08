# Operational Engine v1.0

**Status:** ✅ **DECLARED / CERTIFIED / ARCHITECTURE FROZEN** — 2026-08-07  
**Milestone:** **OPERATIONAL-ENGINE-001**  
**ADR:** [0090](../adr/0090-operational-engine-v1-declaration.md)  
**Supersedes:** [OPERATIONAL_ENGINE_V08](./OPERATIONAL_ENGINE_V08.md) as the current Engine institutional declaration  
**Board:** [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md)  
**Registry:** [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) · [OPERATIONAL_FLOW_REGISTRY](./OPERATIONAL_FLOW_REGISTRY.md)  
**Product:** [PRODUCT_DIRECTION](./PRODUCT_DIRECTION.md) · PRODUCT LAW 001 · ADR [0084](../adr/0084-product-law-001.md)  
**Tenant Success:** [TENANT_SUCCESS_PLAYBOOK](./TENANT_SUCCESS_PLAYBOOK.md) · [TENANT_TIME_SAVINGS_BACKLOG](./TENANT_TIME_SAVINGS_BACKLOG.md)  
**Tag:** `operational-engine-v1.0`

```text
════════════════════════════════════════════════════════════

YOURMEAL OS

Operational Engine v1.0

════════════════════════════════════════════════════════════

Developer Platform
████████████████████
100%

Foundation
████████████████████
100%

Product Core Foundation
████████████████████
100%

Operational Engine · Capabilities
Identity · Customers · Orders · Production
Kitchen · Delivery · Billing
████████████████████
100%  (Engineering Certified layer)

Operational Flows (Engine-core)
FLOW-001 · FLOW-002
████████████████████
Engineering Certified

Construction
████████████████████
COMPLETE

════════════════════════════════════════════════════════════

Construction Phase
COMPLETE

Operational Engine
CERTIFIED

Architecture
FROZEN

Primary Product Focus
Tenant Success

════════════════════════════════════════════════════════════
```

---

## Mission

YourMeal OS exists to **return operational time** to tenants.

The Operational Engine is the certified business capability chain that makes that possible:

```text
Identity   → Who operates?
Customer   → Who creates demand?
Orders     → What was promised?
Production → What work must exist?
Kitchen    → What work was executed?
Delivery   → What commitment left the tenant?
Billing    → What economic outcome can now be produced?
```

**The motor exists.**  
From this declaration forward, we learn to **drive** it — not to rebuild it.

---

## Official Declaration

```text
Construction Phase
COMPLETE

Operational Engine
CERTIFIED

Architecture
FROZEN

Primary Product Focus
Tenant Success
```

```text
Construction
    ↓
Validation
    ↓
Tenant Success
```

All future **Product Core** work must satisfy **PRODUCT LAW 001**:

```text
Every Product Core feature must demonstrably reduce tenant operational time.
If it does not save operational time, it is not Product Core.
```

**Time saved is the primary product KPI.**

---

## What v1.0 consolidates

| Asset | Status | Evidence |
|-------|--------|----------|
| Developer Platform v1.0 | ✅ Complete / Frozen | Platform freeze · Doctor · Runtime |
| Foundation Laws 001–007 | ✅ Stable / Frozen | [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md) · [FOUNDATION_STATUS](./FOUNDATION_STATUS.md) |
| Product Core Foundation | ✅ Complete | ADR 0054 · Product Core track |
| Product Direction · PRODUCT LAW 001 | ✅ Active | [PRODUCT_DIRECTION](./PRODUCT_DIRECTION.md) · ADR 0084 |
| Strategic Freeze | ✅ Active | ADR 0084 |
| Capability Registry | ✅ **100%** Engineering Certified (Identity→Billing) | [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) |
| Operational Dependency Graph | ✅ Complete for Engine chain | [OPERATIONAL_DEPENDENCY_GRAPH](./OPERATIONAL_DEPENDENCY_GRAPH.md) |
| Operational Engine Board | ✅ Updated for v1.0 | [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md) |
| FLOW-001 | ✅ Engineering Certified | Flow Registry |
| FLOW-002 · BH-001 | ✅ Engineering Certified | ADR 0081–0083 |
| Billing Outcome | ✅ Engineering Certified | ADR 0087–0089 |

---

## Capability Snapshot

```text
Context                 Identity                 ✅ Engineering Certified
Business Entity         Customer                 ✅ Engineering Certified + Demo
Operational Planning    Orders · Production      ✅ Engineering Certified + Demo
Operational Execution   Kitchen · Delivery       ✅ Engineering Certified + Demo
Operational Outcome     Billing                  ✅ Engineering Certified
```

```text
Operational Engine
Capability Completion
████████████████████
100%
```

Billing **looks backward**. It certifies economic outcome of completed work — it does not initiate Planning or Execution.

---

## Operational Flow Snapshot

| Flow | Maturity | Role in v1.0 |
|------|----------|--------------|
| FLOW-001 · Orders → Production → Kitchen | Engineering Certified | Core planning→execution |
| FLOW-002 · Fulfillment → Confirmation | Engineering Certified · BH-001 | Core fulfillment |
| FLOW-003 · Confirmation → Billing | Pending (Validation era) | Outcome flow — exercises Engine, does not reopen Construction |

Flow **Demos** and **Field Validation** belong to the **Validation / Tenant Success** era — they prove the Engine in use; they do not extend Engine architecture.

---

## Dependency Graph (canonical)

```text
Identity
  ↓
Customer
  ↓
Orders
  ↓
Production
  ↓
Kitchen Execution
  ↓
Delivery
  ↓
Billing
```

Cross-layer only via Facades (**FOUNDATION LAW 005 · 007**).  
No Capability answers another’s question (**LAW 006-A**).

---

## Construction Timeline (institutional)

| Era | Milestone | Meaning |
|-----|-----------|---------|
| Platform | Developer Platform v1.0 | How we develop |
| Foundation | Laws 001–007 frozen | How we design |
| Product | PRODUCT LAW 001 | Why we develop |
| Engine v0.8 | Identity→Kitchen + FLOW-001 | First certified core |
| Expansion | Delivery · FLOW-002 · Billing | Complete the chain |
| **Engine v1.0** | **This declaration** | **Construction ends** |

---

## Engineering Evidence (pointers)

* Capability validation reports under `docs/10-validation/` (Identity → Billing)  
* Flow validation: FLOW-001 · FLOW-002 reports  
* Facades: `src/identity` · `customer` · `order` · `production` · `kitchen` · `delivery` · `billing`  
* ADRs 0055–0089 (Capability / Flow / Product Direction track)  
* Registry Capability Completion **100%**

This PR adds **no software**. Evidence already exists in the repository history.

---

## Architecture reopen gates (only)

Do **not** reopen Engine architecture unless:

1. a **Foundation Law** is broken, **or**
2. production is **objectively blocked**, **or**
3. a change demonstrably saves tenant operational time (**PRODUCT LAW 001**)

Otherwise: work belongs in **Tenant Success** (experience, validation, time savings).

---

## Next Era · Validation → Tenant Success

Playbook: [TENANT_SUCCESS_PLAYBOOK](./TENANT_SUCCESS_PLAYBOOK.md)

```text
Validation
  · Field Validation
  · Operational Evidence
  · Tenant Time Savings
  · Experience / UX
  · Cross-platform (Android · iOS)
  · Real Tenant Validation (EatClean)

Then
  · Beta 1
  · Beta 2
  · Golden Master
```

### Roadmap language change

| Until today | From this declaration |
|-------------|------------------------|
| Platform → Foundation → Engine | Android → OPPO → iPhone → Isabella → **Time saved** → Beta → Golden Master |
| Quality of software modules | Quality of **operations** |
| “What’s the next Capability?” | “How many minutes do we return?” |

Remaining Demo / FLOW-003 / Product UI items are **Validation & Experience** — not Construction of new Engine Capabilities.

---

## Historical tag

After this declaration merges to the project’s long-lived branch, create:

```text
operational-engine-v1.0
```

Not “another version number”.  
The moment Construction ended and Tenant Success became the primary product objective.

---

## Closing principle

> **The Operational Engine is no longer our competitive advantage.**
>
> **What we build on top of it is.**
>
> **From this point forward, every improvement must help a tenant finish work faster, make fewer mistakes, and operate with greater confidence.**
>
> **Time saved is the product.**

---

## Related

* ADR [0090](../adr/0090-operational-engine-v1-declaration.md)  
* [PRODUCT_DIRECTION](./PRODUCT_DIRECTION.md) · [TENANT_TIME_SAVINGS_BACKLOG](./TENANT_TIME_SAVINGS_BACKLOG.md)  
* [OPERATIONAL_ENGINE_V08](./OPERATIONAL_ENGINE_V08.md) (historic v0.8)  
* [OPERATIONAL_ENGINE](./OPERATIONAL_ENGINE.md) (status index)
