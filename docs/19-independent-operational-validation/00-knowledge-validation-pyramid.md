# Knowledge Validation Pyramid

**Seña de identidad de Operational Product Engineering (OPE).**

En ingeniería del software existen pruebas unitarias, de integración, de carga, de seguridad…  
OPE introduce un concepto distinto: validar el **conocimiento operacional** en capas, hasta que sea **reproducible**.

---

## La pirámide

```text
                 ▲
         Independent Implementation
────────────────────────────────────────
         Adversarial Validation
────────────────────────────────────────
         Comprehension Validation
────────────────────────────────────────
        Operational Validation
────────────────────────────────────────
        Operational Model
────────────────────────────────────────
        Discovery & Checks
────────────────────────────────────────
            Foundation
```

| Capa | Qué demuestra |
|------|----------------|
| **Foundation** | Construye el lenguaje de trabajo |
| **Discovery & Checks** | Construyen el conocimiento de la operación |
| **Operational Model** | Lo formaliza |
| **Operational Validation** | Demuestra que **explica** la realidad (mesa) |
| **Comprehension / Adversarial / Independent Implementation** | Demuestra transferibilidad (IOV) |
| **FOV + EC** *(Evidence Framework)* | Demuestra correspondencia con el campo e **impacto económico** (ECL-4/5) |

Gate formal a producto: [G-01](../20-evidence-framework/07-gate-g01-operational-readiness.md).


---

## Lectura

Si un modelo alcanza el vértice de la pirámide, ya no solo es un «buen modelo».

Es **conocimiento operacional reproducible** — un estándar más exigente, y la aspiración adecuada para OPE.

```text
explica la realidad
        +
es comprensible sin autores
        +
resiste oposición independiente
        +
produce arquitecturas alineadas
        =
conocimiento operacional reproducible
```

---

## Relación con fases

| Capa de la pirámide | Fase / carpeta |
|---------------------|----------------|
| Foundation | `FOUNDATION.md` · `docs/05-architecture/` |
| Discovery & Checks | `docs/16` · `docs/15-product/OPERATIONAL_CHECKS.md` |
| Operational Model | `docs/17-operational-model/` |
| Operational Validation | `docs/18-operational-validation/` |
| Comprehension · Adversarial · Independent Implementation | `docs/19-independent-operational-validation/` |

---

## Relacionado

- [IOV README](./README.md)  
- [OPE](../18-operational-validation/00-operational-product-engineering.md)
