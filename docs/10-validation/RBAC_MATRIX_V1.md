# RBAC Matrix v1 · Functional Review Mode

**Estado:** Borrador de certificación (esperado vs observado Bootstrap)  
**No corrige permisos** — alimenta el bloque de fixes tras la pasada FCR.  
**Eje:** Autorización por **superficie** (Tenant / Platform / Customer) — no «usuario vs usuario».  
**Landings:** [WORKSPACE_ENTRY_POLICY](./WORKSPACE_ENTRY_POLICY.md) (eje distinto).  
**Regla:** [RBAC-001](./FCR_FINDINGS_REGISTER.md)

Leyenda: ✅ permitido · ❌ denegado · ⚠ parcial / ambiguo · □ por recorrer

```text
Tenant Surface     →  /admin
Platform Surface   →  /saas
Customer Surface   →  /app
```

---

## Landings (resumen — ver Entry Policy)

| Perfil | Landing (post-corrección EP-OPS-002) | Superficie de entrada |
|--------|--------------------------------------|------------------------|
| Customer | `/app` | Customer |
| Kitchen | `/admin/kitchen` | Tenant · Workspace |
| Delivery | `/admin/delivery` | Tenant · Workspace |
| Support | `/admin/support` | Tenant · Workspace |
| Accounting | `/admin/accounting` | Tenant · Workspace |
| Company Admin | `/admin` | Tenant Surface |
| SaaS Admin (puro) | `/saas` | Platform Surface |
| SaaS Admin (híbrido Bootstrap) | `/admin` | Tenant-first |

**Estado:** READY FOR RE-CERTIFICATION · [WORKSPACE_ENTRY_POLICY](./WORKSPACE_ENTRY_POLICY.md) · [SURFACE_MATRIX](./SURFACE_MATRIX.md).

---

## Autorización por pantalla (Tenant / Platform / Customer)

Columnas = roles de sesión Bootstrap. Filas = rutas.  
SaaS Admin en columnas Tenant = acceso *al tenant* solo si el producto lo concede; su superficie nativa es Platform.

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
| `/admin/settings` hub | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ⚠ híbrido Tenant settings (FCR-001 Corrected) |
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
| Ajustes Tenant: mismas tiles con o sin rol Platform | **FCR-001** · Tenant vs Platform Surface |
| SaaS Admin Entry Policy → `/saas` | □ · FCR-006 |
| Render Stability (titileo Ops) | **FCR-002** |

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
