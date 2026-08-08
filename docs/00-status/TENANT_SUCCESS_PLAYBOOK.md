# Tenant Success Playbook

**Status:** ▶ **ACTIVE** — constitution of Era 2 · Return Time  
**Era acta:** [ERA_DECLARATION](./ERA_DECLARATION.md) · ADR [0091](../adr/0091-era-declaration.md) · Era 1 CLOSED · Era 2 OPEN  
**Declared:** 2026-08-07 · after [OPERATIONAL_ENGINE_V1](./OPERATIONAL_ENGINE_V1.md) · OPERATIONAL-ENGINE-001  
**Product law:** [PRODUCT_DIRECTION](./PRODUCT_DIRECTION.md) · **PRODUCT LAW 001** · **PRODUCT LAW 002** · ADR [0084](../adr/0084-product-law-001.md) · [0093](../adr/0093-product-law-002.md)  
**Team law:** **TEAM LAW 001** · ADR [0094](../adr/0094-team-law-001.md)  
**Sprint:** [SPRINT_001_TENANT_SUCCESS](./SPRINT_001_TENANT_SUCCESS.md) · Discovery: [ERA2_PRODUCT_DISCOVERY_001](./ERA2_PRODUCT_DISCOVERY_001.md)  
**Cursor header:** [ERA2_CURSOR_PROMPT](./ERA2_CURSOR_PROMPT.md)  
**Companion backlog:** [TENANT_TIME_SAVINGS_BACKLOG](./TENANT_TIME_SAVINGS_BACKLOG.md)  
**Engineering constitution (frozen):** [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md)

```text
We do not start with software.
We start with operational friction.
Software is only one possible solution.
```

```text
ERA 1 · Build the Engine
████████████████████
COMPLETE

────────────────────────────

ERA 2 · Return Time
STARTS TODAY
```

```text
Foundation answers: How do we design?
Developer Platform answers: How do we develop?
PRODUCT LAW 001 answers: Why do we develop?
This Playbook answers: How do we prove we returned time?
```

---

## Product identity

```text
YourMeal OS is an Operational SaaS
that systematically returns time
to food businesses.
```

Not “an app for EatClean.”  
Not “SaaS for catering” as a category slogan.

**Operational First** — not AI First, not Cloud Native as the identity.

Everything orbits the **operation**, not the technology stack.

Serves EatClean today. Tomorrow it can serve restaurants · dark kitchens · caterings · collective dining · franchises — because it names the **problem**, not a single vertical costume.

```text
YourMeal OS no longer competes on having more features.
It competes on returning time.
```

---

## Era change

```text
ERA 1 — until OPERATIONAL-ENGINE-001
  Ingeniería → Arquitectura → Software
  Backlog fed by ideas

ERA 2 — from this Playbook
  Operaciones → Tiempo → Negocio
  Backlog fed by evidence
```

The Operational Engine exists. Supabase · RBAC · TanStack · Foundation · Developer Platform · Doctor · Capability Pattern were **means**.  
The **destination** is time returned.

We do not ask first: *How do we design this?*  
We ask first: *How does Isabella finish earlier?*

Roles we think as:

* Isabella (operator / admin)  
* Cocina  
* Reparto  
* Administración  

Single filter:

> **¿Esto les devuelve tiempo?**

If yes — it may belong in Product Core.  
If no — it probably does not — even if the feature is spectacular.

---

## PRODUCT LAW 001 (operating rule)

```text
Every Product Core feature must demonstrably reduce tenant operational time.
If it does not save operational time, it is not Product Core.
```

```text
Time is the primary currency of the tenant.
YourMeal OS exists to return that currency.
Time saved is the product.
```

PRODUCT LAW 001 is the filter for the entire future of the product.

---

## EXPERIENCE LAW 001

```text
The first interaction
must require the minimum information
needed to continue working.

Everything else
can be completed later.
```

