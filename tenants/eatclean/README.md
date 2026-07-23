# Tenant Assets · EatClean

Primera instancia del patrón **Tenant Resources** (ADR 0014).

> Cambiar identidad de un cliente = cambiar esta carpeta + `BrandConfig`.  
> **No** bifurcar el código del producto.

| Fuente | Aporta |
|--------|--------|
| [Web oficial](https://eatcleantenerifecatering.es/) | Brand identity · confianza · tono institucional |
| Instagram EatClean | **Product identity** · fotos reales · platos · menú semanal · comunicación diaria |

La Customer App fusiona ambas. Instagram es referencia visual principal del producto (platos), no layout SaaS.

## Inventario

| Ruta | Estado | Uso |
|------|--------|-----|
| `brand.json` | ✅ stub | Paleta · tipografía · poweredBy → BrandConfig |
| `copy.es.json` | ✅ stub | Login · home · claims |
| `brand/` | 📁 | Logo · icon · splash oficiales |
| `copy/` | 📁 | Copy adicional por locale |
| `media/` | 📁 | Fotografías de producto (platos) |
| `weekly-menu/` | 📁 | Assets del menú semanal publicado |
| `promotions/` | 📁 | Promos / novedades de temporada |
| `onboarding/` | 📁 | Imágenes onboarding (≤3) |

Binarios oficiales: los aporta el Tenant. No usar stock genérico.

**Bundling:** espejo en `src/tenant/resources/` para Vite. Mantener sincronizado.

## Convención

```text
tenants/<tenant-slug>/
  brand.json · copy.<locale>.json · README.md
  brand/ · copy/ · media/ · weekly-menu/ · promotions/ · onboarding/
```
