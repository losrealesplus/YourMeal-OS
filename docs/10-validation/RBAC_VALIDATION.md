# INFRA-005 · RBAC_VALIDATION

**Fecha:** 2026-07-26  
**Proyecto:** `djangucecsphnejplvic`  
**Regla:** Sin bypass · roles solo desde `user_roles` · capabilities vía `src/permissions`

---

## 1. Modelo de verdad

```text
Auth user (Supabase)
  → profiles (1:1, trigger)
  → tenant_members (membership)
  → user_roles (app_role enum)
  → can(roles, capability) / route guards / RLS helpers
```

| Capa | Fuente |
|------|--------|
| Session | Supabase Auth (`src/auth`) |
| Roles | `public.user_roles` — leídos en `useAuth`, `resolveHomePath`, `route-guards` |
| Capabilities | `src/permissions/index.ts` ↔ `docs/09-security/CAPABILITY_MATRIX.md` |
| Platform Owner | RPC `ensure_platform_owner_session` si email ∈ `platform_owners` |
| DB safety net | RLS + `has_role` / helpers |

**No** hay allowlist de permisos hardcodeada en la UI de login.

---

## 2. Guards de ruta (evidencia código)

| Guard | Archivo | Efecto |
|-------|---------|--------|
| `requireAuthenticatedUser` | `src/auth/guards.ts` | Sin user → `/auth` |
| `assertStaffRoute` | `route-guards.ts` | Sin staff → `/app` |
| `assertSaasRoute` | `route-guards.ts` | Sin `saas.manage` → `/app` |
| `assertDriverRoute` | `route-guards.ts` | Sin driver/logistics/saas → `/app` |
| `assertCapability` / `assertCapabilityFromContext` | `route-guards.ts` | Módulos admin por capability |

Shells:

- `/_authenticated/*` — session gate  
- `/admin/*` — staff + capabilities por módulo  
- `/saas/*` — `saas.manage`  
- `/auth/admin` — login staff; post-login exige `hasStaffAccess`

---

## 3. Mapa perfil → rol → portal

| Perfil negocio | Roles típicos | Portal |
|----------------|---------------|--------|
| Customer | `customer` o **sin roles** (default `isCustomer`) | `/app` |
| Employee | `employee` (+ customer B2B) | `/app` |
| EatClean Tenant Admin | `company_admin` (± operations_manager) | `/admin` |
| Kitchen / Delivery staff | `kitchen` / `delivery` / … | `/admin/kitchen` o `/admin/delivery` o `/admin` |
| SaaS Platform Owner | `saas_admin` + `company_admin` (OP-002) | `/admin` con entry `/saas` |
| Solo platform (raro) | solo `saas_admin` | `/saas` |

Evidencia unitaria: `src/lib/home-path.spec.ts` PASS.

---

## 4. Evidencia runtime (probe 2026-07-26)

| Escenario | Resultado |
|-----------|----------|
| Usuario Auth nuevo sin `user_roles` | `user_roles` count=0 · home teórico `/app` |
| `useAuth` default customer | Código: `isCustomer = customer \|\| (!saas && !staff && !driver)` |
| Platform Owner emails en Auth | **NO** — bloquea validación saas_admin E2E |
| Tenant `eatclean-tenerife` | Existe (service read) |

---

## 5. Flujos administrativos de rol (permitidos)

No insertar roles a mano en SQL ad hoc. Usar:

| Flujo | Implementación |
|-------|----------------|
| Platform Owner | Login allowlisted → `ensure_platform_owner_session` |
| Invite staff tenant | `inviteTenantStaff` (`tenant-admin.functions.ts`) |
| Invite / grant SaaS | `saas-admin.functions.ts` (service role server) |
| Individual customer | RPC `ensure_individual_customer` |

---

## 6. Matriz de verificación operador

```text
□ Customer: login → solo /app · /admin redirige
□ Employee: sin capabilities admin · /admin bloqueado
□ Tenant Admin: /admin OK · /saas bloqueado (salvo también saas_admin)
□ Platform Owner: tras ensure → saas_admin visible · /saas o entry SaaS
□ Revoke role (admin UI) → realtime user_roles → router.invalidate pierde acceso
□ No capability bypass en nav (items ocultos + beforeLoad)
```

---

## 7. Hallazgos / riesgos

| Hallazgo | Severidad | Acción |
|----------|-----------|--------|
| Platform Owners no existen en Auth del proyecto oficial | Alta | Signup/invite de emails OP-002 |
| Signup deja `user_roles` vacío (cliente implícito) | Info | Esperado; onboarding puede llamar `ensure_individual_customer` |
| Google/Apple OFF + UI OAuth oculto | Info | Alineado INFRA-005 |

**Veredicto RBAC código:** PASS (diseño + guards + unit redirects).  
**Veredicto RBAC E2E multi-rol:** PENDING/BLOCKED hasta usuarios Auth reales por perfil.