**ADR:** [0098](../adr/0098-experience-law-001.md) · Missions: [EXPERIENCE_MISSIONS](./EXPERIENCE_MISSIONS.md)

Experience epics use **Time-to-Action (TTA)** KPIs — not CRUD field counts.

---

## TENANT SUCCESS LAW 001

```text
TENANT SUCCESS LAW 001

No observation is accepted
until it has been measured.

No solution is accepted
until the improvement has been measured again.
```

**ADR:** [0092](../adr/0092-tenant-success-law-001.md)

### TENANT SUCCESS LAW 001-A

```text
Never observe unfinished workflows.

Observe only workflows
that are realistically usable.

Otherwise,
you measure missing implementation,
not operational friction.
```

**ADR:** [0096](../adr/0096-tenant-success-law-001a.md)

Natural extension of the Operational Evidence Loop.  
Belief is not enough. Improvement must be demonstrated.  
Unfinished workflows are not valid observation subjects.

Era 2 sprint types:

* **Experience Sprint** — build a usable workflow with a time metric  
* **Observation Sprint** — learn from a realistically usable workflow  

Never mixed.

Era 1 taught us to build correctly.  
Era 2 demands something harder: **decide what not to build** — and **when not to observe yet**.

PRODUCT LAW 001 forbids Product Core features by intuition alone.  
TENANT SUCCESS LAW 001 forbids accepting claims without measurement.  
TENANT SUCCESS LAW 001-A forbids observing missing implementation as if it were operational friction.

Every Product Core decision must answer with evidence:

* Where does the friction exist?  
* How much time is lost?  
* How much time will we recover?  
* How will we measure again afterwards?

If a change cannot answer those questions, it does not belong in Product Core.

**Experience chain:** Customer → Order → Menu → Production → Kitchen → Delivery — ✅ **all Journeys CERTIFIED · FROZEN** ([JOURNEY_CERTIFICATION](./JOURNEY_CERTIFICATION.md)).

**Active Observation Sprint:** [ORGANISM_REVIEW](../tenant-success/ORGANISM_REVIEW.md) · OBSERVATION-ORGANISM-001 — **not** a new Experience.

```text
Do not open another Experience block.
Observe the complete organism.
```

Manifesto (historical Experience constitution): [EXPERIENCE_MANIFESTO](./EXPERIENCE_MANIFESTO.md).

---

## PRODUCT LAW 002

```text
YourMeal OS never forces tenants
to recreate information
they already own.

Existing operational knowledge
must be reusable whenever possible.
```

**ADR:** [0093](../adr/0093-product-law-002.md)

Tenants already have information. Our job is to give them solutions — not force recreation.

---

## TEAM LAW 001

```text
We never optimize our development time.

We optimize the tenant's operational time.

Engineering time is an investment.

Tenant time is the product.
```

**ADR:** [0094](../adr/0094-team-law-001.md)

---

## Era 2 Definition of Done

```text
Before                         Now
Tests PASS                     The operator finishes earlier
```

Done means: intuitive · fewer steps · less doubt · time saved.  
Engineering Evidence + Operational Evidence.

---

## Era 2 working rhythm

```text
Observe Tenant → Measure → Understand → Prototype
→ Validate → Measure Again → Ship
```

Centre: experience — not code.

Mandatory prompt preamble: [ERA2_CURSOR_PROMPT](./ERA2_CURSOR_PROMPT.md).

---

## Operational Core vs Accelerators

| Track | Role |
|-------|------|
| **Operational Core** | Experiences that make the business work (Sprint 001) |
| **Operational Accelerators** | Capture · Import · **OCC (Reserved)** · Templates · Timeline · … · [OPERATIONAL_ACCELERATORS](./OPERATIONAL_ACCELERATORS.md) |

Accelerators do not change the domain. They accelerate work. Recorded in [ERA2_PRODUCT_DISCOVERY_001](./ERA2_PRODUCT_DISCOVERY_001.md).

---

## The true MVP

