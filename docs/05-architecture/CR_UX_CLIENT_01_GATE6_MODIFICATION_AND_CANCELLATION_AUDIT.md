# 🏛️ CR-UX-CLIENT-01 · GATE 6 AUDIT REPORT
## MODIFICACIÓN & CANCELACIÓN E2E AUDIT

```text
CR-UX-CLIENT-01 · GATE 6
FECHA: 2026-10-03
ESTADO: AUDITORÍA COMPLETADA (PASS CON IDENTIFICACIÓN DE GAPS R-04 Y R-05 EN DELIVERY SERVICES)
ACTOR SINTÉTICO: Winnie Pooh (e2e.winnie.pooh.synthetic@yourmealos.test)
TENANT: 8bba00ba-331b-42c8-9283-4e3836ffb870 (eatclean)
```

---

## 1. 🎯 OBJETIVOS DE GATE 6

Auditar técnica y funcionalmente los flujos de **Modificación y Cancelación de Pedidos**:
1. **Modificación de Pedidos (`OrderModificationService`)**:
   - Validación de estados permitidos (`draft`, `confirmed`, `in_production`, `prepared`).
   - Validación estricta contra el catálogo del tenant (integridad de platos).
   - Recálculo de totales e inmutabilidad de líneas de pedido (`order_items`).
   - Preservación del snapshot dietético (`orders.dietary_snapshot`).
   - Auditoría obligatoria (`AuditService.write` con `oldData` y `newData`).
2. **Cancelación de Pedidos (`OrderLifecycleService`)**:
   - Transiciones de estado permitidas vs bloqueo en estados finales (`out_for_delivery`, `delivered`).
   - Registro del motivo de cancelación (`cancelReason`).
   - Impacto y sincronización en cascada sobre los servicios de entrega (`delivery_services`).
3. **Experiencia del Cliente & Centro de Operaciones**:
   - Visualización del estado en Customer App (`/app/orders/$orderId`).
   - Visualización y botones de acción en `/admin/orders`.

---

## 2. 🗺️ ARQUITECTURA DE MODIFICACIÓN Y CANCELACIÓN

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               OPERATIONS & LIFECYCLE                                   │
│                                                                                        │
│   OrderModificationService.modifyOrder()       OrderLifecycleService.cancelOrder()     │
│   - Valida MODIFIABLE_STATUSES                 - Valida CANCELABLE_STATUSES            │
│   - Revalida catalogDishes                     - Transiciona orders.status='cancelled' │
│   - Reemplaza order_items                      - Registra cancelReason en AuditService │
│   - Preserva orders.dietary_snapshot           - ⚠️ GAP R-05: Falta cascada a          │
│   - ⚠️ GAP R-04: Falta resync delivery_services│              delivery_services        │
└─────────────────────────────────────┬───────────────────┬──────────────────────────────┘
                                      │                   │
                                      ▼                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  AUDIT & VISIBILITY                                    │
│                                                                                        │
│   public.audit_log (ADR-0006)                  UI Customer (/app/orders/$orderId)      │
│   - Action: 'update' / 'status_change'         - StatusPill: 'Cancelado' / 'Borrador'  │
│   - oldData vs newData diff                    - Bloqueo de confirmación / repetición  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 🔍 HALLAZGOS Y AUDITORÍA DETALLADA

