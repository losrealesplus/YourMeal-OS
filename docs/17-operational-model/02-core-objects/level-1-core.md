# Nivel 1 — Core Objects

Solo objetos que pasan el [filtro](./README.md).  
Definiciones amplias: [Ubiquitous Language](../01-ubiquitous-language/README.md).

---

## Partes (quién)

### Organization · `Organization`

| Campo | Contenido |
|-------|-----------|
| **Definición** | Empresa (Tenant) que contrata YourMeal OS y posee la operación |
| **Responsabilidad** | Contener y aislar toda la operación |
| **Propietario** | Administrador · SaaS Admin |
| **Estados** | Active · Suspended · Archived |
| **Lifecycle** | Creación Tenant → operación → archivo |
| **Relaciones** | Posee todos los objetos del Tenant |
| **Operational Checks** | — (marco, no Check de cocina) |
| **Capabilities** | Platform · Tenant |
| **Invariants** | Todo dato operativo pertenece a una Organization |

### Company Account · `CompanyAccount`

| Campo | Contenido |
|-------|-----------|
| **Definición** | Entidad que contrata comida para un colectivo |
| **Responsabilidad** | Ser parte contratante B2B (puede pagar sin recibir cada ración) |
| **Propietario** | Administración comercial |
| **Estados** | Active · Suspended · Archived |
| **Lifecycle** | Alta → operación → archivo |
| **Relaciones** | Beneficiary · Order · Invoice · Payment |
| **Operational Checks** | Cuenta al día · destinatarios activos |
| **Capabilities** | B2B · Orders · Accounting |
| **Invariants** | No es Consumer ni Organization |

### Consumer · `Consumer`

| Campo | Contenido |
|-------|-----------|
| **Definición** | Persona que compra directamente a la Organization |
| **Responsabilidad** | Generar demanda B2C |
| **Propietario** | Administración · self-service |
| **Estados** | Active · Archived |
| **Lifecycle** | Alta → Orders → archivo |
| **Relaciones** | Order · Weekly Menu · Payment · Delivery |
| **Operational Checks** | Datos de entrega · cobro |
| **Capabilities** | Orders · Payments |
| **Invariants** | No es Beneficiary ni Company Account |

### Beneficiary · `Beneficiary`

| Campo | Contenido |
|-------|-----------|
| **Definición** | Persona que recibe el servicio contratado por una Company Account |
| **Responsabilidad** | Ser destinatario operativo B2B |
| **Propietario** | Company Account · administración |
| **Estados** | Active · Inactive · Archived |
| **Lifecycle** | Alta en cuenta → recibe → baja |
| **Relaciones** | CompanyAccount · Order · Delivery · Label |
| **Operational Checks** | En ruta · alergias / Label |
| **Capabilities** | B2B · Orders · Delivery · Packaging |
| **Invariants** | Siempre vinculado a una Company Account |

---

## Oferta y demanda

### Weekly Menu · `WeeklyMenu`

| Campo | Contenido |
|-------|-----------|
| **Definición** | Oferta de Dishes publicada para un período y pedible |
| **Responsabilidad** | Acotar qué se puede pedir en el período |
| **Propietario** | Planificación de menú |
| **Estados** | Draft · Published · Locked · Archived |
| **Lifecycle** | Componer → publicar → (bloquear) → archivar |
| **Relaciones** | Dish · Order · Recipe · Production Plan |
| **Operational Checks** | Repetición · nutrición · ingredientes de la oferta |
| **Capabilities** | Menu Management |
| **Invariants** | Draft no compromete producción; Published genera Orders válidos |

### Dish · `Dish`

| Campo | Contenido |
|-------|-----------|
| **Definición** | Unidad comercializable de comida |
| **Responsabilidad** | Ser lo vendible / planificable / producible |
| **Propietario** | Cocina / producto |
| **Estados** | Draft · Active · Inactive · Archived |
| **Lifecycle** | Crear → activar → (desactivar) → archivar |
| **Relaciones** | Recipe · Weekly Menu · Order Item · Production Batch |
| **Operational Checks** | — (vía Menu / Recipe / Stock) |
| **Capabilities** | Dish Management ✅ |
| **Invariants** | No es Recipe ni Stock ni Batch |