The MVP is no longer “the application.”

The MVP is this cycle:

```text
Isabella
  ↓
Observation
  ↓
Friction
  ↓
Product
  ↓
Time recovered
```

If that cycle works, YourMeal OS can evolve for years without losing direction.

---

## First objective of Era 2

Not Delivery. Not Billing. Not AI. Not Telemetry.

Something more concrete:

> **Sit with Isabella and discover where she loses time today.**

That is the first real Tenant Success sprint.  
It does not start on GitHub.  
It starts by observing.

---

## Evidence-guided development

The backlog is no longer fed by ideas alone.

```text
Before                         From today
Idea → Feature                 Observation
                                 ↓
                               Friction
                                 ↓
                               Time lost
                                 ↓
                               Evidence
                                 ↓
                               Prioritization
                                 ↓
                               Implementation
                                 ↓
                               Time recovered
```

That is **desarrollo guiado por evidencia**.

Not every observation becomes a feature. Sometimes the best answer is:

* a flow change  
* a clearer screen  
* a small automation  
* a configuration decision  
* training / operating agreement  

Software is only **one** possible solution.

---

## Operational Evidence Loop (official Product Core cycle)

```text
Observe
  ↓
Measure
  ↓
Understand
  ↓
Design
  ↓
Implement
  ↓
Validate
  ↓
Measure Again
  ↓
Time Saved
  ↓
Repeat
```

This is the official Product Core cycle.

We do not merely develop.  
We **learn**.

Success of a sprint is not “PRs closed” or “Capabilities added.”  
Success is: **Isabella works better at the end of her day.**

---

## Beta means Discover Friction

Beta is **not** primarily for finding software bugs.

```text
Beta
  ↓
Discover Friction
```

If Isabella needs five more clicks than necessary — **that is a bug**,  
even when the software “works perfectly.”

Engineering defects still matter.  
Operational friction is now a first-class defect class.

---

## How to observe an operator (without influencing the work)

**Official instrument:** [OBSERVATION_FRAMEWORK](../tenant-success/OBSERVATION_FRAMEWORK.md) · TENANT-SUCCESS-001 · ADR [0095](../adr/0095-tenant-success-001-observation-framework.md)

**Organism instrument (active):** [ORGANISM_REVIEW](../tenant-success/ORGANISM_REVIEW.md) · OBSERVATION-ORGANISM-001

| Artefact | Path |
|----------|------|
| Framework | [OBSERVATION_FRAMEWORK](../tenant-success/OBSERVATION_FRAMEWORK.md) |
| Organism Review | [ORGANISM_REVIEW](../tenant-success/ORGANISM_REVIEW.md) |
| Work-transfer template | [ORGANISM_OBSERVATION_TEMPLATE](../tenant-success/ORGANISM_OBSERVATION_TEMPLATE.md) |
| Single-task template | [TENANT_OBSERVATION_TEMPLATE](../tenant-success/TENANT_OBSERVATION_TEMPLATE.md) |
| Friction classes | [FRICTION_CATALOG](../tenant-success/FRICTION_CATALOG.md) |
| Priority score | [TIME_SAVINGS_SCORE](../tenant-success/TIME_SAVINGS_SCORE.md) |
| Session files | `docs/tenant-success/observations/` |

Goal: see the real job, not the demo job.  
Organism goal: see **work transfers** across Customer → … → Delivery → Outcome — not screens.

### Rules

1. **Watch first, speak second.** Do not coach mid-task.  
2. **Ask for a real day**, not a showcase path.  
3. **Sit beside, not opposite.** You are a witness, not a teacher.  
4. **Record friction, not opinions.** “Took three screens to correct one dish” > “UX feels bad.”  
5. **Never invent urgency.** If they pause to explain, note that the pause itself is cost.  
6. **One transfer (or one job) at a time.** Prefer From → To handoffs for organism sessions; deep-dive a single task only when needed.  
7. **Thank them for interruption cost.** Observation consumes tenant time; treat it as scarce.  
8. **Use the official template** — organism template for transfers; task template for deep dives. Do not invent ad-hoc spreadsheets as the system of record.  
9. **Clock the whole operational task** — product minutes + Excel + WhatsApp + paper = real duration (not click time alone).

