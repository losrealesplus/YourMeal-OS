# FCR-010 · AUTH TOKEN 400 Root Cause

**Fecha:** 2026-07-29  
**Modo:** Evidence only — no fix  

## Demonstrated request (workspace `.env`)

```http
POST https://cbeegcxkayybfncnuirg.supabase.co/auth/v1/token?grant_type=password
apikey: <VITE_SUPABASE_PUBLISHABLE_KEY>
Authorization: Bearer <VITE_SUPABASE_PUBLISHABLE_KEY>
Content-Type: application/json

{"email":"<attempt>","password":"<attempt>"}
```

Header `sb-project-ref: cbeegcxkayybfncnuirg` confirms which project answered.

## Response (observed)

```json
{"code":400,"error_code":"invalid_credentials","msg":"Invalid login credentials"}
```

Docs: https://supabase.com/docs/guides/auth/debugging/error-codes — `invalid_credentials` = “Login credentials or grant type not recognized.”

## App payload path

`src/routes/auth.tsx` → `signInWithPassword({ email, password })` → `src/auth/credentials.ts` → `getAuthClient().auth.signInWithPassword(input)` → GoTrue password grant. No extra fields; credentials not mutated.

## Discriminators (same endpoint, live probe 2026-07-29)

| Condition | HTTP | error_code / body |
|-----------|------|-------------------|
| Wrong password / unknown email on wired project | 400 | `invalid_credentials` |
| User exists, email not confirmed, correct password | 400 | `email_not_confirmed` |
| Official project URL + legacy publishable key | 401 | `Invalid API key` (+ hint about other project) |

Live probe (wired `.env`):

- unknown email → HTTP 400, `sb-project-ref: cbeegcxkayybfncnuirg`, body `invalid_credentials`
- `kike2morrow@gmail.com` + wrong password → same 400 / `invalid_credentials`
- `https://djangucecsphnejplvic.supabase.co` + legacy key → HTTP 401 `Invalid API key`, `sb-project-ref: djangucecsphnejplvic`

## Project alignment

| Source | Ref |
|--------|-----|
| App `.env` / client (`SUPABASE_URL` + publishable key) | `cbeegcxkayybfncnuirg` (legacy) |
| Docs / “official” cutover | `djangucecsphnejplvic` |
| `.env.example` | `djangucecsphnejplvic` |

App URL + publishable key **match each other** on legacy (`sb-project-ref` confirms). They do **not** match the documented official project. Users seen in Dashboard are only valid for this 400 if that Dashboard is `cbeegcxkayybfncnuirg`.

## Checklist

| Check | Result |
|-------|--------|
| Usuario existe en el proyecto cableado | No demostrado para el email del intento; Dashboard oficial ≠ app |
| Email confirmado | Descartado como causa del error observado (sería `email_not_confirmed`) |
| Password válida en el proyecto cableado | Rechazada por GoTrue → `invalid_credentials` |
| Proyecto Supabase correcto vs docs | App = legacy; docs/example = official → **mismatch** |
| `SUPABASE_URL` | `https://cbeegcxkayybfncnuirg.supabase.co` — consistente con key |
| `SUPABASE_ANON` / publishable key | Coincide con legacy; cross-project → 401 |
| Mezcla entre proyectos | Sí a nivel programa (docs/example vs `.env`); no en el par URL+key de la app |
| Entorno equivocado (`.env`) | `.env` apunta a legacy; `.env.example` a official |

## Resultado FCR-010 (formato requerido)

```
HTTP Status: 400

Código de Supabase: invalid_credentials

Mensaje de Supabase: Invalid login credentials

Causa raíz demostrada:
POST /auth/v1/token?grant_type=password al proyecto cableado
cbeegcxkayybfncnuirg rechaza el grant porque el par email/password
NO es una credencial válida en ESE proyecto.
Discriminador: mismo endpoint + password correcta + email sin confirmar
→ error_code email_not_confirmed (no invalid_credentials).
Por tanto NO es “email sin confirmar”.
URL + publishable key de la app son consistentes entre sí
(sb-project-ref = cbeegcxkayybfncnuirg) pero NO son el proyecto oficial
documentado djangucecsphnejplvic. Usuarios vistos en un Dashboard
oficial no autentican contra el GoTrue de la app.

Nivel de confianza: ALTA (identidad del error + proyecto cableado + discriminador).
MEDIA-ALTA sobre cuál email exacto del operador falla por (a) usuario
solo en proyecto oficial vs (b) password incorrecta en legacy —
ambos producen el mismo error_code.

Archivos implicados:
- src/routes/auth.tsx
- src/routes/auth.admin.tsx
- src/auth/credentials.ts
- src/integrations/supabase/client.ts
- .env
- .env.example
- docs/01-foundation/SUPABASE_PROJECT.md
- docs/10-validation/auth/AUTH_E2E_INVESTIGATION.md
- docs/10-validation/auth/NETWORK_TRACE.md
- docs/10-validation/auth/FCR010_AUTH_TOKEN_400.md
```

### Qué NO es la causa (descartado)

| Hipótesis | Evidencia en contra |
|-----------|---------------------|
| Anon/publishable key inválida | Cross-project → HTTP **401** `Invalid API key` |
| Email no confirmado (password OK) | → `email_not_confirmed`, no `invalid_credentials` |
| Payload malformado | App envía `{ email, password }` strings |
| FCR-008 / Toaster | Downstream / UI-only; no cambian el 400 del token |
