# Era 2 · Experience Prompt Header

**Status:** ▶ **ACTIVE** — mandatory preamble for Experience Sprints  
**Declared:** 2026-08-07  
**Missions:** [EXPERIENCE_MISSIONS](./EXPERIENCE_MISSIONS.md)  
**Law:** EXPERIENCE LAW 001 · ADR [0098](../adr/0098-experience-law-001.md)

Every Experience development prompt should start with:

```text
Context

Strategic Freeze is active.

Operational Engine v1.0 is frozen.

This sprint belongs to Era 2.

The objective is not to add functionality.

The objective is to reduce operational time.

Every UX decision must minimize:

• Time
• Clicks
• Cognitive load
• Repeated work

Mission Success is measured in seconds,
not in lines of code.

EXPERIENCE LAW 001:
The first interaction must require the minimum information
needed to continue working. Everything else can be completed later.

Also satisfy:
PRODUCT LAW 001 · 002
TENANT SUCCESS LAW 001 · 001-A
TEAM LAW 001

Do not introduce new Capabilities.
Do not modify Foundation Laws.
Do not reopen Operational Engine Construction.
```

Then add the mission block (example · Customer):

```text
Mission: Zero Friction Customer Management
TTA: Time-to-Create Customer < 30 seconds
Also: Time-to-Find < 10s · Time-to-Edit Frequent < 20s
Clicks to Create ≤ 6 · Keyboard-only completion: Yes
Surface: useCustomer() only (LAW 003)
```

Also see [ERA2_CURSOR_PROMPT](./ERA2_CURSOR_PROMPT.md) · [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md).
