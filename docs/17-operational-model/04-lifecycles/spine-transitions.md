# Transiciones de la espina

Máquinas de estados operativas (Core).  
Verbos: [03](../03-relationships/verbs.md). Objetos: [02](../02-core-objects/level-1-core.md).  
**Dinámica:** clases Happy · Operational · Protection · Exceptional — [Lifecycles 2.0](../07-operational-dynamics/01-operational-lifecycles-2.0.md).  
**Checks:** resultados PASS · WARNING · BLOCKED · MANUAL DECISION — [Checks 2.0](../07-operational-dynamics/03-operational-checks-2.0.md).

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

#### Cancel Order · *Exceptional*

`Draft` \| `Confirmed` → `Cancelled`

| | |
|--|--|
| **Clase** | Exceptional |
| **Responsable** | Admin / reglas de la Organization |
| **Checks** | ¿**Puede cancelarse** sin romper producción ya iniciada? → PASS / BLOCKED / MANUAL |
| **Postcondiciones** | No alimenta Plan futuro |

#### Amend Confirmed Order · *Operational* *(MC-001 · VR-001)*

`Confirmed` → `Confirmed` (mismo estado; evento de modificación)

| | |
|--|--|
| **Clase** | Operational |
| **Evento** | Amend Order |
| **Responsable** | Admin Organization · reglas B2B |
| **Precondiciones** | Order Confirmed · preferible **antes** de `In production` (si ya In production → MANUAL / reglas Tenant) · Weekly Menu aplicable |
| **Checks** | ¿**Puede modificarse** este Order? (plazo · Plan · Stock · Menu · alérgenos · Route) → PASS / BLOCKED / MANUAL |
| **Postcondiciones** | Order Items actualizados · sigue `contributes to` Plan · puede disparar **Revise Plan** / **Revise Route** |
| **Impactos posibles** | Plan · Batch Planned · Stock · Packaging pendiente · Route · Payment · Label — **no** siempre todos |
| **No es** | Cancel + nuevo Order |

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

#### Revise Plan · *Operational* *(MC-001 · MC-002 · VR-001 · VR-002)*

`Ready` → `Ready` **o** `In execution` → `In execution` (re-agregación / reorden)

| | |
|--|--|
| **Clase** | Operational |
| **Evento** | Revise Plan / Replan |
| **Responsable** | Gerencia / producción |
| **Precondiciones** | Demanda cambió (Amend/Cancel) **o** capacidad (Pause Batch) · Batches **Completed** inmutables |
| **Reglas In execution** | In progress → **Pause** antes de reasignar · Planned reordenables |
| **Checks** | ¿**Puede revisarse** el Plan? → PASS / BLOCKED / MANUAL |
| **Postcondiciones** | Mismo Plan (INV-011) · Batches/Stock proyección actualizados |
| **No es** | Crear segundo Plan del día por defecto |

#### Plan expedito (1 Order) · *Happy* *(MC-006 · VR-006)*

Mismo Finalize/Start con cardinalidad **1 Order** (urgencia). No Core «EmergencyOrder».

---

## Production Batch

### Estados

`Planned` · `Ready to cook` · `In progress` · `Paused` · `Completed` · `Closed`

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
| **Checks** | Stock · capacidad Kitchen · Descongelación · Recetas → PASS / BLOCKED / MANUAL |
| **Postcondiciones** | Batch **consumes** Stock (con **Lot** si aplica) · cocina en curso |

#### Pause Production · *Protection* *(MC-002 · VR-002)*

`In progress` → `Paused`

| | |
|--|--|
| **Clase** | Protection |
| **Evento** | Pause Production / Block Batch |
| **Responsable** | Cocina / gerencia |
| **Checks** | ¿**Puede pausarse**? → PASS / MANUAL |
| **Postcondiciones** | No consume Stock adicional · no produce Packaging nuevo |

#### Resume Production · *Operational / Protection salida*

`Paused` → `In progress`

| | |
|--|--|
| **Clase** | Operational |
| **Checks** | ¿**Puede reanudarse**? (capacidad · Stock · personal) → PASS / BLOCKED / MANUAL |

#### Adjust Planned Batch · *Operational*

`Planned` \| `Ready to cook` — ajuste cantidad/Dish tras Revise Plan (sin nuevo Core).

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

`Pending` · `In progress` · `Complete` · `Held` · `Handed to route`

> `Held` unifica retención operativa y cuarentena sanitaria (Protection). Motivo en el evento (error etiqueta · recall · calidad).

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
| **Checks** | ¿**Puede completarse**? (Label identifies · alergias · destinatario) → PASS / WARNING / BLOCKED / MANUAL |
| **Postcondiciones** | Unidades listas para Route |

#### Hold Packaging · *Protection* *(MC-004 · MC-003 · VR-004 · VR-003)*

`In progress` \| `Complete` → `Held`

