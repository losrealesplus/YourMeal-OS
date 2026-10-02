# YOURMEAL OS — DISCOVERY & DIAGNOSIS MASTER REPORT
## Post-Closure Analysis: CR-OPS-DIET-01 & CR-OPS-05
**Autoridad**: Human Product Authority  
**Fase de Gobernanza**: Discovery & Operational Diagnosis · **STRICT READ-ONLY**  
**Estado del Repositorio**: `main` en `b99d6db2` (Clean, Up-to-date with `origin/main`)  
**Producción**: `https://eatclean.yourmealos.com` (Worker Version `322f662f-0f5d-4479-8b37-adc3a152ee97`)  

---

### Resumen Ejecutivo

Con la consolidación, verificación E2E y despliegue exitoso en producción de:
1. **`CR-OPS-DIET-01`**: Bucle Dietético Integral (autoservicio de clientes `/app/settings/dietary`, 14 alérgenos UE, inmutabilidad de `orders.dietary_snapshot`, e insignias operativas `DietaryBadges` en `OrdersTable`).
2. **`CR-OPS-05`**: Weekly Menu Intake Separation (desacoplamiento constitucional de la oferta disponible en `/app/weekly-menu` frente a la verdad histórica y económica contratada en `orders` y `order_items`).

Se ha completado el tramo upstream de la plataforma: **Captura de la Demanda y Gobernanza Dietética**.

Sin embargo, una auditoría exhaustiva del flujo operativo downstream (**Cocina / Producción → Empacado → Despacho / Reparto → Liquidación**) revela que **la cadena operativa se rompe de forma crítica inmediatamente después del empacado**. 

A continuación se detalla la matriz de diagnóstico, evidencias técnicas verificadas en código y base de datos, impacto operativo y la recomendación priorizada de Change Requests.

---

### 1. Hallazgos Diagnosticados Priorizados (Con Evidencia en Código y DB)

```
[MENU] ✅ ──> [ORDER CAPTURE] ✅ ──> [PRODUCTION] 🟡 ──> [PACKING] 🔴 ──> [DELIVERY] 🔴 ──> [BILLING] 🟡
  CR-OPS-05     CR-OPS-DIET-01        Sheet funciona     Handoff Roto      Sin sustrato DB     Desacoplado
```

---

#### 🔴 HALLAZGO 1 (Severidad Crítica): Desconexión Absoluta del Handoff Empacado ➔ Reparto
* **Ubicación en Código**:
  - `src/routes/_authenticated/admin.production-sheet.tsx` (`handlePackOrder`, L537-L542):
    ```typescript
    await orderApi.readyForKitchen(readyForKitchenCommand({ orderId }));
    ```
  - `src/order/OrderFacade.ts` (L184-L190):
    ```typescript
    async readyForKitchen(command: ReadyForKitchenCommand): Promise<void> {
      // Transiciona la orden a status = "prepared"
      await this.orderRepository.updateStatus(command.orderId, "prepared");
    }
    ```
  - `src/delivery/DeliveryFacade.ts` (`loadContext`, L346-L350) y `src/order/OrderFacade.ts` (`getOrdersReadyForDelivery`, L469-L479):
    ```typescript
    // La vista de Reparto filtra EXCLUSIVAMENTE por "ready_for_delivery" y "out_for_delivery":
    .in("status", ["ready_for_delivery", "out_for_delivery"])
    ```
* **Causa Raíz**:
  Cuando el operario en cocina termina de empacar la bolsa del cliente y pulsa "Marcar como Empacado" en `/admin/production-sheet`, el sistema ejecuta `readyForKitchen` (que pone el pedido en estado `"prepared"`). **Nunca invoca `readyForDeliveryCommand`**. 
* **Impacto Operativo Inmediato**:
  En `/admin/delivery-today`, el equipo de logística y repartidores ve **0 pedidos disponibles**. Los pedidos empacados quedan "atrapados" en un limbo de estado `"prepared"` invisible para logística. Los repartidores no pueden cargar furgonetas ni iniciar rutas salvo manipulación manual de base de datos.

---

#### 🔴 HALLAZGO 2 (Severidad Crítica / Falla Arquitectónica): Estado de Pedido Monolítico vs. Ciclo Multidía
* **Ubicación en Código**:
  - `src/delivery/DeliveryFacade.ts` (`confirmDelivery`, L168-L172):
    ```typescript
    async confirmDelivery(command: ConfirmDeliveryCommand): Promise<void> {
      // Al confirmar UNA entrega, muta la orden global a "delivered":
      await this.orderRepository.updateStatus(command.orderId, "delivered");
    }
    ```
  - `src/modules/operations/infrastructure/operations-repository.ts` (`listOrders`, L154):
    ```typescript
    // La cocina consulta pedidos en estado de preparación activa:
    .in("status", ["confirmed", "in_production", "prepared"])
    ```
* **Causa Raíz**:
  En el modelo de suscripción o menú semanal de YourMeal OS, un cliente encarga comidas para múltiples días de la semana (e.g. Lunes, Miércoles, Viernes). Sin embargo, el estado de preparación y despacho es **un único campo a nivel de cabecera (`orders.status`)**.
