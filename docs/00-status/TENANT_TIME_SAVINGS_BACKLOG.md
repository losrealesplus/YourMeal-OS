# Tenant Time Savings Backlog

**Permanent · PRODUCT LAW 001 · PRODUCT LAW 002**  
**Declared:** 2026-08-07 · ADR [0084](../adr/0084-product-law-001.md) · [0093](../adr/0093-product-law-002.md)  
**North star:** [PRODUCT_DIRECTION](./PRODUCT_DIRECTION.md)  
**How we work now:** [TENANT_SUCCESS_PLAYBOOK](./TENANT_SUCCESS_PLAYBOOK.md)  
**Discovery:** [ERA2_PRODUCT_DISCOVERY_001](./ERA2_PRODUCT_DISCOVERY_001.md) · **Sprint:** [SPRINT_001_TENANT_SUCCESS](./SPRINT_001_TENANT_SUCCESS.md)

```text
Ideas enter by operational impact — not by novelty.
Reuse existing knowledge whenever possible (PRODUCT LAW 002).
```

Every row must answer: **Does it save tenant time? How much? Which Beta?**

---

## Two tracks

| Track | Meaning |
|-------|---------|
| **Operational Core** | Experiences that make the business work (Sprint 001 epics) |
| **Operational Accelerators** | Return time without changing domain — see [OPERATIONAL_ACCELERATORS](./OPERATIONAL_ACCELERATORS.md) |

---

## Classification

| Target | Meaning |
|--------|---------|
| **Beta 1** | Critical for usability |
| **Beta 2** | Major operational improvement |
| **Beta 3** | Automation |
| **GM** | Golden Master · long-term vision |
| **Registered** | Discovery recorded · not open for build yet |

**Time Saved:** Low · Medium · High · Very High (operator estimate until measured).  
**Complexity:** Low · Medium · High (engineering + change risk).

---

## Operational Core · Sprint 001

| Idea | Time Saved | Complexity | Target | Notes |
|------|------------|------------|--------|-------|
| Customer Experience (create/edit/search/segment/prefs) | High | Medium | Beta 1 · Epic 1 | Avoid later calls |
| Order Experience (create/edit/duplicate/templates/incidents) | Very High | Medium | Beta 1 · Epic 2 | Under 1 minute create |
| Menu Experience (week manage/copy/allergens) | High | Medium | Beta 1 · Epic 3 | Import later |
| Production Experience (timeline/prep inventory/export) | High | Medium | Beta 1 · Epic 4 | Prep ≠ Kitchen |
| Kitchen Experience (work list/labels/allergies/print) | High | Medium | Beta 1 · Epic 5 | Work not orders |
| Delivery Experience (driver/vehicle/route/evidence) | High | Medium | Beta 1 · Epic 6 | Leave→Deliver→Confirm |

---

## Operational Accelerators · registered

| Idea | Time Saved | Complexity | Target | Notes |
|------|------------|------------|--------|-------|
| Operational Capture | Very High | High | Registered | Intent capture · conversation context |
| Operational Import Pipeline | Very High | High | Registered | One pipeline · many formats · LAW 002 |
| Quick Create / Quick Repeat | Very High | Medium | Registered / Sprint stories | Last week · last order · template |
| Order Templates | Very High | Medium | Sprint Epic 2 | Preference templates |
| **Organization Templates** | High | Medium | Registered · post-CX004 | Org starter packs · not open now · see CX004 |
| Production Timeline | High | Medium | Sprint Epic 4 | Guide operator · not mere alerts |
| Preparation Inventory | High | Medium | Sprint Epic 4 | Lots · expiry · consumption |
| Nutrition Engine | Medium | High | Registered · GM | System calculates macros |
| Route optimization | High | High | Registered · later | After Delivery Experience |
| AI Assistant | High | High | GM | Only if laws proven |
| **Universal Command Bar (⌘K)** | ~~superseded~~ | — | — | → **ACCELERATOR-001 Operational Command Center** |
| **Operational Command Center (OCC)** | Very High | High | 🔒 **Reserved** · ACCELERATOR-001 | Platform entry point · **not** Customer search · [reservation](./ACCELERATOR_001_OPERATIONAL_COMMAND_CENTER.md) · no code until Experiences mature |

---

## Legacy rows (pre–Discovery 001)

| Idea | Time Saved | Complexity | Target Version | Notes |
|------|------------|------------|----------------|-------|
| Quick Customer create / edit | High | Low | Beta 1 | → Epic 1 |
| Customer archive / restore | Medium | Low | Beta 1 | Soft-delete already Foundation |
| Order create / edit / status | High | Medium | Beta 1 | → Epic 2 |
| Weekly planning clarity | High | Medium | Beta 1 | Operator understands the week |
| Menu create / edit / duplicate / archive | High | Medium | Beta 1 | → Epic 3 |
| Production quick workflow | High | Medium | Beta 1 | → Epic 4 |
| Kitchen quick execution | High | Medium | Beta 1 | → Epic 5 |
| Delivery Capability Demo | Medium | Low | Beta 1 | ✅ LAW 003 proof · ADR 0086 |
| Copy last week (orders / menu) | Very High | Medium | Beta 2 | → Quick Repeat / Menu copy |
| Bulk Excel import | Very High | High | Beta 2 | → Operational Import Pipeline |
| Billing Capability (Architecture→Demo) | High | High | Beta 2 | Certified ✅ ADR 0089 · Demo next · Engine Outcome |
| FLOW-003 Confirmation → Billing | High | Medium | Beta 2 | After Billing Facade |
| OPERATIONAL-ENGINE-001 Declaration | — | Low | ✅ Done | ADR 0090 · tag `operational-engine-v1.0` |
| Mobile UX pack (gestures · sheets · haptics · empty/loading) | High | Medium | Beta 1–2 | Native feel · fewer mistakes |
| Android Doctor / sync / APK field loop | Medium | Medium | Beta 1 | Keep OPPO evidence fresh |
| iOS build + field validation | High | High | Beta 1 | Cross-platform PASS |
| AI Assistant | High | High | GM | Only if PRODUCT LAW 001 proven |

---

## How to add an idea

1. Write the **operator job** (not the screen name).  
2. Estimate time saved vs today.  
3. Ask: does it reuse knowledge the tenant already owns? (PRODUCT LAW 002)  
4. Pick Beta bucket or Registered.  
5. Reject or defer if it does not save time (PRODUCT LAW 001).  
6. Prefer measuring with a real operator before promoting to Product Core.

---

## Priority rule

```text
Time Saved (desc) → Beta urgency → Complexity (asc)
```

Never reorder solely because an idea is architecturally elegant.  
Never open Accelerators before Core MVP without evidence.

---

## Link to Engine (complete)

**Operational Engine v1.0 is DECLARED** — [OPERATIONAL_ENGINE_V1](./OPERATIONAL_ENGINE_V1.md).

This backlog no longer drives Engine Construction.  
It drives **Tenant Success** under [TENANT_SUCCESS_PLAYBOOK](./TENANT_SUCCESS_PLAYBOOK.md).

Remaining Demo / Field / FLOW-003 items are Validation & Experience — measured by time returned, not by modules added.
