# EatClean Pilot Ready · Functional Completeness Review

**Fecha:** 2026-07-23  
**Tipo:** Evidence / Status *(no metodología nueva · no implementación)*  
**Knowledge Lifetime:** Iteration  
**Baseline de código:** `main` @ `60601e3` (“Added branding route & i18n”)  
**Alcance:** revisión estática del código (rutas · UI · servicios · RBAC · flags)  
**No es:** Smoke ejecutado · ORR · FOV · permiso para implementar features

> **Regla aplicada:** todo elemento visible debe funcionar, estar oculto por Feature Flag, o marcarse explícitamente como «Próximamente».  
> Esta revisión **documenta** el estado real. No implementa, no rediseña, no refactoriza.

---

## 1. Veredicto ejecutivo

| Cara | ¿Lista para piloto exclusivo YourMeal OS? |
|------|:------------------------------------------:|
| **Customer App · CJ-001** (menú → pedido draft → resumen → confirmar) | 🟡 **Parcial** — camino feliz Connected; huecos visibles sin “Próximamente” |
| **Centro de Operaciones · OJ** (cocina · reparto · stock · clientes · finanzas) | 🔴 **No** — UI mock / PlaceholderPanel; servicios `unimplemented` |
| **Branding Tenant-Managed** | ✅ **Completo** (logo · colores · preview · persistencia) |
| **Perfil / cobros / favoritos / historial** | 🔴 **No** — menús muertos o solo lectura |

**Conclusión para el piloto**

> En el estado actual de `main`, **no** se cumple la regla de completitud funcional en superficies de operaciones ni en gran parte del hub de perfil.  
> El ciclo **Cliente pide → Sistema genera pedido** puede demostrarse (con datos reales y flags ON).  
> El ciclo **Cocina produce → Reparto entrega** **no** puede demostrarse con datos reales: las pantallas muestran mocks y no mutan.

**Riesgo #1 del piloto:** personal operativo cree que cocina/reparto/stock “funcionan” porque ven listados, pero los datos son simulados (`src/lib/mock-admin.ts`) y los servicios lanzan `unimplemented`.

---

## 2. Feature Completeness Matrix

Estados: ✅ Completo · 🟡 Parcial · 🔴 No implementado  

