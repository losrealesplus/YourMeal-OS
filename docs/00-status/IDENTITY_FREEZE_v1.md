# Identity Freeze v1 · Auth Layer Frozen

**Documento:** `IDENTITY_FREEZE_v1.md`  
**Fecha:** 2026-07-26  
**Estado:** **Frozen v1** — Identity Block + Navigation Decoupling cerrados  
**Proyecto Supabase:** `djangucecsphnejplvic`  
**Declaración oficial:** **Identity Block Frozen v1** · **Auth Layer STATUS: Frozen**

---

## Estado del bloque

| Bloque | Estado |
|--------|:------:|
| FOUNDATION | ✅ |
| INFRA | ✅ |
| Identity | ✅ **Frozen v1** |
| Platform Owner Bootstrap | ✅ |
| Product Identity (PRODUCT-001) | ✅ |
| Navigation Decoupling (BUGFIX-002) | ✅ |

```text
Auth Layer

STATUS: Frozen

Allowed:
✓ Bug fixes
✓ Security fixes
✓ Google OAuth activation
✓ Apple OAuth activation
✓ Phone Auth activation

Forbidden:
✗ Refactor Auth
✗ Cambios RBAC
✗ Cambios Session
✗ Cambios Bootstrap
✗ Cambios Callback
```

A partir de este momento **no se abren más PRs de autenticación** salvo bug real o activación de providers.  
Siguiente foco: **dominio de negocio** (Tenants, Usuarios, Pedidos, Cocina, Producción, Rutas, Facturación, …).

---

## Componentes congelados

| Componente | Estado | Ancla |
|------------|--------|-------|
| Email Auth | Frozen | INFRA-005 · PRODUCT-001 |
| Session Lifecycle | Frozen | `src/auth/session` · BUGFIX-001 |
| Callback / PKCE | Frozen | `/auth/callback` · PRODUCT-001 `next` |
| Password Reset | Frozen | PRODUCT-001 |
| Platform Owner Bootstrap | Frozen | OP-002 |
| RBAC Foundation | Frozen | INFRA-005 |
| Tenant Isolation | Frozen | INFRA-005 |
| Navigation vs PO ensure | Frozen | BUGFIX-002 · `tryEnsure*` / strict Ops |

---

## Feature Flags

### OAuth

| | |
|--|--|
| Flag | `VITE_AUTH_OAUTH_SOCIAL_ENABLED` |
| Estado | **Disabled** (default `false`) |
| Activación futura | Google + Apple configurados en Dashboard → flag `true` → rebuild |

### Phone

| | |
|--|--|
| Flag | `VITE_AUTH_PHONE_ENABLED` |
| Estado | **Disabled** (default `false`) |
| Activación futura | Proveedor SMS + OTP validados → flag `true` → rebuild |

Código OAuth/Phone **conservado**; solo UI gated.

---

## Modelo de bootstrap (inmutable)

```text
Evidencia > Bootstrap > Roles persistidos > Acceso
```

Nunca:

```text
RPC falló → "Asumimos que es Platform Owner"
```

BUGFIX-002: navegación global usa `tryEnsurePlatformOwnerSession()`; Ops entry (`/auth/admin`) mantiene ensure **strict**. Si la RPC falla en home → solo roles ya en DB.

---

## Cambios permitidos

- Bug fixes  
- Security patches  
- Provider activation (OAuth / Phone)  
- UX improvements menores sin cambiar el modelo  

## Cambios prohibidos

- Rediseño Auth  
- Nuevo modelo RBAC  
- Nuevo modelo Session  
- Nuevo Bootstrap  
- Cambios Callback / arquitectura de identidad  

Cualquier ítem prohibido requiere **nuevo acta / ADR**, no un PR de feature.

---

## PRE-CHECK (obligatorio en análisis externos)

Antes de implementar cambios a partir de Lovable u otro revisor:

1. Verificar que el análisis sigue siendo reproducible sobre la rama actual.  
2. Comprobar si PRs recientes ya resolvieron total o parcialmente el problema.  
3. Si el análisis está desactualizado, documentarlo como obsoleto y **no** modificar código innecesariamente.  
4. Si solo una parte sigue siendo válida, limitar la implementación a esa parte.  

*(FOPEBA: la evidencia debe ser actual antes de convertirse en trabajo de ingeniería.)*

---

## Epics cerrados

FOUNDATION · INFRA-001…005 · OP-002 · BUGFIX-001 · PRODUCT-001 · IDENTITY-CLOSEOUT-001 · BUGFIX-002 · Identity Freeze v1

---

## Referencias

| Doc |
|-----|
| [IDENTITY_CLOSEOUT_REPORT](../10-validation/IDENTITY_CLOSEOUT_REPORT.md) |
| [IDENTITY_CLOSEOUT_CHECKLIST](../10-validation/IDENTITY_CLOSEOUT_CHECKLIST.md) |
| [BUGFIX002_NAVIGATION_DECOUPLING](../10-validation/BUGFIX002_NAVIGATION_DECOUPLING.md) |
| [NAVIGATION_REGRESSION_REPORT](../10-validation/NAVIGATION_REGRESSION_REPORT.md) |
| [IDENTITY_PRODUCT_REPORT](../10-validation/IDENTITY_PRODUCT_REPORT.md) |
| [OP002_PLATFORM_OWNER_BOOTSTRAP](../10-validation/OP002_PLATFORM_OWNER_BOOTSTRAP.md) |
| [ADR 0004](../adr/0004-authentication-rbac.md) |

---

## Acta

**Identity Block Frozen v1** · **Auth Layer Frozen** — 2026-07-26.

```text
❌ No reabrir arquitectura de identidad.
✅ Negocio · bugs · seguridad · activar providers cuando proceda.
```
