# YOURMEAL OS — DATA CONTRACT & TECHNICAL SPECIFICATION
## CR-OPS-06: Delivery Scope & Production ➔ Delivery Handoff
**Autoridad**: Human Product Authority  
**Fase de Gobernanza**: Data Contract Specification · **PRE-GATE 3 (STRICT READ-ONLY)**  
**Estado del Repositorio**: `main` en `b99d6db2` (0 código modificado, 0 migraciones, 0 branches)  
**Producción Live**: `https://eatclean.yourmealos.com`  

---

### Resumen Ejecutivo

Este documento formaliza el **Contrato de Datos y Especificación Técnica** para **`CR-OPS-06`**, dando cumplimiento estricto a las directrices de la **Human Product Authority** antes de la apertura de cualquier rama de implementación (Gate 3).

El objetivo es desacoplar el **Contrato Comercial** (`orders`) del **Cumplimiento Físico de cada Jornada** (`delivery_services`), garantizando:
1. **Preservación Incondicional de Pedidos Multidía**: La entrega del Lunes jamás destruirá ni ocultará la producción del Miércoles o Viernes.
2. **Handoff Atómico Empaque ➔ Despacho**: La acción "Marcar como Empacado" en `/admin/production-sheet` posiciona la bolsa inmediatamente en `ready_for_delivery` en `/admin/delivery-today`.
3. **Inmutabilidad de la Entrega (Delivery Snapshot)**: Dirección, contacto, instrucciones y restricciones dietéticas quedan congeladas en cada servicio para proteger la operativa ante cambios posteriores del cliente.
4. **Seguridad e Integridad de Datos**: Cero impacto destructivo sobre pedidos históricos y convivencia retrocompatible con el código existente.

---

### 1. Data Contract: `public.delivery_services`

#### Esquema DDL Propuesto (Aditivo y Seguro)

```sql
-- 1. Tipo Enum para el Microestado Operativo del Servicio
CREATE TYPE public.delivery_service_status AS ENUM (
  'pending',             -- Programado, a la espera de producción
  'in_production',       -- En preparación en cocina
  'prepared',            -- Cocinado / Porcionado
  'ready_for_delivery',  -- Bolsa sellada en mesa de empaque, lista para carga
  'out_for_delivery',    -- En furgoneta / en ruta activa
  'delivered',           -- Entregado físicamente al cliente
  'delivery_issue',      -- Incidencia en reparto (ausente, reintento)
  'cancelled'            -- Servicio cancelado u omitido
);

-- 2. Tabla Principal de Jornadas de Servicio / Entregas Físicas
CREATE TABLE public.delivery_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  delivery_date date NOT NULL,
  status public.delivery_service_status NOT NULL DEFAULT 'pending',
  
  -- Referencia foránea viva a la dirección (opcional/nullable por si se elimina la dirección)
  delivery_address_id uuid REFERENCES public.customer_addresses(id) ON DELETE SET NULL,

  -- SNAPSHOTS INMUTABLES (Congelados al programar/confirmar el servicio)
  delivery_address_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  customer_contact_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  dietary_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  delivery_instructions text,

  -- TIMESTAMPS DE OPERACIÓN
  packed_at timestamptz,
  packed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  delivered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- RESOLUCIÓN DE INCIDENCIAS / NOTAS
  issue_reason text,
  issue_notes text,
  driver_notes text,

  -- METADATOS ESTÁNDAR
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,

  -- RESTRICCIÓN DE UNICIDAD NATURAL:
  -- En YourMeal OS, un pedido semanal tiene como máximo 1 servicio de entrega por día calendario.
  CONSTRAINT uq_delivery_services_order_day UNIQUE (tenant_id, order_id, delivery_date)
);

-- 3. Índices de Rendimiento Operativo
CREATE INDEX idx_delivery_services_day_status 
  ON public.delivery_services(tenant_id, delivery_date, status) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_delivery_services_order 
  ON public.delivery_services(tenant_id, order_id) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_delivery_services_customer 
  ON public.delivery_services(tenant_id, customer_id) 
  WHERE deleted_at IS NULL;
```

---

### 2. Delivery Snapshot: Qué Información se Congela y Por Qué

Al igual que en `CR-OPS-DIET-01` establecimos la inmutabilidad de `orders.dietary_snapshot`, en `CR-OPS-06` el repartidor y el empacador deben tener la certeza de que **la información física de entrega no mutará retrospectivamente si el cliente edita su perfil mañana**.

