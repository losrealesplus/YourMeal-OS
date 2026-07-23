# Tenant Brand

**Nivel OM:** 3 — Configuration Object *(no eslabón de la espina operacional)*  
**Código:** `TenantBrand` · `src/modules/branding/domain/tenant-brand.ts`  
**Owner:** Tenant  
**Capability:** `brand.manage`  
**ADR:** [0014](../../adr/0014-customer-application-is-tenant-branded.md)  
**Contrato de límites:** [BRAND_CONTRACT](../../05-architecture/BRAND_CONTRACT.md)

---

## Definición

> **Tenant Brand** describe la identidad visual oficial de un Tenant: logo, colores, (y a futuro tipografía, iconografía, imágenes y variantes) que la Customer Application y el Centro de Operaciones consumen en **runtime**.

No es una “faceta cosmética” del Tenant.  
Tiene **ciclo de vida propio** (crear / actualizar / limpiar logo · publicar colores), **capability** dedicada y **persistencia** (columnas + Storage).

---

## Incluye (v1 materializado)

| Campo | Notas |
|-------|--------|
| Logo | Path en bucket `tenant-branding` · URL firmada en lectura |
| `primary` | HEX |
| `primaryForeground` | HEX |
| `accent` | HEX |
| `updatedAt` | Auditoría de cambio |

### Extensiones futuras (mismo objeto)

Tipografía configurable · iconografía · splash · hero · onboarding · variantes (claro/oscuro) — siempre vía Brand Contract, no forks.

---

## Owner · Capabilities · Evidence · Runtime

| Dimensión | Valor |
|-----------|--------|
| **Owner** | Tenant |
| **Capabilities** | `brand.manage` (escritura) · lectura vía sesión/tenant para superficies Tenant-Branded |
| **Evidence** | FOV / checklist de marca · [BRAND_VALIDATION_CHECKLIST](../../05-architecture/BRAND_VALIDATION_CHECKLIST.md) |
| **Runtime** | `BrandingService` → `TenantBrandRepository` → Storage → `useTenantBrand()` → `TenantBrandScope` |

---

## Ciclo de vida

```text
(sin configurar) → fallback BrandConfig / defaults de plataforma
        ↓
company_admin / saas_admin edita (preview)
        ↓
Brand Contract OK
        ↓
Published (persistido)
        ↓
Superficies Tenant reflejan la marca
        ↓
(opcional) Clear logo / reset color → vuelve a fallback
```

---

## Filtro Core Object (transparencia)

| Pregunta | Respuesta |
|----------|-----------|
| ¿Existe en cualquier meal-prep SaaS multi-tenant? | Sí — identidad del operador |
| ¿Ciclo de vida propio? | Sí — independiente del pedido |
| ¿Sin interfaz? | Sí — datos + storage |
| ¿Nivel? | **3 Configuration** — no cocina/entrega |
| ¿Sobrevive 5 años? | Sí |

No promover a Nivel 1: no es eslabón de Order → Production → Delivery.

---

## Relacionado

- [level-3-configuration](./level-3-configuration.md)  
- [TENANT_BRANDING](../../05-architecture/TENANT_BRANDING.md)  
- [CAPABILITY_MATRIX](../../09-security/CAPABILITY_MATRIX.md)
