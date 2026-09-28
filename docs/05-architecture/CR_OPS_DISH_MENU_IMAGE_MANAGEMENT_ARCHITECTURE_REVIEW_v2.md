# 🧭 AGENT COUNCIL — ARCHITECTURE REVIEW v2
## Capacidad: Gestión de Imágenes de Platos y Menús (Dish & Menu Image Management)
### Document ID: `CR_OPS_DISH_MENU_IMAGE_MANAGEMENT_ARCHITECTURE_REVIEW_v2.md`
**Fecha de Revisión:** 28/09/2026  
**Estado:** ARCHITECTURE REVIEW v2 (READ-ONLY · NO IMPLEMENTATION)  
**Autoridad:** Agency Core Governance · Strict Stop · Human Product Authority Gate  

---

## 1. Storage Access Model: Análisis Técnico Detallado

### A. Mecánica Real de Supabase Storage (Público vs. Privado)

En Supabase Storage existen dos capas de control claramente diferenciadas: **Capa de Tráfico HTTP** y **Capa de Autorización PostgreSQL (RLS)**.

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE STORAGE ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   HTTP GET (Lectura)                                                           │
│   GET /storage/v1/object/public/tenant-media/{tenant_id}/dishes/...             │
│        │                                                                        │
│        ├─► [Bucket es PUBLIC]  ──► CDN / Edge Cache ──► Retorna Imagen (Sin DB) │
│        │                                                                        │
│        └─► [Bucket es PRIVATE] ──► Pasa a Postgres RLS (Evalúa SELECT Policy)   │
│                                    o Requiere Signed URL (?token=...)           │
│                                                                                 │
│   HTTP POST/PUT/DELETE (Escritura / Borrado)                                    │
│   POST /storage/v1/object/tenant-media/{tenant_id}/dishes/...                   │
│        │                                                                        │
│        └─► SIEMPRE pasa por PostgreSQL RLS en `storage.objects`                 │
│            (Evalúa INSERT, UPDATE o DELETE Policy con Auth JWT)                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### B. Matriz de Permisos del Bucket `tenant-media`

| Operación | Método HTTP | Endpoint | Control de Acceso | Justificación Técnica |
| :--- | :--- | :--- | :--- | :--- |
| **READ** | `GET` | `/public/tenant-media/...` | **Público (Lectura intencional)** | Las fotos de platos son **activos de marketing y menú comerciales** destinados a ser vistos por clientes y visitantes web sin requerir login. No contienen PII ni secretos. Permite caché agresiva en CDN (Cloudflare) y navegador. |
| **INSERT** | `POST` | `/tenant-media/...` | **RLS Estricto (JWT)** | Solo usuarios autenticados con rol `company_admin` o `staff` del **mismo tenant** (`split_part(name, '/', 1)::uuid = auth.jwt()->>'tenant_id'`). |
| **UPDATE** | `PUT` | `/tenant-media/...` | **RLS Estricto (JWT)** | Mismos controles de rol y tenant que INSERT. |
| **DELETE** | `DELETE` | `/tenant-media/...` | **RLS Estricto (JWT)** | Solo `company_admin` o `saas_admin` del tenant propietario. |

### C. Definición Formal de Seguridad del Almacenamiento
> **Definición de Seguridad:**  
> **Lectura pública intencional de assets comerciales; mutaciones (subida, modificación y eliminación) protegidas por autorización y RLS de tenant.**

---

## 2. Media Model: Comparativa Rigurosa de Opciones

### Opción A: Direct Path Columns (`dishes.photo_url` + `weekly_menu_slots.photo_override_url`)
- **Estructura:**
  - `public.dishes.photo_url` (text, nullable — **ya existe** en el schema).
  - `public.weekly_menu_slots.photo_override_url` (text, nullable — requiere 1 columna).
- **Almacenamiento:** Se almacena la ruta relativa canónica (`{tenant_id}/dishes/{dish_id}/photo-{timestamp}.{ext}`) o la URL pública.
- **Ventajas:**
  - Máxima simplicidad operativa.
  - Cero joins adicionales en queries críticas de menú y catálogo.
  - Se adapta directamente al código existente (`DishService`, `DishRowMapper`).
- **Deuda Técnica:** Metadatos como dimensiones (`width`, `height`) o peso en bytes no quedan indexados en DB.

