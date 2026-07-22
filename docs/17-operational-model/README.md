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

## Happy Path B2B (navegación rápida) · IVR-001 / DF-008

Una página para no saltar a ciegas:

```text
1. Weekly Menu Published          → 04 spine-transitions · Publish
2. Beneficiary places Order       → 03 spine-flow · Confirm Order (04)
3. Orders aggregate into Plan     → Finalize / Start Plan (04)
4. Plan executes as Batch         → Start / Complete Batch (04)
5. Batch produces Packaging       → Complete Packaging + Label (04 · level-2)
6. Packaging assigns to Route     → Hand to Route · Ready / Depart (04)
7. Delivery confirms recipient    → Attempt → Confirm Delivered (04)
8. Payment settles Order          → Schedule Due · Settle (04) · finance UL
```

Detalle de estados: [state-index](./04-lifecycles/state-index.md).  
Gramática: bloques 01–07 abajo.

---

## Gramática operativa

| Rol | Bloque |
|-----|--------|
| Vocabulario | 01 Ubiquitous Language |
| Sustantivos | 02 Core Objects |
| Verbos | 03 Operational Dependencies |
| Tiempo | 04 Lifecycles (transiciones) |
| Constitución | 05 Invariants |
| Trazabilidad | 06 Capability Mapping |
| **Dinámica** | [07 Operational Dynamics v0.2](./07-operational-dynamics/README.md) |

> **Las Capabilities interactúan con el modelo — no lo definen.**

```text
Nuevo problema → Nuevo Check (en transición) → Capability → objetos existentes
```

Solo si es imposible → estudiar nuevo Core Object.

> **¿Qué objetos existen en cualquier negocio de comida preparada?**

No ampliar el sistema. **Consolidar el lenguaje.**

---

## Jerarquía definitiva

```text
Invariant          ← gobierna (verdad permanente)
        ↓
Lifecycle          ← transiciones permitidas
        ↓
Operational Check  ← ¿puede ocurrir esta transición?
        ↓
Capability         ← consume el modelo (no lo define)
```

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
| 05 | [Invariants (Constitución)](./05-invariants/README.md) | 🟢 Endurecido |
| 06 | [Capability Mapping (trazabilidad)](./06-capability-mapping/README.md) | 🟢 Marco + Dish ✅ |
| 07 | [Operational Dynamics v0.2](./07-operational-dynamics/README.md) | 🟢 Lifecycles 2.0 · Supporting Taxonomy · Checks 2.0 |

Observation EatClean: ⏸. Sin pantallas / APIs / código.

### Gate FASE 4 + Dynamics + Beta

> Gramática 01–06 ✅ · Dynamics v0.2 ✅ · tren MC-001…006 ✅  
> Nivel de confianza: **Beta** (mesa) — [certification](../18-operational-validation/07-certification.md)  
> Validation VS-001…006 ✅ · [gap analysis](../18-operational-validation/09-joint-gap-analysis.md)


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
5. Ningún Operational Check viola un Invariant.  
6. Cada afirmación canónica tiene [Knowledge State](../18-operational-validation/knowledge-state.md) trazable (proveniencia + VR).
