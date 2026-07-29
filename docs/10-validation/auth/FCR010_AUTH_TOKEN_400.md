# FCR-010 · AUTH TOKEN 400 Root Cause

**Fecha:** 2026-07-29  
**Modo:** Evidence only — no fix  

## Demonstrated request (workspace `.env`)

```http
POST https://cbeegcxkayybfncnuirg.supabase.co/auth/v1/token?grant_type=password
apikey: <VITE_SUPABASE_PUBLISHABLE_KEY>
Content-Type: application/json

{"email":"<attempt>","password":"<attempt>"}
```

Header `sb-project-ref: cbeegcxkayybfncnuirg` confirms which project answered.

## Response (observed)

```json
{"code":400,"error_code":"invalid_credentials","msg":"Invalid login credentials"}
```

Docs: https://supabase.com/docs/guides/auth/debugging/error-codes — `invalid_credentials` = “Login credentials or grant type not recognized.”

## Discriminators (same endpoint)

| Condition | HTTP | error_code |
|-----------|------|------------|
| Wrong password / unknown email on wired project | 400 | `invalid_credentials` |
| User exists, email not confirmed, correct password | 400 | `email_not_confirmed` |
| Official project URL + legacy publishable key | 401 | `Invalid API key` |

## Project alignment

| Source | Ref |
|--------|-----|
| App `.env` / client | `cbeegcxkayybfncnuirg` (legacy) |
| Docs / “official” cutover | `djangucecsphnejplvic` |
| `.env.example` | `djangucecsphnejplvic` |

App and current publishable key **match each other** on legacy. They do **not** match the documented official project. Users seen in Dashboard are only valid for the 400 analysis if that Dashboard is `cbeegcxkayybfncnuirg`.

## App payload path

`EmailForm` → `signInWithPassword({ email, password })` → `getAuthClient().auth.signInWithPassword` → GoTrue token password grant. No extra fields; no code-side mutation of credentials.
