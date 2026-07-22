# Dependencias de soporte (órbita)

**Tipo:** Core + Supporting alrededor de la espina  
**Verbos:** [catálogo](./verbs.md)

La espina no vive aislada. Estas dependencias explican **cómo se calcula y abastece** la producción.

---

## Composición y oferta

```text
Dish
      │
      │  composes
      ▼
   Recipe
      │
      │  requires
      ▼
 Ingredient
      │
      │  supplies
      ▲
  Supplier

Weekly Menu
      │
      │  offers
      ▼
    Dish
```

| Pregunta | Respuesta (dependencia) |
|----------|-------------------------|
| ¿Cómo se produce el Dish? | `Recipe` **composes** `Dish` |
| ¿De qué está hecho? | `Recipe` **requires** `Ingredient` |
| ¿Quién abastece? | `Supplier` **supplies** `Ingredient` |
| ¿Qué se vende esta semana? | `Weekly Menu` **offers** `Dish` |

---

## Stock y producción

```text
Ingredient
      │
      │  (posición de)
      ▼
    Stock
      ▲
      │  consumes
      │
Production Plan ─── uses ─── Recipe
      │
      │  executes as
      ▼
Production Batch
      │
      │  consumes
      ▼
    Stock
```

| Pregunta | Respuesta |
|----------|-----------|
| ¿Cuánto hay? | `Stock` representa disponible de `Ingredient` |
| ¿Alcanza para el plan? | `Production Plan` **uses** `Recipe`; Checks cruzan con `Stock` |
| ¿Qué gasta la cocina? | `Production Batch` **consumes** `Stock` |

**Dirección:** `Production Batch` **consumes** `Stock` — no al revés.

---

## Packaging y identidad (Supporting)

```text
Production Batch
      │
      │  produces
      ▼
  Packaging
      │
      │  identifies
      ▼
    Label          (Supporting)
```

| Pregunta | Respuesta |
|----------|-----------|
| ¿Quién es esta bolsa? | `Label` **identifies** unidad de `Packaging` |

`Label` no sustituye a `Packaging` en la espina.

---

## Logística (Supporting)

```text
Delivery Route
      │
      │  employs
      ▼
   Vehicle          (Supporting)

Delivery Route
      │
      │  performs
      ▼
   Delivery
      │
      │  receives
      ▼
Consumer / Beneficiary
```

| Verbo | Nota |
|-------|------|
| `employs` | Añadido al uso operativo: Route asigna Vehicle (Supporting) |
| `receives` | Destinatario recibe resultado de Delivery |

> `employs` · `references` · `documents via` — ver [verbs.md](./verbs.md).

---

## Actores y Orders

```text
Company Account
      │
      │  contracts for
      ▼
 Beneficiary
      │
      │  places
      ▼
    Order

Consumer
      │
      │  places
      ▼
    Order
```

Sin **Customer**. Tres actores, tres verbos, tres responsabilidades.

---

## Order Item (Supporting)

```text
Order
      │
      │  aggregates into  (líneas)
      ▼
 Order Item
      │
      │  references
      ▼
    Dish
```

`Order Item` no es eslabón de espina; detalla `Order` **places** demanda por Dish/día.

---

## Invoice y Payment

```text
Order
      │
      │  settles
      ▼
  Payment

Order
      │
      │  documents via     (Supporting · futuro)
      ▼
  Invoice
```

`Payment` **settles** `Order` en la espina.  
`Invoice` documenta; no sustituye a Payment.

---

## Qué no dibujar

- `Dashboard` → anything  
- `KPI` → `Order`  
- `Configuration` → Core (ver [level-3-configuration](../02-core-objects/level-3-configuration.md))
