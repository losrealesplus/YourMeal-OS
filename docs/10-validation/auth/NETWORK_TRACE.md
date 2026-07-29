# NETWORK_TRACE · FCR-009

**Fecha:** 2026-07-29  
**Proyecto probe:** `https://cbeegcxkayybfncnuirg.supabase.co` (desde `.env` del workspace)

---

## Llamadas esperadas desde `/auth`

| Acción UI | Endpoint | Método |
|-----------|----------|--------|
| Iniciar sesión | `/auth/v1/token?grant_type=password` | POST |
| Crear cuenta | `/auth/v1/signup` | POST |
| Post-sesión (si OK) | `/auth/v1/user`, `rest/v1/profiles`, roles, memberships | GET |

---

## Probes ejecutados (server-side, misma apikey publishable)

### 1. Token · password incorrecta · `alex1409h@gmail.com`

```text
POST /auth/v1/token?grant_type=password
HTTP 400
{"code":400,"error_code":"invalid_credentials","msg":"Invalid login credentials"}
```

Evidencia: `evidence/auth-token-wrong.json`

### 2. Token · `kike2morrow@gmail.com` · password `x`

```text
HTTP 400
invalid_credentials
```

Evidencia: `evidence/kike.json`  
→ Auth del proyecto cableado **no** autentica ese email+password (usuario inexistente o password distinta).

### 3. Signup · email probe único

```text
POST /auth/v1/signup
HTTP 200
user id presente
confirmation_sent_at presente
access_token AUSENTE
email_verified: false
```

Evidencia: `evidence/auth-signup.json`  
→ Signup **crea** usuario; **no** entrega sesión hasta confirmar email.

---

## Observación humana pendiente (F12 → Network)

Al pulsar **Iniciar sesión** en el deploy:

| Pregunta | Resultado esperado si handler corre |
|----------|-------------------------------------|
| ¿Aparece `…/auth/v1/token`? | Sí |
| ¿Status? | 200 (OK) o 400 (`invalid_credentials`) |
| ¿Si no aparece ninguna petición? | Entonces Scenario A/B fallan en runtime (overlay, JS error, otro build) |

**Sin captura F12 del operador, no se puede cerrar Scenario C en el navegador.**  
Los probes demuestran que el backend Auth del ref `.env` responde correctamente.

---

## 401 / 403 / 404 / 500

No observados en probes de Auth password/signup (solo 400 / 200).
