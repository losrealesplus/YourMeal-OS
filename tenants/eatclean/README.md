# Tenant Assets · EatClean

Primera instancia del patrón **Tenant Resources** (ADR 0014 / Tenant Experience).

> Cambiar identidad de un cliente = cambiar esta carpeta + `BrandConfig`.  
> **No** bifurcar el código del producto.  
> Un nuevo tenant se crea mediante **recursos + configuración**, nunca mediante forks.

| Fuente | Aporta |
|--------|--------|
| [Web oficial](https://eatcleantenerifecatering.es/) | Brand identity · confianza · tono institucional |
| Instagram EatClean | **Product identity** · fotos reales · platos · menú semanal · comunicación diaria |

La Customer App fusiona ambas. Instagram es la referencia visual principal del producto (platos).

| Doc | Rol |
|-----|-----|
| [TENANT_IMPLEMENTATION_EATCLEAN](../../docs/05-architecture/TENANT_IMPLEMENTATION_EATCLEAN.md) | Implementación específica EatClean |
| [TENANT_EXPERIENCE_SPEC](../../docs/05-architecture/TENANT_EXPERIENCE_SPEC.md) | Reglas permanentes de experiencia |
| [TENANT_BRANDING](../../docs/05-architecture/TENANT_BRANDING.md) | Contrato BrandConfig |
| Web oficial | https://eatcleantenerifecatering.es/ |

## Inventario

### Configuración (BrandConfig)

| Archivo | Estado | Uso |
|---------|--------|-----|
| `brand.json` | ✅ | Paleta oficial · tipografía · poweredBy → BrandConfig |
| `copy.es.json` | ✅ | Login · home · claims · Centro de Operaciones |

### Carpetas de assets

| Ruta | Estado | Uso |
|------|--------|-----|
| `brand/` | 📁 | Logo · icon · splash oficiales |
| `copy/` | 📁 | Copy adicional por locale |
| `copy/drafts/` | 📁 | Borradores no publicados (p. ej. guías product-led) |
| `media/` | 📁 | Fotografías de producto (platos) |
| `weekly-menu/` | 📁 | Assets del menú semanal publicado |
| `promotions/` | 📁 | Promos / novedades de temporada |
| `onboarding/` | 📁 | Imágenes onboarding (≤3) |

### Piezas oficiales ya publicadas / pendientes

| Archivo | Estado | Uso |
|---------|--------|-----|
| `logo.svg` | ✅ oficial | Logotipo web (embebido desde pieza oficial) |
| `logo.png` | ✅ oficial | Misma pieza binaria |
| `icon.png` | ⏳ pending | App icon / favicon → `brand/` |
| `splash.webp` | ⏳ pending | Splash (hoy: `src/assets/eatclean-splash.jpg`) → `brand/` |
| `hero-home.webp` | ⏳ pending | Home hero → `media/` |
| `onboarding-1.webp` … `3` | ⏳ pending | Onboarding → `onboarding/` |
| `empty-orders.webp` | ⏳ pending | Empty state pedidos → `media/` |

Los binarios oficiales los aporta el Tenant (o se exportan de la web / Instagram con licencia). No usar stock genérico ni stock SaaS.

**BrandConfig:** `brand.json` + tipografía/paleta alimentan el runtime vía BrandConfig. No hay forks de producto por tenant.

**Bundling:** espejo en `src/tenant/resources/` (+ fotos en `src/assets/` cuando aplique) para Vite. Mantener sincronizado con esta carpeta.

## Convención para futuros tenants

```text
tenants/<tenant-slug>/
  brand.json
  copy.<locale>.json
  README.md
  brand/
  copy/
  media/
  weekly-menu/
  promotions/
  onboarding/
```
