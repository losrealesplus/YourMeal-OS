# YourMeal OS · Product Direction

**Strategic Freeze — August 2026**  
**Status:** ▶ **ACTIVE** · permanent north star  
**ADR:** [0084 — PRODUCT LAW 001](../adr/0084-product-law-001.md)  
**Companions:** [TENANT_TIME_SAVINGS_BACKLOG](./TENANT_TIME_SAVINGS_BACKLOG.md) · [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md) · [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md) · [OPERATIONAL_BEHAVIOUR_BOARD](./OPERATIONAL_BEHAVIOUR_BOARD.md)

```text
This document decides how we take decisions for years.
It is not a feature list.
It is the product constitution above engineering certification.
```

---

## Why are we building YourMeal OS?

The purpose of YourMeal OS is **not** to digitize a catering business.

The purpose is:

```text
Reduce operational time.
Reduce operational mistakes.
Increase operational visibility.
Standardize business operations.
Allow a tenant to grow without increasing administrative complexity.
```

Everything else is secondary.

---

## Product Vision

YourMeal OS is **not** an EatClean application.

EatClean is the first tenant that validates the platform.

The product is a **multi-tenant Operational SaaS**.

Every architectural decision must survive beyond EatClean.

---

## Era change · New Product Direction

```text
Construction phase is ending.
Validation / Tenant Success phase begins.
```

| Until yesterday | From today |
|-----------------|------------|
| How should we build it? | **Does it save operational time?** |
| Engineering Certified | Tenant finishes earlier |
| Architecture expansion | Architecture reopen only under strict gates |
| Interesting ideas | Measurable operational value |

---

## PRODUCT LAW 001

```text
Every Product Core feature must demonstrably reduce tenant operational time.

If it does not save operational time,
it is not Product Core.
```

```text
Time is the primary currency of the tenant.
YourMeal OS exists to return that currency.
```

This Law sits **above** feature taste and **beside** Foundation Laws 001–007.  
Foundation remains the engineering constitution. PRODUCT LAW 001 is the product constitution.

---

## Three constitutions

YourMeal OS now has three complementary constitutions:

```text
1. Developer Constitution
   Developer Platform
   → How we develop

2. Engineering Constitution
   Foundation Laws 001–007
   → How we design

3. Product Constitution
   PRODUCT LAW 001
   → Why we develop
```

```text
Developer Platform
        ↓
Foundation
        ↓
Product Direction
        ↓
Operational Engine
        ↓
Tenant Success
```

That stack is no longer only a roadmap. It is a **company philosophy**.

---

## How PRs must justify themselves

Before PRODUCT LAW 001, a PR could be justified as:

```text
New screen · New CRUD · New table
```

From today, Product Core PRs should answer:

```text
Problem
  ↓
Time lost
  ↓
Solution
  ↓
Time recovered
  ↓
Evidence
```

See GitHub PR template · **Operational Impact** section.

---

## Operational Evidence (new evidence class)

Engineering evidence remains required:

```text
PASS · Tests · Coverage · Engineering Certification
```

A second class now exists:

```text
Operational Evidence
```

Example:

```text
Customer creation
Before   2m 15s
After      28s
Evidence OPPO Validation / operator stopwatch
```

Operational Evidence is more valuable for SaaS product decisions than coverage alone.

---

## Operational Review

Alongside Engineering Review, the project adopts **Operational Review**.

| Review | Question |
|--------|----------|
| Engineering Review | Is the code / architecture correct? |
| **Operational Review** | **Does the operator finish earlier?** |

---

## Beta release notes (future format)

When Beta 1 ships, prefer **Tenant Time Saved** over traditional feature lists:

```text
Tenant Time Saved · Beta 1
✓ Customer creation     -82%
✓ Weekly planning       -71%
✓ Order editing         -68%
✓ Production planning   -55%
```

Not:

```text
Added Orders API
Fixed issue #432
```

---

## Final principle (product)

```text
We do not build features.
We remove operational friction.
Time saved is the product.
```

---

## Foundation Laws

Foundation Laws **001–007 are frozen**.

No new Foundation Laws unless:

* a real tenant exposes a missing architectural principle, **or**
* a Foundation Law is objectively insufficient.

The Constitution is considered stable.

---

## Architecture Freeze policy

| Layer | Status |
|-------|--------|
| Developer Platform | Stable |
| Foundation | Stable |
| Operational Engine | Complete Delivery Demo + Billing + Flow completion → **v1.0 freeze** |

Architecture is no longer expanded by ideas.

Architecture is only reopened if:

```text
A Foundation Law is broken
or
Production is blocked
or
A measurable operational time reduction requires it
```

Otherwise: **No.**

---

## Product Decision Matrix

Every new feature must answer:

```text
Does it save tenant time?
        ↓
How much?
        ↓
Is it needed for Beta 1?
        ↓
Could it wait for Beta 2?
        ↓
Could it wait for GM?
        ↓
Decision.
```

Ideas no longer enter because they are interesting.  
They enter because they generate **measurable value**.

Permanent backlog: [TENANT_TIME_SAVINGS_BACKLOG](./TENANT_TIME_SAVINGS_BACKLOG.md).

---

## Capability Philosophy

Every Capability answers **exactly one** business question. Never two.

| Capability | Question |
|------------|----------|
| Identity | Who is operating? |
| Customer | Who generates demand? |
| Orders | What commitments exist? |
| Production | What work must be generated? |
| Kitchen | What work must be executed now? |
| Delivery | What must be delivered / how do we confirm? |
| Billing | What operational outcome must be recorded? |

If a Capability answers multiple questions, the domain is incorrectly designed.

Dictionary: [OPERATIONAL_LANGUAGE_DICTIONARY](./OPERATIONAL_LANGUAGE_DICTIONARY.md).

---

## Flow · Behaviour · Scenario Philosophy

```text
Capability  → owns business behaviour
Flow        → owns collaboration
Harness     → orchestrates Facades
Behaviour   → names what the business achieves
Scenario    → (reserved) full enterprise cycle
```

Business behaviour **never** migrates into Flows.

---

## Current engineering position (honest)

```text
Developer Platform     ████████████████████ 100%
Foundation             ████████████████████ 100%
Operational Engine     ██████████████████░░  ~95%
```

Remaining for **Operational Engine v1.0**:

* Delivery Capability Demo ✅ (ADR 0086)
* Billing Capability (Architecture → … → Demo)
* Flow completion (FLOW-002 Demo · FLOW-003 with Billing)
* Declare **Operational Engine v1.0 · Architecture Frozen**

Then: **no further architecture** unless PRODUCT LAW 001 / Foundation gates reopen it.

---

## After Operational Engine v1.0

The project focus changes completely:

```text
Tenant Success
```

Not Platform. Not Architecture. **Tenant Success.**

---

## New Success Metric

| Until today | From now on |
|-------------|-------------|
| PASS · Engineering Certified · Tests · Architecture | **Tenant saves time** |
| | Tenant makes fewer mistakes |
| | Tenant understands the system |
| | Tenant finishes earlier |

Success story we optimize for:

> “Antes necesitaba cuatro horas para organizar esto. Ahora lo hago en una.”

---

## Product KPI examples (operational)

| Job | Today (illustrative) | Goal |
|-----|----------------------|------|
| Create Customer | ~2 minutes | ~20 seconds |
| Create Weekly Menu | ~15 minutes | ~2 minutes |
| Bulk Excel Import | ~3 hours | ~5 minutes |
| Modify Customer Order | ~4 minutes | ~30 seconds |

These are **Product KPIs**, not vanity metrics.  
Measure with real operators when Beta evidence exists.

---

## Backlog classification

Every new idea enters one bucket:

| Bucket | Meaning |
|--------|---------|
| **Beta 1** | Critical for usability |
| **Beta 2** | Major operational improvement |
| **Beta 3** | Automation |
| **Golden Master** | Long-term product vision |

---

## Roadmap to Tenant Success (Blocks)

### Block 1 — Finish Delivery Capability

Delivery Facade ✅ · Validation ✅ · **Demo ✅** (ADR 0086)

### Block 2 — Finish Billing Capability

Billing **Architecture ✅** · **Facade ✅** · **Certification ✅** (ADR 0089)

### Block 3 — Declare Engine v1.0

```text
OPERATIONAL-ENGINE-001
Operational Engine v1.0 Declaration
✅ COMPLETE · ADR 0090 · OPERATIONAL_ENGINE_V1.md
```

```text
Construction Phase     COMPLETE
Operational Engine     CERTIFIED
Architecture           FROZEN
Primary Product Focus  Tenant Success
```

Historical tag after merge: `operational-engine-v1.0`

### Block 4 — Tenant Success (now)

Android → OPPO → iPhone → Isabella → **Time saved** → Beta → Golden Master  
All Product Core work must satisfy PRODUCT LAW 001.

No more architectural work by default.

### Block 5 — MVP usability (historic framing)

Customer · Orders · Menus · Production · Kitchen — create / edit / archive / restore / weekly planning / quick workflows as needed for Beta 1.