| Campo Snapshot | Estructura JSON | Justificación Operativa |
| :--- | :--- | :--- |
| **`delivery_address_snapshot`** | `{"street": "Gran Vía 12, 3ºB", "city": "Madrid", "zip": "28013", "label": "Casa", "lat": 40.42, "lng": -3.70}` | Si el cliente cambia su dirección predeterminada el martes, la bolsa del lunes ya entregada conserva su verdad histórica y la del miércoles se entrega en la dirección contratada. |
| **`customer_contact_snapshot`** | `{"displayName": "Juan Pérez", "email": "juan@example.com", "phone": "+34 600 111 222"}` | Permite al repartidor llamar al cliente desde la furgoneta incluso si el usuario modifica su teléfono posteriormente en el CRM. |
| **`dietary_snapshot`** | `{"allergens": ["cacahuetes", "gluten"], "dietaryRequirements": ["vegetariano"], "notes": "Celiaco severo"}` | Copia exacta del snapshot del pedido. Permite renderizar `DietaryBadges` en `/delivery-today` sin uniones costosas. |
| **`delivery_instructions`** | `text` (e.g. *"Llamar al telefonillo 3B; si no contesta, dejar con el conserje Manuel"*) | Instrucciones logísticas específicas del servicio congeladas en el momento de la confirmación. |

---

### 3. Relación `order` ➔ `delivery_services` ➔ `order_items`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                   ORDER                                     │
│  id: 123 · week_start: 2026-10-05 · total: 60.00€ · status: in_fulfillment   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│   DELIVERY SERVICE: LUNES     │             │  DELIVERY SERVICE: MIÉRCOLES  │
│  date: 2026-10-05             │             │  date: 2026-10-07             │
│  status: delivered ✅         │             │  status: pending ⏳            │
│  delivered_at: 14:02          │             │  delivered_at: null           │
└───────────────┬───────────────┘             └───────────────┬───────────────┘
                │ vinculación por                             │ vinculación por
                │ (order_id, day_date)                        │ (order_id, day_date)
                ▼                                             ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│          ORDER ITEMS          │             │          ORDER ITEMS          │
│  · Plato A (Lunes, qty: 1)    │             │  · Plato C (Miérc, qty: 2)    │
│  · Plato B (Lunes, qty: 1)    │             │  · Plato D (Miérc, qty: 1)    │
└───────────────────────────────┘             └───────────────────────────────┘
```

#### Determinación Exacta de Ítems por Servicio
- **Regla Inequívoca**: Los platos pertenecientes a un `delivery_service` son exactamente los registros de `order_items` que satisfacen:
  $$\text{order\_items.order\_id} = \text{delivery\_services.order\_id} \quad \land \quad \text{order\_items.day\_date} = \text{delivery\_services.delivery\_date}$$
- **Sin Duplicación**: Ningún plato puede pertenecer a dos servicios porque `order_items.day_date` es una fecha única.
- **Preservación Económica**: Las cantidades (`qty`), precios unitarios (`unit_price`) y comentarios de `order_items` se leen directamente; jamás se recalculan ni se consultan del catálogo actual.

---

### 4. Máquinas de Estado: Macroestado vs. Microestado

#### A. Macroestado del Contrato (`orders.status`)
El pedido comercial en `orders` tiene los siguientes estados:
1. `draft`: Pedido en elaboración.
2. `confirmed`: Pedido pagado y confirmado. Servicios de entrega creados en `pending`.
3. `in_fulfillment`: Al menos un servicio ha iniciado producción o empaque (`in_production`, `prepared`, `ready_for_delivery` o `out_for_delivery`).
4. `delivered`: **100% de los servicios de entrega de la semana han alcanzado el estado `delivered`**.
   *(Nota: Mantenemos el valor enum `'delivered'` en `orders.status` para que el módulo contable existente y facturación sigan funcionando sin requerir cambios)*.
5. `cancelled`: El pedido completo ha sido anulado.

#### B. Microestado de la Jornada de Entrega (`delivery_services.status`)

```
   [ pending ]
        │  (Inicio de jornada / Hoja de cocina abierta)
        ▼
 [ in_production ]
        │  (Cocina termina lote de producción)
        ▼
   [ prepared ]
        │  (Operario en admin.production-sheet pulsa "Marcar como Empacado")
        ▼
[ ready_for_delivery ]  <─── Visible en /admin/delivery-today como "Ready"
        │  (Repartidor inicia ruta / carga vehículo)
        ▼
[ out_for_delivery ]
        │
        ├──> [ delivered ]  (Repartidor confirma entrega exitosa)
        │
        └──> [ delivery_issue ] (Cliente ausente / dirección inaccesible)
                   │
                   ├──> [ out_for_delivery ] (Reintento posterior)
                   └──> [ cancelled ] (Imposible entregar, devolución)
