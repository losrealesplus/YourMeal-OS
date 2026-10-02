# CR-OPS-05 · Scope Lock: Published Weekly Menu ↔ Universal Order Intake Availability

**Initiative:** CR-OPS-05  
**Domain:** Order Intake & Operational Menus  
**Architectural Owner:** YourMeal OS Core  
**Governance Authority:** Human Product Authority  
**Status:** 🔒 **SCOPE LOCKED & FORMALLY RATIFIED (Implementation Locked)**  
**Version:** 1.1  
**Date:** 2026-10-02  

---

## 1. Executive Summary & Scope Ratification

CR-OPS-05 eliminates the discrepancy between published weekly menu planning (`/admin/menus`) and staff order capture (`UniversalOrderIntakeDrawer.tsx`). It establishes the published weekly menu as the single authoritative source of truth for **commercial dish availability** during order intake, while strictly maintaining the immutability of historical orders.

---

## 2. In-Scope Boundaries (Ratified)

1. **Alignment of `UniversalOrderIntakeDrawer`**:
   - Replace direct raw `dishes` querying with canonical `fetchPublishedWeeklyMenu(tenantId, weekStart)` resolution.
   - Group and display dishes on per-day tabs matching `weekly_menu_slots.day_date`.
   - Render dish thumbnails (`DishThumb`), names, baseline prices, and stepper quantity controls.
   - Provide clear, explicit empty states for unplanned days and unpublished weeks.
2. **Drawer Component Test Suite**:
   - Update and extend [`universal-order-intake-drawer.spec.tsx`](file:///Users/alex/Developer/YourMeal-OS/src/components/orders/universal-order-intake-drawer.spec.tsx) to verify daily dish rendering from published menus, empty states, and order submission.
3. **Multi-Tenant Security**:
   - Strictly scope all menu and dish resolution queries to `tenantId`.

---

## 3. Out-of-Scope (Strict Exclusions)

1. ❌ **NO changes to `orders` or `order_items` tables or schema**.
2. ❌ **NO changes to `StaffOrderCaptureService` mutation or DTO contract**.
3. ❌ **NO modification to historical orders or previous pricing snapshots**.
4. ❌ **NO modification to recipes, inventory, costing, or Cost Intelligence engines**.
5. ❌ **NO changes to consumer ordering pages (`/app/menu`, `/app/schedule`)** (which already consume `useWeeklyMenu` correctly).
6. ❌ **NO new database migrations required** (all required tables and columns already exist in production).

---

## 4. Fundamental Architectural Invariant (Mandatory Contract)

> [!IMPORTANT]
> **Separation of Commercial Availability vs. Order Truth**:
> * **Weekly Menu** = Oferta comercial disponible para la captura y venta en un ciclo operativo determinado.
> * **Order** = Registro histórico e inmutable de lo que el cliente realmente compró y contrató.

### Invariant Rules:
1. **Inmutabilidad de Pedidos Activos**: Cambiar, republicar o despublicar un menú semanal **NO modifica pedidos existentes**.
2. **Protección de Ítems Históricos**: Retirar o reemplazar un plato de `weekly_menu_slots` **NO modifica `order_items` históricos**.
3. **Preservación de Snapshot Económico**: Modificar el precio de un plato en catálogo o menú **NO modifica el `unit_price` ya capturado en `order_items`**.
4. **Desacoplamiento de Reconstrucción**: `fetchPublishedWeeklyMenu()` es un contrato exclusivo de **disponibilidad comercial para captura**; **NUNCA debe utilizarse para reconstruir o hidratar pedidos históricos**.
5. **Fuente de Disponibilidad $\neq$ Fuente de Pedido**: El menú publicado indica qué se puede pedir hoy, mientras que la tabla `orders` / `order_items` es la única fuente de verdad de lo que fue ordenado.

---

## 5. Acceptance Criteria & Quality Gates

```text
CR-OPS-05 ACCEPTANCE GATES:
├── Gate 1: Typecheck          → npx tsc --noEmit (0 errors)
├── Gate 2: Production Build   → npm run build (Success)
├── Gate 3: Drawer Unit Tests  → All component tests passing
├── Gate 4: Runtime Evidence   → Monday 28/09 renders 7 planned dishes, Tuesday 28/09 renders 7 planned dishes, etc.
└── Gate 5: Order Submission   → Completes order capture and submits valid lines to backend
```

---

## 6. Governance State

```text
CR-OPS-05 · CADENA DE GOBERNANZA
├── 1. Discovery                                 ✅ COMPLETADO
├── 2. Architecture Review                       ✅ COMPLETADO
├── 3. Scope Lock & Invariant Ratification       🔒 RATIFICADO POR HUMAN AUTHORITY
└── 4. Implementación de Código                  ⛔ BLOQUEADA (Esperando "AUTORIZO IMPLEMENTACIÓN CR-OPS-05")
```

* El código fuente no ha sido modificado.
* No se han creado migraciones.
* No se ha realizado deploy.
