# YOURMEAL OS — ARCHITECTURE REVIEW & SCOPE LOCK: CR-OPS-06
## Delivery Scope & Production ➔ Delivery Handoff
**Autoridad**: Human Product Authority  
**Fase de Gobernanza**: Architecture Review & Scope Lock Candidate · **STRICT READ-ONLY**  
**Estado del Repositorio**: `main` en `b99d6db2` (Limpio, synchronized con `origin/main`)  
**Producción**: `https://eatclean.yourmealos.com` (Worker `322f662f-0f5d-4479-8b37-adc3a152ee97`)  

---

### Resumen Ejecutivo

Este documento formaliza la **Revisión de Arquitectura** para **`CR-OPS-06: Delivery Scope & Production → Delivery Handoff`**. 

El objetivo es resolver de raíz los dos problemas descubiertos en la cadena operativa física tras el cierre de `CR-OPS-DIET-01` y `CR-OPS-05`:
1. **El Quiebre de Handoff en Mesa de Empaque**: Las bolsas marcadas como empacadas en `/admin/production-sheet` quedan en `prepared`, haciéndose invisibles para el equipo de despacho y reparto en `/admin/delivery-today` (que filtra exclusivamente por `ready_for_delivery` y `out_for_delivery`).
2. **El Colapso de Pedidos Multidía**: En el modelo actual, `orders.status` es un único campo a nivel de cabecera. Cuando un repartidor entrega el servicio del Lunes, la orden global pasa a `delivered`. Al llegar el Miércoles, el filtro de cocina (`confirmed`, `in_production`, `prepared`) y la función RPC de base de datos (`transition_order_status`) bloquean o ignoran el pedido, **haciendo desaparecer las raciones de Miércoles y Viernes de ese cliente**.

---

### 1. Análisis Arquitectónico: ¿Necesitamos una Entidad Persistente de Servicio / Delivery?

Para responder a la pregunta fundamental de la **Human Product Authority**, evaluamos con rigor técnico las dos alternativas viables:

```
─────────────────────────────────────────────────────────────────────────────
OPCIÓN A: Reutilizar esquema existente sin nueva entidad (Estado en order_items)
OPCIÓN B: Introducir la entidad canónica de agregación (delivery_services)
─────────────────────────────────────────────────────────────────────────────
```

#### Comparativa Técnica y Operativa

| Criterio | Opción A: Estado en `order_items` | Opción B: Entidad Canónica `delivery_services` |
| :--- | :--- | :--- |
| **Concepto de Dominio** | Fuerza el estado operativo a nivel de cada ración/plato individual. | Modela la realidad física: **1 Pedido tiene 1..N Jornadas de Entrega (Bolsas/Servicios)**. |
| **Manejo de Bolsas** | Frágil: si el Lunes hay 3 platos, hay que actualizar 3 filas atómicamente y sincronizarlas. | Robusto: 1 fila por cliente/día de entrega (`delivery_service_id`). |
| **Metadatos de Entrega** | Inconsistente: notas de entrega, incidencias o dirección deben duplicarse en cada ítem. | Limpio: `delivered_at`, `notes`, `address_id` residen en la jornada de servicio. |
| **Impacto en UI Reparto** | Requiere agrupar ítems en memoria en cada render de `/delivery-today`. | Mapeo natural 1:1 con las tarjetas de entrega de `/delivery-today`. |
| **Complejidad de Migración** | Baja inicialmente, pero introduce deuda técnica severa en trazabilidad y auditoría. | Aditiva, limpia y no destructiva sobre `orders` u `order_items`. |

#### Veredicto de Arquitectura

**SE RECOMIENDA FORMALMENTE LA OPCIÓN B (Entidad Canónica `delivery_services` o `order_deliveries`)**.

En un servicio de catering o meal-prep por suscripción:
- **`Order`** es el **Contrato Comercial y Económico** (abarca la semana `week_start`, cliente, total € y snapshot dietético).
- **`DeliveryService` (o `OrderDelivery`)** es el **Evento de Cumplimiento Físico / Servicio** (representa la bolsa entregable en un día específico: `delivery_date`, `status`, dirección y notas).
- **`OrderItem`** representa los **Platos Contratados** que componen dicho servicio (`day_date`, `dish_id`, `qty`, `unit_price`).

---

### 2. Modelo de Datos Propuesto (Aditivo y No Destructivo)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                 orders                                       │
│  id (uuid, PK)                                                               │
│  tenant_id (uuid)                                                            │
│  customer_id (uuid)                                                          │
│  week_start (date)                                                           │
│  status (order_status: draft | confirmed | in_fulfillment | completed)       │
│  dietary_snapshot (jsonb)                                                    │
│  total (numeric)                                                             │
└──────────────────────┬───────────────────────────────────────────────────────┘
                       │ 1 : N
                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          delivery_services (Nueva)                           │
