# ADR 0013 — Implementation is Knowledge Materialization

## Estado

Aceptado — 2026-07-23

## Contexto

YourMeal OS construyó FOPEBA, un Operational Model Table-Validated y un Product Skeleton UX antes de conectar la mayor parte de la lógica. El riesgo de Etapa 2 es que el código vuelva a convertirse en **origen** de reglas operacionales (ideas en PRs, conveniencia técnica, «mejoras» sin evidencia).

La frase operativa ya existe en la filosofía de implementación:

> Cursor implementa capacidades previamente certificadas.

Debe quedar como **decisión arquitectónica permanente**, no solo como guía de sprint.

## Decisión

```text
Todo cambio de código debe responder a una necesidad
previamente demostrada por el Operational Model.

El software es una implementación del conocimiento.
Nunca su origen.
```

### Implicaciones

1. **Ninguna regla operacional nueva nace en código.** Si hace falta → STOP · `REQUIRES KNOWLEDGE REVIEW` · Carril A (FOV → FER → KU).  
2. Toda implementación de Capability cita OM / objetos / evidencia ([Knowledge Traceability](../15-product/etapa-2/knowledge-traceability.md)).  
3. Los PRs de Capability **no mezclan** UX, conocimiento o refactors no relacionados ([PR Change Levels](../22-implementation/PR_CHANGE_LEVELS.md)).  
4. Lovable no redefine dominio; Cursor no inventa dominio; FOPEBA certifica; GitHub conserva evidencia.  
5. Esta ADR permanece válida aunque cambien framework, lenguaje o producto concreto.

### Relación con ADR 0012

ADR 0012 reparte roles Cursor / Lovable / docs.  
ADR 0013 fija la **epistemología de la implementación**: el código materializa conocimiento certificado.

## Consecuencias

- Objetivo del proyecto (desde CAP-002): demostrar que FOPEBA produce software operacional de alta calidad.  
- Etapa 2 se organiza en Levels 1–4 ([ETAPA_2_LEVELS](../22-implementation/ETAPA_2_LEVELS.md)) y se mide por CAP × estado × [Knowledge Coverage](../22-implementation/KNOWLEDGE_COVERAGE.md), no por pantallas.  
- Hito: primer Happy Path sin mocks — no «una CAP más».  
- Superseder esta ADR requiere evidencia y un ADR nuevo explícito.

## Relacionado

- [IMPLEMENTATION_PHILOSOPHY](../23-engineering/IMPLEMENTATION_PHILOSOPHY.md)  
- [ETAPA_2_LEVELS](../22-implementation/ETAPA_2_LEVELS.md)  
- [CURSOR_MASTER_PROMPT](../22-implementation/CURSOR_MASTER_PROMPT.md)  
- [ADR 0012](./0012-cursor-cto-lovable-ui.md)
