# 🏛️ CR-UX-CLIENT-01 · GATE 4 AUDIT REPORT
## MENÚ SEMANAL & PEDIDO E2E AUDIT & TRACEABILITY

```text
CR-UX-CLIENT-01 · GATE 4
FECHA: 2026-10-03
ESTADO: AUDITORÍA COMPLETADA (PASS CON IDENTIFICACIÓN DE GAPS R-01/R-02)
ACTOR SINTÉTICO: Winnie Pooh (e2e.winnie.pooh.synthetic@yourmealos.test)
TENANT: 8bba00ba-331b-42c8-9283-4e3836ffb870 (eatclean)
```

---

## 1. 🎯 OBJETIVOS DE GATE 4

Auditar de extremo a extremo la cadena de valor de **Menú Semanal y Pedido** en YourMeal OS / EatClean:
1. **Publicación y Consumo del Menú Semanal**:
   - `weekly_menus` $\rightarrow$ `weekly_menu_slots` $\rightarrow$ `dishes` $\rightarrow$ `/app/menu` & `/app/schedule`.
   - Control de semanas UTC (`utcWeekStartMonday()`), filtrado de platos despublicados / soft-deleted y aislamiento multi-tenant.
2. **Ciclo de Intake y Creación Atómica de Pedidos**:
   - `/app/schedule` (Selector de día, Stepper de raciones, Resumen).
   - Motor de precios comerciales (`resolveOrderCommercialPricing`, `getTenantOffers`, barrera contra precios 0.00 € sin descuento legítimo).
   - Pipeline de Intake: `useProgramDraftOrder` $\rightarrow$ `OrderIntakeService.intakeDraft` (ADR 0017) $\rightarrow$ `OrderService.programDraftItems` $\rightarrow$ `program_draft_order` (RPC Postgres).
3. **Puntos de Fusión de Datos**:
   - **Perfil Dietético**: Congelación atómica de `customer_dietary_profiles` en `orders.dietary_snapshot` y propagación a `delivery_services`.
   - **Direcciones**: Trazabilidad del flujo de `customer_addresses` $\rightarrow$ `orders` $\rightarrow$ `delivery_services.delivery_address_snapshot` y confirmación de los gaps R-01 y R-02.

---

## 2. 🗺️ TRAZABILIDAD DEL FLUJO E2E DE WINNIE POOH

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. AUTENTICACIÓN & TENANCY                                                             │
│    Winnie Pooh (e2e.winnie.pooh.synthetic@yourmealos.test)                             │
│    Tenant: 8bba00ba-331b-42c8-9283-4e3836ffb870 (eatclean)                             │
│    Customer ID: Resuelto / Auto-materializado como Individual Customer (ADR 0015)      │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. CONSUMO DE MENÚ SEMANAL (CAP-003)                                                   │
│    GET /app/menu & /app/schedule (Semana 2026-10-05)                                   │
│    - weekly_menus (status = 'published', week_start = '2026-10-05')                    │
│    - weekly_menu_slots (dishes con macros, fotos, alérgenos)                          │
│    - RLS: Lectura autorizada por is_tenant_member()                                    │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 3. SELECCIÓN & EVALUACIÓN COMERCIAL (CAP-004)                                          │
│    - Día seleccionado: Lunes (2026-10-05)                                              │
│    - Platos seleccionados: 2x Plato A + 1x Plato B (Total: 3 raciones)                 │
│    - Evaluación Comercial: resolveOrderCommercialPricing()                             │
│    - Guard: total > 0.00 € (o descuento 100% explícito verificado)                     │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 4. ORDER INTAKE & SERVICE PERSISTENCE (ADR 0017)                                       │
│    useProgramDraftOrder() ──► OrderIntakeService.intakeDraft(channel: "app")           │
│    OrderService.programDraftItems():                                                   │
│    a) Validación de disponibilidad en slots de menú publicado                          │
│    b) Lectura de customer_dietary_profiles (Winnie: [peanuts, nuts, vegetarian])        │
│    c) Congelación: buildOrderDietarySnapshot() ──► orders.dietary_snapshot             │
│    d) RPC program_draft_order (Atómico: orders + order_items)                          │
│    e) Auditoría: AuditService.write(entityType: "order", action: "create")             │
│    f) CR-OPS-06: createDeliveryServicesForOrder()                                      │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │
                     ┌───────────────────┴───────────────────┐
                     ▼                                       ▼
