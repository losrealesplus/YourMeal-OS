# INFRA-005 · IDENTITY_VALIDATION_REPORT

**Fecha:** 2026-07-26  
**Proyecto Supabase:** `djangucecsphnejplvic`  
**Branch:** `cursor/infra-005-identity-validation-f54a`  
**Alcance:** Identidad nativa email/password · OAuth UI suspendido (código conservado)

---

## 1. Cambios de código

| Cambio | Detalle |
|--------|---------|
| Flag | `VITE_AUTH_OAUTH_SOCIAL_ENABLED` (default **false**) vía `src/auth/features.ts` → `isOAuthSocialEnabled()` |
| UI | `src/routes/auth.tsx` — bloque Google/Apple + separador “or” solo si el flag es true |
| Conservado | `src/auth/oauth.ts`, `signInWithOAuth`, `/auth/callback`, PKCE — **sin eliminar** |
| Config | `.env` / `.env.example` documentan el flag |

**Reactivar OAuth UI:** `VITE_AUTH_OAUTH_SOCIAL_ENABLED=true` + rebuild (+ providers Dashboard ON).

---

## 2. Evidencia automatizada (API · 2026-07-26)

| Check | Resultado | Evidencia |
|-------|-----------|-----------|
| Auth settings | PASS | `email=true`, `google=false`, `apple=false`, `phone=false`, `mailer_autoconfirm=false` |
| Admin createUser + password login | PASS | session JWT válida |
| `getUser(jwt)` | PASS | email del probe |
| `refreshSession` | PASS | nuevo access_token |
| `signOut` | PASS | OK |
| Profile auto-create | PASS | `profiles` fila con `full_name` / `locale=es` tras Auth user |
| `user_roles` al alta | PASS (vacío) | `count=0` — cliente por defecto en runtime |
| `tenant_members` al alta | PASS (vacío) | `count=0` hasta onboarding / ensure_individual |
| Public `signUp` | PASS | user creado, `session=false` (confirmación email requerida) |
| `resetPasswordForEmail` @example.com | FAIL | GoTrue: email inválido — usar dominio real / mailinator |
| Platform Owner en Auth | **FAIL** | `alex1409h@gmail.com` y `alexhdezmtinez@gmail.com` **no** existen en Auth |
| Tenant seed | PASS | `eatclean-tenerife` presente |
| Unit `isOAuthSocialEnabled` | PASS | vitest 3/3 |
| Unit `homePathForRoles` | PASS | vitest 8/8 |

Probes usaron Auth Admin / Auth client (flujos definidos). Usuarios de prueba **eliminados** tras la corrida. No se insertó SQL directo en `user_roles`.

---

## 3. Flujos producto (estado)

### 3.1 Registro email/password

1. UI `/auth` → Sign up → `signUp()` (`src/auth/credentials.ts`).  
2. Con `mailer_autoconfirm=false` el usuario debe confirmar email antes de sesión durable.  
3. Trigger crea `profiles`.  
4. Sin roles → `useAuth().isCustomer` → `resolveHomePath` → `/app`.

**Bloqueador ops:** configurar SMTP (o habilitar autoconfirm solo en entornos no-prod) para completar signup E2E en UI.

### 3.2 Login / logout / persistencia

| Paso | Código | API probe |
|------|--------|-----------|
| Login | `signInWithPassword` | PASS |
| Persistencia | `persistSession: true` + localStorage | Diseño PASS · UI reload = checklist operador |
| Refresh | `autoRefreshToken: true` + probe `refreshSession` | PASS |
| Logout | `signOut` en settings / admin / saas | API PASS |

### 3.3 Recuperación

Ruta `/reset-password` + `resetPasswordForEmail` / `updatePassword`.  
Probe con `@example.com` rechazado por GoTrue — validar con mailbox real en checklist.

---

## 4. Perfiles objetivo

| Perfil | Cómo se obtiene (flujo definido) | Home esperado | Estado validación |
|--------|----------------------------------|---------------|-------------------|
| Customer | Signup / login sin roles staff | `/app` | API: alta + redirect map PASS · UI checklist |
| Employee | Invite / vínculo company (`employee` / customer B2B) | `/app` (salvo staff) | Código mapeado · E2E **PENDING** operador |
| EatClean Tenant Admin | `company_admin` via invite tenant/SaaS | `/admin` | Código + unit redirect PASS · E2E **PENDING** |
| SaaS Platform Owner | Email en `config/bootstrap/platform-owners.json` + login → RPC `ensure_platform_owner_session` | `/admin` (saas+company) o `/saas` si solo saas | **BLOCKED** — owners no están en Auth |

---

## 5. Redirecciones (mapa código)

Fuente: `src/lib/home-path.ts` + `resolveHomePath` (llama `ensurePlatformOwnerSession` antes de leer roles).

| Roles | Path |
|-------|------|
| (vacío) / customer | `/app` |
| `company_admin` / `operations_manager` | `/admin` |
| solo `saas_admin` | `/saas` |
| `saas_admin` + staff | `/admin` (SaaS entry secundaria) |
| solo `kitchen` | `/admin/kitchen` |
| solo delivery/logistics | `/admin/delivery` |
| `driver` | `/driver` |

Staff entry dedicado: `/auth/admin` (email/password only — sin OAuth).

---

## 6. Criterio de cierre INFRA-005

| Ítem | Estado |
|------|--------|
| OAuth UI oculto sin borrar código | ✅ DONE |
| Flag de reactivación | ✅ DONE |
| Login/refresh/logout API | ✅ PASS |
| Signup público + confirm policy documentada | ✅ PASS (session null hasta confirm) |
| Platform Owner E2E | ⛔ BLOCKED (crear Auth users allowlisted) |
| Employee / Tenant Admin E2E UI | ⬜ PENDING operador |
| OAuth re-enable | ⬜ Post-INFRA-005 (providers OFF hoy) |

---

## 7. Próximos pasos operador

1. Crear usuarios Auth (signup o invite) para emails de `platform-owners.json`.  
2. Login → verificar grants `saas_admin` + `company_admin` + membership `eatclean-tenerife`.  
3. Completar checklist UI: [CHECKLIST_IDENTITY_VALIDATION.md](./CHECKLIST_IDENTITY_VALIDATION.md).  
4. Ver [RBAC_VALIDATION.md](./RBAC_VALIDATION.md) y [TENANT_ISOLATION_REPORT.md](./TENANT_ISOLATION_REPORT.md).  
5. Cuando identidad email/password sea PASS → reactivar OAuth (flag + Dashboard).