### Order · `Order`

| Campo | Contenido |
|-------|-----------|
| **Definición** | Selección confirmable de Dishes para un período por Consumer o Beneficiary |
| **Responsabilidad** | Representar la demanda comprometida |
| **Propietario** | Demanda (Consumer/Beneficiary) · cumplimiento (Organization) |
| **Estados** | Draft · Confirmed · In production · Packed · Out for delivery · Delivered · Closed · Cancelled |
| **Lifecycle** | Crear → confirmar → producir → empaquetar → entregar → cerrar |
| **Relaciones** | Weekly Menu · Order Item* · Production Plan · Packaging · Delivery · Payment |
| **Operational Checks** | Completitud · cobro · destinatario en ruta |
| **Capabilities** | Orders |
| **Invariants** | Solo Confirmed alimenta Production Plan; no es Batch ni Purchase Order |

\* Order Item es [Supporting](./level-2-supporting.md) (línea; ciclo dentro del Order).

---

## Producción e insumos

### Recipe · `Recipe`

| Campo | Contenido |
|-------|-----------|
| **Definición** | Composición canónica de un Dish (Ingredients + cantidades) |
| **Responsabilidad** | Definir cómo se construye el Dish |
| **Propietario** | Cocina / producto |
| **Estados** | Draft · Active · Archived |
| **Lifecycle** | Definir → usar en Plan/Batch → archivar / versionar |
| **Relaciones** | Dish · Ingredient · Production Plan · Production Batch · Stock |
| **Operational Checks** | (vía necesidad Ingredient = Recipe × demanda) |
| **Capabilities** | Recipe Builder |
| **Invariants** | No es el Batch del día |

### Ingredient · `Ingredient`

| Campo | Contenido |
|-------|-----------|
| **Definición** | Materia prima / input reutilizable entre Dishes |
| **Responsabilidad** | Nombrar el recurso de compra y consumo |
| **Propietario** | Compras / cocina |
| **Estados** | Active · Archived |
| **Lifecycle** | Alta → uso en Recipes → archivo |
| **Relaciones** | Recipe · Stock · Supplier · Production Batch |
| **Operational Checks** | Suficiencia · (caducidad futuro) |
| **Capabilities** | Ingredient Library · Inventory · Purchasing |
| **Invariants** | No es Stock (cantidad) ni Supplier |

### Supplier · `Supplier`

| Campo | Contenido |
|-------|-----------|
| **Definición** | Quién abastece Ingredients a la Organization |
| **Responsabilidad** | Origen de compra de insumos |
| **Propietario** | Compras |
| **Estados** | Active · Archived |
| **Lifecycle** | Alta → pedidos de compra → archivo |
| **Relaciones** | Ingredient · Stock · Purchase Order (futuro / Supporting) |
| **Operational Checks** | — |
| **Capabilities** | Purchasing · Ingredient Library |
| **Invariants** | No es Company Account |

### Production Plan · `ProductionPlan`

| Campo | Contenido |
|-------|-----------|
| **Definición** | Previsión agregada de qué producir y cuánto para un horizonte |
| **Responsabilidad** | Traducir Orders → necesidad de cocina |
| **Propietario** | Gerencia / producción |
| **Estados** | Draft · Ready · In execution · Completed · Archived |
| **Lifecycle** | Generar desde Orders → ejecutar vía Batches → cerrar |
| **Relaciones** | Order · Recipe · Ingredient · Stock · Production Batch |
| **Operational Checks** | Stock vs necesidad · descongelación · merma |
| **Capabilities** | Production Planning · Production · Inventory |
| **Invariants** | No es Batch; solo Orders confirmados alimentan el Plan |

### Production Batch · `ProductionBatch`

