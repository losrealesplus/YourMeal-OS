# 🧭 DISCOVERY & ARCHITECTURAL BLUEPRINT
## Capacidad: Gestión de Imágenes de Platos y Menús (Dish & Menu Image Management)
### Document ID: `CR_OPS_DISH_MENU_IMAGE_MANAGEMENT_DISCOVERY.md`
**Council Date:** 28/09/2026  
**Status:** DISCOVERY / ARCHITECTURAL PROPOSAL (READ-ONLY · NO IMPLEMENTATION)  
**Governance:** Agency Core Governance · Strict Stop · Human Product Authority Gate  

---

## 1. Executive Summary

El presente informe técnico recoge el análisis del **Agent Council de YourMeal OS** respecto a la incorporación de la capacidad integral de **Gestión de Imágenes de Platos y Menús**.

### Hallazgo Central
1. **La base de datos ya cuenta con soporte preliminar:** La tabla `public.dishes` posee la columna `photo_url text NULL`, y la entidad de dominio `Dish` (`src/modules/dish-library/domain/entities/dish.ts`) junto con sus mappers (`DishRowMapper`) ya reconocen y transportan `photoUrl`.
2. **Existe un desacople en la capa de vista:** El contrato `MockDish` / `CatalogDish` utiliza actualmente un emoji estático (`CATALOG_EMOJI_PLACEHOLDER = "🍽️"`), mientras que el componente `DishThumb` (`src/components/consumer/dish-thumb.tsx`) ya fue programado con soporte para `imageSrc` condicional y fallback a gradiente/emoji.
3. **No existe actualmente soporte para override en el menú semanal:** La tabla `public.weekly_menu_slots` solo almacena la referencia relacional `dish_id`, sin capacidad de override contextual de imagen.
4. **Infraestructura de Storage existente y reutilizable:** YourMeal OS ya implementa en producción patrones seguros de Supabase Storage para `tenant-branding` con aislamiento estricto por RLS (`public.is_tenant_member` y `public.has_role(..., 'company_admin')`).

---

## 2. Current State Audit

### A. Base de Datos (`public.dishes`)
```sql
-- Estructura actual relevante en Supabase Production (nhirlpkuvonggctdzzad):
TABLE public.dishes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id),
    name text NOT NULL,
    description text,
    photo_url text, -- << Ya existe en DDL (actualmente NULL en los registros)
    ...
);
```

### B. Base de Datos (`public.weekly_menu_slots`)
```sql
TABLE public.weekly_menu_slots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    weekly_menu_id uuid NOT NULL REFERENCES public.weekly_menus(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id),
    day_date date,
    day_of_week smallint,
    sort_order integer NOT NULL,
    dish_id uuid NOT NULL REFERENCES public.dishes(id)
    -- NO existe actualmente columna para photo_override_url
);
```

### C. Capa de Dominio y Servicios
- `Dish.create()` y `Dish.update()` ya aceptan `photoUrl`.
- `DishService.update()` ya actualiza `patch.photo_url = input.photoUrl`.
- `admin.dishes.tsx` no expone en el formulario de edición el campo ni el control de upload para `photo_url`.
- `admin.menus.tsx` no expone controles para gestionar imágenes por slot.

---

## 3. Existing Infrastructure (Storage & Patterns)

YourMeal OS cuenta con una infraestructura probada en `src/modules/branding/infrastructure/tenant-brand-repository.ts`:
- **Bucket:** `tenant-branding` (público para lectura de activos de marca, protegido por RLS para escritura).
- **Convención de rutas:** `{tenant_id}/{asset_type}-{timestamp}.{ext}`.
- **Inmutabilidad por Timestamp:** El uso de `${Date.now()}` en el nombre del archivo garantiza que la CDN y el navegador no sirvan copias cacheadas tras un reemplazo.
- **Eliminación Best-Effort:** Los reemplazos ejecutan `removeObject([oldPath])` sin bloquear la transacción principal.

---

