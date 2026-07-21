# YourMeal Operational Model — Core Operativo

**FASE 4** · Lenguaje oficial del sistema (producto)  
**No es:** Foundation · cuarto pilar · Domain Model técnico (DDD) · código · pantallas · APIs  
**Sí es:** el diccionario operativo permanente de YourMeal OS

```text
FOUNDATION                 → cómo construir (arquitectura técnica)
PRODUCT BLUEPRINT          → qué construir y por qué (visión / Checks / Asistentes)
OPERATIONAL DISCOVERY      → por qué evolucionar (evidencia)
Operational Model (este)   → con qué lenguaje hablamos la operación
Domain Model (docs/12)     → cómo se modela en código ese lenguaje
```

No es un cuarto pilar documental. Es el **equivalente, para producto, de lo que el Domain Model es para el código**.

---

## Pregunta de esta fase

Hasta ahora:

> ¿Qué funcionalidades tendrá?

Ahora:

> **¿Qué objetos existen en cualquier negocio de comida preparada?**

No para EatClean sola.

Para **cualquier Organización futura**.

EatClean validará, ajustará y ampliará — no reinventará desde cero.

---

## Cadena de valor operativa (espina)

```text
Demand side (quién pide / recibe)
        │
        ▼
Weekly Menu ──────────────┐
        │                 │
        ▼                 │
Order (periodo) ◄─────────┘
        │
        ▼
Production Plan
        │
        ▼
Production Batch
        │
        ▼
Packaging (+ Label)
        │
        ▼
Delivery Route → Delivery
        │
        ▼
Payment
```

Alrededor (soportes permanentes):

```text
Dish · Recipe · Ingredient · Stock · Supplier · Vehicle · Kitchen
```

Detalle: [03-RELATIONSHIPS.md](./03-RELATIONSHIPS.md).

---

## Roadmap de la fase

| # | Documento | Estado |
|---|-----------|--------|
| 01 | [Ubiquitous Language (operativo)](./01-UBIQUITOUS_LANGUAGE.md) | ✅ v0.1 |
| 02 | [Core Operational Objects](./02-CORE_OBJECTS.md) | ✅ v0.1 |
| 03 | [Relationships](./03-RELATIONSHIPS.md) | ✅ v0.1 |
| 04 | [Lifecycles](./04-LIFECYCLES.md) | ✅ v0.1 |
| 05 | [Invariants](./05-INVARIANTS.md) | ✅ v0.1 |
| 06 | [Capability Mapping](./06-CAPABILITY_MAPPING.md) | ✅ v0.1 |

**v0.1** = hipótesis de lenguaje listas para validar en campo.  
No son tablas ni schemas. Observation / Domain las endurecen después.

---

## Relación con otros bloques

| Bloque | Relación |
|--------|----------|
| [UBIQUITOUS_LANGUAGE](../12-domain-model/UBIQUITOUS_LANGUAGE.md) (Domain) | Código y specs técnicas; este modelo define el **sentido operativo** primero |
| [ACTORS](../12-domain-model/ACTORS.md) | Actores oficiales (nunca «Cliente» ambiguo) |
| [OPERATIONAL_CHECKS](../15-product/OPERATIONAL_CHECKS.md) | Los Checks se enuncian con estos objetos |
| [Operational Discovery](../16-operational-discovery/README.md) | Valida / corrige este modelo con evidencia |
| [CAPABILITY_ROADMAP](../15-product/CAPABILITY_ROADMAP.md) | Capabilities implementan operaciones sobre estos objetos |

---

## Disciplina

1. Toda Capability nueva debe usar estos conceptos.  
2. Todo Operational Check debe nombrarse con estos objetos.  
3. Si el campo contradice el modelo → se ajusta el modelo (Discovery), no se inventa un sinónimo en código.  
4. Sin pantallas, APIs ni migraciones en esta fase.

---

## Qué desbloquea

Cuando estos conceptos estén claros (y luego validados):

- Capabilities más fáciles de diseñar;  
- Checks con lenguaje común;  
- modelo de datos casi natural;  
- la observación en EatClean **valida**, no reinventa.
