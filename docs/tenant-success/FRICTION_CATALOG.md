# Friction Catalog

**Track:** TENANT-SUCCESS-001 · OBSERVATION-ORGANISM-001  
**Framework:** [OBSERVATION_FRAMEWORK](./OBSERVATION_FRAMEWORK.md) · [ORGANISM_REVIEW](./ORGANISM_REVIEW.md)  
**Status:** ▶ **ACTIVE** — living taxonomy (add classes with evidence, not fashion)

Every observed friction should be classified. Classification enables comparison across sessions and tenants.

---

## How to use

1. During / after observation, list frictions on the [task template](./TENANT_OBSERVATION_TEMPLATE.md) or [organism template](./ORGANISM_OBSERVATION_TEMPLATE.md).  
2. Assign **one primary class** (optional secondary). For work transfers, also assign an **organism category** (§ Organism transfer categories).  
3. Score opportunities with [TIME_SAVINGS_SCORE](./TIME_SAVINGS_SCORE.md) **only after** measured observation (LAW 001).  
4. Prefer catalog names in backlog notes so evidence stays comparable.  
5. Do **not** classify as Feature / Accelerator / Capability during Observation — record the problem first.

---

## Catalog classes

| Class id | Class | Typical signal |
|----------|-------|----------------|
| F-01 | Repeated typing | Same data entered more than once |
| F-02 | Searching information | Hunting for client / dish / address / order |
| F-03 | Copy/Paste | Between screens or apps |
| F-04 | Waiting | Idle for system, kitchen, or person |
| F-05 | Navigation | Too many screens / clicks for one job |
| F-06 | Duplicated work | Same job done in two places |
| F-07 | Manual calculations | Macros, totals, portions by hand |
| F-08 | Paper dependency | Paper is source of truth |
| F-09 | External Excel | Spreadsheet holds operational truth |
| F-10 | External PDF | PDF menus / lists retyped |
| F-11 | Phone call dependency | Call required to complete the job |
| F-12 | Knowledge in people's heads | Only one person knows |
| F-13 | Manual validations | Human double-check that software could own |
| F-14 | WhatsApp / chat dependency | Ops coordination only in chat |
| F-15 | Context switching | Jumping tools mid-task |
| F-16 | Unclear next step | Operator hesitates / asks “what now?” |
| F-17 | Error recovery | Fixing mistakes costs more than the happy path |
| F-18 | Preference / restriction recall | Allergies / notes re-asked every time |
| F-19 | Recreate existing knowledge | Forced to re-enter owned data (LAW 002) |
| F-20 | Interruptions from others | Phone / walk-up breaks the flow |
| F-21 | Human bridge / handoff | A person carries work or data between two system parts or departments |
| F-22 | Unsupported operation | Software allows the path poorly or not at all; operator abandons or invents a workaround |
| F-23 | Unavailable substrate | Needed durable write / outcome / certification does not exist yet (honesty gap) |

---

## Organism transfer categories

Used when the unit of observation is a **work transfer** ([ORGANISM_REVIEW](./ORGANISM_REVIEW.md)).  
Map each organism category to one primary F-XX (optional secondary).

| Organism category | Primary F-XX (typical) | Signal |
|-------------------|------------------------|--------|
| DUPLICATE_ENTRY | F-01 · F-06 · F-19 | Same facts typed again at the next responsibility |
| MANUAL_CALCULATION | F-07 | Portions · totals · routes · nutrition by hand |
| SEARCH | F-02 · F-05 | Hunting for what the previous step already knew |
| RECONCILIATION | F-06 · F-13 | Matching two sources before work can continue |
| HANDOFF | F-21 | Responsibility transfer needs a human courier |
| WAITING | F-04 | Idle for person · system · department |
| CONTEXT_SWITCH | F-15 | Jumping tools mid-transfer |
| MISSING_INFORMATION | F-16 · F-23 | Next role cannot act; facts never arrived |
| REPEATED_INFORMATION | F-01 · F-19 | Same payload restated because continuity broke |
| EXTERNAL_TOOL | F-09 · F-10 · F-14 · F-08 | Excel · PDF · WhatsApp · paper hold the truth |
| REWORK | F-17 | Redo because handoff was incomplete or wrong |
| ERROR_CORRECTION | F-17 | Fixing mistakes costs more than the happy path |
| UNSUPPORTED_OPERATION | F-22 | Job exists in reality; product path is unused or abandoned |
| UNAVAILABLE_SUBSTRATE | F-23 | Certified journey honesty gap blocks the next step |
| OTHER | — | Does not fit — do not force |

**Especially important:** when a person becomes the bridge between two parts of the system, primary class is usually **F-21 (HANDOFF)** — often with EXTERNAL_TOOL or DUPLICATE_ENTRY as secondary.

---

## Examples (non-exhaustive)

| Observation | Class |
|-------------|-------|
| Retypes Juan’s address every Monday | F-01 · F-19 |
| Scrolls three screens to find last week’s order | F-02 · F-05 |
| Copies dish list from Excel into the app | F-03 · F-09 |
| Calls client to confirm “sin cebolla” | F-11 · F-18 |
| Calculates portions on phone calculator | F-07 · MANUAL_CALCULATION |
| Prints PDF menu and marks with pen | F-08 · F-10 · EXTERNAL_TOOL |
| Kitchen lead WhatsApps Delivery the day’s specials | F-21 · F-14 · HANDOFF |
| Delivery rebuilds route sheet because Kitchen completion did not carry sequence | F-21 · MISSING_INFORMATION |
| Operator leaves product for Excel because bulk edit is faster | F-22 · F-09 · UNSUPPORTED_OPERATION |

---

## Rules

* Do not invent a class for every anecdote — extend the catalog when a pattern repeats across sessions.  
* A friction can map to Accelerators later (Import Pipeline · Capture · Templates) — **after** measured evidence and scoring.  
* Extra clicks with “working software” still count (Beta = Discover Friction).  
* Organism observations prioritize **transfer friction** over screen polish.  
* Do not open Import · Bulk · OCC · Quick Capture from an unmeasured catalog row.

---

## Related

* [ORGANISM_REVIEW](./ORGANISM_REVIEW.md)  
* [ORGANISM_OBSERVATION_TEMPLATE](./ORGANISM_OBSERVATION_TEMPLATE.md)  
* [OBSERVATION_FRAMEWORK](./OBSERVATION_FRAMEWORK.md)  
* [TENANT_OBSERVATION_TEMPLATE](./TENANT_OBSERVATION_TEMPLATE.md)  
* [TIME_SAVINGS_SCORE](./TIME_SAVINGS_SCORE.md)
