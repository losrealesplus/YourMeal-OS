# 🔒 CR-OPS-04 · SCOPE LOCK
## Dish Catalog Media Management (Fase 1: Catálogo de Platos)
### Document ID: `CR_OPS_04_SCOPE_LOCK.md`
**Fecha de Creación:** 28/09/2026  
**Estado:** SCOPE LOCKED · PENDIENTE DE REVISIÓN HUMANA (NO IMPLEMENTATION)  
**Autoridad:** Human Product Authority · Agency Core Governance  
**Tracking Code:** `CR-OPS-04`  

---

## 1. Identidad y Propósito de la Release

### A. Objetivo Operativo
Permitir que los administradores y operadores de cualquier Tenant (iniciando por EatClean) puedan **añadir, previsualizar, reemplazar y eliminar manualmente fotografías reales para sus platos en el catálogo**, persistiendo la referencia en `public.dishes.photo_url` y almacenando los archivos en Supabase Storage bajo aislamiento multi-tenant estricto.

### B. Principios Fundamentales Inmutables
1. **No False Data:** La plataforma jamás generará ni inyectará imágenes sintéticas o de stock por Inteligencia Artificial. Si un plato no tiene fotografía, se mostrará limpia y explícitamente el fallback `"🍽️ Sin imagen"`.
2. **Safe Retention Lifecycle:** Reemplazar o desvincular una fotografía en el catálogo **NO elimina físicamente el archivo previo de Storage de forma inmediata**, evitando enlaces rotos en cachés o vistas concurrentes.
3. **Core vs. Instance Boundary:** YourMeal OS Core proporciona los componentes UI, servicios de subida y políticas de seguridad; la Instancia (EatClean) custodia sus propias imágenes y catálogo.
4. **Tenant Isolation:** Ningún tenant puede leer mediante listas privadas, mutar, sobreescribir ni eliminar archivos pertenecientes a otro tenant.

---

## 2. In-Scope vs. Out-of-Scope Boundary

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     CR-OPS-04 BOUNDARY DEFINITION                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ✅ IN-SCOPE (Fase 1 · Exclusivamente Catálogo de Platos)              │
│   ─────────────────────────────────────────────────────────             │
│   1. Bucket Supabase Storage: `tenant-media` (Public Read + Tenant RLS).│
│   2. Políticas RLS en `storage.objects` por prefijo `{tenant_id}/...`.  │
│   3. Convención de rutas: `{tenant_id}/dishes/{dish_id}/photo-{ts}.ext`.│
│   4. Validación de cliente y servidor: JPG, PNG, WebP (Máx. 5 MB).      │
│   5. UI en `Admin > Platos > Editar Plato`:                             │
│      - Dropzone / selector de archivo.                                  │
│      - Previsualización inmediata (thumbnail).                          │
│      - Botón "Cambiar imagen" (reemplazo aditivo con nuevo timestamp).  │
│      - Botón "Eliminar imagen" (setea photo_url = NULL).                │
│      - Estado de carga / upload progress.                               │
│   6. Servicio de Dominio `DishMediaService` en Core.                    │
│   7. Proyección en UI Cliente: `DishThumb` y `DishCard` renderizan la   │
│      foto real desde `photo_url` con fallback `"🍽️"`.                  │
│   8. Menú Semanal Activo: Resuelve automáticamente la foto de catálogo. │
│   9. Auditoría: Registro de eventos en `AuditService` para fotos.       │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   🚫 EXPLICITLY OUT-OF-SCOPE (Non-Goals para CR-OPS-04)                 │
│   ─────────────────────────────────────────────────────                 │
│   1. Overrides específicos por slot de menú (Diferido a CR-OPS-05).     │
│   2. Columna `photo_override_url` en `weekly_menu_slots` (CR-OPS-05).   │
│   3. Tabla `media_assets` o soporte de múltiples fotos / galerías.      │
│   4. Editor / recortador interactivo de imágenes en el navegador.       │
│   5. Generación de imágenes mediante IA o filtros automáticos.          │
│   6. Snapshots de imagen en `public.order_items`.                       │
│   7. Banco compartido de imágenes entre diferentes tenants.             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Modelo de Datos y Storage Contract

### A. Base de Datos (`public.dishes`)
- **Columna utilizada:** `photo_url text NULL` (ya existente en DDL, actualmente `NULL`).
- **Cero cambios DDL en tablas existentes:** No se alteran tipos ni constraints en `public.dishes`.

### B. Supabase Storage: Bucket `tenant-media`
- **Bucket Name:** `tenant-media`
- **Public:** `true` (lectura pública intencional de assets comerciales de menú/catálogo sin token dinámico).
- **File Size Limit:** `5242880` (5 MB).
- **Allowed MIME Types:** `['image/jpeg', 'image/png', 'image/webp']` (bloqueo estricto de `.svg`, `.exe`, `.pdf`).

