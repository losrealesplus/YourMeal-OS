# FCR-009 · End-to-End Authentication Investigation

**Documento:** `AUTH_E2E_INVESTIGATION.md`  
**Fecha:** 2026-07-29  
**Modo:** Investigation only — **NO FIX implementado**  
**Rama:** `cursor/fcr008-canonical-post-login-session-f54a` (PR #102)  
**Pre-check:** PR #100 MERGED · #101 CLOSED · #102 OPEN · FCR-002 intacto · sin `getSession` post-login · pipeline canónico vigente

---

## Síntoma reportado

- Permanece en `/auth` tras «Iniciar sesión».
- No navega a Ops ni Customer Portal.
- «No crea usuarios nuevos» (percepción de registro).
- En Dashboard Auth existen usuarios Email (`alex1409…`, `alexhdezmtinez…`).
- Intento observado en UI: `kike2morrow@gmail.com`.

---

## Pregunta crítica

> ¿Se llama realmente a `supabase.auth.signInWithPassword()`?

**Respuesta (código + API):** el wiring del formulario **sí** llama a `signInWithPassword` / `signUp` vía `@/auth`.  
**Respuesta (navegador del operador):** pendiente confirmación Network (`/auth/v1/token`) — ver [NETWORK_TRACE](./NETWORK_TRACE.md).

---

## Mapa E2E (pasos A→M)

| Paso | Escenario | Estado | Evidencia | Archivo |
|------|-----------|--------|-----------|---------|
| A | Button → `onSubmit` / `submit()` | **PASS** (código) | `<form onSubmit={submit}>`; botón sin `type` → default HTML `submit` | `src/routes/auth.tsx` |
| B | Llega a `signInWithPassword()` | **PASS** (código) | `await signInWithPassword({ email, password })` en rama signin | `auth.tsx` · `credentials.ts` |
| C | HTTP `/auth/v1/token` | **PASS** (API probe) · **PENDING** (browser UI) | curl token → HTTP 400 `invalid_credentials` | [evidence/](./evidence/) · Network humano |
| D | Supabase responde | **PASS** (API) | `error_code: invalid_credentials` / signup 200 + user id | evidence JSON |
| E | `SIGNED_IN` | **NOT REACHED** (si login falla) | Solo tras sesión válida | Identity Provider |
| F | `beginPostLoginPipeline` | **PARTIAL** | Se llama **antes** de `signInWithPassword`; si error → `STOP auth_submit_error` | `auth.tsx` |
| G–J | Identity / Profile / Membership / Role | **NOT REACHED** | Requieren sesión | `resolve-home-path` |
| K | Home path | **NOT REACHED** | — | — |
| L | `navigate` | **NOT REACHED** | Solo si `uid` canónico | `goHome` |
| M | Dashboard | **NOT REACHED** | — | — |

---

## Hallazgos demostrados (no hipótesis)

### 1. Feedback de Auth invisible — `Toaster` no montado

- Decenas de llamadas a `toast` / `sonner`.
- Componente `src/components/ui/sonner.tsx` existe.
- **Ningún** `<Toaster />` en `__root.tsx` ni en el árbol de rutas.

**Efecto:** `toast.error("Invalid login credentials")` y `toast.success(checkEmail)` **no se renderizan**.  
El usuario percibe «no pasa nada» aunque el handler y la API sí corran.

Clasificación: **VALID** (código estático).

### 2. Credencial de prueba ≠ usuarios Auth del proyecto cableado

- Intento UI: `kike2morrow@gmail.com`.
- Owners documentados: `alex1409h@gmail.com`, `alexhdezmtinez@gmail.com` (nota: `alex1409**h**`).
- Probe token con password incorrecta / email desconocido → **400 invalid_credentials** contra proyecto `.env` `cbeegcxkayybfncnuirg`.

Clasificación: **VALID** (API).

### 3. Signup **sí crea** usuario; no deja sesión hasta confirmar email

Probe `POST /auth/v1/signup` → HTTP 200, `id` presente, `confirmation_sent_at` set, **sin** `access_token`.  
Código UI: sin `uid`/session → toast `checkEmail` (invisible) → permanece en `/auth`.  
Política documentada: `mailer_autoconfirm=false` ([EMAIL_SIGNUP_VALIDATION](../EMAIL_SIGNUP_VALIDATION.md)).

Clasificación: **VALID** — no es un fallo de «no crea»; es confirmación + feedback invisible.

### 4. FCR-008 / pipeline post-login **no** es el primer fallo en este síntoma

Para llegar a FCR-008 Navigate hace falta `LOGIN_OK` + sesión canónica.  
Con credenciales inválidas o signup sin sesión, el pipeline se detiene en **auth error / awaiting confirmation** — **antes** de Identity→Dashboard.

Clasificación: **STALE** como causa del síntoma actual (sigue vigente como contrato post-login cuando Auth sí entra).

### 5. Posible desalineación de proyecto Supabase

| Fuente | Project ref |
|--------|-------------|
| `.env` workspace | `cbeegcxkayybfncnuirg` |
| Docs EMAIL/PLATFORM validation | `djangucecsphnejplvic` |

Si el Dashboard que miráis y el deploy Lovable no son el mismo ref, «existen usuarios» y «login falla» pueden ser ambos ciertos.

Clasificación: **PARTIAL** — requiere confirmación del ref del deploy Lovable.

---

## Respuestas obligatorias

1. **Primer paso ejecutado (código):** A · Button/form submit wiring.  
2. **Primer paso NO ejecutado hacia dashboard:** E (`SIGNED_IN`) / L (`navigate`) — no hay sesión válida.  
3. **Causa raíz más probable (compuesta):**  
   - **(A)** Errores/éxitos de Auth no visibles (`Toaster` ausente).  
   - **(B)** Login con email/password que Auth rechaza (`invalid_credentials`) o signup sin sesión (confirm email).  
4. **Confianza:** **Alta** en (A) y en API (B); **Media** en que el click del operador siempre dispare Network (falta captura F12).  
5. **Archivos:** `src/routes/__root.tsx` · `src/components/ui/sonner.tsx` · `src/routes/auth.tsx` · `src/auth/credentials.ts`.  
6. **Propuesta mínima (NO implementada):**  
   1. Montar `<Toaster />` en root.  
   2. Reintentar login con usuario Auth real + password conocida (Forgot password / seed).  
   3. Confirmar en Network `POST …/auth/v1/token` y status.  
   4. Alinear project ref Lovable ↔ Dashboard.

---

## Qué NO es

| Afirmación | Veredicto |
|------------|-----------|
| «El botón no ejecuta el handler» | **No demostrado** — wiring PASS |
| «FCR-008 pipeline roto» | **No primer fallo** del síntoma actual |
| «Signup no crea usuarios» | **Falso a nivel API** en proyecto `.env` (probe creó user) |
| Abrir FCR de código por PS-002-C BLOCKED | **No** — distinto |

---

## Artefactos

- [NETWORK_TRACE.md](./NETWORK_TRACE.md)  
- [PIPELINE_TRACE.md](./PIPELINE_TRACE.md)  
- [AUTH_CONSOLE.md](./AUTH_CONSOLE.md)  
- [ROOT_CAUSE.md](./ROOT_CAUSE.md)  
- [evidence/](./evidence/)
