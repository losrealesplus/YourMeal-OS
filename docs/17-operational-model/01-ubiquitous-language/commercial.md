# Comercial — Ubiquitous Language

**Área:** oferta y demanda  
**Espina:** Weekly Menu → Order → …

---

# Weekly Menu · `WeeklyMenu`

## Definición

Conjunto de platos publicados para un período determinado y disponibles para ser pedidos.

## Qué es

Una **oferta** temporal que genera Orders.

## Qué NO es

No es un Order.  
No es producción.  
No es una Recipe.  
No es el catálogo eterno de Dishes (Dish Library).

## Existe cuando...

Se **publica** (Published).

## Finaliza cuando...

Termina su período de vigencia o se archiva tras el cierre operativo de la semana.

## Responsable principal

Organization (planificación de menú / administración).

## Se relaciona con

Dish · Menu Slot · Order · Recipe · Production Plan

## Operational Checks habituales

Repetición / similitud de platos · balance nutricional · ingredientes disponibles para la oferta

## Capabilities relacionadas

Menu Management

## Sinónimos prohibidos

Carta · Catálogo · Lista de platos · MealPlanHeader · «el menú» si se refiere al Dish Library

## Notas

Nivel 2: «carta de la semana» → mapear a Weekly Menu.

---

# Dish · `Dish`

## Definición

Unidad comercializable de comida que la Organization planifica, produce y vende.

## Qué es

El plato de negocio (ej. «Pollo teriyaki»).

## Qué NO es

No es la Recipe.  
No es el Stock.  
No es una línea de Order (Order Item).  
No es un Production Batch.

## Existe cuando...

Se crea y queda **Active** (disponible para menú / venta).

## Finaliza cuando...

Se desactiva o archiva (histórico y Orders pasados se conservan).

## Responsable principal

Organization (cocina / producto).

## Se relaciona con

Recipe · Weekly Menu · Order Item · Production Batch

## Operational Checks habituales

—

## Capabilities relacionadas

Dish Management ✅

## Sinónimos prohibidos

Producto · Meal · Item · Plato (solo en Nivel 2) · MealEntity

## Notas

«Plato» en cocina = Nivel 2 → canónico **Dish**.

---

# Order · `Order`

## Definición

Selección confirmable de Dishes para un período (habitualmente una semana) por un Consumer o Beneficiary.

## Qué es

La **demanda** comprometida del período.

## Qué NO es

No es un ticket de cocina.  
No es un Production Batch.  
No es el Weekly Menu.  
No es una Purchase Order a un Supplier.

## Existe cuando...

Se crea (Draft) y, operativamente, cuando pasa a **Confirmed** compromete producción.

## Finaliza cuando...

Llega a **Closed** (entregado + cobro resuelto según reglas) o **Cancelled**.

## Responsable principal

Consumer / Beneficiary (demanda) · Organization (cumplimiento).

## Se relaciona con

Weekly Menu · Order Item · Production Plan · Packaging · Delivery · Payment

## Operational Checks habituales

Completitud del pedido · cobro pendiente · destinatario en ruta

## Capabilities relacionadas

Orders

## Sinónimos prohibidos

Pedido (solo Nivel 2) · Servicio · Compra (si es a proveedor) · Purchase Order · «producción»

## Notas

«Pedido semanal» / Weekly Order = forma de hablar; canónico **Order**.

---

# Order Item · `OrderItem`

## Definición

Línea de un Order: Dish + día/slot + cantidad + notas.

## Qué es

La granularidad de qué producir, empaquetar y entregar.

## Qué NO es

No es una ración ya cocinada.  
No es un Label.  
No es un Batch.

## Existe cuando...

Se añade al Order.

## Finaliza cuando...

El Order se cancela o la línea se elimina / cumple en Delivery.

## Responsable principal

Quien edita el Order (Consumer / admin) · cocina vía Plan.

## Se relaciona con

Order · Dish · Packaging · Label · Delivery

## Operational Checks habituales

Alergias / notas · cantidad vs Batch

## Capabilities relacionadas

Orders · Packaging

## Sinónimos prohibidos

Línea · Ración (Nivel 2) · Plato (ambiguo con Dish)

## Notas

«Ración» en cocina suele ser cantidad de Order Item o de Batch — aclarar siempre.
