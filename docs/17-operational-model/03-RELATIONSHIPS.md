# 03 — Relationships

**Tipo:** Operational Model · Core Operativo  
**Estado:** 🚧 v0.1 — **siguiente a endurecer**  
**Prerrequisito:** [consistency-review](./02-core-objects/consistency-review.md) ✅  
**Regla:** conectar piezas ya definidas — **no** descubrir conceptos nuevos aquí.

**Pregunta:** ¿Cómo se relacionan los objetos desde el punto de vista operativo?

---

## Espina (flujo principal)

```text
Consumer / CompanyAccount / Beneficiary
              │
              │  elige / recibe según Weekly Menu
              ▼
         Weekly Menu
              │
              │  genera
              ▼
            Order
              │
              │  agrega (por Dish / día / Recipe)
              ▼
       Production Plan
              │
              │  se ejecuta como
              ▼
      Production Batch ──────► usa Recipe / Ingredient / Stock
              │
              │  se reparte en unidades
              ▼
          Packaging ──────────► Label
              │
              │  se asigna a
              ▼
       Delivery Route ────────► Vehicle
              │
              │  se concreta en
              ▼
           Delivery
              │
              │  cierra / dispara
              ▼
           Payment
```

---

## Lectura operativa (una frase por flecha)

| De → A | Significado |
|--------|-------------|
| Weekly Menu → Order | La oferta publicada acota qué se puede pedir |
| Order → Production Plan | La demanda confirmada define qué hay que producir |
| Production Plan → Production Batch | El plan se materializa en ejecuciones de cocina |
| Batch → Packaging | Lo producido se convierte en unidades por destinatario |
| Packaging → Label | Cada unidad lleva identidad verificable |
| Packaging → Route | Las unidades se agrupan en una ventana logística |
| Route → Vehicle | Un recurso físico ejecuta la ruta |
| Route → Delivery | Cada parada confirma (o no) la llegada |
| Delivery → Payment | Según reglas, la entrega habilita o registra cobro |

---

## Soportes (alrededor)

```text
                    Dish
                     │
              ┌──────┴──────┐
              ▼             ▼
           Recipe      Weekly Menu
              │
              ▼
         Ingredient
              │
       ┌──────┴──────┐
       ▼             ▼
     Stock        Supplier
```

| Relación | Significado |
|----------|-------------|
| Dish ↔ Recipe | Cómo se produce lo que se vende |
| Dish ↔ Menu | Qué se ofrece en la semana |
| Recipe → Ingredient | De qué está hecho |
| Ingredient → Stock | Cuánto hay disponible |
| Ingredient → Supplier | De quién se compra |
| Stock → Production Plan / Batch | ¿Se puede ejecutar? (Checks) |
| Stock → Purchasing | ¿Hay que comprar? (Checks) |

---

## Cardinalidades (operativas, no schema)

| Relación | Cardinalidad típica |
|----------|---------------------|
| Weekly Menu : Order | 1 : muchos |
| Order : Order Item | 1 : muchos |
| Order Item : Dish | muchos : 1 |
| Orders → Production Plan | muchos : 1 (por horizonte) |
| Production Plan : Batch | 1 : muchos |
| Batch : Packaging units | 1 : muchos |
| Route : Delivery | 1 : muchos |
| Order : Delivery | 1 : 1..n (según stops) |
| Order : Payment | 1 : 0..n |

---

## Checks viven en las uniones

Los Operational Checks no «pertenecen» a un módulo.

Viven en las **relaciones**:

| Unión | Check ejemplo |
|-------|----------------|
| Stock ↔ Production Plan | ¿Hay Ingredient suficiente? |
| Plan ↔ Batch | ¿Está descongelado a tiempo? |
| Packaging ↔ Label | ¿Etiquetas / alérgenos completos? |
| Route ↔ Delivery | ¿La ruta cabe en la ventana? |
| Delivery ↔ Payment | ¿Debo cobrar? |

Ver [OPERATIONAL_CHECKS.md](../15-product/OPERATIONAL_CHECKS.md).
