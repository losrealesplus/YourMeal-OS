# Identity Freeze v1

**Documento:** `IDENTITY_FREEZE_v1.md`  
**Acta:** IDENTITY-CLOSEOUT-001  
**Fecha:** 2026-07-26  
**Proyecto Supabase:** `djangucecsphnejplvic`  
**Declaración oficial:** **Identity Block Frozen v1**

---

## Estado

**Identity Stable**

El bloque de Identidad de YourMeal OS está cerrado para arquitectura y flujos base.  
El trabajo siguiente del proyecto se centra en dominio de negocio (Tenants, Usuarios, Pedidos, Cocina, Producción, Rutas, Facturación, etc.), sin reabrir el diseño de identidad salvo incidencias o activación futura de proveedores.

---

## Componentes congelados

| Componente | Estado |
|------------|--------|
| Email Auth | Frozen |
| Session Lifecycle | Frozen |
| Callback | Frozen |
| Password Reset | Frozen |
| Platform Owner Bootstrap | Frozen |
| RBAC Foundation | Frozen |
| Tenant Isolation | Frozen |

Anclas técnicas (no modificar salvo bug/security):

- `src/auth/*` — cliente, credentials, session, callback, guards, urls, features, oauth  
- `/auth` · `/auth/callback` · `/reset-password` · `/auth/admin`  
- OP-002: `npm run seed:platform-owners` · `ensure_platform_owner_session`  
- Guards: `assertStaffRoute` / `assertSaasRoute` · `src/permissions`  
- Evidencia: INFRA-003…005 · OP-002 · BUGFIX-001 · PRODUCT-001 · CLOSEOUT-001  

---

## Feature Flags

### OAuth

| Campo | Valor |
|-------|--------|
| Flag | `VITE_AUTH_OAUTH_SOCIAL_ENABLED` |
| Estado | **Disabled** (default `false`) |
| Código | Conservado en `src/auth/oauth.ts` + `/auth/callback` |
| Activación futura | Google + Apple configurados en Dashboard → flag `true` → rebuild |

### Phone

| Campo | Valor |
|-------|--------|
| Flag | `VITE_AUTH_PHONE_ENABLED` |
| Estado | **Disabled** (default `false`) |
| Código | Conservado en `credentials.ts` (`signInWithOtp` / `verifyOtp`) |
| Activación futura | Proveedor SMS + OTP validados → flag `true` → rebuild |

No eliminar implementaciones OAuth ni Phone. Solo UI gated.

---

## Cambios permitidos

- Bug fixes  
- Security patches  
- Provider activation (OAuth / Phone vía flags + Dashboard)  
- UX improvements (copy, loading, mensajes) sin cambiar el modelo  

---

## Cambios prohibidos

- Rediseño Auth  
- Nuevo modelo RBAC  
- Nuevo modelo Session  
- Nuevo Bootstrap  
- Cambios arquitectónicos de identidad  

Cualquier ítem prohibido requiere nuevo acta / ADR de gobernanza, no un PR de feature.

---

## Epics cerrados en este bloque

FOUNDATION · INFRA-001 · INFRA-002 · INFRA-003 · INFRA-004 · INFRA-005 · OP-002 · BUGFIX-001 · PRODUCT-001 · IDENTITY-CLOSEOUT-001

---

## Referencias

| Doc |
|-----|
| [IDENTITY_CLOSEOUT_REPORT](../10-validation/IDENTITY_CLOSEOUT_REPORT.md) |
| [IDENTITY_CLOSEOUT_CHECKLIST](../10-validation/IDENTITY_CLOSEOUT_CHECKLIST.md) |
| [IDENTITY_PRODUCT_REPORT](../10-validation/IDENTITY_PRODUCT_REPORT.md) |
| [OP002_PLATFORM_OWNER_BOOTSTRAP](../10-validation/OP002_PLATFORM_OWNER_BOOTSTRAP.md) |
| [IDENTITY_VALIDATION_REPORT](../10-validation/IDENTITY_VALIDATION_REPORT.md) |
| [RBAC_VALIDATION](../10-validation/RBAC_VALIDATION.md) |
| [TENANT_ISOLATION_REPORT](../10-validation/TENANT_ISOLATION_REPORT.md) |
| [ADR 0004 · Authentication and RBAC](../adr/0004-authentication-rbac.md) |

---

## Acta

**Identity Block Frozen v1** — 2026-07-26.

```text
❌ No reabrir arquitectura de identidad.
✅ Operar producto · bugs · seguridad · activar providers cuando proceda.
```