### Block 5 — Mobile UX

Gestures · Safe Areas · Keyboard · Loading · Empty States · Skeletons · Bottom Sheets · Swipe · Pull-to-refresh · FAB · Haptics · native feel.

### Block 6 — Android field path

Doctor · Environment · Build · Sync · APK · OPPO Validation (PASS already on path — keep evidence fresh).

### Next window — iOS

Build · Install · Field Validation · Cross-platform corrections · Freeze Beta 1.

---

## Beta Philosophy

Beta exists to discover **operational friction**, not only software bugs.

Questions become:

* Can an operator understand the application?
* Can an operator finish work faster?
* Can an operator make fewer mistakes?
* Can the business operate with less effort?

---

## Operational Validation

The most valuable evidence from now on is no longer only engineering.

It becomes:

```text
Real operator behaviour.
```

Every observation becomes evidence.  
Every evidence becomes product.

---

## Final Principle

```text
If we do not know where we are going,
any train will take us there.

We do know where we are going.
```

```text
We do not build features.
We remove operational friction.
Time saved is the product.
```

We are not building software for its own sake.

We are building the **operating system that allows food businesses to recover time, reduce mistakes, and scale their operation**.

Every line of code from today forward must contribute to that mission.

**Single decision question:**

```text
¿Esto ayuda al tenant a trabajar mejor y más rápido?
```

---

## Era 2 · Operational Evidence Loop

**Acta:** [ERA_DECLARATION](./ERA_DECLARATION.md) · ADR [0091](../adr/0091-era-declaration.md) · Era 1 CLOSED · Era 2 OPEN (7 August 2026).

Product identity for the next era:

```text
Operational First.
YourMeal OS is an Operational SaaS
that systematically returns time to food businesses.
```

Official Product Core cycle (detail in [TENANT_SUCCESS_PLAYBOOK](./TENANT_SUCCESS_PLAYBOOK.md)):

```text
Observe → Measure → Understand → Design → Implement
→ Validate → Measure Again → Time Saved → Repeat
```

Not develop. **Learn.** Backlog fed by evidence, not by ideas.

First question of every product conversation:

```text
¿Dónde pierde tiempo Isabella hoy?
```

---

## Closing the Operational Engine (declared)

**OPERATIONAL-ENGINE-001 is complete.** Construction of the Engine has ended.

| Capability | Engineering | Next (Tenant Success) |
|------------|-------------|------------------------|
| Identity → Kitchen | Certified (+ Demos where applicable) | Usability under PRODUCT LAW 001 |
| **Delivery** | **Capability Demo** (ADR 0078–0080 · 0086) | Experience / Field |
| **Billing** | **Engineering Certified** (ADR 0087–0089) | Demo / UX as Validation (optional) |
| FLOW-002 | Engineering Certified | Flow Demo (Validation) |
| FLOW-003 | Pending | Validation era Outcome flow |
| **OPERATIONAL-ENGINE-001** | ✅ **DECLARED** (ADR 0090) | Primary focus = Tenant Success |

See [OPERATIONAL_ENGINE_V1](./OPERATIONAL_ENGINE_V1.md) — *Time saved is the product.*

---

## Related

* [ADR 0084](../adr/0084-product-law-001.md) · PRODUCT LAW 001  
* [ADR 0085](../adr/0085-delivery-engine-v1-alignment.md) · Delivery → Engine v1.0  
* [ADR 0086](../adr/0086-delivery-workspace-demo.md) · Delivery Demo  
* [ADR 0087](../adr/0087-billing-capability.md) · Billing Architecture  
* [ADR 0088](../adr/0088-billing-facade.md) · Billing Facade  
* [ADR 0089](../adr/0089-billing-engineering-certification.md) · Billing Certification  
* [ADR 0090](../adr/0090-operational-engine-v1-declaration.md) · **Engine v1.0 Declaration**  
* [OPERATIONAL_ENGINE_V1](./OPERATIONAL_ENGINE_V1.md) · Construction COMPLETE  
* [ERA_DECLARATION](./ERA_DECLARATION.md) · ADR [0091](../adr/0091-era-declaration.md) · **Era 1 CLOSED · Era 2 OPEN**  
* [TENANT_SUCCESS_PLAYBOOK](./TENANT_SUCCESS_PLAYBOOK.md) · **How we prove we returned time**  
* [TENANT_TIME_SAVINGS_BACKLOG](./TENANT_TIME_SAVINGS_BACKLOG.md)  
* [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md)  
* [OPERATIONAL_EXPERIENCE](./OPERATIONAL_EXPERIENCE.md)