### C. Estructura de Rutas
```text
tenant-media/
  └── {tenant_id}/
        └── dishes/
              └── {dish_id}/
                    ├── photo-1727554800000.jpg  (Foto anterior, retenida)
                    └── photo-1727555900000.webp (Foto actual activa)
```

### D. Políticas RLS en `storage.objects`
```sql
-- 1. Lectura pública (assets comerciales de catálogo)
CREATE POLICY "tenant_media_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'tenant-media');

-- 2. Inserción (Solo company_admin / staff del tenant)
CREATE POLICY "tenant_media_tenant_insert"
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

-- 3. Modificación (Solo company_admin / staff del tenant)
CREATE POLICY "tenant_media_tenant_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-media'
  AND (
    public.is_saas_admin(auth.uid())
    OR public.has_role(auth.uid(), NULLIF(split_part(name, '/', 1), '')::uuid, 'company_admin')
    OR public.has_role(auth.uid(), NULLIF(split_part(name, '/', 1), '')::uuid, 'staff')
  )
);

-- 4. Borrado (Solo company_admin o saas_admin)
CREATE POLICY "tenant_media_tenant_delete"
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

---

## 4. Regla Formal del Ciclo de Vida (Lifecycle Contract)

> **REGLA MANDATORIA DE RETENCIÓN:**  
> **"Reemplazar una fotografía de plato (`photo_url = nueva_ruta`) NO ejecuta la eliminación física inmediata del archivo previo en Storage."**

- **Al subir una nueva imagen:** Se escribe el nuevo archivo con nuevo timestamp. Se actualiza `dishes.photo_url`.
- **Al eliminar una imagen:** Se ejecuta `UPDATE public.dishes SET photo_url = NULL`. El archivo físico se desvincula de la base de datos pero no se borra destructivamente en tiempo real para evitar condiciones de carrera en clientes conectados.
- **Purga Física de Storage:** Solo se ejecutará mediante acciones de purga explícita de plato o rutinas de mantenimiento asíncronas autorizadas.

---

## 5. Plan de Certificación de Calidad (Quality Gates · G1 a G15)

| Compuerta | Código | Criterio de Aceptación Obligatorio |
| :--- | :--- | :--- |
| **G1** | CODE & TYPES | Compilación TypeScript limpia (`tsc --noEmit`). Tipado estricto en `DishMediaService`. |
| **G2** | BUILD | `npm run build` sin advertencias ni errores en Core ni en Instance. |
| **G3** | ROUTE | `/admin/dishes` carga con código HTTP 200. |
| **G4** | MIME ENFORCEMENT | Intento de subir `.svg`, `.pdf` o `.exe` es bloqueado en cliente y en Storage. |
| **G5** | SIZE LIMIT | Intento de subir archivo > 5 MB muestra mensaje de error sin degradar la UI. |
| **G6** | UPLOAD SUCCESS | Subida de JPG/PNG/WebP válido genera archivo en `{tenant_id}/dishes/{dish_id}/...`. |
| **G7** | PERSISTENCE | `public.dishes.photo_url` se actualiza correctamente en base de datos. |
| **G8** | RELOAD INTEGRITY | Tras F5 en el navegador, la miniatura de la imagen persiste en la ficha del plato. |
| **G9** | REPLACE ADITIVO | Cambiar imagen genera nuevo timestamp; la imagen previa permanece en storage sin 404. |
| **G10** | DELETE FALLBACK | Eliminar imagen deja `photo_url = NULL` y renderiza `"🍽️ Sin imagen"`. |
| **G11** | CATALOG PROJECTION | `DishCard` y `DishThumb` muestran la foto real del plato. |
| **G12** | MENU RESOLUTION | El menú semanal activo muestra automáticamente las fotos de los platos configurados. |
| **G13** | MULTI-TENANT RLS | Usuario del Tenant B recibe error 403 si intenta escribir en el path del Tenant A. |
| **G14** | HISTORICAL INTEGRITY | Pedidos y semanas previas no sufren regresiones ni alteraciones de precios (CR-OPS-03). |
| **G15** | AUDIT TRAIL | Modificaciones de imagen generan registro auditable en `AuditService`. |

---

## 6. Siguiente Paso Requerido

Este documento constituye el **Scope Lock definitivo de CR-OPS-04**.

```text
ESTADO ACTUAL:
DISCOVERY                 🟢 COMPLETADO
ARCHITECTURE REVIEW v2    🟢 COMPLETADO
FINAL CLARIFICATIONS      🟢 COMPLETADO
SCOPE LOCK CR-OPS-04      🟢 REDACTADO Y CONGELADO
        ↓
HUMAN REVIEW DEL LOCK     ⏳ EN ESPERA DE AUTORIZACIÓN HUMANA
        ↓
IMPLEMENTACIÓN            🔒 BLOQUEADA HASTA RECIBIR "GO FORMAL"
```

---
*Fin del Documento de Scope Lock · CR-OPS-04 · Agency Core Governance*
