# Time Savings Score

**Track:** TENANT-SUCCESS-001  
**Framework:** [OBSERVATION_FRAMEWORK](./OBSERVATION_FRAMEWORK.md)  
**Laws:** PRODUCT LAW 001 · TENANT SUCCESS LAW 001 · TEAM LAW 001

Every opportunity promoted from observation must receive a score card before Product Core prioritization.

```text
No observation is accepted until it has been measured.
No solution is accepted until the improvement has been measured again.
```

---

## Score card template

| Field | Value |
|-------|-------|
| **Opportunity id** | TS-YYYY-NNN |
| **Source observation** | link / session id |
| **Operator job** | (not screen name) |
| **Friction classes** | from [FRICTION_CATALOG](./FRICTION_CATALOG.md) |
| **Operational frequency** | Daily · Weekly · Monthly |
| **Estimated time lost** | per occurrence · per week |
| **Estimated time saved** | if solved (hypothesis) |
| **Implementation complexity** | Low · Medium · High |
| **Business impact** | Low · Medium · High · Critical |
| **Priority bucket** | Beta 1 · Beta 2 · Beta 3 · Golden Master |
| **Reuses existing knowledge?** | Y/N (PRODUCT LAW 002) |
| **Proposed solution type** | Flow · Screen · Automation · Config · Import · Training · Other |
| **Measure Again plan** | how we will re-time after ship |
| **Status** | Hypothesis · Accepted evidence · Shipped · Validated · Rejected |

---

## Scoring guidance

### Frequency

| Value | Meaning |
|-------|---------|
| Daily | Multiple or once every working day |
| Weekly | Part of the weekly catering cycle |
| Monthly | Periodic / closing / rare ops |

### Time lost / saved

Use clock time from observation when possible.  
If estimate only: mark **Estimate** until Measure Again.

Weekly impact ≈ (time per occurrence) × (occurrences per week).

### Complexity

| Value | Meaning |
|-------|---------|
| Low | Experience layer · existing Facade · no Architecture |
| Medium | Multi-surface · careful UX · limited substrate wiring |
| High | Cross-capability · Import Pipeline · likely Architecture gate |

### Priority buckets

| Bucket | Meaning |
|--------|---------|
| **Beta 1** | Critical usability — blocks daily finish |
| **Beta 2** | Major operational improvement |
| **Beta 3** | Automation / polish |
| **Golden Master** | Long-term vision — only with proof path |

### Priority rule

```text
Time saved (desc) → Frequency → Business impact → Complexity (asc)
```

Never promote solely because the idea is elegant.  
Never accept a solution as success without Measure Again (TENANT SUCCESS LAW 001).

---

## Example (illustrative — not evidence)

| Field | Example |
|-------|---------|
| Job | Create / maintain customer |
| Frequency | Daily |
| Time lost | 8–12 min / alta (estimate) |
| Time saved hypothesis | 5–8 min / alta |
| Complexity | Medium |
| Bucket | Beta 1 |
| Measure Again | Time 5 altas before/after with Isabella |

Replace examples with real Isabella / Sara session cards.

---

## Registry location

Scored opportunities feed:

* [TENANT_TIME_SAVINGS_BACKLOG](../00-status/TENANT_TIME_SAVINGS_BACKLOG.md)  
* Experience sprint selection ([SPRINT_001_TENANT_SUCCESS](../00-status/SPRINT_001_TENANT_SUCCESS.md))

Raw sessions live under `docs/tenant-success/observations/` (create as sessions happen).

---

## Related

* [OBSERVATION_FRAMEWORK](./OBSERVATION_FRAMEWORK.md)  
* [TENANT_OBSERVATION_TEMPLATE](./TENANT_OBSERVATION_TEMPLATE.md)  
* [FRICTION_CATALOG](./FRICTION_CATALOG.md)
