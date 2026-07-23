# Tenant Assets · EatClean

Primera instancia del patrón **Tenant Resources** (ADR 0014).

> Cambiar identidad de un cliente = cambiar esta carpeta + `BrandConfig`.  
> **No** bifurcar el código del producto.

| Doc | Rol |
|-----|-----|
| [TENANT_IMPLEMENTATION_EATCLEAN](../../docs/05-architecture/TENANT_IMPLEMENTATION_EATCLEAN.md) | Brief Cursor/Lovable |
| [TENANT_EXPERIENCE_SPEC](../../docs/05-architecture/TENANT_EXPERIENCE_SPEC.md) | Identidad / checklist |
| [TENANT_BRANDING](../../docs/05-architecture/TENANT_BRANDING.md) | Contrato BrandConfig |
| Web oficial | https://eatcleantenerifecatering.es/ |

## Inventario

| Archivo | Estado | Uso |
|---------|--------|-----|
| `brand.json` | ✅ | Paleta oficial web · tipografía · poweredBy |
| `copy.es.json` | ✅ | Login · home · claims |
| `logo.svg` | ✅ oficial | Logotipo web (`logo-DCRiXn3_.png` embebido) |
| `logo.png` | ✅ oficial | Misma pieza binaria |
| `icon.png` | ⏳ pending | App icon / favicon |
| `splash.webp` | ⏳ pending | Splash (hoy: `src/assets/eatclean-splash.jpg`) |
| `hero-home.webp` | ⏳ pending | Home hero |
| `onboarding-1.webp` … `3` | ⏳ pending | Onboarding |
| `empty-orders.webp` | ⏳ pending | Empty state pedidos |

Los binarios oficiales los aporta el Tenant (o se exportan de la web con licencia). No usar stock SaaS.

**Bundling:** copia espejo en `src/tenant/resources/` para Vite. Mantener sincronizado con esta carpeta.

## Convención para futuros tenants

```text
tenants/<tenant-slug>/
  brand.json
  copy.<locale>.json
  logo.svg · icon.png · splash.webp · …
  README.md
```
