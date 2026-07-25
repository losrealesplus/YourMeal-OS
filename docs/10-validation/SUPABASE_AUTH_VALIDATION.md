# INFRA-003 · Fase 2 — SUPABASE_AUTH_VALIDATION

**Tipo:** Evidencia de configuración Auth  
**Fecha:** 2026-07-25  
**Epic:** INFRA-003  
**Regla:** No inventar configuraciones. Solo lo verificado o marcado UNVERIFIED.

---

## 1. Método de validación

| Canal | Resultado |
|-------|-----------|
| Supabase MCP | `needsAuth` — no usable en este entorno |
| Supabase CLI | No instalado (`supabase: command not found`) |
| `SUPABASE_ACCESS_TOKEN` | Ausente |
| Management API (providers / URL config / JWT) | No autenticada |
| Auth HTTP `GET {SUPABASE_URL}/auth/v1/settings` + publishable key | **OK** para el proyecto apuntado por `.env` |

Endpoint usado (documentado por GoTrue; expone flags públicos de providers):

```http
GET /auth/v1/settings
apikey: <publishable>
Authorization: Bearer <publishable>
```

---

## 2. Proyectos bajo análisis

| Ref | URL | Rol | Settings API |
|-----|-----|-----|--------------|
| `cbeegcxkayybfncnuirg` | `https://cbeegcxkayybfncnuirg.supabase.co` | Legacy (aún en `.env` de `main`) | **Validado** 200 + JSON |
| `djangucecsphnejplvic` | `https://djangucecsphnejplvic.supabase.co` | Oficial post-bootstrap | **No validado** — publishable del `.env` actual es del legacy → `401 Invalid API key` |

> Hasta INFRA-002 cutover + publishable del proyecto oficial, **no** se puede afirmar el estado de providers/URL config del proyecto oficial desde este agente.

---

## 3. Providers (proyecto legacy — evidencia)

Respuesta `external` (2026-07-25):

| Provider | Flag | Estado |
|----------|------|--------|
| Google | `external.google` | **true** (habilitado) |
| Apple | `external.apple` | **true** (habilitado) |
| Azure / Microsoft | `external.azure` | **false** |
| Email | `external.email` | **true** |
| Phone | `external.phone` | **false** |
| Anonymous | `external.anonymous_users` | **false** |
| Otros sociales (GitHub, etc.) | — | **false** |

Otros flags públicos:

| Setting | Valor observado |
|---------|-----------------|
| `disable_signup` | `false` |
| `mailer_autoconfirm` | `false` |
| `phone_autoconfirm` | `false` |
| `sms_provider` | `"twilio"` |
| `saml_enabled` | `false` |
| `passkeys_enabled` | `false` |

### Implicaciones para la app

- UI Google/Apple: providers **existen en legacy**; el fallo local es el broker Lovable, no la ausencia de Google/Apple en GoTrue legacy.
- UI Phone OTP: el código llama `signInWithOtp({ phone })` pero **`external.phone: false`** en legacy → OTP SMS fallará hasta habilitar Phone en el proyecto destino.
- Microsoft: no en UI; `azure: false` — no activar en código de UI.

### Proyecto oficial `djangucecsphnejplvic`

| Check | Estado |
|-------|--------|
| Google | **UNVERIFIED** — operador debe confirmar en Dashboard → Authentication → Providers |
| Apple | **UNVERIFIED** |
| Magic Link / Email | **UNVERIFIED** (email flag + SMTP/templates) |
| Phone | **UNVERIFIED** |
| Client IDs / secrets OAuth | **UNVERIFIED** (no visibles vía `/settings`) |

---

## 4. URL Configuration

| Check | Cómo validar | Estado |
|-------|--------------|--------|
| Site URL | Dashboard → Authentication → URL Configuration | **UNVERIFIED** (requiere Management API o UI) |
| Redirect URLs | Misma pantalla | **UNVERIFIED** |

### Redirects que el código **pide** (derivados del router / UI)

Tras INFRA-003 el cliente usará:

