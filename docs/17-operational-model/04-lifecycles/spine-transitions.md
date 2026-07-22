# Transiciones de la espina

Máquinas de estados operativas (Core).  
Verbos: [03](../03-relationships/verbs.md). Objetos: [02](../02-core-objects/level-1-core.md).

---

## Weekly Menu

### Estados

`Draft` · `Published` · `Locked` · `Archived`

### Transiciones

#### Publish Menu

`Draft` → `Published`

| | |
|--|--|
| **Responsable** | Administrador / planificación menú |
| **Precondiciones** | Dishes activos asignados al período |
| **Checks** | Repetición / similitud (opcional) · balance oferta |
| **Postcondiciones** | La oferta **publishes** período pedible; Orders pueden **places** |

#### Lock Menu

`Published` → `Locked`

| | |
|--|--|
| **Responsable** | Administrador / cierre planificación |
| **Precondiciones** | Horizonte de producción comprometido |
| **Checks** | — |
| **Postcondiciones** | No edición que rompa Orders confirmados |

---

## Order

### Estados

`Draft` · `Confirmed` · `In production` · `Packed` · `Out for delivery` · `Delivered` · `Closed` · `Cancelled`

### Transiciones

#### Confirm Order

`Draft` → `Confirmed`

| | |
|--|--|
| **Responsable** | Consumer / Beneficiary / admin |
| **Precondiciones** | Dentro de Weekly Menu **Published** · líneas válidas |
| **Checks** | ¿**Puede confirmarse** este Order? (completitud, plazos) |
| **Postcondiciones** | Order **contributes to** Production Plan |

#### Cancel Order

`Draft` \| `Confirmed` → `Cancelled`

| | |
|--|--|
| **Responsable** | Admin / reglas de la Organization |
| **Checks** | ¿**Puede cancelarse** sin romper producción ya iniciada? |
| **Postcondiciones** | No alimenta Plan futuro |

#### Mark In Production

`Confirmed` → `In production`

| | |
|--|--|
| **Responsable** | Sistema / producción (al vincular Plan/Batch) |
| **Precondiciones** | Production Plan Ready o In execution |
| **Checks** | Plan cubre el Order |
| **Postcondiciones** | Demanda en ejecución |

#### Mark Packed → Out for delivery → Delivered → Closed

(Cadena logística; cada paso con Check en transición.)

| Transición | Check clave |
|------------|-------------|
| → `Packed` | ¿**Puede marcarse empaquetado**? (Packaging complete) |
| → `Out for delivery` | ¿**Puede salir** a Route? |
| → `Delivered` | ¿**Puede cerrarse entrega**? (Delivery confirms) |
| → `Closed` | ¿**Puede cerrarse** Order? (Payment settles si aplica) |

---

## Production Plan

### Estados

`Draft` · `Ready` · `In execution` · `Completed` · `Archived`

### Transiciones

#### Finalize Plan

`Draft` → `Ready`

| | |
|--|--|
| **Responsable** | Gerencia / producción |
| **Precondiciones** | Orders **Confirmed** agregados |
| **Checks** | Stock vs necesidad (Recipe × demanda) · descongelación |
| **Postcondiciones** | Plan **fulfills** Orders · listo para **executes as** Batch |

#### Start Execution

`Ready` → `In execution`

| | |
|--|--|
| **Responsable** | Producción |
| **Checks** | ¿**Puede iniciarse** la ejecución del plan? |
| **Postcondiciones** | Batches pueden abrirse |

---

## Production Batch

### Estados

`Planned` · `Ready to cook` · `In progress` · `Completed` · `Closed`

### Transiciones

#### Ready to Cook

`Planned` → `Ready to cook`

| | |
|--|--|
| **Responsable** | Cocina |
| **Precondiciones** | Batch en Plan In execution |
| **Checks** | Descongelación · mise en place |
| **Postcondiciones** | Listo para Start Production |

#### Start Production *(ejemplo canónico)*

`Ready to cook` → `In progress`

