# PRODUCT-CORE-FOUNDATION-001 · Validation

**Track:** Product Core Foundation  
**Date:** 2026-08-06  
**Commit on `main`:** `f0cdb17` (+ ReadyContext `.tsx` fix in this PR)  
**Status:** **ENGINEERING VALIDATED** · Field smoke (OPPO) → operator handoff

---

## Declaration

```text
Product Core Foundation
──────────────────────────────────────
Architecture              ✅ ADR 0050
Bootstrap Pipeline        ✅
Bootstrap Orchestrator    ✅ ADR 0051
Ownership                 ✅ ADR 0052
Application Ready Gate    ✅ ADR 0053
Lifecycle                 ✅
──────────────────────────────────────
Engineering Validation    ✅ THIS ACTA
Field Smoke (OPPO)        ⏳ Operator (checklist below)
```

A foundation is not declared stable by opinion. It is demonstrated.

---

## Landed stack (on `main`)

| PR | Title | Result |
|----|-------|--------|
| #309 | Bootstrap Architecture | Merged → `main` |
| #310 | Bootstrap Orchestrator | Commits on `main` (stack tip) |
| #311 | Stage Ownership | Commits on `main` |
| #312 | Application Ready Gate | Commits on `main` |

---

## Evidence matrix (cloud agent · 2026-08-06)

| Step | Command / action | Result |
|------|------------------|--------|
| 1 | `export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64` | Required (doctor:env) |
| 2 | `npm run doctor:env` | ✅ Ready (optional PostHog/AppName missing = WARNING) |
| 3 | `npm run doctor` | ✅ **PASS** · 62/62 checks |
| 4 | `npx vitest run src/bootstrap/` | ✅ **23/23** tests |
| 5 | `npm run build` | ✅ Web build |
| 6 | `npm run build:mobile` | ✅ Capacitor SPA |
| 7 | `npx cap sync android` | ✅ |
| 8 | `./gradlew assembleDebug` | ✅ **APK built** |
| 9 | Install OPPO + smoke | ⏳ **Local operator** |

### Validation bugfix (found by build)

`ReadyContext.ts` contained JSX → renamed to `ReadyContext.tsx`. Web build failed until fixed; re-validated green.

### APK

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

(ADB: no device in cloud — expected.)

---

## OPPO Smoke Checklist (operator)

Execute on device after installing the debug APK:

1. Cold launch → no crash  
2. Auth / landing paints (AUTH_REQUIRED path)  
3. Login (EatClean real account)  
4. Workspace enters only after Ready (no empty tenant flash)  
5. Admin + customer shells open  
6. Sign out → returns to auth  
7. Note any Doctor / Runtime evidence if used  

Record results in this file or a follow-up acta under `docs/10-validation/`.

When OPPO smoke PASSes, append:

```text
Field Smoke (OPPO)        ✅
Foundation                STABLE (full)
```

Until then, **engineering foundation is validated**; EatClean feature work may start with awareness that field smoke is the final confidence gate.

---

## Roadmap shift (authorized after this acta)

```text
FASE 0
  Developer Platform v1.0     ████ 100%
  Product Core Foundation     ████ 100% (engineering)
  Field Smoke                 ░░░░ operator
──────────────────────────────────────
NEXT FOCUS → EatClean Core
  Authentication · Users · Orders · Production
  Inventory · Kitchen · Routes · Delivery · Billing
```

Developer Platform remains the instrument of evidence — not the product roadmap.

---

## Single lifecycle answer (frozen)

```text
src/bootstrap/ready/deriveApplicationReady.ts
  → isApplicationReady()
```

---

## Non-goals of this PR

- No new Product Core features  
- No Developer Platform engine changes  
- No OPPO claim without device evidence  
