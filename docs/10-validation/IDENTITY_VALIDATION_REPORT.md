# OPERATIONAL-001 · Identity Validation Report

**Track:** OPERATIONAL-001 · Phase 3  
**Date:** 2026-08-06  
**ADR:** [0057 — Identity Validation](../adr/0057-identity-validation.md)  
**Status:** **ENGINEERING CERTIFIED** · Field smoke (OPPO) → operator handoff

---

## Declaration

```text
Identity Capability
──────────────────────────────────────
Architecture (ADR 0055)     ✅
Facade (ADR 0056)           ✅
Validation matrix           ✅ ENGINEERING
Field smoke (OPPO)          ⏳ Operator checklist
──────────────────────────────────────
Operational Modules may begin after this engineering certification.
Field smoke remains recommended before production EatClean cutover.
```

Identity is certified for **engineering use by Operational Modules**.  
We do **not** invent a device PASS.

---

## Validation matrix

| ID | Case | Expected | Observed | Evidence | Verdict |
|----|------|----------|----------|----------|---------|
| V01 | Unauthenticated user | anonymous · AUTH_REQUIRED | state=anonymous · AUTH_REQUIRED | `composeIdentity` | **PASS** |
| V02 | Authenticated user | operational_ready · tenant bound | ok · tenant=t1 | `composeIdentity(authed)` | **PASS** |
| V03 | Session restoration | Restore from BootstrapIdentityStore | tenant+roles from snapshot | store + Facade | **PASS** |
| V04 | Tenant resolution | ActiveTenant + membership.tenantId | slug=eatclean · tenantId=t1 | compose | **PASS** |
| V05 | Workspace resolution | homePath → surface | /admin→admin · /saas→saas · /app→app · /driver→driver | compose | **PASS** |
| V06 | Permission loading | roles → capabilities | kitchen → kitchen.operate | `capabilitiesFor` | **PASS** |
| V07 | Branding resolution | provenance + tenantSlug | static · eatclean | compose + brandConfig | **PASS** |
| V08 | Locale loading | profile.locale | es | compose | **PASS** |
| V09 | Feature Flags | Snapshot bag on context | bag present · 0 keys | Contract only; live eval deferred | **WARNING** |
| V10 | Membership | membership context · membershipId | status=approved · membershipId=null | ADR 0019 field pending wire | **WARNING** |
| V11 | Logout | anonymous after clear | anonymous · no session | clear store + compose | **PASS** |
| V12 | Expired Session | absent session ≡ anonymous | anonymous · !ok | compositional; JWT field smoke | **PASS** |
| V13 | Bootstrap interaction | Facade consumes store · Bootstrap owns load | surface=app · tenant bound | Facade ← store | **PASS** |
| V14 | Ready Gate interaction | identity ready ⇒ App Ready | AUTH_REQUIRED → isReady | `deriveApplicationReadySnapshot` | **PASS** |
| V15 | Developer Platform | identity:* events observe-only | identity:operational_ready emitted | IdentityEvents | **PASS** |
| V16 | Doctor interaction | No Doctor contract change | observe-only certified | ADR 0055/0056 | **PASS** |

**Summary:** PASS **14** · WARNING **2** · FAIL **0**

Automated runner: `src/identity/identity-validation.spec.ts` (17 tests green).

---

## WARNING backlog (non-blocking for module start)

| Item | Follow-up |
|------|-----------|
| V09 Feature flags empty | Wire FeatureFlagService into compose when first module needs flags |
| V10 membershipId null | Expose `tenant_members.id` from SessionBootstrapService |

These do **not** block OPERATIONAL-002 Customers architecture — they must be closed before modules that audit by `membershipId` or evaluate flags at identity layer.

---

## Smoke checklist (operator · OPPO / web)

| # | Step | Pass? |
|---|------|-------|
| S1 | Cold launch unauthenticated → auth/landing | ☐ |
| S2 | Login EatClean → workspace after Ready | ☐ |
| S3 | Kill app · restore session → same tenant/workspace | ☐ |
| S4 | Admin vs customer homePath correct | ☐ |
| S5 | Permissions: staff sees admin surfaces | ☐ |
| S6 | Branding / locale visible on shell | ☐ |
| S7 | Logout → anonymous | ☐ |
| S8 | Optional: force token expiry → re-auth | ☐ |

When S1–S7 PASS, append to this acta:

```text
Field smoke (OPPO)   ✅
Identity             FULLY CERTIFIED
```

---

## Rule unlocked

Operational Modules **may begin** (Observe → Design → Freeze…) after this engineering certification.

Still recommended: complete OPPO smoke before EatClean production cutover.

---

## Non-goals (honored)

- No feature work  
- No Product Module implementation  
- No Provider / routing refactors  
- No Doctor engine changes  
