# Workspace Entry Policy (WEP-001)

**Estado:** **READY FOR RE-CERTIFICATION** (EP-OPS-002 · Correction)  
**Fuente de verdad:** [`homePathForRoles`](../../src/lib/home-path.ts) · [`resolveOperationsEntry`](../../src/lib/operations-workspaces.ts) · [`decideOperationsCenterEntry`](../../src/lib/open-operations-center.ts)

---

## Principio

```text
Autorización (RBAC)     →  ¿Qué puede hacer?
Workspace Entry (WEP)   →  ¿Dónde empieza a trabajar?
```

**Nunca:** landing genérico → el usuario decide dónde entrar.

---

## Comportamiento final (post-corrección)

| Rol | Landing | Surface | Workspace |
|-----|---------|---------|-----------|
| Puro `saas_admin` | `/saas` | Platform | Platform Ops |
| Híbrido `company_admin`+`saas_admin` | `/admin` | Tenant (tenant-first) | Operations Center |
| Company Admin | `/admin` | Tenant | Operations Center |
| Operations Manager | `/admin` | Tenant | Operations Center |
| Kitchen / Production | `/admin/kitchen` | Tenant | Kitchen Workspace |
| Delivery / Logistics | `/admin/delivery` | Tenant | Delivery Workspace |
| Support | `/admin/support` | Tenant | Support Workspace |
| Accounting | `/admin/accounting` | Tenant | Accounting Workspace |
| Inventory / Purchasing | `/admin/inventory` | Tenant | Stock Workspace |
| Driver | `/driver` | Driver | Driver |
| Customer | `/app` | Customer | Customer Dashboard |

### Decisiones de corrección

- **Kitchen canónico** = `/admin/kitchen` (execution es pantalla secundaria, no landing).
- **Support / Accounting** ya no aterrizan en `/admin` genérico.
- **Híbrido Platform+Tenant** = tenant-first; Platform vía entry con `saas.manage`.

---

## Mecanismo

| Entrada | Resolver |
|---------|----------|
| Login / OAuth / `"/"` | `resolveHomePath` → `homePathForRoles` |
| `/auth/admin` | `resolvePostAdminLoginPath` / `enterOperationsCenter` |
| Centro de Operaciones | `decideOperationsCenterEntry` |
| Bootstrap / DEV panel | `homePathForRoles` |

Staff con un solo workspace → entrada **directa**.  
Admin / multi-workspace → `/admin` (Ops Center).

---

## Re-Certification Gate

```text
STATUS: READY FOR RE-CERTIFICATION

Correction evidence
  ☑ Landings de departamento únicos sin hub genérico
  ☑ Navegación determinista vía resolvers únicos
  ☑ Tests de entry alineados

Gate: — (no PASS · pendiente pasada RI-001)
```
