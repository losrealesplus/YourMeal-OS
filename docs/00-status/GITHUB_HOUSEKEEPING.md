# GitHub Housekeeping Report

**Date:** 2026-08-06  
**Context:** OPERATIONAL-003 Order Facade · stacked PR cleanup  
**Rule:** Tips already on `main` → **Close without merging**. Never duplicate commits.

---

## Merge report

| PR | Title (short) | Tip on main? | Action | Reason |
|----|---------------|--------------|--------|--------|
| #310 | PRODUCT-CORE-002 Orchestrator | **Yes** | Close without merging | Stacked draft; commits FF'd earlier |
| #311 | PRODUCT-CORE-003 Stage ownership | **Yes** | Close without merging | Same |
| #312 | PRODUCT-CORE-004 Ready Gate | **Yes** | Close without merging | Same (CI was red; tip already landed) |
| #314 | Identity Capability ADR 0055 | **Yes** | Close without merging | Stacked draft |
| #315 | Identity Facade ADR 0056 | **Yes** | Close without merging | Stacked draft |
| #316 | Identity Validation ADR 0057 | **Yes** | Close without merging | Stacked draft |
| #317 | Customer Capability ADR 0058 | **Yes** | Close without merging | Stacked draft |
| #318 | Customer Facade ADR 0059 | **Yes** | Close without merging | Stacked draft |
| #319 | Customer Validation ADR 0060 | Merged | — | Auto-closed when tip hit `main` |
| #320 | Customer Workspace ADR 0061 | Merged via FF | Close if still open | Tip on `main` (`cea7ff4`) |
| #321 | Order Capability ADR 0062 | **Yes** (FF) | Close without merging | Tip on `main` (`2ea0037`) |

**Agent note:** GitHub PR close API is not available to this agent (403 / tool mismatch). Human: bulk **Close without merging** on the Open rows above.

---

## Recommended merge order (if anything remains required)

Nothing remaining in the stack needs merge-by-PR: all tips are already ancestors of `main`.

New work (Order Facade) opens as a **fresh PR → `main`**.

---

## Repository health summary

| Check | Status |
|-------|--------|
| `main` tip | `2ea0037` Order Capability architecture (+ Workspace Demo + Customers certified) |
| Open orphan drafts | ~8–9 (tips on main — close housekeeping) |
| Capability maturity | Identity ✅ · Customers ✅ · Orders Architecture → **Facade (this PR)** |
| Pending capabilities | Production · Kitchen · Delivery · Billing |
| Cleanliness | Code clean on `main`; GitHub UI desynced by stacking |

```text
Git status (conceptual)
──────────────────────
main: clean operational stack through ADR 0062
Open PRs: housekeeping only (close without merge)
Next land: Order Facade (ADR 0063)
```

---

## Acceptance

- [x] Analyzed open PRs vs `main`  
- [x] Merge report produced  
- [x] No business code changed for analysis alone  
- [ ] Human closes orphan drafts in GitHub UI  
