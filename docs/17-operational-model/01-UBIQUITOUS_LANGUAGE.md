# 01 — Ubiquitous Language (operativo)

**Tipo:** Operational Model · Core Operativo  
**Código:** inglés · **Docs:** español  
**Actores:** [ACTORS.md](../12-domain-model/ACTORS.md) — no usar «Cliente» ambiguo  
**Glosario técnico complementario:** [UBIQUITOUS_LANGUAGE.md](../12-domain-model/UBIQUITOUS_LANGUAGE.md)

Este documento define el **sentido operativo** de cada objeto.

No es un inventario de tablas. Es el diccionario oficial del producto.

---

## Regla de lectura

Cada término responde:

> **¿Qué es en la operación — y qué no es?**

---

## Demanda y oferta

### Weekly Menu · `WeeklyMenu`

**Es:** la oferta publicada que genera los pedidos de una semana.  
**No es:** un catálogo eterno de platos ni el Dish Library.

### Dish · `Dish`

**Es:** unidad comercializable (plato) que se planifica, produce y vende.  
**No es:** la receta ni el stock.

### Order · `Order`

**Es:** la selección confirmable de platos para un periodo (habitualmente una semana) por un Consumidor o Beneficiario.  
**No es:** un ticket de cocina ni un batch de producción.

> En conversación de producto puede decirse «pedido semanal» / Weekly Order. El término canónico es **Order**.

### Order Item · `OrderItem`

**Es:** una línea del Order (Dish + día/slot + cantidad + notas).  
**No es:** una ración ya producida.

---

## Quién pide / quién recibe

No existe un único «Customer» ambiguo.

| Situación | Actor | Código |
|-----------|-------|--------|
| Compra directa | **Consumidor** | `Consumer` |
| Contrata para un colectivo | **Cuenta Empresa** | `CompanyAccount` |
| Recibe el servicio B2B | **Beneficiario** | `Beneficiary` |

En la espina operativa, «lado demanda» = quien genera o recibe el Order.  
Detalle: [ACTORS.md](../12-domain-model/ACTORS.md).

---

## Producción

### Production Plan · `ProductionPlan`

**Es:** la previsión agregada de qué hay que producir (y cuánto) a partir de Orders + Menu + Recipe, para un horizonte (día / turno / semana).  
**No es:** la ejecución en cocina ni el stock.

### Production Batch · `ProductionBatch`

**Es:** la ejecución de una producción concreta para cubrir uno o varios Orders (o parte de ellos).  
**No es:** una Recipe. **No es** un Order.

### Recipe · `Recipe`

**Es:** la composición canónica de un Dish (Ingredients + cantidades).  
**No es:** lo que se cocinó hoy (eso es el Batch).

### Ingredient · `Ingredient`

**Es:** materia prima o input reutilizable entre Dishes.  
**No es:** el stock disponible (ver Stock).

### Stock · `Stock` / Inventory Item

**Es:** la representación del estado disponible de recursos necesarios para mantener la operación.  
**No es:** «el almacén» como lugar físico ni el historial de compras.

En Domain / persistencia el término cercano es **Inventory Item**. En producto y Checks preferimos **Stock**.

### Supplier · `Supplier`

**Es:** quien abastece Ingredients (u otros inputs).  
**No es:** la Cuenta Empresa cliente.

---

## Packaging y salida

### Packaging · `Packaging`

**Es:** el proceso de ensamblar la producción en unidades entregables por destinatario (bolsa / caja / pedido).  
**No es:** la Label sola ni la Route.

### Label · `Label`

**Es:** la identificación impresa o digital que acompaña a la unidad empaquetada (destinatario, plato, alérgenos, fecha…).  
**No es:** el Order completo.

---

## Logística y cobro

### Delivery Route · `DeliveryRoute` (Route)

**Es:** la planificación logística de entrega para un conjunto de Orders dentro de una ventana temporal.  
**No es:** un mapa ni el GPS del vehículo.

### Vehicle · `Vehicle`

**Es:** el recurso de transporte asignable a una Route.  
**No es:** la Route.

### Delivery · `Delivery`

**Es:** la confirmación de que una producción llegó al destinatario correcto en el momento correcto (parada / entrega concreta).  
**No es:** «un envío» genérico ni la Route entera.

En Domain: a menudo **Delivery Stop** es la unidad de parada; **Delivery** en producto nombra el hecho operativo «entregado / no entregado / incidencia».

### Payment · `Payment`

**Es:** la liquidación económica asociada a un Order / Invoice en el momento que la operación lo exige (anticipo, contra entrega, factura…).  
**No es:** la Invoice completa ni el estado del Order.

---

## Organización

### Organization · `Organization` / Tenant

**Es:** quien contrata YourMeal OS y posee la operación.  
**No es:** el Consumidor final.

### Kitchen · `Kitchen`

**Es:** el ámbito operativo donde se ejecutan Production Batches.  
**No es:** un módulo de UI.

---

## Lemas (recordatorio)

- Primero evidencia. Después abstracción.  
- ¿Qué pregunta elimina?  
- No mostramos datos. Confirmamos que la operación puede continuar.

Si un término nuevo aparece en campo y no está aquí → Discovery → ajustar este glosario → luego Domain.