| Flujo | `redirectTo` / destino |
|-------|------------------------|
| OAuth (Google/Apple) | `{origin}/auth/callback` |
| Email signup confirm | `{origin}` (existente) |
| Password reset | `{origin}/reset-password` |
| Post-callback home | `/app`, `/admin`, … vía `resolveHomePath` |

**Operador debe allowlist** (por entorno):

```text
http://localhost:<port>/auth/callback
http://127.0.0.1:<port>/auth/callback
https://<lovable-preview-host>/auth/callback
https://<production-host>/auth/callback
https://eatcleanapp.lovable.app/auth/callback   # si sigue siendo host publicado
```

También conservar origins usados hoy (`/`, `/reset-password`) si siguen en flujos email.

Site URL recomendada: URL canónica de producción del tenant / Lovable publish (hoy el código SEO referencia `https://eatcleanapp.lovable.app`).

---

## 5. JWT / PKCE / Session lifetime

| Check | Evidencia disponible | Estado |
|-------|----------------------|--------|
| JWT expiry (access token) | No expuesto en `/auth/v1/settings` | **UNVERIFIED** — default Supabase suele ser ~3600s; confirmar en Dashboard → Auth → JWT |
| Refresh token rotation / reuse | Idem | **UNVERIFIED** |
| Session lifetime | Idem | **UNVERIFIED** |
| PKCE | Cliente `@supabase/supabase-js` ^2.110 — PKCE es el flow por defecto en v2 modernos; `client.ts` **no** fuerza `flowType` | **Assumed default PKCE** (código); confirmar en Auth settings si hay override |
| `detectSessionInUrl` | Default SDK `true`; no override en `client.ts` | **Default ON** |
| `persistSession` | `true` + `localStorage` (browser) | **Verified in code** |
| `autoRefreshToken` | `true` (browser) | **Verified in code** |

Health endpoint `GET /auth/v1/health` con publishable → **401** (no usado como señal de misconfig).

---

## 6. Checklist operador (proyecto oficial)

Completar en [Dashboard](https://supabase.com/dashboard/project/djangucecsphnejplvic/auth/providers) y URL Configuration:

```text
□ Google provider ON + Client ID/Secret correctos
□ Apple provider ON + config correcta (si se ofrece en UI)
□ Email provider ON (password + magic link según producto)
□ Phone ON solo si se mantiene la pestaña SMS en /auth
□ Site URL = host de producción
□ Redirect URLs incluyen /auth/callback (local + preview + prod)
□ Redirect URLs incluyen /reset-password
□ JWT expiry / refresh policy revisados (defaults aceptables)
□ Probar authorize URL: /auth/v1/authorize?provider=google (tras cutover de keys)
```

Pegar evidencia (screenshot o export) en `docs/10-validation/evidence/infra003/` cuando exista.

---

## 7. Riesgos de configuración

| Riesgo | Efecto |
|--------|--------|
| OAuth migrado en código pero providers OFF en oficial | Error Supabase en botón Google/Apple |
| Redirect URL no allowlisted | `redirect_uri_mismatch` / fallo post-login |
| Cutover `.env` incompleto (INFRA-002) | App sigue en legacy aunque el código sea nativo |
| Phone UI con `phone: false` | UX rota en pestaña Teléfono |
| Apple en web sin Services ID / return URL | Fallo solo Apple |

---

## 8. Criterio de salida Fase 2

| Ítem | Resultado |
|------|-----------|
| Providers legacy inventariados con evidencia HTTP | PASS |
| Proyecto oficial validado end-to-end | **FAIL / UNVERIFIED** — bloqueado por keys |
| URL/JWT/PKCE dashboard | Documentados como UNVERIFIED + checklist operador |
| Código client session options | Verificados |

**Gate para cerrar INFRA-003 en producción:** operador completa §6 en `djangucecsphnejplvic` **y** INFRA-002 cutover de publishable keys.

**Siguiente:** Fase 3+ — capa `src/auth/` + OAuth nativo (código).
