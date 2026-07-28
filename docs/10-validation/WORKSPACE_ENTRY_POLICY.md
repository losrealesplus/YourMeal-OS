# Workspace Entry Policy (WEP-001)

**Estado:** ✅ **CERTIFIED** (EP-OPS-002 · 2026-07-28)  
**Fuente de verdad:** [`homePathForRoles`](../../src/lib/home-path.ts) · [`resolveOperationsEntry`](../../src/lib/operations-workspaces.ts) · [`decideOperationsCenterEntry`](../../src/lib/open-operations-center.ts)

---

## Principio

```text
Autorización (RBAC)     →  ¿Qué puede hacer?
Workspace Entry (WEP)   →  ¿Dónde empieza a trabajar?
```

**Nunca:** landing genérico → el usuario decide dónde entrar.

---

## Política certificada

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

### Decisiones certificadas

- Kitchen canónico = `/admin/kitchen` (execution = pantalla secundaria).
- Support / Accounting = landings directos (no hub genérico).
- Híbrido Platform+Tenant = tenant-first.

---

## Evidence Gate · WEP-001

```text
STATUS: CERTIFIED

Evidence
  ☑ Cada rol del alcance aterriza en su Workspace
  ☑ Sin landing genérico ambiguo para roles de departamento únicos
  ☑ Kitchen / Support / Accounting / Delivery alineados
  ☑ Tests: home-path · operations-workspaces · open-operations-center

Gate: PASS
```