### Anti-patterns

* Leading questions (“Wouldn’t a button here help?” · “Would an import help?”)  
* Teaching the product during observation  
* Fixing live while measuring  
* Measuring only power users  
* Measuring only empty / sandbox tenants  
* Opening Import · Bulk · OCC · Quick Capture from intuition  
* Reporting only in-product minutes when the job finished outside the product

---

## How to measure real task time

### Minimum stopwatch protocol

```text
Task name
Role
Device (Web / Android / iOS)
Start condition (what is already true)
End condition (what “done” means)
Duration (mm:ss)
Error count / retries
Notes (friction only)
```

### Before / After

Every Product Core change that claims time savings should eventually show:

```text
Before   mm:ss   (observed)
After    mm:ss   (observed)
Delta    −% or −mm:ss
Evidence OPPO / Web / Isabella session id or date
```

Until measured, label estimates as **Estimated** — never as Evidence.

### What counts as “done”

Define the operator’s job completion — not the engineering acceptance test.

Example:

```text
Done = weekly order corrected and visible for kitchen for Thursday
Not done = “API returned 200”
```

---

## How to register operational friction

Friction is a first-class product input.

### Friction log (lightweight)

| Field | Content |
|-------|---------|
| Date | |
| Tenant / site | EatClean · … |
| Role | Admin · Kitchen · Delivery · … |
| Job | Create customer · Edit order · … |
| Friction | What slowed or confused |
| Cost | Time · error · rework · trust |
| Severity | Low · Medium · High · Blocker |
| Candidate fix | One sentence (feature · flow · config · other) |
| PRODUCT LAW 001 | Time recoverable? Y/N · estimate |

Store links in validation notes, field reports, or the Time Savings Backlog — not only in chat.

### Friction → backlog rule

```text
Observation
  ↓
Measurement
  ↓
Pattern (candidate only)
  ↓
Evidence
  ↓
Product Decision
  ↓
TENANT_TIME_SAVINGS_BACKLOG row  (if Decision = build)
  ↓
Experience · Capability · Accelerator · or Do Nothing
```

No friction → no Product Core ticket by default.  
No measurement → no accepted observation (LAW 001).

---

## How observations become Product Backlog

1. Write the **operator job**, not the screen name.  
2. Attach friction + time estimate.  
3. Classify **Time Saved** · **Complexity** · **Target Version**.  
4. Apply PRODUCT LAW 001 — reject or defer if no time returned.  
5. Prefer a measured session before promoting to “must ship”.  
6. PR must include **Operational Impact** (see GitHub PR template).  
7. Ask whether software is required — or flow / config / clarity is enough.

Priority:

```text
Time Saved (desc) → Beta urgency → Complexity (asc)
```

Never reorder solely for architectural elegance.

---

## Roadmap by time recovered (not by modules)

Do not divide the roadmap by modules first.  
Divide it by **tiempo recuperado** the client understands.

| Objetivo | Tiempo recuperado esperado |
|----------|----------------------------:|
| Alta rápida de clientes | 20–30 min/semana |
| Edición rápida de pedidos | 1–2 h/semana |
| Importación de Excel | 2–4 h/semana |
| Copiar planificación semanal | 30–60 min/semana |
| Flujo móvil optimizado | Menos errores · menos interrupciones |

Concrete candidates live in [TENANT_TIME_SAVINGS_BACKLOG](./TENANT_TIME_SAVINGS_BACKLOG.md).  
Every sprint should name the minutes it intends to return.

---

## Beta / GM decision gate

