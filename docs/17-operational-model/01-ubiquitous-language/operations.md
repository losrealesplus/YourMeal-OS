# Operaciones — Ubiquitous Language

**Área:** cocina, insumos, empaquetado  
**Espina:** … → Production Plan → Production Batch → Packaging → …

---

# Production Plan · `ProductionPlan`

## Definición

Previsión agregada de qué hay que producir (y cuánto) a partir de Orders + Menu + Recipe, para un horizonte (día / turno / semana).

## Qué es

La **necesidad de cocina** calculada antes de ejecutar.

## Qué NO es

No es la ejecución en cocina (eso es Production Batch).  
No es el Stock.  
No es un Order.

## Existe cuando...

Se genera / consolida a partir de Orders confirmados (u horizonte definido).

## Finaliza cuando...

Se completa la ejecución del horizonte o se archiva el plan.

## Responsable principal

Gerencia / producción (Employee).

## Se relaciona con

Order · Recipe · Ingredient · Stock · Production Batch

## Operational Checks habituales

Stock suficiente · descongelación · merma incluida

## Capabilities relacionadas

Production Planning · Production · Inventory

## Sinónimos prohibidos

Producción (ambiguo) · Batch · Planificación (sin «Production»)

## Notas

Si alguien dice «la producción de mañana», preguntar: ¿Plan o Batch?

---

# Production Batch · `ProductionBatch`

## Definición

Ejecución de una producción concreta para cubrir uno o varios Orders (o parte de ellos).

## Qué es

El **lote / corrida** real en cocina.

## Qué NO es

No es una Recipe.  
No es un Order.  
No es el Production Plan.  
No es Packaging.

## Existe cuando...

Se planifica / abre un Batch para producir un Dish (u horizonte) concreto.

## Finaliza cuando...

Se completa y cierra (ya no alimenta Packaging pendiente).

## Responsable principal

Cocina (Employee).

## Se relaciona con

Production Plan · Dish · Recipe · Ingredient · Stock · Packaging

## Operational Checks habituales

Mise en place · descongelación · cantidades vs Plan

## Capabilities relacionadas

Production

## Sinónimos prohibidos

Lote (solo Nivel 2) · Bandeja (Nivel 3 local) · Pedido · Recipe · MealEntity

## Notas

Nivel 3 EatClean u otros: «bandeja» → mapear a **Production Batch** (o Packaging unit — aclarar en Observation).

---

# Recipe · `Recipe`

## Definición

Composición canónica de un Dish: Ingredients con cantidades y unidades.

## Qué es

La **fórmula** de cómo se construye el Dish.

## Qué NO es

No es lo que se cocinó hoy (Batch).  
No es el Stock.  
No es el Weekly Menu.

## Existe cuando...

El Dish tiene composición definida y usable.

## Finaliza cuando...

Se archiva / sustituye por una versión nueva (histórico se conserva).

## Responsable principal

Cocina / producto.

## Se relaciona con

Dish · Ingredient · Production Plan · Production Batch · Stock

## Operational Checks habituales

(indirectos) necesidad de Ingredient vía Recipe × demanda

## Capabilities relacionadas

Recipe Builder · Dish · Inventory

## Sinónimos prohibidos

Ficha técnica (Nivel 2) · Fórmula · BOM sin contexto

## Notas

—

---

# Ingredient · `Ingredient`

## Definición

Materia prima o input reutilizable entre Dishes.

## Qué es

El recurso de compra / consumo (ej. pechuga de pollo, salsa de soja).

## Qué NO es

No es el Stock (cantidad disponible).  
No es el Dish.  
No es el Supplier.

## Existe cuando...

Se da de alta en la Organization.

## Finaliza cuando...

Se archiva (histórico de consumo se conserva).

## Responsable principal

Compras / cocina.

## Se relaciona con

Recipe · Stock · Supplier · Production Batch

## Operational Checks habituales

Suficiencia vs Plan · caducidad (futuro)

## Capabilities relacionadas

Ingredient Library · Inventory · Purchasing

## Sinónimos prohibidos

Producto · Material · SKU (técnico)

## Notas

—

---

# Stock · `Stock` (Inventory Item)

## Definición

Representación del estado disponible de recursos necesarios para mantener la operación.

