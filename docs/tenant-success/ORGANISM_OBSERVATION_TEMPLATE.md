# Organism Observation Template

**Track:** OBSERVATION-ORGANISM-001  
**Framework:** [ORGANISM_REVIEW](./ORGANISM_REVIEW.md) · [OBSERVATION_FRAMEWORK](./OBSERVATION_FRAMEWORK.md)  
**Use:** One copy per **work transfer** (From → To), not per screen.

```text
Copy this section into a dated file under
docs/tenant-success/observations/
e.g. 2026-08-15-eatclean-organism-kitchen-to-delivery.md
```

```text
Unit of observation = WORK TRANSFER
Not a screen. Not a feature. A handoff of responsibility.
```

---

## Header

| Field | Value |
|-------|-------|
| **Observation ID** | ORG-YYYYMMDD-### |
| **Date** | |
| **Tenant** | |
| **Observer** | |
| **Tenant role observed** | (actual title / responsibility — not assumed org chart) |
| **Workflow** | Customer→Order · Order→Menu · Menu→Production · Production→Kitchen · Kitchen→Delivery · Delivery→Outcome · other |
| **From** | |
| **To** | |
| **Task** | (the real operational job being transferred) |
| **Environment** | Web / Android / iOS · build if known |
| **Session id** | (optional) |

---

## Work being transferred

| Field | Value |
|-------|-------|
| **Work description** | What responsibility moves From → To? |
| **Definition of done (receiver)** | What must be true for the next role to act? |
| **People involved** | Count + roles |
| **Handoffs in this transfer** | Count |

---

## Information map

| Field | Value |
|-------|-------|
| **Information required** | |
| **Information available** | (where / in which tool) |
| **Information missing** | |
| **Information duplicated** | |
| **Information continuity** | PASS · FRICTION · BREAK · UNKNOWN |
| **Responsibility continuity** | PASS · FRICTION · BREAK · UNKNOWN |
| **Context continuity** | PASS · FRICTION · BREAK · UNKNOWN |
| **Execution continuity** | PASS · FRICTION · BREAK · UNKNOWN |

---

## Timing (LAW 001 — required)

| Field | Value |
|-------|-------|
| **Start time** | |
| **End time** | |
| **Active work time** | |
| **Waiting time** | |
| **Total operational time** | (active + waiting · all tools) |
| **Time inside YourMeal OS** | (subset — do not report alone) |
| **Time outside product** | |
| **Repetitions** | |
| **Manual entries** | |
| **Systems / tools involved** | count + list |

### Operational task clock (important)

If the job spans product + Excel + WhatsApp (etc.), clock the **whole task**.

```text
Product minutes + external minutes = operational minutes
```

---

## Tools & manual work

| Tool / medium | Used? | Role in the transfer |
|---------------|-------|----------------------|
| YourMeal OS | | |
| Excel | | |
| PDF | | |
| Paper | | |
| WhatsApp / chat | | |
| Email | | |
| Phone | | |
| Manual calculation | | |
| External route / maps | | |
| External DB / other app | | |
| Other | | |

| Field | Value |
|-------|-------|
| **Manual steps** | (numbered) |
| **Repeated entries** | |
| **Copy / paste events** | |
| **Human bridge?** | Y/N — person carries info between system parts |
| **Who is the bridge?** | |

---

## Friction

| Field | Value |
|-------|-------|
| **Primary organism category** | DUPLICATE_ENTRY · MANUAL_CALCULATION · SEARCH · RECONCILIATION · HANDOFF · WAITING · CONTEXT_SWITCH · MISSING_INFORMATION · REPEATED_INFORMATION · EXTERNAL_TOOL · REWORK · ERROR_CORRECTION · UNSUPPORTED_OPERATION · UNAVAILABLE_SUBSTRATE · OTHER |
| **F-XX class(es)** | see [FRICTION_CATALOG](./FRICTION_CATALOG.md) |
| **Observed friction** | (what happened — facts) |
| **Workaround** | (what they do today) |
| **Impact** | time · error risk · people · departments |
| **Leaves product?** | Y/N — if yes, where do they go and why |
| **Error risk** | Low · Medium · High · Blocker |
| **Evidence** | (quote · count · screenshot ref · note — no coaching) |
| **Confidence** | High · Medium · Low |

---

## Priority signals (for later ranking — not a solution)

| Signal | Note |
|--------|------|
| Frequency | How often this transfer / friction occurs |
| Duration | Measured operational minutes |
| People affected | |
| Operational impact | |
| Repetition | |
| Error risk | |
| Dependency | Blocks downstream? |
| Cross-department impact | |

Do **not** score theoretical Time Saved here.

---

## Explicitly empty (this phase)

Do **not** fill unless a later Product Decision reopens the record:

* Feature request  
* Capability  
* Accelerator  
* AI  
* Import / Bulk / Quick Capture / OCC  
* “Would help if…”  

```text
First record the problem.
Then measure it.
Then understand it.
Then decide.
```

---

## Observer notes (optional)

Facts only. No coaching. No solution design.

---

## Related

* [ORGANISM_REVIEW](./ORGANISM_REVIEW.md)  
* [TENANT_OBSERVATION_TEMPLATE](./TENANT_OBSERVATION_TEMPLATE.md) (single-task deep dive)  
* [FRICTION_CATALOG](./FRICTION_CATALOG.md)  
* [OBSERVATION_FRAMEWORK](./OBSERVATION_FRAMEWORK.md)
