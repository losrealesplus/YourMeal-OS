# YourMeal Operational Model — Core Operativo

**FASE 4** · Lenguaje oficial del sistema (producto)  
**No es:** Foundation · cuarto pilar · Domain Model técnico (DDD) · código · pantallas · APIs  
**Sí es:** el diccionario operativo permanente de YourMeal OS

```text
FOUNDATION                 → cómo construir (arquitectura técnica)
PRODUCT BLUEPRINT          → qué construir y por qué (visión / Checks / Asistentes)
OPERATIONAL DISCOVERY      → por qué evolucionar (evidencia) · campo ⏸
Operational Model (este)   → con qué lenguaje hablamos la operación
Domain Model (docs/12)     → cómo se modela en código ese lenguaje
```

No es un cuarto pilar. Es el **equivalente, para producto, de lo que el Domain Model es para el código**.

---

## Gramática operativa

| Rol | Bloque |
|-----|--------|
| Vocabulario | 01 Ubiquitous Language |
| Sustantivos | 02 Core Objects |
| Verbos | 03 Operational Dependencies |
| Tiempo | 04 Lifecycles (transiciones) |

> **Las Capabilities interactúan con el modelo — no lo definen.**

```text
Nuevo problema → Nuevo Check (en transición) → Capability → objetos existentes
```

Solo si es imposible → estudiar nuevo Core Object.

> **¿Qué objetos existen en cualquier negocio de comida preparada?**

No ampliar el sistema. **Consolidar el lenguaje.**

---

## Cadena de valor operativa (espina)

```text
Weekly Menu → Order → Production Plan → Production Batch
→ Packaging → Delivery Route → Delivery → Payment
```

Soportes: Dish · Recipe · Ingredient · Stock · Supplier · Vehicle · Kitchen

---

## Roadmap de la fase

| # | Documento | Estado |
|---|-----------|--------|
| 01 | [Ubiquitous Language](./01-ubiquitous-language/README.md) | 🟢 Endurecido |
| 02 | [Core Objects](./02-core-objects/README.md) | 🟢 Endurecido + revisión de consistencia ✅ |
| 03 | [Operational Dependencies](./03-relationships/README.md) | 🟢 Endurecido (verbos · flujo · checks en vínculos) |
| 04 | [Lifecycles (transiciones)](./04-lifecycles/README.md) | 🟢 Endurecido |
| 05 | [Invariants](./05-INVARIANTS.md) | 🚧 v0.1 — **siguiente** |
| 06 | [Capability Mapping](./06-CAPABILITY_MAPPING.md) | 🚧 v0.1 |

Observation EatClean: ⏸. Sin pantallas / APIs / código.

### Gate 04 → 05

> ¿Transiciones críticas con evento, responsable y Checks?  
> **Sí** — ver [spine-transitions.md](./04-lifecycles/spine-transitions.md).  
> Siguiente: **05 Invariants** = leyes permanentes del sistema.

---

## Relación con otros bloques

| Bloque | Relación |
|--------|----------|
| [01 Ubiquitous Language](./01-ubiquitous-language/README.md) | Contrato semántico del producto |
| [Domain UL](../12-domain-model/UBIQUITOUS_LANGUAGE.md) | Glosario técnico / código |
| [ACTORS](../12-domain-model/ACTORS.md) | Actores oficiales |
| [OPERATIONAL_CHECKS](../15-product/OPERATIONAL_CHECKS.md) | Checks se enuncian con estos objetos |
| [Discovery](../16-operational-discovery/README.md) | Campo ⏸; validará el modelo más adelante |

---

## Disciplina

1. No objetos «por si acaso» (evitar sobre-modelado).  
2. Toda Capability y Check habla Nivel 1 (canónico).  
3. Alias de cocina = Nivel 2/3, nunca sustituyen al canónico.  
4. Sin nombres de DTO / Entity / Repository en el lenguaje operativo.