│  id (uuid, PK)                                                               │
│  tenant_id (uuid, FK tenants)                                                │
│  order_id (uuid, FK orders ON DELETE CASCADE)                                │
│  customer_id (uuid, FK customers)                                            │
│  delivery_date (date) ──> e.g. '2026-10-05'                                  │
│  delivery_address_id (uuid, FK customer_addresses)                           │
│  status (delivery_service_status)                                            │
│    Valores: pending | in_production | prepared | ready_for_delivery |        │
│             out_for_delivery | delivered | delivery_issue | cancelled        │
│  dietary_snapshot (jsonb) ──> Inmutable heredado de order                    │
│  packed_at (timestamptz)                                                     │
│  delivered_at (timestamptz)                                                  │
│  notes (text)                                                                │
│  created_at (timestamptz)                                                    │
└──────────────────────┬───────────────────────────────────────────────────────┘
                       │ 1 : N (Vinculación por order_id + day_date)
                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                               order_items                                    │
│  id (uuid, PK)                                                               │
│  order_id (uuid, FK orders)                                                  │
│  day_date (date) ──> Coincide con delivery_services.delivery_date            │
│  dish_id (uuid, FK dishes)                                                   │
│  qty (int)                                                                   │
│  unit_price (numeric)                                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Compatibilidad Hacia Atrás (Zero Downtime)
- Los pedidos existentes conservan su fila en `orders` y sus filas en `order_items`.
- Para pedidos históricos o en curso, la creación de `delivery_services` se puede generar de forma determinista agrupando `(order_id, day_date)` con `status = 'delivered'` si `orders.status = 'delivered'`, o `status = orders.status` si aún están activos.
- `orders.status` mantiene su semántica macro comercial.

---

### 3. Flujo de Estados Propuesto: Macro-Estado vs. Micro-Estado de Servicio

```
=============================================================================
1. MACRO-ESTADO DEL PEDIDO (orders.status)
=============================================================================
draft ──> confirmed ──> in_fulfillment ──> completed (todos delivered)
                           │
                           └──> cancelled

=============================================================================
2. MICRO-ESTADO DE CADA JORNADA / SERVICIO (delivery_services.status)
=============================================================================
pending ──> in_production ──> prepared ──> ready_for_delivery ──> out_for_delivery ──> delivered
                                                                         │
                                                                         └──> delivery_issue (reintento)
```

#### Comportamiento del Handoff Cocina ➔ Empaque ➔ Reparto
1. **En Cocina (`admin.production-sheet` / Tab P1)**:
   - Se cocinan los lotes de platos del día seleccionado.
   - Estado del lote pasa a `in_progress` → `completed`.
2. **En Mesa de Empaque (`admin.production-sheet` / Tab P2 Cliente)**:
   - El operario verifica las porciones de la bolsa del cliente para la fecha seleccionada.
   - Al pulsar **"Marcar como Empacado"**:
     - El micro-estado de ese `delivery_service` transiciona de `prepared` ➔ **`ready_for_delivery`**.
     - Se registra `packed_at = now()`.
3. **En Panel de Reparto (`admin.delivery-today`)**:
   - Consulta los `delivery_services` donde `delivery_date = :dayDate` y `status IN ('ready_for_delivery', 'out_for_delivery')`.
   - La bolsa aparece **de inmediato** con estado `Ready` para ser cargada en el vehículo.
4. **Al Entregar**:
   - El repartidor pulsa "Confirmar Entrega" en `/admin/delivery-today`.
   - Transiciona ese `delivery_service` específico a `delivered`.
   - **Los servicios de días posteriores (Miércoles, Viernes) permanecen intactos en `pending` o `confirmed`**.
   - La hoja de cocina del Miércoles carga sin ninguna interferencia.

---

### 4. Invariantes del Sistema

1. **Invariante de Aislamiento por Fecha**:
   Ningún cambio de estado en la entrega del día $D_1$ puede mutar, cancelar ni ocultar los ítems o servicios programados para los días $D_2, \dots, D_n$.
2. **Invariante del Handoff Operativo**:
   Una bolsa declarada empacada en la mesa de packing (`admin.production-sheet`) debe alcanzar atómicamente el estado `ready_for_delivery`, garantizando su visibilidad inmediata en `/admin/delivery-today` sin intervención manual.
3. **Invariante Dietética en Reparto**:
   Toda tarjeta de entrega en `/admin/delivery-today` debe proyectar el `dietary_snapshot` inmutable asociado a la entrega, renderizando el componente `DietaryBadges` en modo compacto para alertar de forma visual e inequívoca sobre los 14 alérgenos UE antes de que el repartidor entregue la bolsa al cliente.
4. **Invariante de Cierre de Pedido**:
   Un pedido global (`orders`) solo alcanza el estado macro `completed` cuando **el 100% de sus `delivery_services` asociados** se encuentran en estado `delivered` (o `cancelled` con resolución).