### Opción B: Entidad Dedicada `media_assets`
- **Estructura:**
  - Tabla `public.media_assets (id, tenant_id, bucket_id, file_path, file_size_bytes, mime_type, width, height, created_at, created_by)`.
  - `dishes.media_asset_id` (FK a `media_assets`).
  - `weekly_menu_slots.media_asset_id` (FK a `media_assets`).
- **Ventajas:**
  - Soporte nativo para galerías de múltiples imágenes, banco de recursos compartidos, auditoría de cuotas por tenant.
- **Desventajas para MVP:**
  - Duplica la complejidad de transacciones (requiere insertar en `media_assets` antes de actualizar `dishes`).
  - Requiere queries con joins adicionales o mappers complejos en todas las pantallas.
  - Sobrediseño (YAGNI) para una necesidad actual de 1 foto por plato.

### Veredicto del Council
> **La Opción A es la elección deliberada y correcta para el MVP.**  
> No es una deuda técnica accidental: al utilizar una convención de rutas estricta (`{tenant_id}/...`) y centralizar la resolución de URLs en un servicio de dominio (`DishPhotoService`), la futura transición a `media_assets` (cuando se justifique por galerías o banners) será puramente aditiva y no requerirá renombrar ni mover archivos físicos en Storage.

---

## 3. Image Lifecycle & Regla de Retención Segura

| Evento | Comportamiento en Base de Datos | Comportamiento en Supabase Storage | Comportamiento en UI / Menú Semanal |
| :--- | :--- | :--- | :--- |
| **A. Reemplazo de foto canónica de plato** | `dishes.photo_url` se actualiza con la nueva ruta/timestamp. | Se sube el nuevo archivo con nuevo timestamp. El archivo anterior **se conserva en Storage** para no romper representaciones históricas. | La nueva foto se muestra inmediatamente en catálogo y menús activos que resuelven fallback. |
| **B. Eliminación de foto canónica de plato** | `dishes.photo_url = NULL`. | El asset físico se desvincula de DB pero se preserva o marca para purga diferida. | El plato y todos los menús sin override pasan inmediatamente al fallback `"🍽️ Sin imagen"`. |
| **C. Existencia de Menu Override** | `weekly_menu_slots.photo_override_url` tiene valor. | El asset reside en `{tenant_id}/menus/...`. | El menú muestra la foto de override. La foto canónica del plato en el catálogo general permanece **completamente inalterada**. |
| **D. Eliminación de Menu Override** | `weekly_menu_slots.photo_override_url = NULL`. | El asset de override se desvincula. | El slot del menú vuelve automáticamente a mostrar la foto canónica del catálogo (o fallback si no tiene). |
| **E. Archivo de un plato (`status = 'archived'`)** | `dishes.status = 'archived'`, `archived_at = NOW()`. `photo_url` se conserva. | El archivo en Storage **se conserva intacto**. | El plato desaparece de la vista activa de catálogo, pero si se restaura, recupera su fotografía inmediatamente. |
| **F. Purga de un plato (`purge`)** | Se elimina la fila en `dishes`. | Solo tras verificar ausencia total de referencias en slots históricos se eliminan los assets físicos en Storage. | Desaparece del sistema. |
| **G. Asset no disponible / Error 404 en Storage** | La DB conserva la URL. | El archivo físico falta o falla la red. | El componente `DishThumb` captura el evento `onError` del elemento `<img>` y muestra limpiamente el fallback `"🍽️ Sin imagen"` sin romper la interfaz ni lanzar excepciones. |

---

## 4. Historical Orders: Separación Contable vs. Visual

### Principio Fundamental
- **Snapshot Económico (Inmutable · CR-OPS-03):** Los pedidos históricos congelan obligatoriamente `name`, `unit_price`, `quantity`, `tax`, `total`. Esto es un requisito legal y fiscal.
- **Presentación Visual (No Bloqueante):** La fotografía de un plato es un elemento accesorio de visualización. En plataformas líderes de comercio y restauración (Shopify, Deliveroo, UberEats), los pedidos históricos muestran la imagen actual del producto o un icono/fallback si fue eliminado.

### Decisión para el MVP
> **NO se creará un snapshot de imagen en `public.order_items`.**  
> El detalle de un pedido histórico renderiza la foto actual del plato vía `dish_id`. Si el plato fue archivado o su foto eliminada, la UI renderiza el fallback estándar `"🍽️ Sin imagen"`. Esto evita almacenar miles de URLs redundantes en la tabla de líneas de pedido y no compromete en absoluto la integridad contable.

