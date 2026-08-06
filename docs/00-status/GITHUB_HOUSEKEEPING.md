# GitHub Housekeeping Report

**Date:** 2026-08-06 (updated · Production Workspace Demo)  
**Rule:** Tips already on `main` → **Close without merging**. Never duplicate commits.  
**Agent limit:** Cannot close/merge PRs via API (403 / tool). Human must apply actions below.

---

## Merge report

### A · Orphans (tip already on `main`) → Close without merging

| PR | Title | Action | Reason |
|----|-------|--------|--------|
| #310 | PRODUCT-CORE-002 Orchestrator | **Close without merging** | Tip on main |
| #311 | PRODUCT-CORE-003 Stage ownership | **Close without merging** | Tip on main |
| #312 | PRODUCT-CORE-004 Ready Gate | **Close without merging** | Tip on main |
| #314 | Identity Capability ADR 0055 | **Close without merging** | Tip on main |
| #315 | Identity Facade ADR 0056 | **Close without merging** | Tip on main |
| #316 | Identity Validation ADR 0057 | **Close without merging** | Tip on main |
| #317 | Customer Capability ADR 0058 | **Close without merging** | Tip on main |
| #318 | Customer Facade ADR 0059 | **Close without merging** | Tip on main |
| #321 | Order Capability ADR 0062 | **Close without merging** | Tip on main |

### B · Active stack (required · not yet on `main`) → Merge in order

| Order | PR | Title | Base |
|-------|-----|-------|------|
| 1 | **#322** | Order Facade ADR 0063 | `main` |
| 2 | **#323** | Order Validation ADR 0064 | #322 branch |
| 3 | **#324** | Order Workspace Demo ADR 0065 | #323 branch |
| 4 | **#325** | Production Architecture ADR 0066 | #324 branch |
| 5 | **#326** | Production Facade ADR 0067 | #325 branch |
| 6 | **#327** | Production Engineering Certification ADR 0068 | #326 branch |
| 7 | **#328** | Production Workspace Demo ADR 0069 | #327 branch |

**Preferred clean land:** FF `main` to tip of #328, then **Close without merging** all of #322–#328 (tips become ancestors of main — no duplicate commits).

---

## Repository health summary

| Check | Status |
|-------|--------|
| Open orphan drafts | 9 (#310–318, #321) — close without merging |
| Active stack | #322–#328 Operational Planning chain |
| Capability maturity | Identity ✅ · Customers ✅ · Orders ✅+Demo · Production ✅+Demo |
| Next | Kitchen Execution (OPERATIONAL-005) |
| Agent PR write | Blocked — human close/merge required |

```text
Git status (conceptual)
──────────────────────
main: still at ADR 0062 until stack lands
stack tip: Production Workspace Demo (ADR 0069)
board: docs/00-status/OPERATIONAL_ENGINE_BOARD.md FROZEN
```
