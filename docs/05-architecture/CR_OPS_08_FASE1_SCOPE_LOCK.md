# 🏛️ CR-OPS-08 · FASE 1: SCOPE LOCK
## B2C DELIVERY ADDRESS & ORDER LIFECYCLE

```text
CR-OPS-08 · FASE 1: DISCOVERY & SCOPE LOCK
FECHA: 2026-10-03
ESTADO: 🔒 SCOPE LOCKED (LISTO PARA AUTORIZACIÓN DE IMPLEMENTACIÓN)
TIPO: Corrección Estructural de Cadena de Entrega B2C & Ciclo de Vida
AUTORIZACIONES: 0 mutaciones en Fase 1 · Cero impacto en producción
```

---

## 1. 🎯 OBJETIVO Y PROBLEMA ARQUITECTÓNICO

Durante la auditoría **CR-UX-CLIENT-01**, se demostró una asimetría estructural: mientras que el circuito de seguridad alimentaria y perfil dietético está completamente conectado de extremo a extremo (100% PASS), el circuito de **Direcciones de Entrega Particulares (B2C)** y su sincronización con **Delivery Services** sufre de 6 desconexiones funcionales encadenadas (**R-01 a R-05**).

El objetivo de **CR-OPS-08** es resolver de forma unificada y coherente la cadena completa de entrega:

$$\begin{aligned}
\text{Customer Addresses} &\xrightarrow{\text{R-01 (Checkout)}} \text{orders.delivery\_address\_id} \\
&\xrightarrow{\text{R-02 (Intake)}} \text{delivery\_services.delivery\_address\_snapshot} \\
&\xrightarrow{\text{R-03 / R-03B}} \text{Operations Visibility (/admin/customers \& /admin/orders)} \\
&\xrightarrow{\text{R-04 (Modify)}} \text{Resync Delivery Dates in delivery\_services} \\
&\xrightarrow{\text{R-05 (Cancel)}} \text{Cascade Status 'cancelled' in delivery\_services}
\end{aligned}$$

---

## 2. 🔍 INVENTARIO DETALLADO DE LOS GAPS (R-01 A R-05)

