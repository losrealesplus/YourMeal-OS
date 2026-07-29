# PIPELINE_TRACE · FCR-009

**Fecha:** 2026-07-29  
**Contrato FCR-008:** `LOGIN → … → DASHBOARD_RENDERED`

---

## Comportamiento del código en `/auth` (EmailForm)

```text
submit()
  ↓
beginPostLoginPipeline("canonical")     → emite LOGIN
  ↓
signInWithPassword()
  ↓
error? → stopPostLogin("auth_submit_error") + toast.error  → STOP (sin LOGIN_OK)
  ↓
LOGIN_OK
  ↓
CANONICAL_SESSION (si data.session / user)
  ↓
goHome → BOOTSTRAP_START → … → NAVIGATE → DASHBOARD_RENDERED
```

Nota: `LOGIN` se emite **antes** de conocer el éxito de Supabase.  
Un intento fallido deja evidencia `[FCR-008] LOGIN` + `[FCR-008] STOP`.

---

## Trazas esperadas por caso

| Caso | Pipeline observado | Navigate |
|------|--------------------|----------|
| Credenciales inválidas | `LOGIN` → `STOP(auth_submit_error)` | No |
| Signup nuevo (confirm email) | `LOGIN` → `STOP(awaiting_email_confirmation)` o sin LOGIN_OK | No |
| Login OK + sesión | Contrato completo FCR-008 | Sí |
| Toaster ausente | Igual que arriba, **sin feedback visible** | Igual |

---

## Conclusión respecto a FCR-008

El síntoma «me quedo en `/auth`» con `kike2morrow@gmail.com` **no requiere** un defecto del pipeline canónico.  
El pipeline **no alcanza** `CANONICAL_SESSION` / `NAVIGATE` si Auth no entrega sesión.

Revalidar FCR-008 / PS-002-C **solo** tras un login 200 con sesión real.