## 4. Domain Model

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                              TENANT                                     │
│  (EatClean: 8bba00ba-331b-42c8-9283-4e3836ffb870)                      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
┌───────────────────────────────┐               ┌─────────────────────────────────┐
│             DISH              │               │       WEEKLY MENU SLOT          │
│  (Entidad Canónica Catálogo)  │               │      (Contexto Temporal)        │
├───────────────────────────────┤               ├─────────────────────────────────┤
│ id: UUID                      │               │ id: UUID                        │
│ name: Text                    │               │ weekly_menu_id: UUID            │
│ price: Decimal (11.90 €)      │               │ day_date: Date (2026-09-28)     │
│ photo_url: String | Null      │◄──────────────┤ sort_order: Integer (1..7)      │
│   (Imagen Canónica)           │    Fallback   │ dish_id: UUID                   │
└───────────────────────────────┘   Automático  │ photo_override_url: Str | Null  │
                                                │   (Imagen Específica de Semana) │
                                                └────────────────┬────────────────┘
                                                                 │
                                                                 ▼
                                                ┌─────────────────────────────────┐
                                                │     RESOLUCIÓN EN RUNTIME       │
                                                ├─────────────────────────────────┤
                                                │ effectivePhotoUrl =             │
                                                │   slot.photo_override_url ??    │
                                                │   dish.photo_url ??             │
                                                │   null                          │
                                                └─────────────────────────────────┘
```

---

## 5. Core vs Instance Boundary

| Dimensión | Responsabilidad Core (YourMeal OS) | Responsabilidad Instance (EatClean) |
| :--- | :--- | :--- |
| **Lógica y Contratos** | Definición de tipos, servicios de subida, componentes UI (`DishPhotoUploader`, `DishThumb`), resolución de fallback. | Consumo de la UI, subida de archivos reales. |
| **Almacenamiento** | Definición de buckets de storage, políticas RLS y rutas seguras. | Archivos binarios (JPG/PNG/WebP) pertenecientes a sus platos. |
| **Aislamiento** | Enforcement de que ningún tenant acceda o sobreescriba assets de otro tenant. | Custodia de su propio catálogo visual. |
| **Identidad Visual** | Componente de fallback "Sin imagen" (`🍽️`). | Fotografías reales de sus elaboraciones gastronómicas. |

---

## 6. Storage Architecture

### A. Bucket Strategy: `tenant-media`
Se propone la creación de un bucket unificado para medios de catálogo y menús:
- **Bucket ID:** `tenant-media`
- **Public:** `true` (las fotos de platos son recursos públicos de cara a comensales y app cliente).
- **File Size Limit:** `5 MB` (5,242,880 bytes).
- **Allowed MIME Types:** `image/jpeg`, `image/png`, `image/webp`. *(SVG explícitamente prohibido para evitar XSS almacenado)*.

### B. Path Conventions
1. **Foto Canónica de Plato:**
   `{tenant_id}/dishes/{dish_id}/canonical-{timestamp}.{ext}`
2. **Foto Específica de Menú (Slot):**
   `{tenant_id}/menus/{weekly_menu_id}/slots/{slot_id}/override-{timestamp}.{ext}`

### C. Lifecycle y Reemplazo
- **Subida:** Se sube el nuevo archivo con nuevo timestamp.
- **Persistencia en DB:** Se actualiza `photo_url` o `photo_override_url` con la ruta relativa del storage o URL pública.
- **Limpieza de Huérfanos:** Best-effort cleanup del archivo anterior en el Storage mediante `supabase.storage.from('tenant-media').remove([oldPath])`.

---

## 7. Database Architecture: Evaluación de Opciones

### Opción A: Direct Path Columns (Recomendada para MVP)
- **Modificación:** Reutilizar `dishes.photo_url` existente y añadir `weekly_menu_slots.photo_override_url text NULL`.
- **Pros:** Cero sobreingeniería, encaja al 100% con el código actual de `DishService` y `weekly-menu-repository`, máxima velocidad de consulta (sin joins adicionales).
- **Contras:** Metadatos (peso, dimensiones) no se persisten en tabla relacional.

### Opción B: `media_assets` Dedicado (Evolución Futura)
- **Modificación:** Crear tabla `media_assets (id, tenant_id, file_path, file_size, mime_type, width, height, created_at)` y claves foráneas en `dishes` y `slots`.
- **Pros:** Ideal para galerías múltiples, banco de imágenes compartido y metadatos avanzados.
- **Contras:** Complejidad prematura para la necesidad operativa actual (1 foto por plato + 1 override por slot).

> **Recomendación del Council:** Adoptar la **Opción A** para el MVP, manteniendo las rutas estructuradas para que una futura migración a la **Opción B** sea una simple extracción de metadatos sin mover archivos físicos.

---

## 8. RLS / Security Model & Threat Model

### A. Políticas de Storage en `storage.objects`

```sql
-- 1. Lectura pública (assets de catálogo/menú)
CREATE POLICY "tenant_media_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'tenant-media');