### 3.1. Modificación de Pedidos (`OrderModificationService`)
- **Implementación**: [`src/modules/orders/application/order-modification-service.ts`](file:///Users/alex/Developer/YourMeal-OS/src/modules/orders/application/order-modification-service.ts).
- **Comportamiento Auditado**:
  - ✅ **Guard de Estados**: Bloquea modificaciones si el pedido no está en `draft`, `confirmed`, `in_production` o `prepared`.
  - ✅ **Validación de Catálogo**: Comprueba en modo de solo lectura que cada `dishId` pertenece al catálogo del tenant.
  - ✅ **Recálculo Atómico de Precio**: Recalcula `newGrandTotal` en función de las nuevas raciones y `unitPriceOverride`, actualizando la cabecera `orders`.
  - ✅ **Preservación Dietética**: Mantiene intacto `orders.dietary_snapshot` (alérgenos `peanuts`, `nuts` y dieta `vegetarian` de Winnie Pooh permanecen congelados).
  - ✅ **Auditoría Completa**: Genera registro en `AuditService` con el diff detallado antes y después del cambio.
  - ⚠️ **Gap R-04 (Delivery Services Sync)**: Si la modificación altera los días de entrega (ej. se eliminan platos del lunes y se añaden platos del miércoles), el servicio no actualiza las filas correspondientes en `delivery_services`.

### 3.2. Cancelación de Pedidos (`OrderLifecycleService`)
- **Implementación**: [`src/modules/orders/application/order-lifecycle-service.ts`](file:///Users/alex/Developer/YourMeal-OS/src/modules/orders/application/order-lifecycle-service.ts).
- **Comportamiento Auditado**:
  - ✅ **Guard de Cancelación**: Solo permite cancelar pedidos en `draft`, `confirmed`, `in_production`, `prepared` o `ready_for_delivery`.
  - ✅ **Bloqueo en Ruta/Entregado**: Lanza `DomainError("INVALID_STATE")` si se intenta cancelar un pedido que ya está en reparto (`out_for_delivery`) o entregado (`delivered`).
  - ✅ **Auditoría de Cancelación**: Registra obligatoriamente el `cancelReason` en `AuditService`.
  - ⚠️ **Gap R-05 (Cascada a Delivery Services)**: `OrderLifecycleService.cancelOrder` no actualiza el estado de las filas en `delivery_services` (quedan en `status = 'pending'` en lugar de transicionar a `'cancelled'`).

---

## 4. 📊 MATRIZ DE CALIDAD & TEST SUITES

```text
Test Suite                                                            Resultados
────────────────────────────────────────────────────────────────────────────────
src/modules/orders/application/order-modification-service.spec.ts        4/4  ✅ PASS
src/modules/orders/application/app-orders-routing.spec.ts                3/3  ✅ PASS
src/modules/orders/application/order-lifecycle-service.spec.ts         15/15 ✅ PASS
────────────────────────────────────────────────────────────────────────────────
TOTAL TESTS EJECUTADOS EN GATE 6: 22/22 (100% PASS)
```

---

## 5. 📋 TABLA CONSOLIDADA DE GAPS DE AUDITORÍA CR-UX-CLIENT-01

| ID Gap | Módulo / Capacidad | Descripción | Impacto |
| :--- | :--- | :--- | :--- |
| **R-01** | `/app/schedule` Step 3 | Texto hardcodeado "Dirección habitual" sin selector de direcciones | Customer UX |
| **R-02** | `createDeliveryServicesForOrder` | Snapshot de dirección B2C queda en `unresolved` | Reparto / Delivery |
| **R-03** | `/admin/customers` | Ficha no muestra las direcciones personales de `customer_addresses` | Operaciones |
| **R-03B** | `/admin/orders` | Cajón de detalle solo muestra dirección si existe `siteAddress` B2B | Operaciones |
| **R-04** | `OrderModificationService` | No resincroniza `delivery_services` al cambiar fechas de entrega | Delivery / Rutas |
| **R-05** | `OrderLifecycleService` | Cancelar un pedido no transiciona sus `delivery_services` a `cancelled` | Delivery / Rutas |

---

## 6. 🏁 CONCLUSIÓN

El **Gate 6 queda AUDITADO Y SUPERADO** a nivel de lógica de modificación, recálculo de precios, inmutabilidad, protección de estados de cancelación y preservación del perfil dietético.

Los gaps detectados en la sincronización de `delivery_services` (**R-04** y **R-05**) quedan formalmente registrados para su remediación coordinada junto con la cadena de direcciones B2C (**R-01..R-03B**).
