# ADR 0044 — Recommendation Engine

## Estado

**Accepted** — 2026-08-05  
**Track:** DEVELOPER-PLATFORM-008  
**Producto:** Developer Platform **v1.5**  
**Detalle:** [RECOMMENDATION_ENGINE](../05-architecture/RECOMMENDATION_ENGINE.md)

## Contexto

Con Knowledge Model (#301 / DEVELOPER-PLATFORM-007), la plataforma ya tiene un origen de verdad declarativo. El Doctor UI seguía mezclando strings ad-hoc de checks/incidentes. Sin un motor de decisión, Recommendation, Recovery e IA volverían a duplicar lógica.

## Decisión

1. Introducir **Recommendation Engine** que **solo consume Knowledge** (vía match de Incident → Knowledge).  
2. Prohibir `Incident → Recommendation` directo.  
3. Agrupar N incidentes → 1 recommendation por artículo de Knowledge.  
4. Priorizar Critical → High → Medium → Low.  
5. Acciones `recovery` con `supported: false` hasta Recovery Engine.  
6. Doctor UI deja de hardcodear recomendaciones y llama a `buildRecommendations()`.  
7. Fijar el **principio de dependencia unidireccional** de Engines en la documentación de plataforma.

## Consecuencias

- Recommendation / Recovery / AI comparten el mismo camino por Knowledge.  
- Tests unitarios del Engine no necesitan Doctor ni Host.  
- Añadir consejo = ampliar Knowledge (`registerKnowledge`), no editar el Engine.
