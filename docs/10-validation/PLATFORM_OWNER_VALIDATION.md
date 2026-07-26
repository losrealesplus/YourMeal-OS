# OP-002 · PLATFORM_OWNER_VALIDATION

**Fecha:** 2026-07-26  
**Proyecto:** `djangucecsphnejplvic`  
**Evidencia machine:** [evidence/op002/validation-run.json](./evidence/op002/validation-run.json)  
**Resultado agregado:** **26 / 26 PASS**

---

## 1. Identidades

| Email | Auth user id | Auth | Roles | Membership |
|-------|--------------|------|-------|------------|
| `alex1409h@gmail.com` | `eb87be19-e7d3-4e15-b429-20d3cc9766e8` | created → reused | `saas_admin`, `company_admin` | `eatclean-tenerife` |
| `alexhdezmtinez@gmail.com` | `ddc40f80-8980-475c-a7a2-1f3be4eaa59f` | created → reused | `saas_admin`, `company_admin` | `eatclean-tenerife` |

Provisionadas con `npm run seed:platform-owners` (Supabase Auth Admin API — no SQL).

---

## 2. Flujo de sesión (ambos owners)

| Paso | Resultado |
|------|-----------|
| Login `signInWithPassword` | PASS |
| `ensure_platform_owner_session` | PASS (`ok`, `applied`, roles confirmados) |
| `refreshSession` | PASS |
| Logout + re-login | PASS |
| `homePathForRoles` | **`/admin`** (híbrido staff+saas; entry a `/saas` en UI) |

> Criterio “portal SaaS”: acceso autorizado a `/saas` + listado/creación de tenants.  
> Redirect automático primario = `/admin` cuando coexisten `company_admin` + `saas_admin` (diseño `home-path.ts`).

---

## 3. RBAC SaaS

| Capacidad | Evidencia |
|-----------|-----------|
| Acceso lista tenants | PASS — ambos owners leen `tenants` (EatClean) |
| Crear tenant (flujo privilegiado) | PASS — insert como owner autenticado (RLS saas) + cleanup; UI oficial = `createTenant` server fn |
| Tenant EatClean presente | PASS — no creado por SQL en esta corrida; ya existía del bootstrap de plataforma |
| `saas_admin` global (`tenant_id` NULL) | PASS vía seed ensure |
| `company_admin` en EatClean | PASS |

---

## 4. Pruebas negativas

| Caso | Resultado |
|------|-----------|
| Usuario Auth aleatorio → `ensure_platform_owner_session` | `applied=false`, `reason=not_platform_owner` |
| Mismo usuario → `user_roles` | vacío (sin `saas_admin`) |
| Mismo usuario → `tenants` select | 0 filas |

---

## 5. Idempotencia

Re-ejecución de `npm run seed:platform-owners` → `auth: reused` para ambos · grants intactos · PASS.

---

## 6. Password / acceso humano

Las passwords usadas en el agente son efímeras (Auth Admin `updateUserById` solo para probes).  

**Operador:** en `/auth` usar **Forgot password** para `alex1409h@gmail.com` y `alexhdezmtinez@gmail.com`, o volver a seedear con `PLATFORM_OWNERS_PASSWORD` conocido en un secret manager.

---

## 7. Checklist UI restante (humano)

```text
□ Forgot password → set password (cada owner)
□ Login → aterriza en /admin
□ Abrir YourMeal OS / SaaS entry → /saas
□ Ver EatClean Tenerife en tenants
□ (Opcional) Crear tenant de prueba desde UI y archivar/limpiar
□ Logout / reload / re-login
```

---

## 8. Veredicto

| Criterio de éxito | Estado |
|-------------------|--------|
| Dos identidades Platform Owner en Auth | ✅ |
| Ambas pueden iniciar sesión | ✅ |
| Acceso portal SaaS (datos + path) | ✅ (home `/admin` + `/saas` autorizado) |
| RBAC correcto | ✅ |
| Negativos sin privilegios | ✅ |
| Sin SQL Auth manual / sin bypass | ✅ |
| Procedimiento documentado | ✅ Runbook + este informe |

**OP-002 live identity bootstrap: PASS** (pendiente solo set-password humano vía forgot-password).