| | |
|--|--|
| **Clase** | Protection |
| **Evento** | Hold / Quarantine Packaging |
| **Checks** | ¿**Puede retenerse**? → PASS |
| **Postcondiciones** | **No** Hand to route · entra [Recovery Pattern](../07-operational-dynamics/01-operational-lifecycles-2.0.md#recovery-pattern-reutilizable) |

#### Release Packaging · *Protection salida*

`Held` → `In progress` \| `Complete`

| | |
|--|--|
| **Checks** | ¿**Puede liberarse**? (Label↔contenido/Order verificado · o clearance sanitario) → PASS / BLOCKED / MANUAL |

#### Hand to Route

`Complete` → `Handed to route`

| | |
|--|--|
| **Checks** | ¿**Puede asignarse** a Route? · ¿**identidad verificada**? → PASS / BLOCKED / MANUAL |
| **Postcondiciones** | Packaging **assigns to** Route |
| **Prohibido desde** | `Held` |

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

#### Revise Route · *Operational* *(MC-001 · MC-002 · VR-001 · VR-002)*

`Ready` → `Ready` **o** `Draft` → … → `Ready` (reoptimizar)

| | |
|--|--|
| **Clase** | Operational |
| **Evento** | Revise Route |
| **Precondiciones** | Packaging aún no Handed **o** regla de recall de carga · ventana cambió |
| **Checks** | ¿**Puede revisarse** la ruta? (ventana · Vehicle · paradas) → PASS / BLOCKED / MANUAL |
| **Postcondiciones** | Orden/ventana actualizados · INV-042 |
| **Impactos** | Deliveries Pending — **no** nuevo Order |

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
| **Checks** | ¿**Puede marcarse como entregada**? (destinatario · **Location** si aplica · ventana) |
| **Postcondiciones** | Delivery **confirms** · Order puede avanzar a Delivered |

#### Update Delivery Destination · *Operational* *(MC-006 · VR-006)*

`Pending` \| `Attempted` — actualizar Location/destino (planta, habitación…) sin nuevo Delivery.

| | |
|--|--|
| **Clase** | Operational |
| **Checks** | ¿**Puede redirigirse**? → PASS / BLOCKED / MANUAL |

#### Stop for Safety · *Protection* *(VR-003)*

`Pending` \| `Attempted` → `Incident` \| `Failed` (parada sanitaria mid-route)

| | |
|--|--|
| **Clase** | Protection / Exceptional |
| **Checks** | ¿**Puede detenerse** por seguridad? → PASS / MANUAL |

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

#### Schedule / Open Amount · *Happy*

`Not due` → `Due`  
*(cuando la regla de la Organization hace exigible el cobro — p.ej. emisión de Invoice, fecha de factura, cierre de periodo)*

| | |
|--|--|
| **Checks** | ¿**Puede exigirse** cobro? → PASS / BLOCKED / MANUAL |
| **Postcondiciones** | Importe Due · puede Settle o Captured |

#### Mark Pending at Delivery · *Happy*

`Not due` \| `Due` → `Pending at delivery`

| | |
|--|--|
| **Precondiciones** | Regla «cobro en ruta / contra entrega» |
| **Checks** | ¿**Puede cobrarse** en Delivery? → PASS / BLOCKED |

#### Capture Payment · *Happy / Operational*

`Due` \| `Pending at delivery` → `Captured` *(autorización / cobro en curso)*  
`Captured` → `Settled` *(confirmación)* **o** `Captured` → `Failed`

| | |
|--|--|
| **Checks** | ¿**Puede capturarse**? → PASS / BLOCKED / MANUAL |

#### Record Payment Failure · *Exceptional*

`Due` \| `Pending at delivery` \| `Captured` → `Failed`

| | |
|--|--|
| **Checks** | ¿**Puede registrarse** fallo de cobro? → PASS / MANUAL |
| **Postcondiciones** | Order no Closed por Payment · reintento o ajuste Invoice |

#### Settle Payment

`Due` \| `Pending at delivery` \| `Captured` → `Settled`

| | |
|--|--|
| **Responsable** | Admin / repartidor (cobro en ruta) |
| **Checks** | ¿**Puede liquidarse**? (¿debo cobrar? · importe · método) → PASS / BLOCKED / MANUAL |
| **Postcondiciones** | Payment **settles** Order · Order puede → `Closed` |
| **Cross-link** | Momento de cobro (anticipo / contra entrega / factura): [finance UL](../01-ubiquitous-language/finance.md) · Invoice Supporting |

> **IVR-001 / DF-002 · DF-006:** máquina Payment y enlace a finance documentados aquí.

---

## Diagrama resumen (Happy + Dynamics)

```text
Weekly Menu ──Publish──► Published
Order ──Confirm──► Confirmed ──Amend──► Confirmed
              └──Cancel──► Cancelled
Production Plan ──Finalize──► Ready ──Revise──► Ready
                        └──Start──► In execution ──Revise/Replan──► In execution
Production Batch ──Start──► In progress ──Pause──► Paused ──Resume──► In progress
                                      └──Complete──► Completed
Packaging ──Complete──► Complete ──Hold──► Held ──Release──► Complete
                                  └──Hand to Route──► Handed to route
Delivery Route ──Ready──► Ready ──Revise──► Ready ──Depart──► In progress
Delivery ──Confirm──► Delivered · Stop/Incident · Update destination
Payment ──Settle──► Settled
```

Clases: [Lifecycles 2.0](../07-operational-dynamics/01-operational-lifecycles-2.0.md).  
Cada flecha = candidata a Check 2.0 (PASS / WARNING / BLOCKED / MANUAL DECISION).