| Bucket | Enter when |
|--------|------------|
| **Beta 1** | Blocks real weekly operations or wastes large daily time |
| **Beta 2** | Major recurring savings; safe after Beta 1 stability |
| **Beta 3** | Automation that multiplies existing clear jobs |
| **GM** | Long-term vision — only with PRODUCT LAW 001 proof path |

Questions before promoting:

```text
Which role finishes earlier?
How many minutes per week?
What evidence do we have (or will we collect)?
What breaks if we ship this unfinished?
Does this reopen frozen Architecture without a reopen gate?
Is software the right solution — or is flow/config enough?
```

Architecture reopen remains exceptional (Foundation broken · production blocked · measurable time savings). See [OPERATIONAL_ENGINE_V1](./OPERATIONAL_ENGINE_V1.md).

---

## Roadmap language (permanent)

```text
Android
  ↓
OPPO
  ↓
iPhone
  ↓
Isabella
  ↓
Observation
  ↓
Iteration
  ↓
Beta
  ↓
Production
```

Not:

```text
Platform → Foundation → Engine → next module
```

---

## Dual evidence (required for Product Core)

| Class | Question |
|-------|----------|
| **Engineering Evidence** | Does it pass tests · certification · laws? |
| **Operational Evidence** | Does the operator finish earlier with fewer mistakes? |

Engineering Evidence alone is not enough to claim product success.  
Operational Evidence alone is not enough to ship unsafe software.  
Tenant Success needs **both**.

The Operational Evidence Loop closes only when we **Measure Again** and can state Time Saved.

---

## Working with engineering (Cursor / agents)

Start every Product Core prompt with [ERA2_CURSOR_PROMPT](./ERA2_CURSOR_PROMPT.md).

Then:

```text
Role: Isabella / Kitchen / Delivery / Admin
Job: …
Current duration: …
Friction: …
Desired duration: …
Constraint: do not reopen Engine Architecture unless …
Success: Operational Evidence (Measure Again) …
```

Avoid prompts that only say “add a module” without time returned.

---

## Relationship to other constitutions

| Document | Era question |
|----------|----------------|
| Developer Platform | How do we develop safely? |
| FOUNDATION_LOCK | How do we design Capabilities? |
| PRODUCT_DIRECTION | Why · PRODUCT LAW 001 + 002 · TEAM LAW 001 |
| OPERATIONAL_ENGINE_V1 | What motor is frozen? (Era 1 complete) |
| **ERA_DECLARATION** | **Acta institucional · Era 1 CLOSED · Era 2 OPEN** |
| **ERA2_PRODUCT_DISCOVERY_001** | **First Discovery · Accelerators registered** |
| **TENANT-SUCCESS-001** | **Observation Framework** · docs/tenant-success/ |
| **OBSERVATION-ORGANISM-001** | **Organism Review** · [ORGANISM_REVIEW](../tenant-success/ORGANISM_REVIEW.md) · active Observation Sprint |
| **SPRINT_001_TENANT_SUCCESS** | **Era 2 sprint constitution · Experience chain complete** |
| **TENANT_SUCCESS_PLAYBOOK** | **How do we return time? (Era 2)** · TENANT SUCCESS LAW 001 |
| TENANT_TIME_SAVINGS_BACKLOG | Which jobs return how many minutes? |
| ERA2_CURSOR_PROMPT | Mandatory Era 2 prompt header |

---

## Closing principle

> **Great software is not measured by the amount of code it contains.**
>
> **Great operational software is measured by the amount of time it gives back to the people who use it.**
>
> **Time saved is not a consequence of the product.**
>
> **Time saved is the product.**

> **The Operational Engine is no longer our competitive advantage.**
>
> **What we build on top of it is.**
>
> **From this point forward, every improvement must help a tenant finish work faster, make fewer mistakes, and operate with greater confidence.**

```text
ERA 1 ended building a motor.
ERA 2 begins returning time.
```

> **We are not going to develop screens.**
>
> **We are going to design better workdays.**

This Playbook is the prologue of that company — not a feature list.