### R-01 · Selector de Dirección en Checkout (`/app/schedule`)
- **Estado Actual**: En [`src/routes/_authenticated/app.schedule.tsx:396-401`](file:///Users/alex/Developer/YourMeal-OS/src/routes/_authenticated/app.schedule.tsx#L396-L401), el Resumen del pedido muestra texto hardcodeado `"Dirección habitual"` sin consultar `customer_addresses` ni permitir seleccionar una dirección alternativa.
- **Solución Bloqueada**:
  1. Cargar las direcciones del cliente con `useQuery` sobre `customer_addresses`.
  2. Seleccionar por defecto la dirección `is_default: true` (o la primera registrada).
  3. Permitir cambiar entre direcciones o pulsar "Añadir dirección" si no tiene ninguna.
  4. Enviar `deliveryAddressId` en el payload de confirmación.

### R-02 · Transporte y Snapshot en Ingesta de Pedidos (`OrderIntakeService` + `delivery_services`)
- **Estado Actual**:
  1. `OrderIntakeDraftCommand` ([`src/modules/order-intake/domain/intake-command.ts`](file:///Users/alex/Developer/YourMeal-OS/src/modules/order-intake/domain/intake-command.ts)) no tiene el campo `deliveryAddressId`.
  2. `OrderService.programDraftItems` no persiste `delivery_address_id` en `orders`.
  3. `createDeliveryServicesForOrder` ([`src/modules/operations/infrastructure/operations-repository.ts:321-344`](file:///Users/alex/Developer/YourMeal-OS/src/modules/operations/infrastructure/operations-repository.ts#L321-L344)) solo construye snapshot si existe `order.siteAddress` (B2B), dejando `delivery_address_snapshot` en `{ unresolved: true, reason: "no_address_at_intake" }` para particulares.
- **Solución Bloqueada**:
  1. Extender `OrderIntakeDraftCommand`, `useProgramDraftOrder` y `ProgramDraftItemsCommand` con `deliveryAddressId?: string`.
  2. En `OrderService.programDraftItems`, si `deliveryAddressId` no viene en el comando, resolver automáticamente la dirección por defecto del cliente en `customer_addresses`.
  3. Persistir `delivery_address_id` en la tabla `orders` (la columna y FK `REFERENCES customer_addresses(id)` ya existen en Postgres).
  4. En `createDeliveryServicesForOrder`, resolver `delivery_address_snapshot` leyendo `customer_addresses` si `siteAddress` es nulo, congelando `{ addressId, street, city, zip, label, lat, lng }`.

### R-03 · Visualización de Direcciones B2C en Ficha de Clientes (`/admin/customers`)
- **Estado Actual**: [`src/routes/_authenticated/admin.customers.tsx`](file:///Users/alex/Developer/YourMeal-OS/src/routes/_authenticated/admin.customers.tsx) muestra sitios B2B pero no lista las direcciones personales de `customer_addresses`.
- **Solución Bloqueada**: Renderizar sección "Direcciones de Entrega" con badge de dirección predeterminada y listado de direcciones activas del cliente.

### R-03B · Visualización de Dirección de Entrega en Detalle de Pedidos (`/admin/orders`)
- **Estado Actual**: En el cajón de detalle de [`src/routes/_authenticated/admin.orders.tsx:596-605`](file:///Users/alex/Developer/YourMeal-OS/src/routes/_authenticated/admin.orders.tsx#L596-L605), la dirección solo se renderiza si `detail.siteName` o `detail.siteAddress` existen.
- **Solución Bloqueada**: Renderizar la dirección de entrega física (`detail.deliveryAddress` o snapshot de `delivery_services`) tanto para pedidos particulares B2C como corporativos B2B.

### R-04 · Resincronización de `delivery_services` en Modificación de Fechas (`OrderModificationService`)
- **Estado Actual**: [`OrderModificationService.modifyOrder`](file:///Users/alex/Developer/YourMeal-OS/src/modules/orders/application/order-modification-service.ts) reemplaza líneas en `order_items`, pero si los días de entrega cambian, no actualiza `delivery_services`.
- **Solución Bloqueada**: Invocar `createDeliveryServicesForOrder` / resincronización de servicios al modificar un pedido para que las fechas en `delivery_services` reflejen exactamente los días de las nuevas líneas.

### R-05 · Cascada de Cancelación a `delivery_services` (`OrderLifecycleService`)
- **Estado Actual**: [`OrderLifecycleService.cancelOrder`](file:///Users/alex/Developer/YourMeal-OS/src/modules/orders/application/order-lifecycle-service.ts) transiciona `orders.status = 'cancelled'`, pero los registros de `delivery_services` asociados quedan en `status = 'pending'`.
- **Solución Bloqueada**: Al cancelar un pedido, actualizar en cascada todos los `delivery_services` asociados con `order_id = orderId` y `status = 'pending'` a `status = 'cancelled'`.

---

## 3. 🛡️ INVARIANTES Y REGLAS DE NO-REGRESIÓN

1. **Invariante de Precios e Inmutabilidad**: La asignación de dirección de entrega no afecta el cálculo de precios comerciales ni la integridad de `orders.dietary_snapshot`.
2. **Invariante Multi-Tenant**: Todas las consultas a `customer_addresses` y `delivery_services` filtran estrictamente por `tenant_id` y respetan las políticas RLS (`is_customer_owner` / `has_any_staff_role`).
3. **Invariante B2B Preservado**: Los pedidos corporativos con `siteId` y `siteAddress` continúan funcionando sin alteraciones.
4. **Cero Migraciones Destructivas**: No se requieren migraciones DDL; las columnas `delivery_address_id` y `delivery_address_snapshot` ya existen en `public.orders` y `public.delivery_services`.

---

## 4. 🧪 MATRIZ DE PRUEBAS PREVISTAS (QUALITY GATES FASE 4)

```text
Suite de Pruebas                                      Objetivo
──────────────────────────────────────────────────────────────────────────────────
1. useProgramDraftOrder / intakeDraft.spec.ts         Verificar payload con deliveryAddressId
2. order-service.spec.ts                              Verificar persistencia de delivery_address_id
3. operations-repository.spec.ts                      Verificar snapshot B2C en delivery_services
4. order-modification-service.spec.ts                 Verificar resync de delivery_services
5. order-lifecycle-service.spec.ts                    Verificar cascada de cancelación a delivery_services
6. admin.customers.spec.tsx                           Verificar renderizado de direcciones B2C
7. admin.orders.spec.tsx                              Verificar renderizado de dirección en drawer
8. app.schedule.spec.tsx                              Verificar selector de direcciones en checkout
──────────────────────────────────────────────────────────────────────────────────
```

---

## 5. 🔒 DECLARACIÓN FORMAL DE SCOPE LOCK

```text
ESTADO: SCOPE LOCK v1.0 APROBADO TÉCNICAMENTE
ALCANCE CERRADO: R-01, R-02, R-03, R-03B, R-04, R-05
MUTACIONES REALIZADAS EN FASE 1: 0 (CERO)
```

🛑 **STRICT STOP ACTIVO.**

Para proceder a la implementación controlada de CR-OPS-08, se requiere la orden explícita:

> **`AUTORIZO IMPLEMENTACIÓN · CR-OPS-08`**