```

---

### 5. Estrategia de Migración y Backward Compatibility (Zero Downtime)

#### Seguridad e Inmutabilidad de Pedidos Existentes
1. **Creación Aditiva**: La tabla `delivery_services` se crea sin modificar las columnas existentes de `orders` ni de `order_items`.
2. **Backfill Idempotente de Pedidos Históricos**:
   Se ejecuta una migración de datos para pedidos existentes que agrupa `order_items` por `(order_id, day_date)` e inserta los `delivery_services` correspondientes:
   - Si `orders.status = 'delivered'`, los servicios históricos se crean directamente con `status = 'delivered'`.
   - Si `orders.status IN ('confirmed', 'in_production', 'prepared', 'ready_for_delivery')`, los servicios se crean con su estado correspondiente.
3. **Convivencia Retrocompatible**:
   - `admin.production-sheet` puede actualizar `delivery_services` y sincronizar el estado macro de `orders` sin romper llamadas existentes de `OrderFacade`.
   - `/admin/delivery-today` consulta prioritariamente `delivery_services`. Si un pedido no tiene aún fila en `delivery_services`, hace fallback transparente al adaptador en memoria.

---

### 6. Estrategia de RLS (Row Level Security)

```sql
ALTER TABLE public.delivery_services ENABLE ROW LEVEL SECURITY;

-- 1. Personal Operativo (Staff / Kitchen / Logistics)
CREATE POLICY delivery_services_staff_all ON public.delivery_services
  FOR ALL TO authenticated
  USING (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
  );

-- 2. Repartidores Asignados (Driver read-only + status update)
CREATE POLICY delivery_services_driver_read ON public.delivery_services
  FOR SELECT TO authenticated
  USING (
    delivered_by = auth.uid()
  );

-- 3. Cliente Final (Lectura de sus propias entregas)
CREATE POLICY delivery_services_customer_read ON public.delivery_services
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = customer_id AND c.user_id = auth.uid()
    )
  );
```

---

### 7. Especificación del Escenario E2E de Certificación

Para certificar en producción el éxito de `CR-OPS-06`, el test E2E debe validar obligatoriamente la siguiente secuencia sin ninguna intervención manual:

```text
[PASO 1] Ingesta de Pedido Multidía:
         Crear Pedido QA con:
         - 2 Platos para Lunes (D_1)
         - 2 Platos para Miércoles (D_2)
         Verificar: Se crean 2 delivery_services (Lunes en pending, Miércoles en pending).

[PASO 2] Producción y Empaque de Lunes:
         Abrir /admin/production-sheet?date=Lunes.
         Verificar: Aparece la bolsa del cliente con los 2 platos del Lunes.
         Acción: Pulsar "Marcar como Empacado".
         Verificar DB: delivery_services(Lunes).status = 'ready_for_delivery'.
         Verificar DB: delivery_services(Miércoles).status = 'pending' (INTACTO).

[PASO 3] Despacho y Reparto de Lunes:
         Abrir /admin/delivery-today?day=Lunes.
         Verificar: Aparece la tarjeta de entrega en estado "Ready".
         Verificar: DietaryBadges renderiza los alérgenos del cliente en la tarjeta.
         Acción: Confirmar entrega.
         Verificar DB: delivery_services(Lunes).status = 'delivered'.
         Verificar DB: orders.status = 'in_fulfillment' (NO 'delivered').

[PASO 4] Verificación de Preservación de Miércoles:
         Abrir /admin/production-sheet?date=Miércoles.
         Verificar: La hoja de cocina y la mesa de empaque del Miércoles
                    muestran al cliente y sus 2 platos con 100% de integridad.
         ¡CERO DESAPARICIONES! Escenario superado.
```

---

### 8. Riesgos y Decisiones Cerradas

1. **Riesgo**: ¿Podría una orden quedar en `in_fulfillment` permanentemente si se cancela un día?
   - **Solución Cerrada**: Si un servicio de entrega se cancela (`cancelled`), la regla de compleción de la orden evalúa si el 100% de los servicios restantes están `delivered` o `cancelled`.
2. **Riesgo**: ¿Qué pasa con los tests de integración existentes (`FLOW-01` / `FLOW-02`) que asumen `orders.status = 'delivered'`?
   - **Solución Cerrada**: En el caso de pedidos de un solo día (monodía), la entrega de ese único servicio promueve simultáneamente el servicio a `delivered` y `orders.status` a `delivered`, preservando la compatibilidad absoluta con el arnés de tests `FLOW-01`.

---

### 9. Parada Obligatoria de Gobernanza

**ESTADO: STOP ESTRICTO.**  
El repositorio se mantiene intacto en `main` (`b99d6db2`). Queda a la espera de la revisión y ratificación final de esta especificación técnica por parte de la **Human Product Authority** para posteriormente autorizar la apertura de **Gate 3 (Worktree / Feature Branch)**.
