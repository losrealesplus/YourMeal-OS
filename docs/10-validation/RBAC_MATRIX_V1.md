# RBAC Matrix v1 · Functional Review Mode

**Estado:** Borrador de certificación (esperado vs observado Bootstrap)  
**No corrige permisos** — alimenta el bloque de fixes tras la pasada FCR.  
**Regla:** [RBAC-001 en FCR_FINDINGS_REGISTER](./FCR_FINDINGS_REGISTER.md)

Leyenda: ✅ permitido · ❌ denegado · ⚠ parcial / ambiguo · □ por recorrer

---

## Home path esperado (producto)

| Perfil | Landing esperado |
|--------|------------------|
| Customer | `/app` |
| Kitchen | `/admin/kitchen-execution` |
| Delivery | `/admin/delivery` |
| Support | `/admin/support` |
| Accounting | `/admin/accounting` |
| Company Admin | `/admin` (EatClean Ops) |
| SaaS Admin | `/admin` **y** `/saas` (plataformas distintas) |

**Código actual (`homePathForRoles`):** Kitchen → `/admin/kitchen` · Support/Accounting → `/admin` · SaaS+company_admin → `/admin`. Ver FCR-004/005/006.

---

## Superficies

| Pantalla / ruta | Customer | Kitchen | Delivery | Support | Accounting | Company Admin | SaaS Admin |
|-----------------|----------|---------|----------|---------|------------|---------------|------------|
| `/app` Home | ✅ | ❌ | ❌ | ❌ | ❌ | ❌* | ❌* |
| Menú semanal | ✅ | ❌ | ❌ | ❌ | ❌ | ❌* | ❌* |
| Pedido / programación | ✅ | ❌ | ❌ | ❌ | ❌ | ❌* | ❌* |
| Historial | ✅ | ❌ | ❌ | ❌ | ❌ | ❌* | ❌* |
| Favoritos / preferencias | ✅ | ❌ | ❌ | ❌ | ❌ | ❌* | ❌* |
| Perfil cliente | ✅ | ❌ | ❌ | ❌ | ❌ | ❌* | ❌* |
| `/admin` Ops home | ❌ | ⚠ | ⚠ | ⚠ | ⚠ | ✅ | ✅ (tenant) |
| `/admin/kitchen` | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ (tenant) |
| `/admin/kitchen-execution` | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ (tenant) |
| `/admin/delivery` | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ (tenant) |
| `/admin/support` | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ (tenant) |
| `/admin/accounting` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ (tenant) |
| `/admin/customers` | ❌ | ❌ | ❌ | ⚠ | ❌ | ✅ | ✅ (tenant) |
| `/admin/companies` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ (tenant) |
| `/admin/production*` | ❌ | ⚠ | ❌ | ❌ | ❌ | ✅ | ✅ (tenant) |
| `/admin/users` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ (tenant) |
| `/admin/audit` (tenant) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ (tenant) |
| `/admin/branding` **Business** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ⚠ (tenant) |
| `/admin/settings` hub | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ⚠ **FCR-001** |
| `/admin/commercial` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ⚠ |
| `/saas` Overview | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/saas/tenants` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Platform Owners / company-admin SaaS | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/saas/roles` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/saas/audit` global | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/saas` feature flags / settings | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/saas/branding` **Platform** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Licencias / domains | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

\* Company/SaaS Admin no usan Customer App como home; acceso excepcional fuera de alcance FCR.

---

## Observado en FCR (sesión Bootstrap)

| Check | Resultado |
|-------|-----------|
| Selector muestra Company Admin (`company_admin`) vs SaaS Admin (`company_admin, saas_admin`) | ✅ perfiles OK |
| Company Admin → `/admin` EatClean | □ confirmar en pasada |
| Company Admin → no navega a `/saas` por defecto | □ |
| Company Admin Ajustes ≈ mismas tiles que SaaS Admin en `/admin/settings` | **FCR-001** observado |
| SaaS Admin tiene entry a `/saas` desde Ops | □ |
| Titileo en navegación Ops | **FCR-002** |

---

## Branding (separación conceptual)

| Concepto | Ruta propuesta | Rol |
|----------|----------------|-----|
| Business Branding | `/admin/branding` | Company Admin (tenant) |
| Platform Branding | `/saas/branding` | SaaS Admin only |

Hoy «Marca del negocio» en Ajustes apunta a `/admin/branding` — correcto para **tenant** si el copy lo deja claro. No debe mutar marca YourMeal OS.

---

## Próximo paso

Completar celdas □ con recorrido de los 7 perfiles Bootstrap.  
No cambiar `src/permissions` hasta cerrar la matriz observada.
