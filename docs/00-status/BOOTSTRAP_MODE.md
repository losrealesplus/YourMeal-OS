# EP-BOOTSTRAP-001 · Development Bootstrap Mode

**Estado:** Available (default **OFF**)  
**Fecha:** 2026-07-26  
**Tipo:** Adaptador temporal de desarrollo — **no** cambia producción  

---

## Objetivo

Desbloquear certificación RI-001 / Day-0 / Functional Completeness Review cuando el flujo real de autenticación bloquee la navegación UI.

Permite recorrer:

- Customer App (`/app`)
- Centro de Operaciones EatClean (`/admin`)
- Centro de Operaciones YourMeal OS (`/saas`)
- Cambio de perfiles / roles

**sin depender de Supabase Auth** para la identidad de sesión.

---

## Principio arquitectónico

> **No modifica el comportamiento de producción.**  
> Es un adaptador temporal de desarrollo.

```text
App
 └─ IdentityProvider
     ├─ SupabaseIdentityProvider   ← default (VITE_BOOTSTRAP_MODE=false)
     └─ BootstrapIdentityProvider  ← solo si flag true
```

Los consumidores siguen usando `useAuth()` con la misma `AuthState`.  
Ninguna pantalla de negocio debe ramificar con `if (bootstrap)`.

---

## Activación

```bash
# .env (local / preview de desarrollo — NUNCA producción)
VITE_BOOTSTRAP_MODE=true
```

Default / `.env.example`: `false`.

Tras cambiar la flag: **rebuild** (Vite inyecta `import.meta.env` en build).

---

## Uso

1. Arrancar la app con la flag `true`.  
2. Pantalla **Development Bootstrap** → elegir perfil → **Entrar**.  
3. Panel flotante **DEV MODE** → cambiar perfil / salir.  

| Perfil | Roles | Home típico |
|--------|-------|-------------|
| Customer | `customer` | `/app` |
| Kitchen | `kitchen` | `/admin/kitchen` |
| Delivery | `delivery` | `/admin/delivery` |
| Support | `support` | `/admin` |
| Finance | `accounting` | `/admin` |
| Company Admin | `company_admin` | `/admin` |
| SaaS Admin | `company_admin` + `saas_admin` | `/admin` (entry a `/saas` vía UI) |

El botón **Centro de Operaciones YourMeal OS** sigue visible solo si `isSaasAdmin` (RBAC real vía roles del perfil).

---

## Qué toca (identidad únicamente)

| Pieza | Rol |
|-------|-----|
| `src/bootstrap/*` | Flag, perfiles, store, selector, DEV panel |
| `src/identity/*` | IdentityProvider swap |
| `src/auth/session.ts` | Origen getUser/getSession/signOut cuando flag ON |
| `src/permissions/route-guards.ts` | `loadRoles` lee roles bootstrap si flag ON |
| `src/lib/ensure-platform-owner-session.ts` | No-op seguro en bootstrap (no RPC) |

**No toca:** RLS · migraciones · policies · repositories · services de negocio · lógica de guards (solo origen de roles).

---

## Limitaciones

- Sesión **sintética** — no hay JWT real de Supabase.  
- Mutaciones / server functions que exijan Auth real de Supabase **fallarán** o quedarán vacías.  
- Sirve para **navegación UI**, FCR visual, Day-0 de pantallas — no sustituye evidencias de Auth de producción.  
- Tenant/company IDs son fijos de seed documental (`eatclean-tenerife`).

---

## Cómo eliminarlo cuando Auth esté resuelto

1. Poner `VITE_BOOTSTRAP_MODE=false` (o quitar la variable) en todos los entornos.  
2. Verificar login real Customer / Admin / SaaS.  
3. (Opcional, PR de limpieza) eliminar `src/bootstrap/*` + `src/identity/bootstrap-*` y dejar solo `SupabaseIdentityProvider` si ya no se necesita el adaptador.  
4. Actualizar esta acta a **Retired**.

Mientras la flag sea `false`, el código bootstrap no altera el flujo de producción.

---

## Relación con Identity Freeze

Excepción **temporal y encapsulada** para certificación — no es rediseño de Auth ni nuevo modelo RBAC.  
Producción permanece en el modelo Frozen (email/password · OP-002 · BUGFIX-002).

---

## Seguridad

- Default OFF.  
- No activar en builds de producción / Lovable prod.  
- No concede privilegios en DB; solo identidad en memoria / `sessionStorage`.  
