# Era 2 · Experience Prompt Header

**Status:** ▶ **ACTIVE** — mandatory preamble for Experience Sprints  
**Declared:** 2026-08-07  
**Manifesto:** [EXPERIENCE_MANIFESTO](./EXPERIENCE_MANIFESTO.md) · ADR [0099](../adr/0099-experience-manifesto-001.md)  
**Missions:** [EXPERIENCE_MISSIONS](./EXPERIENCE_MISSIONS.md)  
**Law:** EXPERIENCE LAW 001 · ADR [0098](../adr/0098-experience-law-001.md)

Every Experience development prompt should be a **mission**, not a task list.

---

## Mandatory header

```text
Context

Strategic Freeze is active.

Developer Platform is frozen.

Foundation is frozen.

Operational Engine v1.0 is frozen.

No architectural changes.

No new Capabilities.

No changes to Operational Flows.

No changes to Foundation Laws.

Era 2 is active.

The objective is not feature completeness.

The objective is operational speed.

EXPERIENCE MANIFESTO 001
A great Experience is invisible.
The operator should think about the customer,
not about the software.
The software succeeds when it disappears.

Every UX decision must minimize:

• Time
• Clicks
• Cognitive load
• Repeated work

Mission Success is measured in seconds,
not in lines of code.

EXPERIENCE LAW 001
The first interaction must require only the minimum
information necessary to continue working.
Progressive Completion is mandatory.

TEAM LAW 001
Engineering time is an investment.
Tenant time is the product.

PRODUCT LAW 001
Every Product Core improvement must demonstrably
reduce tenant operational time.

PRODUCT LAW 002
Never force tenants to recreate information
they already own.

TENANT SUCCESS LAW 001
Measure before deciding.
```

---

## Mission block (Customer example)

```text
CUSTOMER-EXPERIENCE-001

Mission
Zero Friction Customer Management

Mission KPI
Time-to-Create Customer
Target
<30 seconds

Do not think about CRUD.
Think about an operator who has thirty seconds.

Primary Flow
New Customer → Individual / Company / Company Employee
→ Name → Phone → Delivery Address → Save → Done.

Progressive Completion
Never require Preferences · Billing · Allergies
· Company Employees · Tags · Operational Notes on first create.

Acceptance
The operator never feels blocked.
The screen minimizes typing, navigation, decisions,
mouse travel, repeated work.

Definition of Done
Customer creation is demonstrably faster.
The experience feels natural.
The operator thinks about the customer,
not about the software.

PR must include Operational Time Saved
(current ≈ · new ≈ · saving ≈ · measurement method).
```

Also see [ERA2_CURSOR_PROMPT](./ERA2_CURSOR_PROMPT.md) · [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md).