-- 2. Escritura (Solo administradores del Tenant)
CREATE POLICY "tenant_media_admin_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-media'
  AND (
    public.is_saas_admin(auth.uid())
    OR public.has_role(auth.uid(), NULLIF(split_part(name, '/', 1), '')::uuid, 'company_admin')
    OR public.has_role(auth.uid(), NULLIF(split_part(name, '/', 1), '')::uuid, 'staff')
  )
);

-- 3. Borrado (Solo administradores del Tenant)
CREATE POLICY "tenant_media_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-media'
  AND (
    public.is_saas_admin(auth.uid())
    OR public.has_role(auth.uid(), NULLIF(split_part(name, '/', 1), '')::uuid, 'company_admin')
  )
);
```

### B. Threat Model & Controles Obligatorios
1. **Cross-Tenant Overwrite:** Imposible gracias a la comprobación de `split_part(name, '/', 1)::uuid` contra el `tenant_id` del usuario autenticado en RLS.
2. **Archivos Maliciosos / XSS:** Prohibición estricta de SVG y tipos ejecutables. Solo `image/jpeg`, `image/png`, `image/webp`.
3. **Denegación de Servicio por Archivos Gigantes:** Límite duro en bucket de 5MB y compresión en cliente a máximo 1600px antes de subir.

---

## 9. UX Proposal

### A. Vista Platos → Editar Plato (`admin.dishes.tsx`)
```text
┌────────────────────────────────────────────────────────┐
│ Fotografía del Plato                                   │
├────────────────────────────────────────────────────────┤
│ ┌──────────────────┐                                  │
│ │                  │  [ 📷 Subir Imagen ]              │
│ │     PREVIEW      │  [ 🔄 Reemplazar ]                │
│ │   (o Sin Foto)   │  [ 🗑️ Eliminar ]                  │
│ │                  │  Formatos: JPG, PNG, WebP (Max 5MB)│
│ └──────────────────┘                                  │
└────────────────────────────────────────────────────────┘
```

### B. Vista Menús → Detalle de Slot de Menú (`admin.menus.tsx`)
```text
┌────────────────────────────────────────────────────────┐
│ Fotografía para este Menú                              │
├────────────────────────────────────────────────────────┤
│ (•) Usar foto oficial del catálogo                     │
│     [ Miniatura Foto Catálogo ]                        │
│                                                        │
│ ( ) Usar presentación especial para esta semana       │
│     [ + Subir foto de menú ]                           │
└────────────────────────────────────────────────────────┘
```

---

## 10. Dish Image vs Menu Override & Lifecycle

1. **Regla de Inmutabilidad Cruzada:** Modificar o eliminar la foto específica de un menú **nunca** afecta la foto base del plato en el catálogo.
2. **Regla de Borrado Canónico:** Si se elimina la foto del catálogo, los menús que utilizaban fallback pasan inmediatamente a mostrar el placeholder `"🍽️ Sin imagen"`. Los menús con override específico conservan su imagen intacta.
3. **Regla de Pedidos Históricos:** Los pedidos pasados no deben romperse por cambios de imagen. La UI de detalle de pedido renderiza la foto actual o el fallback estándar sin generar errores 404.

---

## 11. Performance & Accessibility

1. **Optimización de Carga:** Componente `DishThumb` implementa `loading="lazy"` y `decoding="async"`.
2. **Dimensiones fijas:** Evitar Content Layout Shift (CLS) utilizando clases con ratio fijo (`aspect-[4/3]` / `size-24`).
3. **Accesibilidad:** Etiqueta `alt` descriptiva basada en el nombre del plato (`alt={dish.name}`), o `aria-hidden` para elementos puramente decorativos cuando el título está adyacente.

---

## 12. MVP Scope vs Explicit Non-Goals

### ✅ Alcance MVP (Fase 1)
- Subida, reemplazo y borrado de 1 foto canónica por plato en `Admin > Platos`.
- Visualización de la foto en `DishCard`, `DishThumb`, catálogo y menú semanal.
- Fallback automático elegante cuando no existe foto (`🍽️ Sin imagen`).
- Aislamiento multi-tenant 100% verificado en Supabase Storage.

### 🚫 Non-Goals Explícitos para el MVP (Fases Futuras)
- Galerías de múltiples fotos por plato.
- Editor / recortador integrado de imágenes en el navegador.
- Generación de imágenes mediante Inteligencia Artificial (violación del principio *No False Data*).
- Banco global de imágenes compartido entre distintos tenants.

---

## 13. QA / Product Capability Certification Plan (21 Gates)

| Gate | Categoría | Criterio de Verificación |
| :--- | :--- | :--- |
| **G1** | CODE | Tipos TypeScript estrictos para `photoUrl` y `photoOverrideUrl`. |
| **G2** | BUILD | Compilación limpia sin errores en Worker ni App. |
| **G3** | DEPLOY | Despliegue en Worker sin regresiones. |
| **G4** | ROUTE | Rutas `/admin/dishes` y `/admin/menus` responden 200. |
| **G5** | RBAC | Solo roles autorizados (`company_admin`, `staff`) pueden subir/eliminar imágenes. |
| **G6** | STORAGE RLS | Intentos de subida a carpetas de otro tenant son rechazados con 403. |
| **G7** | UPLOAD | Subida exitosa de JPG/PNG/WebP hasta 5MB. |
| **G8** | MIME BLOCK | Rechazo de archivos `.exe`, `.svg`, `.pdf`. |
| **G9** | PREVIEW | Visualización inmediata de la miniatura tras la subida. |
| **G10** | PERSISTENCE | `photo_url` guardado en DB tras confirmar formulario. |
| **G11** | RELOAD | La imagen persiste tras refrescar el navegador (F5). |
| **G12** | REPLACE | Reemplazar imagen elimina o desvincula la anterior sin caché residual. |
| **G13** | DELETE | Eliminar foto deja `photo_url = NULL` y muestra fallback. |
| **G14** | FALLBACK | Platos sin imagen muestran `DishThumb` sin errores. |
| **G15** | MENU DISPLAY | Menú semanal renderiza fotos de platos automáticamente. |
| **G16** | MENU OVERRIDE | Subir override en un slot no modifica el catálogo general. |
| **G17** | MENU RESTORE | Eliminar override en slot restaura la foto de catálogo. |
| **G18** | TENANT ISOLATION | Tenant B no puede ver ni mutar assets del Tenant A. |
| **G19** | HISTORICAL INTEGRITY | Pedidos históricos no fallan si un plato cambia de imagen. |
| **G20** | RESPONSIVE | Comportamiento verificado en móvil, tablet y desktop. |
| **G21** | PERFORMANCE | Menú de 35 platos carga fluido con lazy loading sin picos de memoria. |

---

## 14. Proposed Future CR Breakdown

1. **`CR-OPS-04 · Dish Canonical Image Management (Catalog Core)`**
   - Creación de bucket `tenant-media` con políticas RLS de tenant.
   - Integración de upload/replace/delete en `Admin > Platos > Editar Plato`.
   - Proyección de `photo_url` a `DishCard` y `DishThumb`.
2. **`CR-OPS-05 · Weekly Menu Slot Image Override`**
   - Adición de `photo_override_url` en `weekly_menu_slots`.
   - Selector contextual en `Admin > Menús`.
   - Resolución prioritaria en `useWeeklyMenu`.

---

## 15. Decisiones que Requieren Human Product Authority

1. **¿Aprobación del Bucket Unificado `tenant-media` público para lectura?**
   *(Recomendado: Sí, simplifica entrega vía CDN y caché de navegador).*
2. **¿Aprobación del enfoque incremental (Opción A para MVP)?**
   *(Recomendado: Sí, entrega valor operativo inmediato sin sobrecoste de schema).*
3. **¿Aprobación del Scope Lock para CR-OPS-04 como siguiente paso?**
   *(Pendiente de decisión formal).*

---
*Fin del Documento de Discovery · Agent Council YourMeal OS*
