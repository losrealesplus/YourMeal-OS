# PASSWORD_RESET_VALIDATION · PRODUCT-001

**Project:** `djangucecsphnejplvic`  
**Scope:** Forgot password → email link → update password → login

## Flow under test

```
Forgot Password (/auth)
  → resetPasswordForEmail()
  → Supabase mailer
  → Reset link (redirectTo)
  → /auth/callback?code=…&next=/reset-password
  → exchangeCodeForSession
  → /reset-password (recovery session)
  → updateUser({ password })
  → /auth (login)
```

## Root cause (pre-fix)

| Layer | Finding |
|-------|---------|
| Request API | **OK** — `resetPasswordForEmail` accepted valid emails |
| `redirectTo` | **BUG** — pointed at `/reset-password` directly |
| `/reset-password` page | **BUG** — called `updatePassword` without establishing PKCE session |
| `/auth/callback` | **GAP** — did not honor `?next=` (always `resolveHomePath`) |

Hypothesis #2 from the epic brief is **confirmed**.

## Fixes shipped

1. `passwordResetRedirectTo()` → `authCallbackUrl(origin, "/reset-password")`  
   → `{origin}/auth/callback?next=%2Freset-password`
2. `handleAuthCallback` returns sanitized `next`.
3. `AuthCallbackPage` navigates to `/reset-password` when `next` matches.
4. `/reset-password`:
   - bootstraps session (`code` / hash recovery defensive path)
   - shows invalid/expired link UX (no infinite spinner)
   - `try/finally` on submit
   - after success → `/auth`

## Checks

| Case | Result |
|------|--------|
| Valid email request | API accepts (`error: null`) — probe JSON |
| Invalid email format | Rejected — `Unable to validate email address` |
| `redirectTo` shape | PKCE callback + allowlisted `next` |
| Token missing / no session | UI: `recoveryLinkInvalid` + link to sign-in |
| Weak new password | Client min 6 + Supabase policy |
| Loading | Boot state + disabled submit; never stuck busy |
| Post-update login | Navigate to `/auth`; existing session may auto-route home |

## Operator Dashboard (do not assume)

Redirect allowlist **must** include:

- `https://<prod-host>/auth/callback`
- `http://localhost:5173/auth/callback`

Site URL alone is not enough if recovery lands on callback with query params — add the callback path explicitly.

Email template should use the Supabase confirmation URL (respects `redirectTo` from the API call). Do not hardcode legacy `/reset-password` as the only Site URL target without callback exchange.

## Success criteria

- [x] Request path wired  
- [x] `redirectTo` corrected for PKCE  
- [x] Update password requires recovery session  
- [x] Invalid link UX  
- [ ] Live inbox click + password change (operator — SMTP / rate limits)  