| | |
|--|--|
| **Evento** | Start Production |
| **Responsable** | Employee (cocina) |
| **Precondiciones** | ✔ Ingredientes disponibles (Stock) · ✔ Producción aprobada en Plan · ✔ Personal asignado |
| **Checks** | Stock · Descongelación · Recetas disponibles |
| **Postcondiciones** | Batch **consumes** Stock · cocina en curso |

#### Complete Batch

`In progress` → `Completed`

| | |
|--|--|
| **Responsable** | Cocina |
| **Checks** | ¿**Puede completarse**? (cantidades registradas) |
| **Postcondiciones** | Batch **produces** Packaging pendiente |

#### Close Batch

`Completed` → `Closed`

| | |
|--|--|
| **Responsable** | Cocina / cierre turno |
| **Postcondiciones** | No alimenta Packaging nuevo |

---

## Packaging

### Estados

`Pending` · `In progress` · `Complete` · `Handed to route`

### Transiciones

#### Start Packaging

`Pending` → `In progress`

| | |
|--|--|
| **Precondiciones** | Batch **Completed** o parcial disponible |
| **Checks** | Cantidad vs Order Item |

#### Complete Packaging

`In progress` → `Complete`

| | |
|--|--|
| **Checks** | ¿**Puede completarse**? (Label identifies · alergias · destinatario) |
| **Postcondiciones** | Unidades listas para Route |

#### Hand to Route

`Complete` → `Handed to route`

| | |
|--|--|
| **Checks** | ¿**Puede asignarse** a Delivery Route? |
| **Postcondiciones** | Packaging **assigns to** Route |

---

## Delivery Route

### Estados

`Draft` · `Ready` · `Departed` · `In progress` · `Completed` · `Closed`

### Transiciones

#### Ready Route

`Draft` → `Ready`

| | |
|--|--|
| **Checks** | ¿**Puede declararse lista** la ruta? (viabilidad ventana · Vehicle employs) |
| **Postcondiciones** | Route **transports** Packaging |

#### Depart

`Ready` → `Departed` → `In progress`

| | |
|--|--|
| **Responsable** | Repartidor |
| **Checks** | Carga completa · conteo bolsas |
| **Postcondiciones** | Deliveries en Pending/Attempted |

#### Complete Route

`In progress` → `Completed` → `Closed`

| | |
|--|--|
| **Checks** | Todas las Deliveries resueltas |
| **Postcondiciones** | Cierre logístico del turno |

---

## Delivery

### Estados

`Pending` · `Attempted` · `Delivered` · `Failed` · `Incident` · `Closed`

### Transiciones

#### Confirm Delivered

`Attempted` → `Delivered`

| | |
|--|--|
| **Responsable** | Repartidor |
| **Checks** | ¿**Puede marcarse como entregada**? (destinatario · ventana) |
| **Postcondiciones** | Delivery **confirms** · Order puede avanzar a Delivered |

#### Record Failure / Incident

`Attempted` → `Failed` \| `Incident`

| | |
|--|--|
| **Checks** | ¿**Puede registrarse** incidencia? |
| **Postcondiciones** | Orden de seguimiento (fuera de espina mínima) |

---

## Payment

### Estados

`Not due` · `Due` · `Pending at delivery` · `Captured` · `Failed` · `Settled`

### Transiciones

#### Settle Payment

`Due` \| `Pending at delivery` → `Settled`

| | |
|--|--|
| **Responsable** | Admin / repartidor (cobro en ruta) |
| **Checks** | ¿**Puede liquidarse**? (¿debo cobrar? · importe · método) |
| **Postcondiciones** | Payment **settles** Order · Order puede → `Closed` |

---

## Diagrama resumen (transiciones críticas)

```text
Weekly Menu ──Publish──► Published
Order ──Confirm──► Confirmed ──…──► Closed
Production Plan ──Finalize──► Ready ──Start──► In execution
Production Batch ──Start Production──► In progress ──Complete──► Completed
Packaging ──Complete──► Complete ──Hand to Route──► Handed to route
Delivery Route ──Depart──► In progress
Delivery ──Confirm Delivered──► Delivered
Payment ──Settle──► Settled
```

Cada flecha etiquetada = candidata a Operational Check en la transición.
