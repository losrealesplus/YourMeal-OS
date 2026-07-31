# BR-03.1 · EatClean Admin Audit

**Fecha:** 2026-07-31  
**Tipo:** Auditoría de evidencia (solo lectura)  
**Alcance:** Backoffice `/admin` · tenant EatClean / YourMeal OS  
**Regla:** **No se modifica código de producto** en este entregable.  
**Pregunta:** ¿Qué puede hacer hoy un administrador en el panel, y qué falta para operar la oferta (platos / menú)?

---

## 1. Resumen ejecutivo

| Área | Veredicto |
|------|-----------|
| Acceso / shell | ✅ Staff-only · `AdminShell` · capabilities RBAC |
| Biblioteca de platos | 🟡 **Parcial** — alta + listado + activar; sin edición/archivo en UI |
| Menú semanal | 🟡 **Parcial** — draft + slots + publish; sin quitar slot / unpublish |
| Pedidos · Cocina · Reparto · Producción · Rutas | ✅ Datos reales (ops) |
| Inventario · Compras · Informes · Promociones | ❌ Placeholder |
| Categorías de platos / `menu_week` / `menu_items` | ❌ No hay tablas/pantallas con esos nombres |

**Flujo operativo usable hoy (oferta):**  
crear plato activo → asegurar draft de semana → añadir platos por día → **publicar menú**.

**Flujo operativo usable hoy (ejecución):**  
ver pedidos → cocina / ejecución por lote → producción / etiquetas → rutas / entregas / incidencias.

---

## 2. Acceso y shell

| Ítem | Evidencia | Estado |
|------|-----------|--------|
| Layout `/admin` | `src/routes/_authenticated/admin.tsx` → `AdminShell` + `<Outlet />` | Existe |
| Guard staff | `assertStaffRoute(user.id)` en `beforeLoad` | Existe |
| Nav + capabilities | `src/components/admin-shell.tsx` · `assertCapabilityFromContext` en hijos | Existe |
| Kit UI admin | `src/components/admin/*` (header, table, cards, chips, toolbar, KPI) | Existe |

---

## 3. Inventario de rutas `/admin`

Leyenda de estado: **Existe** (conectado a datos) · **Parcial** · **Falta** (placeholder o ausente).

| Ruta | Archivo | Propósito | Estado |
|------|---------|-----------|--------|
| `/admin` | `admin.index.tsx` | Centro de operaciones (KPIs) | Existe |
| `/admin/dishes` | `admin.dishes.tsx` | Biblioteca de platos | Parcial |
| `/admin/menus` | `admin.menus.tsx` | Menús semanales + publish | Parcial |
| `/admin/orders` | `admin.orders.tsx` | Pedidos + detalle | Existe |
| `/admin/kitchen` | `admin.kitchen.tsx` | Cola cocina + transiciones | Existe |
| `/admin/kitchen-execution` | `admin.kitchen-execution.tsx` | Ejecución por lote | Existe |
| `/admin/delivery` | `admin.delivery.tsx` | Cola reparto + transiciones | Existe |
| `/admin/production` | `admin.production.tsx` | Hub producción | Existe |
| `/admin/production/` | `admin.production.index.tsx` | Planning | Existe |
| `/admin/production/batch` | `admin.production.batch.tsx` | Tandas | Existe |
| `/admin/production/packaging` | `admin.production.packaging.tsx` | Bolsas | Existe |
| `/admin/production/labels` | `admin.production.labels.tsx` | Etiquetas | Existe |
| `/admin/production-sheet` | `admin.production-sheet.tsx` | Hoja de producción | Existe |
| `/admin/routes` | `admin.routes*.tsx` | Rutas · paradas · entregas · intentos · incidencias | Existe |
| `/admin/customers` | `admin.customers.tsx` | Clientes | Existe |
| `/admin/companies` | `admin.companies.tsx` | Empresas B2B | Existe |
| `/admin/commercial` | `admin.commercial.tsx` | Dashboard comercial | Existe |
| `/admin/support` | `admin.support.tsx` | Atención | Existe |
| `/admin/users` | `admin.users.tsx` | Usuarios / roles | Existe |
| `/admin/branding` | `admin.branding.tsx` | Marca tenant | Existe |
| `/admin/audit` | `admin.audit.tsx` | Audit log | Existe |
| `/admin/accounting` | `admin.accounting.tsx` | Contabilidad | Existe |
| `/admin/settings` | `admin.settings.tsx` | Hub de enlaces | Existe |
| `/admin/design-system/*` | `admin.design-system*.tsx` | Showcase diseño | Existe |
| `/admin/inventory` | `admin.inventory.tsx` | Inventario | **Falta** (PlaceholderPanel) |
| `/admin/purchasing` | `admin.purchasing.tsx` | Compras | **Falta** (PlaceholderPanel) |
| `/admin/reports` | `admin.reports.tsx` | Informes | **Falta** (PlaceholderPanel) |
| `/admin/promotions` | `admin.promotions.tsx` | Promociones | **Falta** (PlaceholderPanel) |
| Gestión de categorías de plato | — | UI CRUD categorías | **Falta** |
| Editor avanzado de plato (foto, alérgenos, receta) | — | Form completo | **Falta** |
| Quitar slot / despublicar menú | — | UI | **Falta** |

