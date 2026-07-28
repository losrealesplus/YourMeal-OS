# Workspace Entry Policy (WEP-001)

**Estado:** **CERTIFIED** (EP-OPS-002 · 2026-07-28)  
**Fuente de verdad en código:** [`homePathForRoles`](../../src/lib/home-path.ts) · [`resolveOperationsEntry`](../../src/lib/operations-workspaces.ts) · [`decideOperationsCenterEntry`](../../src/lib/open-operations-center.ts)  
**Relacionado:** [LANDING_POLICY_VALIDATION](./LANDING_POLICY_VALIDATION.md) · [SURFACE_MATRIX](./SURFACE_MATRIX.md)

---

## Principio

```text
Autorización (RBAC)     →  ¿Qué puede hacer?
Workspace Entry (WEP)   →  ¿Dónde empieza a trabajar?
```

No son lo mismo. Un rol puede *poder* abrir `/admin` y aun así *debe* aterrizar en su workspace.

**Nunca:** landing genérico → el usuario decide dónde entrar.

---

## Política certificada

| Rol | Landing | Surface | Workspace |
|-----|---------|---------|-----------|
| Platform Owner / puro `saas_admin` | `/saas` | Platform | Platform Ops |
| SaaS Admin híbrido (`company_admin`+`saas_admin`) | `/admin` | Tenant (tenant-first) | Operations Center |
| Company Admin | `/admin` | Tenant | Operations Center |
| Operations Manager | `/admin` | Tenant | Operations Center |
| Kitchen / Production | `/admin/kitchen` | Tenant | Kitchen Workspace |
| Delivery / Logistics | `/admin/delivery` | Tenant | Delivery Workspace |
| Support | `/admin/support` | Tenant | Support Workspace |
| Accounting | `/admin/accounting` | Tenant | Accounting Workspace |
| Inventory / Purchasing | `/admin/inventory` | Tenant | Stock Workspace |
| Driver | `/driver` | Driver | Driver |
| Customer | `/app` | Customer | Customer Dashboard |

### Kitchen canónico

Workspace de entrada = **`/admin/kitchen`**.  
`/admin/kitchen-execution` es una **pantalla operativa secundaria** dentro del workspace (no el landing).  
Cierra FCR-004 como decisión de producto (no gap).

### Híbrido Platform + Tenant

Si el actor tiene roles de staff Tenant **y** `saas_admin`, el landing es **Tenant-first** (`/admin`).  
Platform permanece accesible vía entry SaaS (`saas.manage`), no como segundo landing ambiguo.  
Cierra FCR-006 como política documentada.

---

## Mecanismo

| Punto de entrada | Función |
|------------------|---------|
| Login / OAuth callback / `"/"` | `resolveHomePath` → `homePathForRoles` |
| `/auth/admin` post-login | `resolvePostAdminLoginPath` / `enterOperationsCenter` |
| Brand / “Centro de Operaciones” | `decideOperationsCenterEntry` |
| Bootstrap selector / DEV panel | `homePathForRoles` |

Staff con **un solo** workspace autorizado → `resolveOperationsEntry` → **direct**.  
Admin / multi-workspace → Operations Center `/admin`.

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