---

## 5. Core vs. Instance: Delimitación de Responsabilidades

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        YOURMEAL OS CORE                                │
├────────────────────────────────────────────────────────────────────────┤
│ • Contrato de dominio (`photoUrl`, `photoOverrideUrl`).               │
│ • Servicio de subida y validación (`DishMediaService`).                │
│ • Componentes UI reutilizables (`DishThumb`, `DishPhotoUploader`).     │
│ • Resolver de fallback (`effectivePhotoUrl = override ?? canonical`).  │
│ • Políticas de seguridad RLS estándar para buckets de tenant.          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Instanciación
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     EATCLEAN INSTANCE (Tenant)                         │
├────────────────────────────────────────────────────────────────────────┤
│ • Bucket propio desplegado en su proyecto Supabase (`nhirlpkuvonggctdzzad`). │
│ • Archivos fotográficos reales de sus platos cocinados.                │
│ • Configuración visual y catálogo de productos.                        │
│ • Cero acoplamiento de fotografías en el código fuente de Core.        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. MVP Scope Boundary

### ✅ En Alcance para el MVP
1. **Gestión de Imagen Canónica en Catálogo:**
   - Subida, previsualización, reemplazo y borrado en `Admin > Platos > Editar Plato`.
   - Soporte de formatos JPG, PNG, WebP (máximo 5MB).
2. **Visualización en Catálogo y Menú Semanal:**
   - Proyección de `photo_url` en `DishCard`, `DishThumb` y vistas de cliente.
   - Fallback elegante `"🍽️ Sin imagen"` cuando no hay foto.
3. **Override Contextual en Menú Semanal:**
   - Subida, previsualización y eliminación de foto específica en `Admin > Menús > Editar Slot`.
   - Resolución automática: `slot.photo_override_url ?? dish.photo_url ?? null`.
4. **Seguridad y Rendimiento:**
   - RLS estricto por tenant en `storage.objects`.
   - Lazy loading y prevención de layout shifts (CLS).

### 🚫 Fuera de Alcance Explícito (Non-Goals)
- Galerías de múltiples fotos por plato.
- Recortador / editor gráfico interactivo en navegador (Canvas/Cropper).
- Generación o mejora de fotos mediante Inteligencia Artificial (Principio *No False Data*).
- Snapshot de imagen en `order_items`.
- Banco de imágenes compartido entre diferentes tenants.

---

## 7. Naming Proposal para el Roadmap

Se propone la siguiente nomenclatura formally aligned con el estándar de Change Requests:

1. **`CR-OPS-04 · Dish Catalog Media Management`**
   - Alcance: Bucket `tenant-media`, subida/reemplazo/borrado de imagen canónica en `Admin > Platos`, visualización con fallback en catálogo y menú.
2. **`CR-OPS-05 · Weekly Menu Slot Contextual Media Override`**
   - Alcance: Columna `photo_override_url` en `weekly_menu_slots`, selector de imagen en `Admin > Menús`, resolver de prioridad en `useWeeklyMenu`.

---

## 8. Final Decision Matrix

| Dimensión | Decisión Propuesta | Justificación Técnica / de Producto | Alternativa Rechazada |
| :--- | :--- | :--- | :--- |
| **Acceso Storage** | **Lectura Pública Intencional + RLS de Tenant en Mutaciones** | Máximo rendimiento CDN, lectura sin auth para app/web, autorización estricta en escritura/borrado. | Bucket Privado con Signed URLs (rechazado por sobrecarga de base de datos y rotura de caché). |
| **Modelo de Datos** | **Path Columns (`photo_url` + `photo_override_url`)** | Reutiliza schema existente, cero sobrecoste de joins, simplicidad y claridad operativa. | Tabla `media_assets` (rechazada para MVP por sobreingeniería YAGNI). |
| **Inmutabilidad de Nombres** | **Rutas con Timestamp (`photo-{timestamp}.ext`)** | Invalida instantáneamente caché de navegador/CDN al reemplazar sin requerir query-strings. | Sobreescritura de archivo con nombre fijo (`photo.jpg`) (rechazada por problemas de caché). |
| **Órdenes Históricas** | **Referencia Dinámica (Sin Snapshot de Foto)** | La foto es accesoria; la orden protege datos económicos (precio snapshot), no imágenes. | Snapshot de imagen en `order_items` (rechazado por duplicación innecesaria de datos). |
| **Principio Visual** | **No False Data (Fallback Explícito)** | Si no hay foto real, se muestra claramente `"🍽️ Sin imagen"`. Nunca inventar fotos stock/IA. | Inyección de imágenes genéricas por categoría (rechazada por violar la fidelidad del producto). |