---

## 4. Componentes Admin existentes

Ubicación: `src/components/admin/`

| Componente | Rol |
|------------|-----|
| `admin-header.tsx` | Cabecera de página |
| `data-table.tsx` | Tabla de datos |
| `panel-card.tsx` | Contenedor de panel |
| `section-title.tsx` | Título de sección |
| `status-chip.tsx` | Chip de estado |
| `toolbar.tsx` | Barra de acciones |
| `kpi-card.tsx` | KPI |
| `progress-bar.tsx` | Progreso |
| `index.ts` | Barrel export |

Shell de navegación: `src/components/admin-shell.tsx` (fuera de `components/admin/`, pero es el chrome del backoffice).

---

## 5. CRUD disponibles (oferta · dishes / menus)

### 5.1 Platos (`/admin/dishes`)

| Operación | UI admin | Servicio / dominio | Estado |
|-----------|----------|--------------------|--------|
| Listar | ✅ `DishService.list` | ✅ | Existe |
| Crear | ✅ formulario nombre/desc/precio/kcal → status `active` | ✅ `create` | Existe |
| Activar | ✅ | ✅ `update` status | Existe |
| Editar campos | ❌ | ✅ use case / `update` en servicio | Parcial |
| Desactivar | ❌ | ✅ use case | Parcial |
| Archivar / restaurar | ❌ | ✅ `archive` / `restore` | Parcial |
| Purge | ❌ | ✅ servicio | Parcial |
| Duplicar / asignar receta | ❌ | ✅ use cases en módulo | Falta (UI) |
| Borrado duro de negocio | — | No expuesto como delete de producto | Falta (intencional) |

**Capabilities:** `dishes.read` · `dishes.create` · `dishes.update` (UI usa update solo para activar).

**Evidencia:** `admin.dishes.tsx` · `src/modules/dish-library/application/dish-service.ts`.

### 5.2 Menús semanales (`/admin/menus`)

| Operación | UI admin | Servicio | Estado |
|-----------|----------|----------|--------|
| Listar menús | ✅ | `WeeklyMenuService.list` | Existe |
| Asegurar draft semana | ✅ `ensureDraft` | ✅ | Existe |
| Listar slots del día | ✅ | ✅ | Existe |
| Añadir plato a día | ✅ | `addDishToDay` | Existe |
| Publicar | ✅ `publish` | ✅ | Existe |
| Quitar slot | ❌ | No en UI auditada | Falta |
| Despublicar | ❌ | No en UI auditada | Falta |
| Borrar menú | ❌ | — | Falta |

**Capabilities:** `menus.read` · `menus.write`.

**Evidencia:** `admin.menus.tsx` · `src/modules/weekly-menu/application/weekly-menu-service.ts`.

---

## 6. Modelo de datos (dishes / menu / week / categories)

Fuente: `src/integrations/supabase/types.ts` (schema generado).

### 6.1 Tablas presentes (relacionadas)

| Nombre pedido en BR-03 | Tabla real en DB | Estado |
|------------------------|------------------|--------|
| `dishes` | `dishes` | Existe |
| `menu` / menú semanal | `weekly_menus` | Existe (nombre distinto) |
| `menu_week` | — | **Falta** como tabla; semana = `weekly_menus.week_start` |
| slots / ítems de menú | `weekly_menu_slots` | Existe |
| `categories` | — | **Falta** como tabla |
| categoría en plato | `dishes.category_id` (uuid string) | Parcial — campo sin FK tipada a tabla `categories` en types |

### 6.2 `dishes` — columnas relevantes

`id` · `tenant_id` · `name` · `description` · `status` (`dish_status`) · `price` · `cost` · `kcal` · `category_id` · `allergens` · `macros` · `photo_url` · `prep_*` · `recipe_id` · `tags` · `weight_g` · soft-delete (`deleted_at` / `deleted_by`) · timestamps.

Relacionado: `dish_ingredients`.

### 6.3 `weekly_menus`

`id` · `tenant_id` · `week_start` · `status` · `published_at`.

### 6.4 `weekly_menu_slots`

`id` · `tenant_id` · `weekly_menu_id` · `day_date` · `dish_id` · `sort_order`  
FK → `dishes`, `weekly_menus`.

### 6.5 Ausentes respecto al enunciado BR-03

