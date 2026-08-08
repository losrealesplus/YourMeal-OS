# Operational Observation Framework

**Track:** TENANT-SUCCESS-001  
**Status:** ▶ **ACTIVE** — permanent Era 2 methodology  
**Declared:** 2026-08-07  
**Laws:** PRODUCT LAW 001 · PRODUCT LAW 002 · TENANT SUCCESS LAW 001 · **001-A** · TEAM LAW 001  
**Playbook:** [TENANT_SUCCESS_PLAYBOOK](../00-status/TENANT_SUCCESS_PLAYBOOK.md)  
**Companions:** [TENANT_OBSERVATION_TEMPLATE](./TENANT_OBSERVATION_TEMPLATE.md) · [FRICTION_CATALOG](./FRICTION_CATALOG.md) · [TIME_SAVINGS_SCORE](./TIME_SAVINGS_SCORE.md)  
**ADR:** [0095](../adr/0095-tenant-success-001-observation-framework.md) · [0096](../adr/0096-tenant-success-law-001a.md) (LAW 001-A)

```text
This is not software.
This is product methodology.

One official question:
Where does the tenant lose operational time?

LAW 001-A:
Never observe unfinished workflows.
```

---

## Purpose

Institutionalize **how YourMeal OS observes tenants**.

Every future Product Core decision must be justifiable with measurable operational evidence.  
The roadmap becomes **evidence-driven**, not idea-driven.

The Observation Framework is the instrument that discovers the correct features.  
It is **not** a Capability. It does not touch Foundation, Developer Platform, or the Operational Engine.

---

## Official sequence (Era 2 · corrected)

```text
1. Operational Observation Framework     ✅ READY (instrument)
2. Experience chain
   Customer → Order → Menu → Production → Kitchen → Delivery
3. Android APK → OPPO → Internal Dogfooding
4. Isabella Observation Session          ⏸ after usable workflows
5. Sara Observation Session
6. Tenant Success Backlog (evidence-ranked)
```

**Experience Sprints** build. **Observation Sprints** learn. Never mixed.

Do **not** observe Isabella on unfinished edit/order/menu paths — that measures missing implementation, not operational friction (TENANT SUCCESS LAW 001-A).

Active now: [CUSTOMER_EXPERIENCE_001](../00-status/CUSTOMER_EXPERIENCE_001.md).

---

## Observation principles

1. **Observe the real work** — a real day, not a showcase path.  
2. **Measure before proposing solutions.**  
3. **Friction is a first-class defect** — even when software “works.”  
4. **Software is only one possible solution** (flow · screen · config · training · reuse of existing knowledge).  
5. **One job at a time** — one task per observation block.  
6. **Evidence over opinion** — clicks, screens, minutes, tools — not “UX feels bad.”  
7. **Reuse knowledge** — note Excel · PDF · WhatsApp · paper · phone (PRODUCT LAW 002).  
8. **Close the loop** — after a change ships, **Measure Again**.

---

## Observation ethics

```text
Observe without influencing.

Never teach.
Never explain.
Never interrupt.

Watch first. Speak second.
```

Additional rules:

* Sit beside, not opposite — witness, not teacher.  
* Do not coach mid-task.  
* If they pause to explain, the pause itself is cost — record it.  
* Thank them for interruption cost; observation consumes tenant time.  
* Do not invent urgency or invent features mid-session.  
* Protect privacy: note operational facts, not gossip; no customer PII in public docs beyond what the tenant authorizes.

---

## What every session must produce

| Artefact | Template |
|----------|----------|
| Observation record | [TENANT_OBSERVATION_TEMPLATE](./TENANT_OBSERVATION_TEMPLATE.md) |
| Friction entries | [FRICTION_CATALOG](./FRICTION_CATALOG.md) classes |
| Scored opportunities | [TIME_SAVINGS_SCORE](./TIME_SAVINGS_SCORE.md) |

No backlog item from observation is “accepted” until duration / frequency / tools are recorded (TENANT SUCCESS LAW 001).

---

## Roles to observe (EatClean first)

| Role | Why |
|------|-----|
| Isabella (admin / operator) | Primary daily path |
| Sara (or kitchen lead) | Kitchen work list reality |
| Delivery operator | Leave → deliver → confirm |
| Admin / billing contact | Incidents · preferences · later calls |

---

## Relationship to Product Core

```text
Observation
  ↓
Friction (catalogued)
  ↓
Time lost (measured)
  ↓
Time Savings Score
  ↓
Prioritization (Beta / GM)
  ↓
Experience sprint
  ↓
Measure Again
  ↓
Time recovered
```

Accelerators (Operational Capture · Import Pipeline · …) enter only through this path — registered ideas are not evidence.

---

## Explicit non-goals

* No code · no UI · no database · no architecture  
* No new Capabilities · no Foundation Laws · no Engine changes  
* This folder is methodology only  

---

## Definition of Done (framework)

* Every future product decision can cite measurable operational evidence.  
* YourMeal OS has **one official way** to discover tenant needs.  
* The roadmap is evidence-driven instead of idea-driven.

---

## Related

* [TENANT_SUCCESS_PLAYBOOK](../00-status/TENANT_SUCCESS_PLAYBOOK.md)  
* [SPRINT_001_TENANT_SUCCESS](../00-status/SPRINT_001_TENANT_SUCCESS.md)  
* [ERA2_PRODUCT_DISCOVERY_001](../00-status/ERA2_PRODUCT_DISCOVERY_001.md)  
* [ERA2_CURSOR_PROMPT](../00-status/ERA2_CURSOR_PROMPT.md)  
* [TENANT_TIME_SAVINGS_BACKLOG](../00-status/TENANT_TIME_SAVINGS_BACKLOG.md)
