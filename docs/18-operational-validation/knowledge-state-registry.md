# Knowledge State Registry

Registro vivo del **estado del conocimiento** por elemento canónico del Operational Model.

**Convención tras FASE 4:** elementos de la espina e Invariants críticos empiezan en **Hypothesized** hasta VR/FOV.

Actualizar al cerrar VR o FOV. Ver [knowledge-state.md](./knowledge-state.md).

**Última actualización:** 2026-07-22 (inicial)

---

## Leyenda

| KS | Estado |
|----|--------|
| H | Hypothesized |
| O | Observed |
| V | Validated |
| R | Refuted |
| G | Generalized |

---

## Core Objects (espina)

| Elemento | KS | Primera observación | VR respaldo | Notas |
|----------|-----|---------------------|-------------|-------|
| Weekly Menu | H | FASE 4 | — | |
| Order | H | FASE 4 | — | |
| Production Plan | H | FASE 4 | — | |
| Production Batch | H | FASE 4 | — | |
| Packaging | H | FASE 4 | — | |
| Delivery Route | H | FASE 4 | — | |
| Delivery | H | FASE 4 | — | |
| Payment | H | FASE 4 | — | |

---

## Invariants (muestra — espina y operación)

| ID | KS | Primera observación | VR respaldo | Notas |
|----|-----|---------------------|-------------|-------|
| INV-011 | H | FASE 4 | — | Batch → un Plan |
| INV-021 | H | FASE 4 | — | Orden causal espina |
| INV-034 | H | FASE 4 | — | Stock no negativo silencioso |
| INV-040 | H | FASE 4 | — | Payment liquida Order · tensión EC-002 |
| INV-050…055 | H | FASE 4 | — | Orden operativo |

Índice completo: [constitution-index](../17-operational-model/05-invariants/constitution-index.md) — añadir filas KS al validar.

---

## Dependencies (verbos espina — muestra)

| Verbo / vínculo | KS | Primera observación | VR respaldo |
|-----------------|-----|---------------------|-------------|
| Menu `offers` Dish | H | FASE 4 | — |
| Order `commits` demanda | H | FASE 4 | — |
| Plan `aggregates` Orders | H | FASE 4 | — |
| Batch `consumes` Stock | H | FASE 4 | — |
| Payment `settles` Order | H | FASE 4 | — |

---

## Contadores (resumen)

| KS | Conteo (muestra registrada) |
|----|----------------------------|
| Hypothesized | 17+ |
| Observed | 0 |
| Validated | 0 |
| Refuted | 0 |
| Generalized | 0 |

Actualizar desde [validation-coverage](./05-validation-reports/validation-coverage.md) cuando el registro crezca.

---

## Relacionado

- [knowledge-state.md](./knowledge-state.md)  
- [05 validation-reports](./05-validation-reports/README.md)