## Qué es

**Cuánto hay** (y en qué estado) para operar.

## Qué NO es

No es el almacén físico como lugar.  
No es el historial de compras.  
No es el Ingredient (el qué).

## Existe cuando...

Hay posición de inventario para un Ingredient (u otro recurso operativo).

## Finaliza cuando...

La posición se cierra / archiva (ajustes quedan auditados).

## Responsable principal

Compras / cierre / cocina.

## Se relaciona con

Ingredient · Production Plan · Production Batch · Supplier · Purchase Order (futuro)

## Operational Checks habituales

Stock vs producción prevista · stock mínimo · comprar antes de hora X

## Capabilities relacionadas

Inventory · Purchasing · Production

## Sinónimos prohibidos

Inventario (si se usa como sinónimo suelto sin Stock) · Almacén · InventoryMovementDTO

## Notas

En Domain: **Inventory Item**. En producto y Checks: preferir **Stock**.

---

# Supplier · `Supplier`

## Definición

Quién abastece Ingredients (u otros inputs) a la Organization.

## Qué es

Proveedor de compra.

## Qué NO es

No es Company Account (cliente B2B).  
No es la Organization.

## Existe cuando...

Hay relación de abastecimiento activa.

## Finaliza cuando...

Se archiva el proveedor.

## Responsable principal

Compras.

## Se relaciona con

Ingredient · Stock · Purchase Order (futuro)

## Operational Checks habituales

—

## Capabilities relacionadas

Purchasing · Ingredient Library

## Sinónimos prohibidos

Proveedor (solo Nivel 2 ES) · Cliente · Vendor sin mapear

## Notas

En español de docs: se puede decir «proveedor» como Nivel 2 → canónico **Supplier**.

---

# Kitchen · `Kitchen`

## Definición

Ámbito operativo donde se ejecutan Production Batches.

## Qué es

El espacio / unidad de ejecución de cocina.

## Qué NO es

No es un módulo de UI.  
No es el Production Plan.

## Existe cuando...

La Organization opera al menos un ámbito de producción.

## Finaliza cuando...

Se desactiva ese ámbito (raro).

## Responsable principal

Producción.

## Se relaciona con

Production Batch · Employee · Stock

## Operational Checks habituales

—

## Capabilities relacionadas

Production

## Sinónimos prohibidos

Departamento Cocina (si solo es navegación UI)

## Notas

Puede haber una sola Kitchen por Tenant al inicio.

---

# Packaging · `Packaging`

## Definición

Proceso de ensamblar la producción en unidades entregables por destinatario (bolsa / caja / pedido).

## Qué es

El cruce **producción ↔ destinatario**.

## Qué NO es

No es la Label sola.  
No es la Delivery Route.  
No es el Batch.

## Existe cuando...

Hay unidades que empaquetar tras Batch(es) para Orders.

## Finaliza cuando...

Se entrega a ruta (Handed to route) / se completa el empaquetado del horizonte.

## Responsable principal

Packaging (Employee).

## Se relaciona con

Production Batch · Order · Order Item · Label · Delivery Route

## Operational Checks habituales

Etiquetas · bolsas · alergias · conteo antes de salir

## Capabilities relacionadas

Packaging · Labels · Orders

## Sinónimos prohibidos

Envasado (Nivel 2) · Expedición (ambiguo con Delivery)

## Notas

—

---

# Label · `Label`

## Definición

Identificación impresa o digital que acompaña a la unidad empaquetada (destinatario, plato, alérgenos, fecha…).

## Qué es

La **identidad verificable** de la unidad entregable.

## Qué NO es

No es el Order completo.  
No es el Packaging como proceso.

## Existe cuando...

Se emite / imprime para una unidad.

## Finaliza cuando...

Se aplica y entrega, o se anula (Void).

## Responsable principal

Packaging.

## Se relaciona con

Packaging · Order Item · Dish · Beneficiary / Consumer · Delivery

## Operational Checks habituales

Fecha · alérgenos · destinatario correcto

## Capabilities relacionadas

Labels · Packaging

## Sinónimos prohibidos

Etiqueta (solo Nivel 2 ES) · Sticker · Tag (técnico)

## Notas

—
