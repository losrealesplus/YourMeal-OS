# 03 · Edge Cases

Rotura **deliberada** — casos puntuales que tensionan Invariants y Lifecycles.

Más agresivos que los escenarios completos. Objetivo: encontrar grietas.

> **Nomenclatura:** los IDs históricos `EC-xxx` son **Edge Cases** (mesa).  
> En FOPEBA, **EC = Economic Confirmation** — [06](../../20-evidence-framework/06-economic-confirmation.md).
> Preferir decir «Edge Case EC-001» en prosa para evitar confusión.

---

## Plantilla

```markdown
# EC-xxx — [Título]

**Invariant(s) bajo prueba:** INV-…  
**Validation Report:** VR-xxx

## Pregunta de refutación

¿Qué tendría que pasar para romper [Invariant]?

## Condición límite

[Descripción mínima del caso]

## Resultado esperado del modelo

[Qué debe ocurrir si el modelo es sólido]

## Resultado

⏳ Pendiente
```

---

## Índice

| ID | Caso | Invariant(s) / tensión | Estado |
|----|------|------------------------|--------|
| [EC-001](./EC-001-dos-batches-mismo-stock.md) | Dos Batches compiten por mismo Stock | INV-034 · INV-050 | ⏳ |
| [EC-002](./EC-002-payment-parcial.md) | Payment parcial | INV-040 · INV-013 | ⏳ |
| [EC-003](./EC-003-delivery-fallida.md) | Delivery fallida | INV-041 · INV-022 | ⏳ |
| [EC-004](./EC-004-packaging-danado.md) | Packaging dañado | INV-030 · INV-035 | ⏳ |
| [EC-005](./EC-005-ingrediente-sustituido.md) | Ingrediente sustituido | INV-033 · consistencia Recipe | ⏳ |
| [EC-006](./EC-006-ruta-dividida.md) | Ruta dividida entre vehículos | INV-042 · INV-052 | ⏳ |

---

## Relacionado

- [05-invariants](../../17-operational-model/05-invariants/README.md)  
- [02 validation-scenarios](../02-validation-scenarios/README.md)