┌────────────────────────────────────────┐   ┌───────────────────────────────────────────┐
│ 5A. SEGURIDAD ALIMENTARIA (PASS ✅)     │   │ 5B. DIRECCIONES DE ENTREGA (GAPS ⚠️)      │
│                                        │   │                                           │
│ orders.dietary_snapshot:               │   │ /app/schedule: Texto "Dirección habitual" │
│ - allergens: ["peanuts", "nuts"]       │   │ OrderIntakeCommand: no tiene addressId    │
│ - restrictions: ["vegetarian"]         │   │ delivery_services:                        │
│ - kitchenNotes: "Envasar sellado"      │   │ - delivery_address_id = null              │
│ ──► Visible en /admin/orders           │   │ - snapshot = { unresolved: true,          │
│ ──► Segregación P1 Cocina (🔴 Alérgeno)│   │               reason: "no_address_at_... "}│
└────────────────────────────────────────┘   └───────────────────────────────────────────┘
```

---

## 3. 🔍 HALLAZGOS Y AUDITORÍA DETALLADA

### 3.1. Menú Semanal (`weekly_menus` $\rightarrow$ `weekly_menu_slots` $\rightarrow$ `dishes`)
- **Repositorio**: [`src/modules/weekly-menu/infrastructure/weekly-menu-repository.ts`](file:///Users/alex/Developer/YourMeal-OS/src/modules/weekly-menu/infrastructure/weekly-menu-repository.ts).
- **Consultas**: [`src/modules/weekly-menu/application/weekly-menu-queries.ts`](file:///Users/alex/Developer/YourMeal-OS/src/modules/weekly-menu/application/weekly-menu-queries.ts).
- **Verificación**:
  - `findPublishedByWeekStart` filtra por `status = 'published'`, `tenant_id`, y descarta menús con `deleted_at IS NOT NULL`.
  - `listSlotsWithDishes` excluye automáticamente platos con `dishes.deleted_at IS NOT NULL`.
  - 37 tests unitarios y de integridad (`weekly-menu-service.integrity.spec.ts`, `week-dates.spec.ts`) ejecutan en verde (`37 passed`).

### 3.2. Motor de Intake de Pedidos (`OrderIntakeService` + `OrderService`)
- **Contrato de Ingesta**: [`src/modules/order-intake/application/order-intake-service.ts`](file:///Users/alex/Developer/YourMeal-OS/src/modules/order-intake/application/order-intake-service.ts).
  - Cumple estrictamente con **ADR 0017**: La UI nunca llama a persistencia directamente; invoca `OrderIntakeService.intakeDraft(channel: "app")`.
  - Registra metadatos de origen (`OrderIntakeOrigin`) y traza auditoría.
- **Servicio de Dominio**: [`src/modules/orders/application/order-service.ts`](file:///Users/alex/Developer/YourMeal-OS/src/modules/orders/application/order-service.ts).
  - Comprueba que todos los `dishId` existan en los slots del día solicitado.
  - Resuelve pricing comercial canónico con protección contra órdenes a 0.00 €.
  - Invoca la RPC `program_draft_order` para inserción atómica de cabecera (`orders`) y líneas (`order_items`).
  - 34 tests de dominio (`order-service.spec.ts`, `order-service.commercial-pricing.spec.ts`, `order-price-immutability.spec.ts`) ejecutan en verde (`34 passed`).

### 3.3. Trazabilidad de Perfil Dietético vs Direcciones

| Dimensión | Flujo en Pedido de Winnie Pooh | Estado | Detalle |
| :--- | :--- | :---: | :--- |
| **Alérgenos UE-14** | `customer_dietary_profiles` $\rightarrow$ `orders.dietary_snapshot` | ✅ **PASS** | `["peanuts", "nuts"]` congelados de por vida en el pedido. |
| **Notas Cocina** | `customer_dietary_profiles` $\rightarrow$ `orders.dietary_snapshot` | ✅ **PASS** | Texto persistido e inmutable. |
| **Segregación P1** | `orders.dietary_snapshot` $\rightarrow$ `ProductionKitchenEngine` | ✅ **PASS** | Raciones clasificadas en lote 🔴 Alérgenos. |
| **Selector Dirección** | `/app/schedule` $\rightarrow$ `useProgramDraftOrder` | ⚠️ **GAP R-01** | La UI muestra "Dirección habitual" fija sin selector. |
| **Payload Intake** | `OrderIntakeDraftCommand` | ⚠️ **GAP R-01** | El comando no incluye campo `deliveryAddressId`. |
| **Delivery Snapshot** | `createDeliveryServicesForOrder` $\rightarrow$ `delivery_services` | ⚠️ **GAP R-02** | Para B2C individual queda `{ unresolved: true, reason: "no_address_at_intake" }`. |

---

## 4. 📊 MATRIZ DE CALIDAD & TEST SUITES

```text
Test Suite                                                   Resultados
────────────────────────────────────────────────────────────────────────
src/modules/weekly-menu/application/admin-menu-day-date.spec.ts       2/2   ✅ PASS
src/modules/weekly-menu/application/week-dates.spec.ts                7/7   ✅ PASS
src/modules/weekly-menu/application/weekly-menu-mapper.spec.ts        7/7   ✅ PASS
src/modules/weekly-menu/application/weekly-menu-service.integrity.spec 21/21 ✅ PASS
src/modules/orders/application/order-service.spec.ts                  5/5   ✅ PASS
src/modules/orders/application/order-service.commercial-pricing.spec 26/26 ✅ PASS
src/modules/orders/application/order-price-immutability.spec.ts       3/3   ✅ PASS
────────────────────────────────────────────────────────────────────────
TOTAL TESTS EJECUTADOS EN GATE 4: 71/71 (100% PASS)
```

---

## 5. 🏁 CONCLUSIÓN Y RECOMENDACIONES

El **Gate 4 queda AUDITADO Y SUPERADO** en cuanto a la lógica de negocio, arquitectura de ingesta, inmutabilidad de precios, seguridad de menús y persistencia dietética.

**Recomendaciones confirmadas para Fase 4 (Remediación)**:
1. **R-01**: Extender `OrderIntakeDraftCommand` y `useProgramDraftOrder` para aceptar `deliveryAddressId?: string` opcional y conectarlo con el selector de direcciones de Winnie en `/app/schedule`.
2. **R-02**: En `createDeliveryServicesForOrder` ([`operations-repository.ts`](file:///Users/alex/Developer/YourMeal-OS/src/modules/operations/infrastructure/operations-repository.ts)), cuando `order.siteAddress` sea nulo, buscar la dirección por defecto del cliente en `customer_addresses` y rellenar `delivery_address_snapshot` con la calle, ciudad y código postal reales.