---

## 9. Final Architecture Clarifications

### A. Comportamiento de Imágenes en Menús Semanales Históricos (Historical Weekly Menus)

**Problema Analizado:**  
Si un menú publicado (ej. semana 28/09) utilizaba la foto canónica A del plato, y semanas después el plato actualiza su foto canónica a B: ¿qué debe mostrar la consulta del menú del 28/09?

**Opciones Evaluadas:**
1. **Puntero Dinámico al Catálogo (Recomendada):** El menú histórico resuelve `dish.photo_url` (Foto B o fallback si se eliminó).
   - *Fundamento:* En la gestión gastronómica real, el menú semanal representa **la oferta gastronómica (el plato)**, no una copia congelada del archivo gráfico. La entidad fija es el plato (`dish_id`), su precio histórico (`orders`) y su receta. La foto es la representación visual actual del producto en el catálogo.
2. **Snapshot Congelado en Publicación (`photo_override_url = canonical_photo_at_publish_time`):**
   - *Fundamento de descarte:* Obligaría a copiar URLs en 35 slots cada lunes. Si el operador cambia la foto del catálogo porque la foto A era de mala calidad o tenía un error, los menús pasados quedarían anclados a la foto defectuosa A indefinidamente.
3. **Override Contextual Explícito:**
   - Si para una semana especial (ej. Navidad) el operador subió deliberadamente un override, ese override sí está congelado en `weekly_menu_slots.photo_override_url` y permanece intacto en ese menú histórico para siempre.

> **Regla de Producto:**  
> Los slots sin override son **punteros dinámicos a la identidad visual del plato en el catálogo**. Los slots con override específico son **contextuales e inmutables para ese menú**.

---

### B. Regla Formal del Ciclo de Vida de Assets (Image Asset Lifecycle)

> **REGLA FUNDAMENTAL DE ALMACENAMIENTO:**  
> **"Reemplazar una foto en el catálogo (`photo_url`) NO ejecuta la eliminación física inmediata del archivo previo en Storage."**

**Mecanismo de Retención Inmutable:**
1. Las rutas de Storage son aditivas y llevan timestamp único (`photo-{timestamp}.ext`).
2. Al subir la Foto B, la Foto A permanece físicamente en Storage a coste marginal despreciable (fracciones de céntimo por gigabyte).
3. Esto garantiza que:
   - Ninguna pestaña abierta de un usuario sufra enlaces rotos (404).
   - Ningún menú con override que apunte a una foto previa se rompa.
   - Las cachés de CDN no sirvan recursos 404 durante propagación.
4. **Purga Física de Archivos:** La eliminación física de Storage solo se ejecuta cuando un plato es formalmente **purgado (hard-delete)** por un administrador, o mediante un script de mantenimiento periódico que compruebe que no existen referencias activas en base de datos.

---

### C. Lenguaje de Seguridad del Almacenamiento Formalizado

Se elimina formalmente cualquier referencia ambigua a "seguridad total". El estándar queda fijado como:

> **"Lectura pública intencional de assets comerciales; mutaciones (creación, reemplazo y borrado) protegidas por autorización y políticas RLS de tenant."**

---

## 🚦 Decisiones que Requieren Human Product Authority

1. **Aprobación de la Regla de Menú Histórico:**
   - ¿Aceptamos que los slots estándar sin override apunten dinámicamente a la foto de catálogo actual, mientras que los overrides queden congelados en el menú? *(Recomendado: Sí).*
2. **Aprobación de la Regla de Retención de Storage:**
   - ¿Aceptamos el modelo append-only (sin borrado físico destructivo inmediato en reemplazos)? *(Recomendado: Sí).*
3. **Autorización de Scope Lock para Fase 1 (`CR-OPS-04`):**
   - ¿Procedemos a redactar el **Scope Lock formal de `CR-OPS-04 · Dish Catalog Media Management`** (exclusivamente catálogo de platos)?

---
*Fin del Documento de Architecture Review v2 · Agent Council YourMeal OS*