* **Impacto Operativo Catastrófico**:
  Cuando el repartidor entrega la bolsa del **Lunes** al mediodía y marca "Entregado", `orders.status` pasa a `"delivered"`.
  El **Miércoles** por la mañana, cuando el jefe de cocina entra a `/admin/production-sheet` a preparar los platos de ese día, el filtro excluye los pedidos en `"delivered"`. **¡Las raciones de Miércoles y Viernes de ese cliente desaparecen por completo de la hoja de producción de cocina!**

---

#### 🟡 HALLAZGO 3 (Severidad Alta): Ausencia de Sustrato Persistente de Rutas/Entregas en DB
* **Ubicación en Base de Datos Supabase (`eu-central-1`)**:
  - `public.delivery_routes`: **INEXISTENTE** (PGRST205)
  - `public.delivery_stops`: **INEXISTENTE** (PGRST205)
  - `public.deliveries`: **INEXISTENTE** (PGRST205)
  - `public.delivery_events`: **INEXISTENTE** (PGRST205)
* **Ubicación en Código**:
  - `src/delivery/mapDelivery.ts`: Sintetiza en memoria IDs efímeros con formato:
    ```typescript
    assignmentId: `assignment:${order.id}`
    stopId: `stop:${order.id}`
    ```
* **Impacto Operativo**:
  No hay persistencia de quién repartió qué, a qué hora, qué incidencias hubo (cliente ausente, portero, cambio de dirección), ni trazabilidad de cadena de frío/entrega. Si la página se refresca o acceden dos repartidores, no hay asignación real ni concurrencia protegida.

---

#### 🟡 HALLAZGO 4 (Severidad Media): Desconexión de Facturación y Liquidación
* **Ubicación en Código**:
  - `src/routes/_authenticated/admin.accounting.tsx`
* **Impacto Operativo**:
  La contabilidad y facturación se calcula directamente sobre el importe total del pedido capturado, sin conciliación contra las entregas efectivamente completadas o incidencias no entregadas.

---

### 2. Matriz de Dependencias Operativas

```
┌────────────────────────────────────────────────────────┐
│                   UPSTREAM (RESUELTO)                   │
│  [CR-OPS-05] Weekly Menu  ──>  [CR-OPS-DIET-01] Dietary │
│  (Oferta Semanal / Precios)     (Snapshot Inmutable)   │
└───────────────────────────┬────────────────────────────┘
                            │ genera
                            ▼
┌────────────────────────────────────────────────────────┐
│               DOWNSTREAM INMEDIATO (ROTO)              │
│  1. Cocina produce platos del día (Production Sheet)   │
│  2. Empacador sella bolsa por cliente                  │
│  3. [QUIEBRE 1] Handoff a Reparto (Estado "prepared")  │
│  4. [QUIEBRE 2] Entrega Lunes invalida Miércoles       │
└───────────────────────────┬────────────────────────────┘
                            │ impacta
                            ▼
┌────────────────────────────────────────────────────────┐
│               DISTRIBUCIÓN Y CLIENTE FINAL              │
│  - Repartidor sin pedidos visibles en /delivery-today  │
│  - Cliente recibe 1 día y pierde los siguientes        │
│  - Liquidación financiera sin trazabilidad de entrega  │
└────────────────────────────────────────────────────────┘
```

---

### 3. Recomendación Normativa para el Siguiente Change Request

Para restaurar la integridad del negocio de catering sin sobrecargar el sistema con complejidad innecesaria, se debe descomponer el trabajo en dos capas:

#### LO QUE DEBE SER EL SIGUIENTE CR (`CR-OPS-06: Handoff Empacado ↔ Despacho y Desacoplamiento por Entrega`)
1. **Reparación Inmediata del Handoff Operativo**:
   - Ajustar el flujo de empaque en `/admin/production-sheet` para que al completar el empaque de un pedido/entrega, se promueva explícitamente a `ready_for_delivery` (o se configure el estado unificado que alimenta `/admin/delivery-today`).
2. **Alcance de Entrega por Día (Delivery Scope / Delivery Units)**:
   - Asegurar que la finalización o entrega del día $D_1$ no anule ni oculte los ítems del pedido programados para $D_2$ y $D_3$ en las hojas de producción de cocina subsiguientes.
3. **Visibilidad en `/admin/delivery-today`**:
   - Garantizar que las bolsas empacadas del día seleccionado aparezcan de inmediato para el equipo de reparto con su dirección, notas y badges dietéticos correspondientes.

#### LO QUE NO DEBE HACERSE TODAVÍA (Out of Scope / Anti-Bloat)
- ❌ **No integrar APIs externas de flotas ni GPS en tiempo real** (Onfleet, Routific, Google Maps Fleet Engine).
- ❌ **No construir algoritmos de optimización combinatoria de rutas (TSP/VRP)** en este momento.
- ❌ **No rediseñar el módulo de facturación/contabilidad** hasta que el flujo físico de comida esté 100% estabilizado.
- ❌ **No alterar el esquema de `orders` de forma destructiva**; cualquier persistencia de entregas debe ser aditiva y retrocompatible.

---

### 4. Estado de Gobernanza y Próximos Pasos

* **Estado**: Discovery & Diagnosis Complete.
* **Código / DB**: 0 modificaciones, 0 migraciones, 0 branches creadas.
* **Recomendación para AG**: Mantenerse en **STOP** estricto hasta que la **Human Product Authority** revise este diagnóstico y decida abrir formalmente el **Gate 1 de `CR-OPS-06`** o priorizar una ruta alternativa.
