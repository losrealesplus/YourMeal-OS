# Identity Freeze v1

**Documento:** `IDENTITY_FREEZE_v1.md`  
**Fecha:** 2026-07-26  
**Estado:** **Frozen v1**  
**Proyecto Supabase:** `djangucecsphnejplvic`  
**Knowledge Lifetime:** Iteration *(acta inmutable al cierre)*  

---

## Decisión

Queda **congelada** la foundation de identidad de YourMeal OS.

A partir de este momento, la identidad operativa se considera estable para continuar módulos de producto **sin rediseñar Auth, roles ni sesión**.

```text
❌ No reabrir arquitectura de identidad.
✅ Operar, endurecer seguridad y completar OAuth cuando proceda.
```

---

## Frozen Components

| Componente | Estado | Evidencia / ancla |
|------------|--------|-------------------|
| Supabase Auth | ✓ Frozen | INFRA-003 · `src/auth/*` · cliente oficial |
| Email / Password | ✓ Frozen | INFRA-005 · credentials + `/auth` |
| Session Lifecycle | ✓ Frozen | getSession / refresh / persist / signOut · BUGFIX-001 resiliencia admin |
| Platform Owner Bootstrap | ✓ Frozen | OP-002 · `seed:platform-owners` · `ensure_platform_owner_session` |
| RBAC Foundation | ✓ Frozen | `user_roles` · `src/permissions` · route guards |
| Tenant Isolation | ✓ Frozen | RLS + membership · INFRA-005 TENANT report |
| Admin Entry | ✓ Frozen | `/auth/admin` · Ops Center entry · BUGFIX-001 |

---

## Future Changes

### Allowed

- Bug fixes  
- Security fixes  
- OAuth provider enablement (`VITE_AUTH_OAUTH_SOCIAL_ENABLED` + Dashboard providers)

### Forbidden

- Auth architecture changes  
- New identity models  
- Role redesign  
- Session redesign  

---

## Alcance explícito (no congelado aquí)

Estos temas **no** forman parte de Identity Freeze v1 y siguen su propio ciclo:

- Product modules (Pedidos, Cocina, Packaging, …)  
- Tenant branding / experience polish  
- Feature flags de módulos piloto  
- Multi-tenant commercial expansion beyond EatClean seed  

---

## Reactivación OAuth (permitida)

Procedimiento permitido sin romper el freeze:

1. Dashboard: Google / Apple ON + Redirect URLs `/auth/callback`  
2. `.env`: `VITE_AUTH_OAUTH_SOCIAL_ENABLED=true`  
3. Rebuild Preview / producción  
4. Smoke OAuth (sin `/~oauth/initiate`)

No requiere nuevo modelo de identidad.

---

## Referencias

| Doc |
|-----|
| [OP002_PLATFORM_OWNER_BOOTSTRAP](../10-validation/OP002_PLATFORM_OWNER_BOOTSTRAP.md) |
| [PLATFORM_OWNER_VALIDATION](../10-validation/PLATFORM_OWNER_VALIDATION.md) |
| [BOOTSTRAP_RUNBOOK](../10-validation/BOOTSTRAP_RUNBOOK.md) |
| [IDENTITY_VALIDATION_REPORT](../10-validation/IDENTITY_VALIDATION_REPORT.md) |
| [RBAC_VALIDATION](../10-validation/RBAC_VALIDATION.md) |
| [TENANT_ISOLATION_REPORT](../10-validation/TENANT_ISOLATION_REPORT.md) |
| [BUGFIX001_ADMIN_AUTH_LOADING](../10-validation/BUGFIX001_ADMIN_AUTH_LOADING.md) |
| [ADR 0004 · Authentication and RBAC](../adr/0004-authentication-rbac.md) |

---

## Acta

**Identity Freeze v1** — cerrada el 2026-07-26.

Cualquier cambio en la columna *Forbidden* requiere decisión explícita de gobernanza (nuevo acta / ADR), no un PR de feature.