| Área | Visible | Funciona | Guarda | RBAC | Estado |
|------|:-------:|:--------:|:------:|:----:|:------:|
| **Login cliente** (`/auth`) | Sí | Sí | Auth Supabase | Auth | ✅ |
| **Recuperar contraseña** | Sí | Sí | Email reset → `/reset-password` | Auth | ✅ |
| **Login staff / Centro Ops** (`/auth/admin`) | Sí | Sí (login) | Auth | Staff post-login → `/admin` | 🟡 |
| **Idioma (auth)** | Sí | Sí | Locale | — | ✅ |
| **Branding dinámico (login/app)** | Sí | Sí | Runtime + estático | — | ✅ |
| **Home · Hero / CTA menú** | Sí | Sí | — | customer | ✅ |
| **Home · Menú destacado** | Sí | Sí (si hay weekly menu) | Read | `dish_library` | 🟡 |
| **Home · Favoritos** | Sí | 🔴 Navega a `/app/menu` sin favoritos | No | — | 🔴 |
| **Home · Próxima entrega** | Sí | 🔴 Navega a lista vacía `/app/orders` | No | — | 🔴 |
| **Home · Promociones** | No | — | — | — | 🔴 *(no visible)* |
| **Menú semanal · listado / días** | Sí | Sí | Read Supabase | `menus.read` + flag | ✅ |
| **Menú · filtros (más allá de día)** | No | — | — | — | 🔴 |
| **Menú · imágenes** | Sí | 🟡 Misma foto hero para todos | Assets | — | 🟡 |
| **Menú · macros** | Sí | Sí (datos plato) | Read | — | ✅ |
| **Menú · añadir / cantidades / carrito** | 🟡 | Via `/app/schedule` (no carrito persistente en menú) | Al programar draft | `orders.write` | 🟡 |
| **Programar pedido (schedule)** | Sí | Sí | `program_draft_order` | flag `order_programming` | ✅ |
| **Resumen · ítems / estado** | Sí | Sí | Read | `orders.read` | ✅ |
| **Resumen · cálculo total** | Sí | 🟡 UI scaffold `qty×990`; total autoritativo server | Mixed | — | 🟡 |
| **Resumen · dirección entrega** | Sí | 🔴 Texto «Próximamente» | No | — | 🟡 *(marcado)* |
| **Resumen · confirmar** | Sí | Sí | `orders.status` + audit | flag `order_confirmation` | ✅ |
| **Pedidos · listado** | Sí | Empty state (sin CAP-007) | No list | — | 🟡 |
| **Perfil · lectura metadata** | Sí | Sí | Auth metadata | — | 🟡 |
| **Perfil · editar** | Sí | Disabled + «Próximamente» | No | — | 🟡 *(marcado)* |
| **Settings · direcciones / teléfonos / pago / facturas / historial / alergias / preferencias / notificaciones / ayuda / about** | Sí | 🔴 Botones **sin acción** y **sin** «Próximamente» | No | — | 🔴 |
| **Settings · idioma / logout** | Sí | Sí | Locale / Auth | — | ✅ |
| **Admin dashboard `/admin`** | Sí | 🔴 KPIs + timeline **MOCK** | No | staff | 🔴 |
| **Admin · Production (todas las pestañas)** | Sí | 🔴 MOCK | No | staff nav | 🔴 |
| **Admin · Routes / delivery (todas)** | Sí | 🔴 MOCK | No | staff nav | 🔴 |
| **Admin · Customers** | Sí | 🔴 MOCK tabla | No | staff | 🔴 |
| **Admin · Menus / Promotions / Accounting** | Sí | 🔴 MOCK | No | staff | 🔴 |
| **Admin · Inventory / Purchasing / Support / Reports / Dishes** | Sí | PlaceholderPanel «Próximamente» | No | staff | 🟡 *(marcado)* |
| **Admin · Settings** | Sí | Solo entrada Branding | — | admin | 🟡 |
| **Admin · Usuarios / permisos UI** | No | — | — | — | 🔴 |
| **Admin · Branding** | Sí | Sí | BrandingService + Storage | `company_admin` / `saas_admin` | ✅ |
| **Driver `/driver`** | Sí | PlaceholderPanel | No | driver | 🟡 *(marcado)* |
| **SaaS console `/saas/*`** | Sí | PlaceholderPanel en todas | No | `saas.manage` | 🟡 *(marcado)* |
| **Feature Flags (servicio)** | No UI | Sí (backend) | `feature_flags` | — | ✅ *(infra)* |
| **Ops workspaces / agenda real** | No en `main` | — | — | — | 🔴 *(existe en ramas #29 no mergeadas)* |

---

## 3. Inventario por superficie

### 3.1 Customer App

#### Login (`/auth`, `/auth/admin`, `/reset-password`)

| Elemento | Hallazgo |
|----------|----------|
| Login email/password | Connected (Supabase Auth) |
| Registro / OAuth / OTP | Presentes en `/auth` |
| Recuperar contraseña | Connected → email → `/reset-password` |
| Centro de Operaciones | Link footer → `/auth/admin` |
| Idioma | `QuietLocaleSwitch` (ES/EN) en auth |
| Branding | `TenantLogo` / brand scope / Powered by |

#### Home (`/app`)

| Elemento | Hallazgo |
|----------|----------|
| Logo · saludo · CTA menú | OK |
| Plato destacado | Read `useWeeklyMenu` |
| Enlace «Favoritos» | **Violación de regla:** visible, navega a menú, **no hay favoritos** |
| Enlace «Próxima entrega» | **Violación:** visible, va a `/app/orders` vacío, **no hay próxima entrega** |
| Promociones | No hay bloque de promociones |

#### Menú semanal (`/app/menu`, `/app/menu/$dishId`)

| Elemento | Hallazgo |
|----------|----------|
| Listado por día | Connected (`weekly_menus` / slots / dishes) |
| Flag `dish_library` | Si OFF → vacío (no oculta nav) |
| Imágenes | Asset único `eatclean-hero.jpg` para todos los platos |
| Macros | De datos de plato |
| Añadir al pedido | CTA → `/app/schedule` (no qty en menú) |

#### Programación / Resumen / Confirmación

| Elemento | Hallazgo |
|----------|----------|
| `/app/schedule` | 3 pasos · `OrderService.programDraft` · persistencia real |
| `/app/orders/$orderId` | Read real · Confirm CAP-006 |
| Dirección | «Próximamente» (cumple marca explícita) |
| Lista `/app/orders` | Empty hasta CAP-007 (sin mocks — correcto; sin datos) |

#### Perfil (`/app/settings*`)

| Elemento | Hallazgo |
|----------|----------|
| Profile read | Metadata Auth |
| Edit | Disabled + «Próximamente» ✅ |
| 10 filas del hub sin `to` | **Botones sin acción** — **violación grave** de la regla de completitud |

---

### 3.2 Centro de Operaciones / Admin

**Estado en `main`:** no existe el «Centro de Operaciones» (agenda + workspaces) de #29.  
`/admin/` es un **dashboard KPI** con `MOCK_ADMIN_KPIS` + `MOCK_TIMELINE`.

| Módulo | UI | Datos | Servicio | Persistencia |
|--------|----|-------|----------|--------------|
| Dashboard | Real layout | Mock | — | No |
| Production (+ batch, packaging, labels, kitchen) | Real layout | Mock | `ProductionService` stub | No |
| Routes (+ stops, deliveries, attempt, incidents) | Real layout | Mock | `RouteService` stub | No |
| Customers | Tabla | Mock | — | No |
| Menus / Promotions / Accounting | UI | Mock | Accounting stub | No |
| Inventory / Purchasing / Support / Reports / Dishes | PlaceholderPanel | — | stubs / DishService sin UI | No |
| Settings | Thin | — | — | Solo link branding |
| Branding | Full | Runtime | BrandingService | **Sí** |
| Users / Permissions | Ausente | — | — | No |

Shell nav (`admin-shell.tsx`) expone **todos** los módulos anteriores a staff — incluidos mocks y placeholders — sin Feature Flag de UI.

---

### 3.3 Branding

| Paso | Estado |
|------|--------|
| Subir logo | ✅ |
| Cambiar colores HEX | ✅ |
| Preview | ✅ |
| Guardar | ✅ BrandingService |
| Persistencia | ✅ `tenants` + Storage `tenant-branding` |
| Actualización inmediata | ✅ `useTenantBrand` / query invalidation |
| RBAC | ✅ `company_admin` / `saas_admin` (route + service) |

SaaS `/saas/branding` = PlaceholderPanel (distinto del flujo tenant).

---

### 3.4 Navegación — hallazgos

| Tipo | Ejemplos |
|------|----------|
| Rutas con contenido mock (parecen reales) | `/admin`, `/admin/production*`, `/admin/routes*`, `/admin/customers`, `/admin/menus`, `/admin/accounting`, `/admin/promotions` |
| Rutas con «Próximamente» | inventory, purchasing, support, reports, dishes, driver, saas/* |
| Botones sin acción | Settings hub (addresses, phones, payment, invoices, orderHistory, allergies, preferences, notifications, help, about) |
| Enlaces engañosos | Home Favoritos · Home Próxima entrega |
| 404 esperable | Order ID inexistente → `notFound()` (correcto) |

No se detectó un catálogo de rutas “rotas” (404 de router) en el tree generado; el problema dominante es **contenido vacío / mock / dead UI**, no rutas faltantes.

---

### 3.5 Persistencia

| Acción | Persistencia real |
|--------|-------------------|
| Auth login / reset | ✅ |
| Program draft order | ✅ RPC `program_draft_order` |
| Confirm order | ✅ status + audit |
| Weekly menu / dishes read | ✅ |
| Branding update / logo | ✅ |
| Production / routes / inventory / accounting mutations | 🔴 stubs |
| Profile update / addresses / payments | 🔴 |
| Soft delete customer-facing | N/A en UI piloto |

---

### 3.6 RBAC (matriz de código)

Roles en `src/permissions/index.ts`:  
`saas_admin`, `company_admin`, `kitchen`, `production`, `purchasing`, `inventory`, `accounting`, `logistics`, `support`, `driver`, `employee`, `customer`.

| Rol (pedido de revisión) | Home post-login | Visibilidad real en `main` |
|--------------------------|-----------------|----------------------------|
| Cliente | `/app` | Customer App |
| Empleado Cocina (`kitchen` / `production`) | `/admin` | Ve **todo** el shell admin (mocks incluidos); no hay redirect a workspace único en `main` |
| Empleado Reparto (`logistics`) | `/admin` | Idem |
| Empleado Stock (`inventory`) | `/admin` | Idem + Placeholder inventory |
| Empleado Administración | `/admin` | Settings + branding si admin |
| Empleado Finanzas (`accounting`) | `/admin` | Accounting mock |
| Company Admin | `/admin` | Shell completo + branding |
| SaaS Admin | `/saas` | Placeholders |

**Gap RBAC UX:** capabilities existen en código; la navegación admin **no filtra por workspace** en `main` (eso vive en ramas Operations Center no mergeadas). Un rol cocina ve menús de finanzas/promos/etc.

---

### 3.7 Feature Flags

| Key | Efecto | ¿Oculta UI? |
|-----|--------|-------------|
| `dish_library` | Hooks menú/platos vacíos si OFF | No (nav sigue) |
| `order_programming` | `programDraft` lanza UNIMPLEMENTED | No |
| `order_confirmation` | `confirm` lanza UNIMPLEMENTED | No |

**No hay Feature Flags de UI** para ocultar módulos admin incompletos. La regla «ocultar con flag» **no está aplicada** a operaciones.

---

## 4. Resultado del informe

### 4.1 Funcionalidades completas ✅

- Login cliente y staff · recuperar contraseña · idioma en auth  
- Branding runtime (logo · colores · preview · save · persistencia)  
- Lectura menú semanal / platos (con flag ON y datos)  
- Flujo programar draft → resumen → confirmar pedido (CAP-004…006)  
- Logout · selector de idioma en settings  
- Infra FeatureFlagService · RBAC capabilities (capa plataforma)

### 4.2 Funcionalidades parciales 🟡

- Home (CTA OK; favoritos / próxima entrega engañosos)  
- Imágenes de plato (UI sí; asset único)  
- Total en schedule (display scaffold)  
- Dirección en resumen («Próximamente»)  
- Lista de pedidos (empty state limpio, sin historial)  
- Perfil (read-only + edit marked)  
- Admin settings (solo branding)  
- Placeholders marcados (inventory, dishes UI, saas, driver…)  
- Login «Centro de Operaciones» (auth OK; destino = dashboard mock)

### 4.3 Funcionalidades pendientes 🔴

- Favoritos reales · promociones · próxima entrega real  
- Filtros de menú (alergias, etc.) · carrito en menú con qty  
- CAP-007 historial de pedidos  
- Direcciones · teléfonos · métodos de pago · facturas · alergias · preferencias · notificaciones (persistidos)  
- Cocina / producción operativa con datos reales y cambio de estado  
- Reparto: rutas · asignación · estado reales  
- Stock: listado · movimientos · actualización  
- Clientes: búsqueda · edición · historial reales  
- Administración: usuarios · permisos UI  
- Finanzas: facturación · cobros · exportaciones reales  
- Agenda / workspaces Operations Center (no en `main`)

### 4.4 Botones sin acción

En `/app/settings` (sin `to`, `<button>` sin handler, **sin** «Próximamente»):

1. Direcciones  
2. Teléfonos  
3. Métodos de pago  
4. Facturas  
5. Historial de pedidos (settings)  
6. Alergias  
7. Preferencias  
8. Notificaciones  
9. Ayuda  
10. Acerca de  

### 4.5 Rutas sin contenido útil (o solo mock / vacío)

| Ruta | Contenido |
|------|-----------|
| `/app/orders` | Empty state |
| `/admin/` | Mock KPIs |
| `/admin/production*` | Mock |
| `/admin/routes*` | Mock |
| `/admin/customers` | Mock |
| `/admin/menus` | Mock |
| `/admin/accounting` | Mock |
| `/admin/promotions` | Mock |
| `/admin/inventory` etc. | «Próximamente» |
| `/driver`, `/saas/*` | «Próximamente» |

### 4.6 Formularios que no persisten

- Edit profile (disabled)  
- Cualquier interacción en pantallas mock admin (no hay mutaciones reales cableadas)  
- Settings rows sin ruta  

### 4.7 Datos simulados

- `src/lib/mock-admin.ts` — fuente de casi todo el admin operativo  
- Precio UI schedule `selected.length * 990` (comentario: scaffold)  
- Foto única de plato en menú/home  

### 4.8 Datos reales

- Auth users / sessions  
- `dishes`, `weekly_menus`, `weekly_menu_slots`  
- `orders`, `order_items` (+ RPC program draft)  
- `audit_log` (mutations CAP)  
- Tenant brand columns + Storage logo  
- `feature_flags`  
- `profiles` / `user_roles` / `tenant_members` (lectura auth)

---

## 5. Riesgos para el piloto

| # | Riesgo | Severidad | Impacto en EP |
|---|--------|:---------:|---------------|
| R1 | Ops (cocina/reparto/stock) **parecen** operativos pero son mock | 🔴 Alta | EP-002 · EP-003 · EP-004 |
| R2 | Botones muertos en Perfil dañan confianza del cliente | 🔴 Alta | Experiencia · regla completitud |
| R3 | Home «Favoritos» / «Próxima entrega» engañan | 🟠 Media | EP-001 percepción |
| R4 | Sin historial de pedidos (CAP-007) | 🟠 Media | EP-001 cierre / EP-005 |
| R5 | Staff ve módulos fuera de su rol (nav no filtrada en `main`) | 🟠 Media | RBAC demo |
| R6 | Flags OFF rompen pedido sin ocultar UI | 🟡 Baja–Media | EP-001 |
| R7 | Imágenes/precios no “reales” por plato | 🟡 Baja | Credibilidad menú |
| R8 | Branches #29–#31 (Ops Center · Pilot docs · Materialization) **no están en `main`** | 🟠 Media | Desalineación docs vs código |

---

## 6. Cumplimiento de la regla principal

```text
Visible + útil     → minority (CJ-001 core + branding + auth)
Visible + marcado  → PlaceholderPanels + algunos comingSoon
Visible + muerto   → settings hub + mocks admin + home links engañosos
Oculto por Flag UI → casi inexistente
```

**Para cumplir la regla antes del piloto (recomendación documental — no implementado aquí):**

1. Ocultar o marcar «Próximamente» **todos** los botones muertos de Settings.  
2. Ocultar / flaggear / marcar módulos admin mock (production, routes, customers, accounting, menus, promotions, dashboard KPI).  
3. Corregir o quitar enlaces Home Favoritos / Próxima entrega hasta que existan.  
4. No iniciar EP-002…004 hasta que cocina/reparto lean **pedidos reales** (no `mock-admin`).

---

## 7. Relación con Pilot Ready

Pregunta de éxito del piloto:

> ¿Puede EatClean operar una semana **exclusivamente** con YourMeal OS y dejar evidencia FOPEBA?

Con este baseline: **aún no** para la cara operativa.  
Sí se puede preparar un **piloto acotado a EP-001** (pedido cliente) si se cierran las violaciones visibles del Customer App y hay menú/datos reales.

---

## 8. Método y límites

- Revisión **estática** de rutas (`src/routes`), shells, servicios, permissions, mocks.  
- **No** se ejecutó la app contra Supabase live ni se validaron cuentas por rol en runtime.  
- **No** se midió Smoke HP-001 / ORR en esta acta.  
- Cualquier merge posterior a `60601e3` invalida filas concretas — re-ejecutar la matriz.

---

## Referencias de código

| Artefacto | Path |
|-----------|------|
| Rutas | `src/routes/**` · `src/routeTree.gen.ts` |
| Mocks admin | `src/lib/mock-admin.ts` |
| Stubs | `src/services/placeholders.ts` |
| Settings muertos | `src/routes/_authenticated/app.settings.tsx` |
| Branding | `src/routes/_authenticated/admin.branding.tsx` · `src/modules/branding/` |
| Pedido | `src/modules/orders/` · hooks `use-program-draft-order` · `use-confirm-order` |
| RBAC | `src/permissions/index.ts` |
| Flags | `src/services/feature-flag-service.ts` |
