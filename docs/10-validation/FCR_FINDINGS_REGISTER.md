# Functional Completeness Review · Findings Register

**Modo:** Functional Review Mode (Bootstrap / Development Identity Adapter)  
**Identity source:** `BootstrapIdentityProvider`  
**Auth producción:** **NO** certificada en esta pasada  
**Regla de trabajo:** anotar → agrupar → corregir por bloques. No parchear hallazgo a hallazgo.

Checklist de recorrido: [BOOTSTRAP_FCR_CHECKLIST](./BOOTSTRAP_FCR_CHECKLIST.md)  
Matriz de acceso: [RBAC_MATRIX_V1](./RBAC_MATRIX_V1.md)  
Investigación titileo: [FCR002_FLICKER_INVESTIGATION](./FCR002_FLICKER_INVESTIGATION.md)

---

## Severidad

| | |
|--|--|
| **P0** | Bloquea la operación |
| **P1** | Existe / accesible pero incorrecto o incompleto |
| **P2** | UX |
| **P3** | Visual / detalle |

---

## Registro

| ID | Hallazgo | Severidad | Tema | Estado | Notas |
|----|----------|-----------|------|--------|-------|
| **FCR-001** | Separación insuficiente Company Admin vs SaaS Admin en `/admin/settings` (mismas entradas: Marca, Comercial, Clientes, Soporte, Usuarios, Auditoría) | **P1** | RBAC / superficies | Pendiente | SaaS Admin no es «Company Admin +». Ver RBAC-001 + Business vs Platform Branding |
| **FCR-002** | Titileo / vibración durante navegación Ops | **P1** | Render / navegación | Investigar | Hipótesis principal: `can` inestable en deps de `admin.index` + `animate-fade-in` / `ops-home-in` al remount. Ver acta FCR-002 |
| **FCR-003** | Superficie de Operaciones (departamentos) validada visualmente | ✅ | Producto | Validado | Coherencia Ops: Cocina / Reparto / Atención / Comercial — no ERP genérico |
| **FCR-004** | Landing Kitchen: esperado `/admin/kitchen-execution`; código → `/admin/kitchen` | **P2** | Navegación | Pendiente | `homePathForRoles` |
| **FCR-005** | Landing Support / Accounting: esperado `/admin/support` y `/admin/accounting`; código → `/admin` | **P2** | Navegación | Pendiente | `homePathForRoles` no especializa esos roles |
| **FCR-006** | Perfil Bootstrap «SaaS Admin» incluye `company_admin` + `saas_admin` → home `/admin` (no `/saas`) | ⚠ | Bootstrap / home | Documentado | Alineado con diseño actual («staff + saas → tenant home + entry SaaS»). Confirmar en FCR si entry `/saas` es suficiente |

---

## RBAC-001 (regla — no implementada aún)

```text
SaaS Admin  ⊃  capacidades de plataforma (+ acceso tenant cuando aplique)
Company Admin  ⊄  superficies SaaS (/saas, tenants, PO, flags globales, branding plataforma)
```

| Dominio | Company Admin | SaaS Admin |
|---------|---------------|------------|
| Business Branding (logo/colores/nombre del tenant) | ✅ | vía tenant o N/A |
| Platform Branding (YourMeal OS / white-label global) | ❌ | ✅ |
| Tenants · Licencias · Platform Owners · Feature flags globales | ❌ | ✅ |
| Cocina · Reparto · Clientes · Usuarios tenant · Producción | ✅ | acceso tenant si opera como admin; **superficie distinta** en `/saas` |

`/admin` = EatClean (tenant).  
`/saas` = otra aplicación (plataforma), no otro menú dentro de Ajustes.

---

## Plan de bloques (cuando cierre la pasada FCR)

1. **Bloque RBAC / superficies** — FCR-001 (+ entradas menú SaaS vs tenant)
2. **Bloque render** — FCR-002
3. **Bloque landings** — FCR-004, FCR-005, FCR-006
4. Revertir smoke force (`BOOTSTRAP_SMOKE_FORCE_ON`) cuando FCR ya no lo necesite; activar solo con `VITE_BOOTSTRAP_MODE`

---

## Cierre de sesión de evidencia

```text
Identity source: BootstrapIdentityProvider
Banner visible: sí
Auth producción: NO certificada
```

Fecha · revisor · commit tip:
