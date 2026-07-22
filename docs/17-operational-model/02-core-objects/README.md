# 02 — Core Objects

**FASE 4 · Operational Model**  
**Observation:** ⏸ congelada  
**Lenguaje:** [01 Ubiquitous Language](../01-ubiquitous-language/README.md)

> **Un Core Object es una entidad operacional permanente que existe independientemente de una pantalla, una Capability o un cliente concreto, y que representa un concepto estable del dominio de YourMeal OS.**

Tres palabras obligatorias: **operacional** · **permanente** · **estable**.  
Si falla una → no es Core.

---

## Filtro obligatorio (toda candidatura)

| # | Pregunta | Si falla |
|---|----------|----------|
| 1 | ¿Existe en **cualquier** empresa de comida preparada? | ❌ Solo EatClean → no Core |
| 2 | ¿Tiene **ciclo de vida propio**? | ❌ Nace/muere dentro de otro → no Core |
| 3 | ¿Puede existir **sin interfaz**? | ❌ Depende de una pantalla → no Core |
| 4 | ¿Puede tener **Operational Checks** propios? | ❌ Nunca tendrá reglas → probablemente no |
| 5 | ¿**Sobrevivirá** dentro de cinco años? | ❌ «Quizá no» → no entra |

No añadir objetos «por si acaso».

---

## Tres niveles (no mezclar)

| Nivel | Nombre | Qué es |
|-------|--------|--------|
| **1** | [Core Objects](./level-1-core.md) | Corazón del modelo · espina + piezas permanentes |
| **2** | [Supporting Objects](./level-2-supporting.md) | Soporte · importantes pero no el corazón |
| **3** | [Configuration Objects](./level-3-configuration.md) | Reglas / ajustes · **no** son la operación |

---

## Qué nunca entra en el Operational Model

Formas de **presentar** información, no de operar:

- Dashboard / Centro de Control (superficie, no objeto)
- Notification · Report · Widget · KPI
- «Configuración» como cajón de sastre

Esas cosas pueden existir en el producto.  
**No** son Core Objects.

---

## Espina dorsal (Nivel 1)

Nombres canónicos del UL (no «Customer», no «Package» suelto):

```text
Company Account / Consumer / Beneficiary
              │
              ▼
         Weekly Menu
              │
              ▼
            Order
              │
              ▼
       Production Plan
              │
              ▼
      Production Batch
              │
              ▼
          Packaging
              │
              ▼
       Delivery Route
              │
              ▼
           Delivery
              │
              ▼
           Payment
```

Orbitando (Core o Supporting — ver fichas):

```text
Dish · Recipe · Ingredient · Stock · Supplier · Vehicle · Organization
```

---

## Plantilla obligatoria (Nivel 1)

```text
Nombre
Definición
Responsabilidad
Propietario
Estados
Lifecycle
Relaciones
Operational Checks
Capabilities
Invariants
```

Si no se puede rellenar → no es Core.

---

## Gate antes de 03 · Operational Dependencies

Tras cerrar este bloque: [consistency-review.md](./consistency-review.md) ✅

> ¿Podemos contar el ciclo completo de una operación usando **solo** Core Objects (Nivel 1) y lenguaje canónico?

Si sí → Dependencies conectan piezas con verbos.  
Ver [03-relationships/](../03-relationships/README.md).

---

## Índice

| Doc | Contenido |
|-----|-----------|
| [level-1-core.md](./level-1-core.md) | Core Objects (plantillas) |
| [level-2-supporting.md](./level-2-supporting.md) | Supporting |
| [level-3-configuration.md](./level-3-configuration.md) | Configuration (fuera del Core) |
| [consistency-review.md](./consistency-review.md) | Prueba del ciclo completo |

---

## Relacionado

- [01 UL](../01-ubiquitous-language/README.md)  
- [03 Operational Dependencies](../03-relationships/README.md)  
- [OPERATIONAL_CHECKS](../../15-product/OPERATIONAL_CHECKS.md)