| Campo | Contenido |
|-------|-----------|
| **Definición** | Ejecución concreta de producción para cubrir Orders / Plan |
| **Responsabilidad** | Materializar la cocina real |
| **Propietario** | Cocina |
| **Estados** | Planned · Ready to cook · In progress · Completed · Closed |
| **Lifecycle** | Planificar → preparar → cocinar → completar → cerrar |
| **Relaciones** | Production Plan · Dish · Recipe · Stock · Packaging |
| **Operational Checks** | Mise · descongelación · cantidad vs Plan |
| **Capabilities** | Production |
| **Invariants** | No es Order ni Recipe; siempre referencia qué necesidad cubre |

---

## Salida y cobro

### Packaging · `Packaging`

| Campo | Contenido |
|-------|-----------|
| **Definición** | Ensamblaje de producción en unidades entregables por destinatario |
| **Responsabilidad** | Cruzar producción ↔ destinatario |
| **Propietario** | Packaging (Employee) |
| **Estados** | Pending · In progress · Complete · Handed to route |
| **Lifecycle** | Abrir tras Batch → completar → entregar a Route |
| **Relaciones** | Production Batch · Order · Label* · Delivery Route |
| **Operational Checks** | Etiquetas · bolsas · alergias · conteo |
| **Capabilities** | Packaging · Labels · Orders |
| **Invariants** | Sin destinatario identificable no está «completo» |

\* Label = Supporting.

### Delivery Route · `DeliveryRoute`

| Campo | Contenido |
|-------|-----------|
| **Definición** | Planificación logística de entregas en una ventana temporal |
| **Responsabilidad** | Organizar el conjunto de Deliveries del turno |
| **Propietario** | Logística |
| **Estados** | Draft · Ready · Departed · In progress · Completed · Closed |
| **Lifecycle** | Planificar → salir → completar paradas → cerrar |
| **Relaciones** | Packaging · Vehicle* · Delivery · Order · Payment |
| **Operational Checks** | Viabilidad de ventana · redistribuir · adelantar salida |
| **Capabilities** | Routes · Drivers · Deliveries |
| **Invariants** | Ventana temporal explícita; no es un mapa |

\* Vehicle = Supporting.

### Delivery · `Delivery`

| Campo | Contenido |
|-------|-----------|
| **Definición** | Hecho de entrega al destinatario correcto (o fallo / incidencia) |
| **Responsabilidad** | Confirmar el resultado de una parada |
| **Propietario** | Repartidor |
| **Estados** | Pending · Attempted · Delivered · Failed · Incident · Closed |
| **Lifecycle** | Prevista → intento → resultado → cierre |
| **Relaciones** | Delivery Route · Order · Consumer/Beneficiary · Payment · Label |
| **Operational Checks** | Cobro · destinatario · ventana |
| **Capabilities** | Deliveries · Payments · Orders |
| **Invariants** | No se da por entregado al cerrar la Route a ciegas |

### Payment · `Payment`

| Campo | Contenido |
|-------|-----------|
| **Definición** | Liquidación económica asociada a Order / Invoice |
| **Responsabilidad** | Registrar el cobro según reglas de la Organization |
| **Propietario** | Administración · repartidor (si cobro en ruta) |
| **Estados** | Not due · Due · Pending at delivery · Captured · Failed · Settled |
| **Lifecycle** | Compromiso → captura / fallo → settled |
| **Relaciones** | Order · Invoice* · Delivery · Consumer / Company Account |
| **Operational Checks** | Pendiente de cobro en Delivery |
| **Capabilities** | Payments · Accounting · Deliveries |
| **Invariants** | No flota sin Order/Invoice; no es el Order |

\* Invoice = Supporting.

---

## Inventario canónico Nivel 1

```text
Organization
Company Account · Consumer · Beneficiary
Weekly Menu · Dish · Order
Recipe · Ingredient · Supplier
Production Plan · Production Batch
Packaging
Delivery Route · Delivery
Payment
```

**17 Core Objects.** No ampliar sin pasar el filtro.
