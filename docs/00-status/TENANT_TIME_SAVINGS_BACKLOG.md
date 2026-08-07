# Tenant Time Savings Backlog

**Permanent · PRODUCT LAW 001**  
**Declared:** 2026-08-07 · ADR [0084](../adr/0084-product-law-001.md)  
**North star:** [PRODUCT_DIRECTION](./PRODUCT_DIRECTION.md)

```text
Ideas enter by operational impact — not by novelty.
```

Every row must answer: **Does it save tenant time? How much? Which Beta?**

---

## Classification

| Target | Meaning |
|--------|---------|
| **Beta 1** | Critical for usability |
| **Beta 2** | Major operational improvement |
| **Beta 3** | Automation |
| **GM** | Golden Master · long-term vision |

**Time Saved:** Low · Medium · High · Very High (operator estimate until measured).  
**Complexity:** Low · Medium · High (engineering + change risk).

---

## Backlog

| Idea | Time Saved | Complexity | Target Version | Notes |
|------|------------|------------|----------------|-------|
| Quick Customer create / edit | High | Low | Beta 1 | Reduce create from minutes → seconds |
| Customer archive / restore | Medium | Low | Beta 1 | Soft-delete already Foundation |
| Order create / edit / status | High | Medium | Beta 1 | Weekly commitment path |
| Weekly planning clarity | High | Medium | Beta 1 | Operator understands the week |
| Menu create / edit / duplicate / archive | High | Medium | Beta 1 | Core catering loop |
| Production quick workflow | High | Medium | Beta 1 | Less clicks to releasable work |
| Kitchen quick execution | High | Medium | Beta 1 | Queue → ready → complete |
| Delivery Capability Demo | Medium | Low | Beta 1 | LAW 003 proof · already Certified |
| Copy last week (orders / menu) | Very High | Medium | Beta 2 | Repeatable weekly cycle |
| Bulk Excel import | Very High | High | Beta 2 | Replace multi-hour spreadsheet work |
| Billing Capability (Architecture→Demo) | High | High | Beta 2 | Engine v1.0 Outcome · after Confirmation |
| FLOW-003 Confirmation → Billing | High | Medium | Beta 2 | After Billing Facade |
| Mobile UX pack (gestures · sheets · haptics · empty/loading) | High | Medium | Beta 1–2 | Native feel · fewer mistakes |
| Android Doctor / sync / APK field loop | Medium | Medium | Beta 1 | Keep OPPO evidence fresh |
| iOS build + field validation | High | High | Beta 1 | Cross-platform PASS |
| AI Assistant | High | High | GM | Only if PRODUCT LAW 001 proven |

---

## How to add an idea

1. Write the **operator job** (not the screen name).  
2. Estimate time saved vs today.  
3. Pick Beta bucket.  
4. Reject or defer if it does not save time (PRODUCT LAW 001).  
5. Prefer measuring with a real operator before promoting to Product Core.

---

## Priority rule

```text
Time Saved (desc) → Beta urgency → Complexity (asc)
```

Never reorder solely because an idea is architecturally elegant.

---

## Link to Engine completion

Still required before Architecture Freeze v1.0 (engineering path):

1. Delivery Demo  
2. Billing Capability cycle  
3. Flow completion (FLOW-002 Demo · FLOW-003 with Billing)  
4. Declare **Operational Engine v1.0 · Architecture Frozen**

Then backlog above becomes the main product driver.
