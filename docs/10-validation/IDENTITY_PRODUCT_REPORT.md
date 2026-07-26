# IDENTITY_PRODUCT_REPORT · PRODUCT-001

**Epic:** Identity Flows Validation  
**Status after this PR:** Product gaps closed for email signup + password recovery; phone documented and gated; employee invite-only confirmed.

## Phase 1 · Audit summary

Chain reviewed:

```
UI → TanStack Router → src/auth → Supabase Auth → Profiles → Membership → RBAC → Home
```

| Flow | Pre-fix failure point | Post-fix |
|------|-------------------------|-----------|
| Email signup | Confirm redirect skipped PKCE; weak duplicate UX | `emailRedirectTo` → `/auth/callback?next=/auth`; duplicate/weak toasts |
| Password reset | `redirectTo=/reset-password` without `exchangeCodeForSession`; callback ignored `next` | Callback + `next=/reset-password`; reset page session gate |
| Phone | Provider OFF; UI still offered OTP | Documented; `VITE_AUTH_PHONE_ENABLED=false` hides tab |

**Hypotheses:**

1. Signup API without UI — **rejected** (UI was wired).  
2. Reset `redirectTo` / callback — **confirmed**.  
3. Phone UI placeholder — **confirmed**.

Infrastructure / Supabase cutover / Platform Owner bootstrap were **not** reopened. No RLS, migrations, roles, or OAuth reactivation.

## Phase 2–3 · Email + recovery

See:

- `EMAIL_SIGNUP_VALIDATION.md`
- `PASSWORD_RESET_VALIDATION.md`

Code touchpoints:

- `src/auth/urls.ts` — callback helpers + allowlisted `next`
- `src/auth/callback.ts` — returns `next`
- `src/routes/auth.callback.tsx` — routes recovery / login next
- `src/routes/reset-password.tsx` — session boot + invalid link UX
- `src/routes/auth.tsx` — signup/forgot UX hardening

## Phase 4 · Phone

See `PHONE_AUTH_AUDIT.md`.

**Official support today:** email/password only on `/auth`.

## Phase 5 · Employee flow (official)

Employees **must not** self-register into staff roles via public `/auth` signup.

| Path | Official? | Mechanism |
|------|-----------|-----------|
| Public `/auth` signup | Customer only | Auth user + `handle_new_user` profile; no staff role |
| Tenant admin invite | **Yes** | `inviteTenantStaff` → `inviteUserByEmail` + `tenant_members` + `user_roles` (`admin.users`) |
| SaaS admin invite | **Yes** | `saas-admin.functions` → `inviteUserByEmail` |
| Platform Owner bootstrap | Ops only | `npm run seed:platform-owners` (OP-002) — not public |

Staff login surface: `/auth/admin` (not the customer phone/email marketing splash for privilege grant).

## Phase 6 · Customer flow

| Action | Surface | Notes |
|--------|---------|-------|
| Signup | `/auth` | Confirm email required |
| Login | `/auth` | `signInWithPassword` → `resolveHomePath` |
| Logout | App session / `signOut` | Unchanged |
| Reset | Forgot → email → callback → `/reset-password` → `/auth` | Fixed PKCE |
| Persistence | Supabase client localStorage | Unchanged |

## Phase 7 · UX states

| State | Behavior |
|-------|----------|
| Loading submit | Buttons disabled; `finally` clears busy (email, forgot, phone, reset) |
| Recovery boot | Explicit preparing / invalid states — no infinite spinner |
| Errors | Toast + inline recovery message |
| Retry | User can resubmit; recovery offers return to sign-in |
| Offline / network | Supabase client errors surface as toast messages |
| Timeout | No custom infinite waiters added on these forms |

## Phase 8 · Evidence

| Artifact | Path |
|----------|------|
| API probe | `docs/10-validation/evidence/product-001/auth-api-probe.json` |
| Email signup | `EMAIL_SIGNUP_VALIDATION.md` |
| Password reset | `PASSWORD_RESET_VALIDATION.md` |
| Phone audit | `PHONE_AUTH_AUDIT.md` |

### Auth settings (probe)

- `email=true`, `phone=false`, OAuth social off  
- `mailer_autoconfirm=false`  
- `disable_signup=false`

## Success criteria checklist

| Criterion | Status |
|-----------|--------|
| User can create account email/password | **Ready** (confirm + SMTP operator step) |
| Can confirm email | **Ready** (callback redirect fixed) |
| Can recover password | **Ready** (PKCE + next fixed) |
| Can sign in after change | **Ready** (navigate `/auth`) |
| Phone validated | **Documented unsupported** + UI gated |
| Employees only via admin invite | **Confirmed** in code |
| Error feedback adequate | **Improved** (duplicate, weak, recovery invalid, busy) |

## Restrictions respected

- No RLS / migration / role / Platform Owner / tenant-isolation changes  
- No OAuth reactivation  
- No auth bypass / SQL user inserts  
- Identity architecture unchanged — product wiring + feature gate only  

## Operator follow-ups

1. Confirm Redirect URLs allowlist includes `/auth/callback` for prod + local.  
2. Complete one live inbox cycle for signup confirm + password reset (SMTP).  
3. Keep `VITE_AUTH_PHONE_ENABLED=false` until Phone Auth is configured.  
4. Keep `VITE_AUTH_OAUTH_SOCIAL_ENABLED=false` until providers are intentionally enabled.  