- Tabla `categories` / `dish_categories`  
- Tabla `menu_week` (como entidad separada)  
- Tabla `menu_items` (sustituida por `weekly_menu_slots`)

---

## 7. Pantallas que existen vs faltan (oferta EatClean)

### Existen (conectadas)

- Biblioteca de platos (bootstrap)  
- Menús semanales (draft → publish)  
- Ops: pedidos, cocina, ejecución, delivery, producción, rutas  
- Clientes, empresas, usuarios, branding, audit, accounting, support, commercial  

### Parciales

- Platos: sin editor completo ni archivo en UI  
- Menús: sin remove slot / unpublish  
- `category_id` en plato sin pantalla de categorías  

### Faltan (placeholder o inexistentes)

- Inventario · Compras · Informes · Promociones (PlaceholderPanel)  
- CRUD de categorías  
- Pantallas dedicadas “menu_week” / “menu_items” con esos nombres  

---

## 8. Flujo operativo que puede realizar hoy un administrador

### 8.1 Oferta (piloto menú)

```text
Login staff (/auth/admin o post-login home admin)
  → /admin/dishes     crear plato (activo)
  → /admin/menus      ensureDraft (semana)
  → añadir platos a días (slots)
  → publish
  → (cliente) ve menú publicado en /app/menu
```

Estado: **usable con límites** (Parcial).

### 8.2 Pedido → cocina → reparto

```text
/admin/orders          ver pedido
/admin/kitchen         avanzar estados cocina
/admin/kitchen-execution  lotes
/admin/production*     planning / tandas / packaging / labels
/admin/delivery        cola reparto
/admin/routes*         rutas, paradas, entregas, intentos, incidencias
```

Estado: **Existe** (datos reales; calidad de UX/piloto a validar en device, fuera de esta auditoría).

### 8.3 Lo que no puede hacer aún en backoffice

- Gestionar categorías de catálogo  
- Editar/archivar platos desde UI completa  
- Quitar un plato del menú publicado / despublicar  
- Inventario, compras, informes, promociones  
- Depender de tablas `menu_week` / `menu_items` / `categories` (no existen)

---

## 9. Tabla consolidada de estado

| Capacidad / superficie | Existe | Parcial | Falta |
|------------------------|:------:|:-------:|:-----:|
| Shell admin + RBAC | ✅ | | |
| Componentes UI admin | ✅ | | |
| Listar platos | ✅ | | |
| Crear plato | ✅ | | |
| Editar / archivar plato (UI) | | ✅ | |
| Draft menú semanal | ✅ | | |
| Añadir plato a día | ✅ | | |
| Publicar menú | ✅ | | |
| Quitar slot / unpublish | | | ✅ |
| Tabla `dishes` | ✅ | | |
| Tabla `weekly_menus` / `weekly_menu_slots` | ✅ | | |
| Tabla `categories` / `menu_week` / `menu_items` | | | ✅ |
| Pedidos / cocina / delivery / producción / rutas | ✅ | | |
| Inventario / compras / informes / promociones | | | ✅ |
| CRUD categorías en UI | | | ✅ |

---

## 10. Implicaciones para BR-03 (beta EatClean)

1. **No hace falta inventar el backoffice desde cero** para menú: el camino bootstrap platos → menú → publish ya está cableado.  
2. Los huecos de **DX de catálogo** (editar, archivar, categorías, quitar del menú) son el principal gap de “admin de oferta”.  
3. Ops de jornada (cocina/reparto) están en **Existe**; inventario/compras/informes no bloquean un piloto acotado si se declaran fuera de alcance.  
4. Cualquier implementación posterior de BR-03 debe respetar el naming real (`weekly_menus` / `weekly_menu_slots`), no asumir `menu_week` / `menu_items` / `categories` sin migración.

---

## 11. Evidencia (rutas de código)

| Tema | Path |
|------|------|
| Layout | `src/routes/_authenticated/admin.tsx` |
| Nav | `src/components/admin-shell.tsx` |
| Platos UI | `src/routes/_authenticated/admin.dishes.tsx` |
| Menús UI | `src/routes/_authenticated/admin.menus.tsx` |
| Dish domain | `src/modules/dish-library/` |
| Weekly menu domain | `src/modules/weekly-menu/` |
| Placeholders | `admin.inventory.tsx` · `admin.purchasing.tsx` · `admin.reports.tsx` · `admin.promotions.tsx` |
| Types DB | `src/integrations/supabase/types.ts` → `dishes`, `weekly_menus`, `weekly_menu_slots` |

---

## 12. Fuera de alcance de este documento

- Implementar pantallas o CRUD  
- Cambiar esquema Supabase  
- Smoke en dispositivo  
- Certificar PS-002-C / auth  

**Siguiente paso natural (producto, no esta auditoría):** priorizar huecos Parcial/Falta del catálogo solo si bloquean la jornada EatClean (menú publicado + ops).
