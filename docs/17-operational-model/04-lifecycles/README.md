# 04 — Lifecycles (transiciones)

**FASE 4 · Operational Model**  
**Prerrequisito:** [03 Operational Dependencies](../03-relationships/README.md) ✅  
**Observation:** ⏸ congelada  

> No modelamos solo **estados**.  
> Modelamos **transiciones permitidas** — con evento, responsable, pre/postcondiciones y Checks.

---

## La cuarta dimensión: tiempo

| Dimensión | Qué es |
|-----------|--------|
| Vocabulario | [01 Ubiquitous Language](../01-ubiquitous-language/README.md) |
| Sustantivos | [02 Core Objects](../02-core-objects/README.md) |
| Verbos | [03 Operational Dependencies](../03-relationships/README.md) |
| **Tiempo** | **04 Lifecycles** (este bloque) |

La gramática operativa:

```text
Sustantivo  +  verbo  +  transición en el tiempo  =  historia completa
```

Ejemplo (historia canónica):

```text
Weekly Menu     publishes          (oferta pedible)
Consumer        places             Order
Orders          aggregate into     Production Plan
Production Plan executes as        Production Batch
Production Batch produces         Packaging
Delivery Route  transports         Packaging
Delivery        confirms           delivery to destinatario
Payment         settles            Order
```

Eso no es UML. Es **cómo se lee la operación**.

---

## Regla de oro

> **Los Operational Checks viven en las transiciones — no en los estados.**

| Mal | Bien |
|-----|------|
| Check «Order Confirmed» | ¿**Puede confirmarse** este Order? |
| Check «Batch In Progress» | ¿**Puede iniciarse** este Production Batch? |
| Check «Delivery Delivered» | ¿**Puede marcarse como entregada** esta Delivery? |
| Check «Payment Settled» | ¿**Puede liquidarse** este Payment? |

Un Check valida el **paso** de un estado a otro.

Ver [checks-on-transitions.md](./checks-on-transitions.md).

---

## Plantilla de transición

Cada transición permitida documenta:

| Campo | Pregunta |
|-------|----------|
| **Estado origen** | ¿Desde dónde? |
| **Evento** | ¿Qué provoca el cambio? |
| **Estado destino** | ¿Hacia dónde? |
| **Responsable** | ¿Quién puede hacerlo? |
| **Precondiciones** | ¿Qué debe cumplirse? |
| **Postcondiciones** | ¿Qué garantiza el sistema? |
| **Operational Checks** | ¿Qué Checks deben pasar **antes**? |

Cada transición responde:

```text
¿Quién? · ¿Cuándo? · ¿Por qué? · ¿Qué Check lo permite? · ¿Qué cambia después?
```

Plantilla vacía: [transition-template.md](./transition-template.md).

---

## Índice

| Doc | Contenido |
|-----|-----------|
| [spine-transitions.md](./spine-transitions.md) | Máquinas de la espina (Core) |
| [support-transitions.md](./support-transitions.md) | Supporting (Label, Stock, catálogo) |
| [checks-on-transitions.md](./checks-on-transitions.md) | Checks ↔ transiciones |
| [state-index.md](./state-index.md) | Índice rápido de estados (referencia) |

---

## Principio permanente (Capabilities)

> **Las Capabilities interactúan con el modelo — no lo definen.**

```text
Nuevo problema
        ↓
Nuevo Check (en una transición)
        ↓
Capability
        ↓
Interactúa con objetos existentes
```

Solo si es **imposible** con el vocabulario actual → estudiar nuevo Core Object (filtro 02).

También en [PRODUCT_PRINCIPLES](../../15-product/PRODUCT_PRINCIPLES.md).

---

## Gate 04 → 05

> ¿Cada transición crítica de la espina tiene evento, responsable y Checks asociados?

Si sí → **05 · Invariants** expresa las **leyes permanentes** (lo que nunca puede romperse).  
Si no → completar transiciones antes de listar invariantes sueltos.

**Veredicto interno (v0.1):** ✅ espina documentada — ver [spine-transitions.md](./spine-transitions.md).

---

## Relacionado

- [03 spine-flow](../03-relationships/spine-flow.md)  
- [05 Invariants](../05-INVARIANTS.md) — siguiente  
- [STATE_MACHINES.md](../../12-domain-model/STATE_MACHINES.md) — implementación técnica después
