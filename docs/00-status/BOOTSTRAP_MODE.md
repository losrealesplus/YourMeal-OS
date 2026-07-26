# EP-BOOTSTRAP-001 · Development Bootstrap Mode

**Estado:** Available (default **OFF**) · en uso como **Functional Review Mode**  
**Fecha:** 2026-07-26  
**Tipo:** Adaptador temporal de desarrollo — **no** cambia producción  
**Práctica FOPEBA:** [Development Identity Adapter](../20-evidence-framework/11-development-identity-adapter.md)  
**FCR en curso:** [OPERATIONAL_READINESS_CERTIFICATION](../10-validation/OPERATIONAL_READINESS_CERTIFICATION.md) · [FCR_FINDINGS_REGISTER](../10-validation/FCR_FINDINGS_REGISTER.md) · [FCR_SESSION_LOG](../10-validation/FCR_SESSION_LOG.md) · [RBAC_MATRIX_V1](../10-validation/RBAC_MATRIX_V1.md) · [WORKSPACE_ENTRY_POLICY](../10-validation/WORKSPACE_ENTRY_POLICY.md)

---

## Objetivo

Desbloquear certificación RI-001 / Day-0 / **Functional Completeness Review operacional** cuando el Auth de producción bloquee la navegación UI.

Nombre operativo mientras se recorre el producto: **Functional Review Mode**.  
Herramienta de **certificación / QA**, no solución permanente de identidad.

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

## Identificación visual (obligatoria)

Con Bootstrap Mode activo, la UI muestra **siempre**:

1. **Banner superior permanente**

```text
⚠ Bootstrap Mode — Identity Source: BootstrapIdentityProvider · Not Supabase Auth
```

2. **Panel DEV** (esquina) con perfil actual + cambio de rol + salir.

Ninguna captura de FCR debe poder confundirse con una sesión Supabase real.

---

## Activación

```bash
# .env (local / preview de desarrollo — NUNCA producción)
VITE_BOOTSTRAP_MODE=true
```

Default / `.env.example`: `false`.

Tras cambiar la flag: **rebuild**.

---

## Uso

1. Arrancar con la flag `true`.  
2. Pantalla **Development Bootstrap** → perfil → **Entrar**.  
3. Recorrer pantallas con el checklist operacional: [BOOTSTRAP_FCR_CHECKLIST](../10-validation/BOOTSTRAP_FCR_CHECKLIST.md).  
4. Panel DEV → cambiar perfil / salir.  

| Perfil | Roles | Home típico |
|--------|-------|-------------|
| Customer | `customer` | `/app` |
| Kitchen | `kitchen` | `/admin/kitchen` |
| Delivery | `delivery` | `/admin/delivery` |
| Support | `support` | `/admin` |
| Finance | `accounting` | `/admin` |
| Company Admin | `company_admin` | `/admin` |
| SaaS Admin | `company_admin` + `saas_admin` | `/admin` (entry UI → `/saas`) |

El botón **Centro de Operaciones YourMeal OS** solo si `isSaasAdmin`.

---

## Limitaciones (no ocultar)

| Qué funciona | Qué NO certifica |
|--------------|------------------|
| Navegación UI | Auth de producción |
| Guards / RBAC con roles inyectados | JWT Supabase real |
| Recorrido FCR / Day-0 de pantallas | Mutaciones server que exijan sesión Auth |
| Cambio de perfil sin reiniciar | Evidencia de login/signup/reset |

> Las mutaciones que dependan de un JWT real **pueden fallar**.  
> Bootstrap Mode **no** sustituye la validación de Identity Frozen.

---

## Qué toca (identidad únicamente)

| Pieza | Rol |
|-------|-----|
| `src/bootstrap/*` | Flag, perfiles, store, selector, banner, DEV panel |
| `src/identity/*` | IdentityProvider swap |
| `src/auth/session.ts` | Origen getUser/getSession/signOut cuando flag ON |
| `src/permissions/route-guards.ts` | `loadRoles` origen bootstrap si flag ON |
| `src/lib/ensure-platform-owner-session.ts` | No-op en bootstrap |

**No toca:** RLS · migraciones · policies · repositories · services · lógica de guards.

---

## Cómo eliminarlo cuando Auth esté resuelto

1. `VITE_BOOTSTRAP_MODE=false` en todos los entornos.  
2. Verificar login real Customer / Admin / SaaS.  
3. (Opcional) retirar `src/bootstrap/*` + provider bootstrap.  
4. Marcar esta acta **Retired**.

---

## Relación con Identity Freeze

Excepción **temporal y encapsulada** — no rediseño Auth / RBAC.  
Producción: modelo Frozen (email/password · OP-002 · BUGFIX-002).
