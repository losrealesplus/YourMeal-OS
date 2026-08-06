# FIELD-VALIDATION-002 · iOS Validation Guide

**Status:** 📋 **AUDIT COMPLETE · NOT READY for field PASS**  
**Declared:** 2026-08-06  
**Prerequisite:** Android Field Validation PASS · [ANDROID_FIELD_VALIDATION_REPORT](./ANDROID_FIELD_VALIDATION_REPORT.md) · [#340](https://github.com/losrealesplus/YourMeal-OS/pull/340)  
**Companions:** [FIELD_VALIDATION_MILESTONE](./FIELD_VALIDATION_MILESTONE.md) · [OPERATIONAL_VALIDATION_SPRINT](../00-status/OPERATIONAL_VALIDATION_SPRINT.md) · [MR01_IOS_ARCHIVE_POLICY](./mobile-release/MR01_IOS_ARCHIVE_POLICY.md)

```text
══════════════════════════════════════════════
FIELD-VALIDATION-002

Objetivo

Demostrar que Operational Engine v0.8
es independiente de la plataforma.

Pregunta única

¿Estamos preparados para ejecutar
Operational Engine v0.8
en un dispositivo iOS?

Respuesta de esta auditoría

NOT READY

(Architecture READY · Operator path NOT READY)

No Delivery.
No code changes in this document.
══════════════════════════════════════════════
```

---

## 1. Final declaration

| Verdict | Scope |
|---------|--------|
| **Architecture / Hybrid Shell** | **READY** — same Core SPA, Capacitor 8.4.2, `ios/` project, C4/C5 certified |
| **Operator field run (physical iPhone)** | **NOT READY** — signing team, Preferences SPM link, fresh sync, and Mac/Xcode path incomplete |

```text
READY TO PLAN THE FIELD SESSION   ✅
READY TO INSTALL ON IPHONE TODAY  ❌
```

Do **not** declare Engine v0.8 **FIELD VALIDATED** until iPhone PASS matches Android PASS.

---

## 2. Official checklist

| Área | Estado | Evidencia | Acción |
| ---- | ------ | --------- | ------ |
| Capacitor iOS | ✅ READY | `capacitor.config.ts` · `ios/App` · `@capacitor/ios` ^8.4.2 · CAPACITOR-004 C4 | `npm run sync:mobile` then `npm run cap:open:ios` on macOS |
| Xcode Signing | ❌ NOT READY | `CODE_SIGN_STYLE=Automatic` · **no `DEVELOPMENT_TEAM`** · archive evidence `contract_ready_pending_macos` | Set Apple Team in Xcode · create shared scheme `App` · Archive |
| Safe Areas | ⚠️ PARTIAL | CSS `env(safe-area-inset-bottom)` in shells · **no `viewport-fit=cover`** | Field-observe notch first; fix only if UX blocked |
| Keyboard | ⚠️ PARTIAL | No `@capacitor/keyboard` | Field-observe; add plugin only if forms obscured |
| Splash | ✅ READY | `LaunchScreen.storyboard` + Splash assets | Visual check on device |
| Status Bar | ⚠️ PARTIAL | Plist `UIViewControllerBasedStatusBarAppearance` · no StatusBar plugin | Field-observe |
| Supabase Auth | ⚠️ PARTIAL | Same client as Android · session via Preferences bridge | Prefer **email/password** first (parity with OPPO); OAuth later |
| Preferences | ❌ NOT READY | JS adapter READY · Android Gradle linked · **iOS `CapApp-SPM` has Capacitor+Cordova only — no Preferences product** | `npx cap sync ios` and verify SPM includes Preferences before field auth smoke |
| Routing | ✅ READY | TanStack path history · `#340` context fix on `main` · no `server.url` | Confirm post-login surface loads (same contract as Android) |
| Deep Links | ❌ NOT READY | No `CFBundleURLTypes` · no Associated Domains · AppDelegate hooks unused · docs out-of-scope | Out of scope for first iPhone PASS (same as Android first session) |
| Networking | ✅ READY | Default ATS · HTTPS Supabase | Confirm env points to HTTPS project |
| Build | ⚠️ PARTIAL | Scripts `build:mobile` / `cap:sync` / `cap:open:ios` READY · no live `.xcarchive`/IPA in evidence | Produce Debug install on device from Mac |
| Runtime Doctor | ⚠️ PARTIAL | Declares `ios` platform · **no iOS-specific checks** · CLI focuses Android | Use log + Runtime Overlay; do not depend on Doctor for iOS gate |

**Legend:** ✅ READY · ⚠️ PARTIAL (field-observable, not a hard stop if mitigated) · ❌ NOT READY (must clear before claiming PASS)

---

## 3. Risks (probability × impact)

| # | Risk | P | Impact | Why | Mitigation for first PASS |
|---|------|---|--------|-----|---------------------------|
| R1 | Preferences not linked in iOS SPM → session not persisted / cold start fails | **High** | **Critical** | Android PASS depended on Preferences; iOS Package.swift lacks Preferences product | Sync iOS; verify plugin; retest getSession after kill-app |
| R2 | No DEVELOPMENT_TEAM / no shared scheme → cannot install | **High** | **Critical** | pbxproj Automatic without team; no `xcshareddata/xcschemes` | Open Xcode once · set Team · share scheme `App` |
| R3 | Stale `ios/App/App/public` web assets | **Medium** | **High** | public often gitignored; field build must ship `#340`+Engine | Always `npm run sync:mobile` before open/archive |
| R4 | OAuth / `capacitor://localhost` origin not allowlisted | **Medium** | **High** (if OAuth used) | `oauthRedirectTo()` uses `window.location.origin` | **Do not use OAuth** on first iPhone session |
| R5 | Safe-area / keyboard obscure Ops UI | **Medium** | **Medium** | No viewport-fit / Keyboard plugin | Record UX notes; do not block Engine PASS unless unusable |
| R6 | Doctor gives false confidence on iOS | **Low** | **Medium** | No iOS check suite | Treat Doctor as observe-only on iOS |
| R7 | Deep Links / Universal Links | **Low** (out of scope) | **High** if required | No schemes/entitlements | Explicitly out of scope for FIELD-VALIDATION-002 PASS |

---

## 4. Capacitor & Xcode dependencies

### Capacitor

| Item | Value |
|------|--------|
| Core / CLI / iOS | `^8.4.2` |
| Preferences (JS) | `@capacitor/preferences` `^8.0.1` |
| Config | `appId: com.yourmealos.eatclean` · `webDir: .output/public` |
| iOS deploy target | **15.0** (pbxproj + CapApp-SPM) |
| Package manager | **SPM** (no Podfile for Cap core) |

### Operator machine (required)

| Requirement | Notes |
|-------------|--------|
| macOS | Xcode only runs on Mac |
| Xcode (current stable) | Open `ios/App/App.xcodeproj` via `npm run cap:open:ios` |
| Apple Developer account | Personal or org Team |
| Physical iPhone | USB trust · Developer Mode if required by iOS version |
| CocoaPods | Not required for Cap 8 SPM core; only if future Cordova pods appear |

### Repo scripts

```text
npm run doctor:env
npm run doctor
npm run build:mobile          # CAPACITOR_BUILD=1 → .output/public
npm run sync:mobile           # build + cap sync
npm run cap:open:ios          # opens Xcode (macOS)
```

Archive recipe (Release): see [MR01_IOS_ARCHIVE_POLICY](./mobile-release/MR01_IOS_ARCHIVE_POLICY.md).

---

## 5. Signing & deploy requirements

| Step | Required | In Git? |
|------|----------|---------|
| Apple Team ID in Xcode target | **Yes** | No secrets — set locally |
| Automatic signing | Yes (already) | Style only |
| Shared scheme `App` | **Yes** for CLI archive | Should be committed once created |
| Distribution cert / `.p8` / profiles | For TestFlight later | **Never** in Git |
| First field install | **Debug → device** sufficient | Prefer Debug over TestFlight for FV-002 |
| TestFlight / App Store | **Out of scope** for first PASS | Same discipline as Android APK-first |

```text
Minimum path for FIELD-VALIDATION-002

macOS
  → sync:mobile
  → cap sync ios (confirm Preferences in SPM)
  → Xcode: Team + scheme
  → Run on physical iPhone (Debug)
  → Email/password login
  → Post-login authenticated surface
  → Log row in FIELD_VALIDATION_LOG
```

---

## 6. Compatibility notes (by area)

### Safe Areas

- Shells already use `pb-[env(safe-area-inset-bottom)]`.
- Root viewport meta lacks `viewport-fit=cover` → insets may be `0` until fixed.
- **Field rule:** photograph notch/home indicator; only open a fix PR if Ops UI is clipped.

### Keyboard

- No Capacitor Keyboard plugin.
- **Field rule:** open login + a form-heavy admin screen; note overlap.

### Preferences

- Critical for parity with Android PASS (“Token recovered from Preferences”).
- **Gate:** before claiming iOS PASS, kill app and confirm session restores.

### Supabase Auth

- Same FCR-008 / `#340` contract as Android.
- **In scope:** password (and OTP if enabled).
- **Out of scope for first PASS:** Google/Apple OAuth, email deep-link recovery unless manually verified.

### Routing

- `#340` must be in the bundled web assets (`return { user }` on `/_authenticated`).
- Expect **no** “This page didn't load” after login if sync is fresh.

### Runtime Doctor

- Useful on device for overlay/trace only.
- **Not** a substitute for the field checklist below.

---

## 7. Field session checklist (execute on iPhone)

Copy into [FIELD_VALIDATION_LOG](./FIELD_VALIDATION_LOG.md) after the run.

| # | Check | Pass? |
|---|--------|-------|
| 1 | Build installed from Mac (Debug) | ☐ |
| 2 | Capacitor WebView boots | ☐ |
| 3 | Preferences session restores after kill (or fresh login persists) | ☐ |
| 4 | Supabase session valid | ☐ |
| 5 | Runtime Root renders | ☐ |
| 6 | Post Login Pipeline → authenticated surface (no ErrorComponent) | ☐ |
| 7 | At least one Ops / Customer path usable | ☐ |
| 8 | Safe area / keyboard notes recorded | ☐ |

**PASS definition:** checks 1–7 ✅ · same spirit as Android report.

---

## 8. Cross-platform method (roadmap addition)

```text
Observe
  → Design
  → Freeze
  → Facade
  → Engineering Certification
  → Capability Demo
  → Field Validation          ← Android PASS (OPPO)
  → Cross-Platform Validation ← FIELD-VALIDATION-002 (this doc)
  → Production
```

Android alone does **not** prove platform independence.  
Android + iPhone PASS does.

---

## 9. Explicit non-goals

- No Delivery / FLOW-002
- No Billing
- No new Capabilities
- No Foundation Laws
- No code changes as part of this audit document
- No requirement to solve OAuth/Deep Links for first iPhone PASS

---

## 10. When to flip the board

After iPhone field PASS:

```text
Operational Engine v0.8

FIELD VALIDATED
(Android + iOS)
```

Only then reopen Delivery under the same Evidence → Hypothesis → Minimal Fix discipline.

---

## Evidence index (this audit)

| Source | Path |
|--------|------|
| Capacitor config | `capacitor.config.ts` |
| iOS SPM | `ios/App/CapApp-SPM/Package.swift` |
| AppDelegate | `ios/App/App/AppDelegate.swift` |
| Info.plist | `ios/App/App/Info.plist` |
| Preferences JS | `src/platform/storage-provider/capacitor-adapter.ts` |
| Android Preferences link | `android/app/src/main/assets/capacitor.plugins.json` |
| Auth URLs / OAuth | `src/auth/urls.ts` · `src/auth/oauth.ts` |
| Safe area CSS | `src/components/admin-shell.tsx` · `mobile-shell.tsx` |
| iOS archive policy | `docs/10-validation/mobile-release/MR01_IOS_ARCHIVE_POLICY.md` |
| Android PASS | `docs/10-validation/ANDROID_FIELD_VALIDATION_REPORT.md` |
