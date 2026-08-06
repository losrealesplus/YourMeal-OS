# Android Field Validation Report

**Status:** ✅ **PASS**  
**Date:** 2026-08-06  
**Device:** OPPO (physical)  
**Milestone:** [FIELD_VALIDATION_MILESTONE](./FIELD_VALIDATION_MILESTONE.md)  
**Engine:** Operational Engine v0.8  
**Era:** Validation (Construction complete)

---

## Verdict

```text
First successful end-to-end execution
of the Operational Engine
on a physical Android device.
```

Capacitor, Preferences, Supabase Auth, Bootstrap, Ready Gate, Identity, and Product Core routes reached a usable operational surface after login.

---

## Build evidence

| Item | Value |
|------|--------|
| Platform | Android (Capacitor WebView) |
| Device | OPPO |
| Branch / base | `main` |
| Engine land | Merge #339 · Operational Engine v0.8 stack |
| Context fix | Merge #340 · `6c4e74d` (`e75d5c1` fix commit) |
| Validation method | Field session + logcat + architectural hypothesis |

> Record exact APK filename / versionCode locally when assembling; the decisive evidence for this report is the **PASS session after #340**.

---

## Checklist (field)

| # | Check | Result |
|---|--------|--------|
| 1 | Capacitor boots | ✅ |
| 2 | Token recovered from Preferences | ✅ |
| 3 | Supabase returns valid session | ✅ |
| 4 | Runtime Root renders | ✅ |
| 5 | Post Login Pipeline completes | ✅ |
| 6 | First authenticated screen loads (no ErrorComponent) | ✅ (after #340) |
| 7 | Operational path usable on device | ✅ |

---

## Bug found (pre-fix)

| Field | Detail |
|-------|--------|
| Symptom | UI: **"This page didn't load"** immediately after Post Login Pipeline |
| Surface | Root TanStack `errorComponent` (`src/routes/__root.tsx`) |
| Not the cause | Capacitor · Preferences · Supabase session · Bootstrap · Identity · Ready Gate |

### Failure chain

```text
Authentication OK
        │
        ▼
requireAuthenticatedUser()  →  { user } obtained
        │
        ▼
/_authenticated beforeLoad
        │
        ├── awaited requireAuthenticatedUser()
        └── DID NOT return { user }
                │
                ▼
context.user === undefined
                │
                ▼
/admin | /saas | /driver beforeLoad
                │
                ▼
throw new Error("Missing auth context")
                │
                ▼
Root ErrorComponent → "This page didn't load"
```

### Root cause

**Broken route-context contract** between `/_authenticated` and staff child layouts.

TanStack Router only merges values **returned** from parent `beforeLoad` into child `context`. The parent obtained `user` and discarded it.

### Correction

| Item | Value |
|------|--------|
| PR | [#340](https://github.com/losrealesplus/YourMeal-OS/pull/340) |
| Change | `return { user }` from `/_authenticated` `beforeLoad` |
| Scope | Minimal — no Bootstrap / Identity / Providers / Navigation / Ready Gate / HomePath changes |
| Regression | `src/auth/authenticated-route-context.spec.ts` |

---

## Method validated (FOPEBA)

```text
Evidence
  → Hypothesis
  → Validation
  → Minimal Fix
  → Regression Tests
  → Field Validation PASS
```

Architectural layers held. Only the inter-layer contract was repaired.

---

## What this validates on device

| Layer | Field status |
|-------|----------------|
| Developer Platform | ✅ exercised |
| Foundation | ✅ exercised |
| Bootstrap Pipeline | ✅ |
| Ready Gate | ✅ |
| Identity Capability | ✅ |
| Customer / Orders / Production / Kitchen surfaces | ✅ reachable post-login |
| FLOW-001 path (engine stack) | ✅ engine usable on Android |
| Operational Engine v0.8 | ✅ **Android field PASS** |

---

## Explicitly not declared yet

| Item | Status |
|------|--------|
| iPhone Field Validation | ⏳ pending · FIELD-VALIDATION-002 |
| Operational Engine **FIELD VALIDATED** (both platforms) | 🔒 after iOS PASS |
| Delivery / FLOW-002 | 🔒 locked |

---

## Next

```text
FIELD-VALIDATION-002 · iPhone Validation

Same question, second platform:
¿El Operational Engine funciona igual en iOS?

Then — and only then — declare Engine v0.8 FIELD VALIDATED
and open Delivery under the same discipline.
```
