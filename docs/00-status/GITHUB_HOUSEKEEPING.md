# GitHub Housekeeping Report

**Date:** 2026-08-06 (final · after `main` FF to ADR 0069)  
**Rule:** Tips already on `main` → **Close without merging**. Never duplicate commits.  
**Agent limit:** Cannot close PRs via GitHub API (403). Human must bulk-close.  
**Also:** After closing, **Delete branch** for integrated branches so the repo stays clean.

---

## Status

`main` tip includes Production Workspace Demo (ADR 0069) and Operational Planning stack.  
**Operational Engine exists** (incomplete). Kitchen Execution Architecture is on branch → merge via ADR 0070 PR.

---

## Action required (human) — Close without merging + Delete branch

| PR | Title | Why |
|----|-------|-----|
| #310 | PRODUCT-CORE-002 | Tip on main (orphan stack) |
| #311 | PRODUCT-CORE-003 | Tip on main |
| #312 | PRODUCT-CORE-004 | Tip on main |
| #314 | Identity Capability | Tip on main |
| #315 | Identity Facade | Tip on main |
| #316 | Identity Validation | Tip on main |
| #317 | Customer Capability | Tip on main |
| #318 | Customer Facade | Tip on main |
| #321 | Order Capability | Tip on main |
| #322 | Order Facade | Tip on main (FF 2026-08-06) |
| #323 | Order Validation | Tip on main |
| #324 | Order Workspace Demo | Tip on main |
| #325 | Production Architecture | Tip on main |
| #326 | Production Facade | Tip on main |
| #327 | Production Certification | Tip on main |
| #328 | Production Workspace Demo | Tip on main |

**Do not merge any of these** — commits already exist on `main`. Close only, then delete branches.

---

## Repository health

| Check | Status |
|-------|--------|
| `main` | Clean · Operational Planning complete |
| Open drafts | Close list above |
| Identity · Customers · Orders · Production | Engineering Certified (+ Demos) |
| Kitchen Execution | Architecture (ADR 0070) |
| Board | [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md) — Engine **exists** |
| LAW 005 | One Capability · one Operational Model layer |

```text
Platform / Foundation     Stable
Operational Planning      Orders + Production ✅
Operational Execution     Kitchen Execution Architecture ✅ · Facade next
```
