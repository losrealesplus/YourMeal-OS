# PHONE_AUTH_AUDIT · PRODUCT-001

**Project:** `djangucecsphnejplvic`  
**Rule:** No invented OTP. Document before implementing.

## Question

Does YourMeal OS support Phone OTP, Phone+Password, or only UI?

## Evidence

### Supabase Auth settings (`GET /auth/v1/settings`)

| Flag | Value |
|------|-------|
| `external.email` | `true` |
| `external.phone` | **`false`** |
| `phone_autoconfirm` | `false` |
| `sms_provider` | `twilio` (named, but phone provider not enabled) |
| Google / Apple | `false` |

### Live API probe

```
signInWithOtp({ phone: '+34600000000' })
→ 400 Unsupported phone provider
```

Snapshot: `docs/10-validation/evidence/product-001/auth-api-probe.json`

### Application code

| Piece | Status |
|-------|--------|
| `signInWithOtpPhone` / `verifyOtpSms` in `src/auth/credentials.ts` | Present (Phone **OTP** API shape — not phone+password) |
| `PhoneForm` in `src/routes/auth.tsx` | Present |
| SMS / Twilio secrets in app | None |
| Phone+password signup | **Not implemented** |

## Verdict

**Hypothesis #3 confirmed:** the phone tab was a product UI over an unsupported Auth provider.

Supported model **if/when enabled:** **Phone OTP (SMS)**, not phone+password.

Current state: **not product-ready**. No SMS delivery path is configured on the official project.

## Product decision (this epic)

- Do **not** invent OTP or mock codes.
- Gate UI with `VITE_AUTH_PHONE_ENABLED` (default **`false`**).
- Keep credential helpers in `src/auth` for a future enablement.
- Document reactivation steps below.

## Reactivation checklist (future — out of PRODUCT-001 implementation)

1. Supabase Dashboard → Authentication → Providers → **Phone** ON.  
2. Configure SMS provider (Twilio credentials) until `signInWithOtp` succeeds.  
3. Add redirect / rate-limit / test numbers as required by provider.  
4. Set `VITE_AUTH_PHONE_ENABLED=true` in `.env` / Lovable env and rebuild.  
5. Re-run probes: send OTP → verify → session → `resolveHomePath`.  
6. Update this audit with PASS evidence.

## Success criteria

- [x] Phone support fully validated (documented: **unsupported**)  
- [x] UI no longer exposes a broken phone path by default  
- [x] No fake OTP implementation  