---

### 5. Dependencias del Sistema

- **Upstream**:
  - `CR-OPS-05` (Order Intake): Al capturar y confirmar un pedido semanal, se generan los `delivery_services` correspondientes para cada fecha única encontrada en sus `order_items`.
  - `CR-OPS-DIET-01`: Copia el `dietary_snapshot` congelado del pedido hacia cada `delivery_service`.
- **Downstream**:
  - `admin.production-sheet`: Consulta las líneas de producción y el estado de empaque por servicio de fecha.
  - `admin.delivery-today`: Consume los servicios del día vía `DeliveryFacade` y los proyecta en las tarjetas de entrega.

---

### 6. Impacto sobre Producción, Packing y Delivery

1. **Cocina (`P1 Cocina`)**:
   - Cero impacto negativo. Continúa agrupando recetas e ingredientes por `order_items.day_date`.
2. **Mesa de Packing (`P2 Packing por Cliente`)**:
   - Al completar la verificación de una bolsa, la acción "Marcar como Empacado" promueve el servicio a `ready_for_delivery`.
   - Se elimina la confusión actual donde la interfaz indicaba "Bolsa lista para reparto" pero el backend la dejaba en `prepared`.
3. **Logística y Despacho (`admin.delivery-today`)**:
   - Las tarjetas de entrega muestran datos reales y sincronizados.
   - Se integran las insignias rojas de alérgenos (`DietaryBadges`) en la cabecera de la tarjeta.
   - La acción de entrega finaliza con éxito sin destruir la semana de producción del cliente.

---

### 7. Qué Reutilizar (Alineación con el Código Existente)

- **`DietaryBadges` (`src/components/operations/dietary-badges.tsx`)**:
  - Reutilización directa en las tarjetas de entrega de `src/delivery-experience/DeliveryTodayPanel.tsx` (tanto en vista colapsada como expandida).
- **`OrderFacade` (`src/order/OrderFacade.ts`)**:
  - Reutilizar `readyForDeliveryCommand` y `readyForKitchenCommand`.
- **`DeliveryFacade` (`src/delivery/DeliveryFacade.ts`)**:
  - Reutilizar `getDeliveryContext`, adaptándolo para consultar el agregado por fecha de servicio.
- **`ProductionReportService` (`src/modules/operations/application/production-report-service.ts`)**:
  - Conservar la lógica de cálculo y agregación de ingredientes y recetas.

---

### 8. Qué Debe Quedar Fuera (Out of Scope / Anti-Bloat)

Para garantizar un cierre limpio, auditable y sin sobreingeniería en `CR-OPS-06`:
- ❌ **No incluir optimización algorítmica de rutas (VRP / TSP)**.
- ❌ **No incluir tracking GPS en tiempo real de repartidores ni mapas interactivos**.
- ❌ **No incluir módulos de prueba de entrega compleja (POD con foto o firma biométrica)**.
- ❌ **No modificar los módulos de facturación o contabilidad (`admin.accounting.tsx`)**.
- ❌ **No alterar destructivamente la tabla `orders`**.

---

### 9. Scope Lock Propuesto para `CR-OPS-06`

```text
CR-OPS-06: DELIVERY SCOPE & PRODUCTION ➔ DELIVERY HANDOFF

ALCANCE CONGELADO:
1. Sustrato de Entregas por Fecha:
   - Creación de tabla aditiva `delivery_services` vinculada a `orders` por fecha de entrega.
   - Población automática de `delivery_services` al confirmar pedidos.
2. Handoff de Empaque:
   - Modificación de `handlePackOrder` en `admin.production-sheet.tsx` para transicionar
     el servicio a `ready_for_delivery`.
3. Preservación Multidía:
   - La confirmación de entrega en `admin.delivery-today.tsx` opera sobre el `delivery_service`
     del día, sin mutar a `delivered` la orden completa ni afectar los días futuros en cocina.
4. Integración Dietética en Reparto:
   - Renderizado de `DietaryBadges` en las tarjetas de entrega de `admin.delivery-today.tsx`.
5. Verificación E2E en Producción:
   - Flujo continuo: Menú -> Pedido multidía (Lunes + Miércoles) -> Cocina Lunes -> 
     Empaque Lunes -> Reparto Lunes (Entregado) -> Verificación de Cocina Miércoles INTACTA.
```

---

### 10. Estado de Gobernanza y Próximos Pasos

* **Estado**: Architecture Review & Scope Lock completado.
* **Repositorio**: `main` en `b99d6db2` (Inalterado, 0 código, 0 migraciones).
* **Parada Obligatoria**: **STOP ESTRICTO**. Queda a la espera de la ratificación formal de la **Human Product Authority** para aprobar este Scope Lock y autorizar los Gates sucesivos.
