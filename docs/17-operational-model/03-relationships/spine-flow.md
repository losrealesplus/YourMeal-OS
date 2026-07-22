# Mapa de flujo operativo — espina dorsal

**Tipo:** dependencias Core (Nivel 1)  
**Lenguaje:** canónico · verbos del [catálogo](./verbs.md)

> Describe **cómo funciona cualquier operación de comida preparada** en YourMeal OS — no un diagrama de BD.

---

## B2B (referencia)

```text
Organization
      │
      │  owns
      ▼
Company Account
      │
      │  contracts for
      ▼
Beneficiary
      │
      │  places
      ▼
```

## B2C (sustituir bloque anterior)

```text
Consumer
      │
      │  places
      ▼
```

---

## Espina (demanda → cobro)

```text
Weekly Menu
      │
      │  publishes
      ▼
   (oferta pedible: Dishes en período)
      │
      │  places  (Consumer / Beneficiary)
      ▼
     Order
      │
      │  contributes to
      │  aggregates into
      ▼
Production Plan
      │
      │  fulfills          ◄── Orders (demanda)
      │  uses              ◄── Recipe (vía Dish / Order)
      │
      │  executes as
      ▼
Production Batch
      │
      │  produces
      ▼
  Packaging
      │
      │  assigns to
      ▼
Delivery Route
      │
      │  transports
      ▼
  (unidades en ruta)
      │
      │  performs
      ▼
   Delivery
      │
      │  confirms          ◄── destinatario + momento
      │
      │  settles
      ▼
   Payment
```

---

## Lectura en español (una frase por eslabón)

| Dependencia | Pregunta que responde |
|-------------|------------------------|
| Weekly Menu **publishes** oferta | ¿Qué se puede pedir? |
| Actor **places** Order | ¿Quién pidió qué? |
| Orders **aggregate into** Production Plan | ¿Qué hay que producir en conjunto? |
| Production Plan **fulfills** Orders | ¿Qué demanda cubre este plan? |
| Production Plan **executes as** Production Batch | ¿Cómo se cocina? |
| Production Batch **produces** Packaging | ¿Qué sale listo para destinatario? |
| Packaging **assigns to** Delivery Route | ¿Qué sale en qué ruta? |
| Delivery Route **transports** unidades | ¿Cómo se mueve en la ventana? |
| Delivery **performs** parada | ¿Se intentó entregar? |
| Delivery **confirms** resultado | ¿Llegó al destinatario correcto? |
| Payment **settles** Order | ¿Quedó liquidado el compromiso? |

---

## Dish en la espina (sin objeto extra)

**Dish** no es un eslabón entre Batch y Packaging.

Flujo canónico:

```text
Weekly Menu  offers  Dish
Order        references  Dish  (vía Order Item · Supporting)
Production Plan / Batch  uses  Recipe  composes  Dish
```

No añadir flecha `Batch → Dish` si solo repite lo ya dicho por Recipe/Order.

---

## Cardinalidades operativas (recordatorio)

| Sujeto | Verbo | Objeto | Cardinalidad típica |
|--------|-------|--------|---------------------|
| Weekly Menu | publishes | período pedible | 1 : 1 semana |
| Consumer/Beneficiary | places | Order | 1 : n |
| Order | contributes to | Production Plan | n : 1 (horizonte) |
| Production Plan | executes as | Production Batch | 1 : n |
| Production Batch | produces | Packaging | 1 : n unidades |
| Delivery Route | transports | Packaging | 1 : n |
| Delivery Route | performs | Delivery | 1 : n |
| Order | settles | Payment | 1 : 0..n |

No es schema SQL. Es lectura operativa.

---

## Inversión de dependencia (producto)

Las **Capabilities** no definen este mapa.

Interactúan con un modelo que **ya existe**:

```text
Operational Model (lenguaje + objetos + dependencias)
        ↓
Capabilities / Checks / UI
```

---

## Veredicto gate 03 → 04

¿Se puede narrar el ciclo completo con verbos canónicos? **Sí.**

Siguiente: [04 · Lifecycles](../04-LIFECYCLES.md) — estados de cada objeto en este flujo.
