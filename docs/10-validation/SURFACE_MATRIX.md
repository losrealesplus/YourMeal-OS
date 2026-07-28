# Surface Matrix · EP-OPS-002 (comportamiento final)

**Estado:** **READY FOR RE-CERTIFICATION**  
**Fecha:** 2026-07-28  
**Nota:** Solo comportamiento post-corrección. Certificación en pasada RI-001.

---

## Matriz

| Rol | Surface | Workspace | Landing |
|-----|---------|-----------|---------|
| Platform Owner / puro `saas_admin` | Platform | Platform Ops | `/saas` |
| SaaS Admin híbrido (`company_admin`+`saas_admin`) | Tenant (entry) · Platform (opcional) | Operations Center | `/admin` |
| Company Admin | Tenant | Operations Center | `/admin` |
| Operations (`operations_manager`) | Tenant | Operations Center | `/admin` |
| Kitchen | Tenant | Kitchen | `/admin/kitchen` |
| Delivery | Tenant | Delivery | `/admin/delivery` |
| Support | Tenant | Support | `/admin/support` |
| Accounting | Tenant | Accounting | `/admin/accounting` |
| Customer | Customer | Customer Dashboard | `/app` |

---

## Permitido / prohibido (resumen)

| Rol | Permitido | Prohibido |
|-----|-----------|-----------|
| Puro SaaS Admin | `/saas/*` | Sustituir operación diaria Tenant; landing Customer |
| Company Admin | Tenant `/admin/*` (caps admin) | `/saas` sin `saas.manage` |
| Kitchen | Kitchen workspace | Platform · settings admin · accounting |
| Delivery | Delivery / logistics | Platform · kitchen write · accounting |
| Support | Support workspace | Platform · producción write · settings admin |
| Accounting | Accounting workspace | Platform · cocina/reparto operate |
| Customer | `/app` | `/admin/*` · `/saas/*` · workspaces internos |

---

## Referencias de corrección

- [RBAC_SURFACE_CERTIFICATION](./RBAC_SURFACE_CERTIFICATION.md)
- [WORKSPACE_ENTRY_POLICY](./WORKSPACE_ENTRY_POLICY.md)
- [LANDING_POLICY_VALIDATION](./LANDING_POLICY_VALIDATION.md)
- [SURFACE_NAVIGATION_REPORT](./SURFACE_NAVIGATION_REPORT.md)
