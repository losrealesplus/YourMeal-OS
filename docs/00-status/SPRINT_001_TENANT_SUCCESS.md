# Sprint 001 · Tenant Success

**Status:** ▶ **ACTIVE** — Era 2 · Experience Sprint mode  
**Declared:** 2026-08-07 · corrected same day (LAW 001-A)  
**Active epic:** [CUSTOMER_EXPERIENCE_001](./CUSTOMER_EXPERIENCE_001.md)  
**Observation instrument (ready, sessions deferred):** [OBSERVATION_FRAMEWORK](../tenant-success/OBSERVATION_FRAMEWORK.md) · ADR [0095](../adr/0095-tenant-success-001-observation-framework.md)  
**LAW 001-A:** ADR [0096](../adr/0096-tenant-success-law-001a.md)  
**Discovery:** [ERA2_PRODUCT_DISCOVERY_001](./ERA2_PRODUCT_DISCOVERY_001.md)  
**Prompt:** [ERA2_CURSOR_PROMPT](./ERA2_CURSOR_PROMPT.md)

```text
Experience Sprint = build
Observation Sprint = learn
Never mixed.
```

---

## Era 2 roadmap (corrected)

```text
Framework                         ✅ TENANT-SUCCESS-001
↓
Customer Experience               ▶ CUSTOMER EXPERIENCE 001
↓
Order Experience
↓
Menu Experience
↓
Production Experience
↓
Kitchen Experience
↓
Delivery Experience
↓
Android APK
↓
OPPO
↓
Internal Dogfooding
↓
Isabella Observation              ⏸ after usable workflows (LAW 001-A)
↓
Sara Observation
↓
Tenant Backlog (evidence)
```

---

## Two sprint types

| Type | Purpose | Example |
|------|---------|---------|
| **Experience Sprint** | Build a coherent, usable workflow with a time metric | CUSTOMER EXPERIENCE 001 · &lt; 30s |
| **Observation Sprint** | Measure real operator friction on usable workflows | Isabella · Sara sessions |

Never run both as one sprint. Building + observing together invites intuition-justified changes.

---

## Active metric (Customer)

```text
Mission: Zero Friction Customer Management
TTA: Time-to-Create Customer < 30 seconds
TTF: Time-to-Find < 10 seconds
Clicks to Create ≤ 6
```

See [CUSTOMER_EXPERIENCE_001](./CUSTOMER_EXPERIENCE_001.md) · [EXPERIENCE_MISSIONS](./EXPERIENCE_MISSIONS.md) · EXPERIENCE LAW 001.

---

## Experience time targets (chain)

| Experience | Target |
|------------|--------|
| Customer | &lt; 30 seconds |
| Order | &lt; 45 seconds |
| Menu | &lt; 2 minutes |
| Production | &lt; 1 minute |
| Kitchen | &lt; 10 seconds |
| Delivery (route ready) | &lt; 2 minutes |

---

## What we will not touch

* Foundation · Developer Platform · Operational Engine Construction  
* New Capabilities  
* Isabella Observation until LAW 001-A gate passes  
* Accelerators as primary work  

---

## Definition of Done

```text
Before                         Now
Tests PASS                     The operator finishes earlier
```

Experience Sprint: coherent usable path + visible time objective + Engineering Evidence.  
Observation Sprint (later): measured friction on **finished** workflows only.  
Aligned with [TENANT_SUCCESS_PLAYBOOK](./TENANT_SUCCESS_PLAYBOOK.md) · Era 2 Definition of Done.

---

## Related

* [CUSTOMER_EXPERIENCE_001](./CUSTOMER_EXPERIENCE_001.md)  
* [CURRENT_PHASE](./CURRENT_PHASE.md)  
* [TENANT_SUCCESS_PLAYBOOK](./TENANT_SUCCESS_PLAYBOOK.md)
