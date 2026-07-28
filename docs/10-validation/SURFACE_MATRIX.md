# Surface Matrix · EP-OPS-002

**Estado:** Completa · CERTIFIED con RBAC-001 / WEP-001 / LP-001  
**Fecha:** 2026-07-28

---

## Matriz principal

| Rol | Surface | Workspace | Landing |
|-----|---------|-----------|---------|
| Platform Owner / puro `saas_admin` | Platform | Platform Ops | `/saas` |
| SaaS Admin (híbrido `company_admin`+`saas_admin`) | Tenant (entry) · Platform (entry opcional) | Operations Center | `/admin` |
| Company Admin | Tenant | Operations Center | `/admin` |
| Operations | Tenant | Operations Center | `/admin` |
| Kitchen | Tenant | Kitchen | `/admin/kitchen` |
| Delivery | Tenant | Delivery | `/admin/delivery` |
| Support | Tenant | Support | `/admin/support` |
| Accounting | Tenant | Accounting | `/admin/accounting` |
| Customer | Customer | Customer Dashboard | `/app` |

*Operations* = `operations_manager` (y Company Admin como superconjunto).

---

## Operaciones permitidas / prohibidas (por rol)

### Platform Owner / puro SaaS Admin

| Permitido | Prohibido |
|-----------|-----------|
| `/saas/*` · tenants · licencias · owners · config global | Usar Platform como sustituto de cocina/reparto del día |
| Entrada Tenant solo si RBAC lo concede (`hasStaffAccess`) | Landing ambiguo a Customer App |

### Company Admin

| Permitido | Prohibido |
|-----------|-----------|
| Todo Tenant Ops `/admin/*` según capabilities de admin | `/saas` sin `saas.manage` → redirect `/admin` |
| Configuración del negocio | Gestión Platform Owners / licencias globales |

### Kitchen

| Permitido | Prohibido |
|-----------|-----------|
| Kitchen workspace · ejecución cocina (capability) | Platform `/saas` · Admin settings · Accounting |
| | Customer App como home |

### Delivery

| Permitido | Prohibido |
|-----------|-----------|
| Delivery / routes (logistics.operate) | Platform · Kitchen write · Accounting |
| | Customer App como home |

### Support

| Permitido | Prohibido |
|-----------|-----------|
| Support workspace · lectura clientes/soporte | Platform · producción/cocina write · settings admin |
| | Customer App como home |

### Accounting

| Permitido | Prohibido |
|-----------|-----------|
| Accounting workspace | Platform · cocina/reparto operate |
| | Customer App como home |

### Customer

| Permitido | Prohibido |
|-----------|-----------|
| `/app` · menú · pedidos · perfil | `/admin/*` · `/saas/*` · workspaces internos |

---

## Referencias

- [RBAC_SURFACE_CERTIFICATION](./RBAC_SURFACE_CERTIFICATION.md)
- [WORKSPACE_ENTRY_POLICY](./WORKSPACE_ENTRY_POLICY.md)
- [LANDING_POLICY_VALIDATION](./LANDING_POLICY_VALIDATION.md)
- [SURFACE_NAVIGATION_REPORT](./SURFACE_NAVIGATION_REPORT.md)
