# EMAIL_SIGNUP_VALIDATION · PRODUCT-001

**Project:** `djangucecsphnejplvic`  
**Scope:** Customer email/password registration (no OAuth, no SQL user creation)

## Flow under test

```
UI (/auth · Crear cuenta)
  → signUp() @ src/auth/credentials.ts
  → Supabase Auth Signup
  → Confirm Email (mailer_autoconfirm=false)
  → handle_new_user → profiles
  → (membership/roles: customer path; not staff)
  → Login / home via /auth/callback?next=/auth
```

## Audit findings (evidence-first)

| Step | Status | Evidence |
|------|--------|----------|
| UI wired to API | **PASS** | `EmailForm` → `signUp({ email, password, fullName })` |
| Signup enabled | **PASS** | Auth settings `disable_signup=false`, `external.email=true` |
| Email confirmation required | **PASS** | `mailer_autoconfirm=false` — no session until confirm |
| Profile auto-create | **PASS** | Trigger `on_auth_user_created` → `handle_new_user()` (migrations) |
| Weak password rejected | **PASS** | API: `Password should be at least 6 characters.` (422) |
| Duplicate email UX | **FIXED** | Empty `identities[]` → toast `emailAlreadyRegistered` |
| Confirm `emailRedirectTo` | **FIXED** | Was origin `/` without PKCE exchange → now `/auth/callback?next=/auth` |
| Manual profile creation | **N/A** | Forbidden; trigger only |

Probe snapshot: `docs/10-validation/evidence/product-001/auth-api-probe.json`

> Note: repeated signup probes may hit `email rate limit exceeded`. That is Auth rate limiting, not a product wiring failure.

## Validations (UI)

| Case | Expected |
|------|----------|
| Empty email/password | Browser `required` |
| Password &lt; 6 | Toast `passwordTooWeak` (client) + API 422 |
| New email | Toast `checkEmail`; mode returns to sign-in |
| Existing email (silent) | Toast `emailAlreadyRegistered` |
| Loading | Submit button `disabled` while busy; `finally` clears busy |
| After confirm link | `/auth/callback` exchanges `code` → `/auth` → user signs in |

## Membership / RBAC

- Public signup creates an Auth user + profile.
- Staff roles are **not** granted on signup.
- Customer home after login: `resolveHomePath` → typically `/app`.
- Employees cannot self-elevate via this form (see Identity Product Report · employee flow).

## Operator checklist (Dashboard)

1. Authentication → Providers → **Email** enabled.
2. Confirm email template active; SMTP or default mailer delivering.
3. Redirect URL allowlist includes:
   - `https://<prod>/auth/callback`
   - `http://localhost:5173/auth/callback` (dev)
4. Do **not** enable `mailer_autoconfirm` for production EatClean unless product explicitly changes policy.

## Success criteria

- [x] Create account path uses official `signUp` architecture  
- [x] Confirm redirect goes through PKCE callback  
- [x] Weak / duplicate feedback present  
- [x] No infinite loading on submit  
- [ ] End-to-end confirm click in a real inbox (operator — rate limit / SMTP)  
