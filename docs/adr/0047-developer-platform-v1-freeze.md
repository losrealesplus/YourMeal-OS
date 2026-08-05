# ADR 0047 — Developer Platform v1.0 Freeze

## Estado

**Accepted** — 2026-08-05  
**Track:** DEVELOPER-PLATFORM-011 · Platform Stabilization  
**Producto:** Developer Platform **v1.0.0** (FROZEN)  
**Constitución:** [DEVELOPER_PLATFORM_v1.md](../05-architecture/DEVELOPER_PLATFORM_v1.md)

## Contexto

Tras Portal → Host → Core → Capability → Doctor → Incident → Knowledge → Recommendation → Recovery, la cadena cognitiva está completa. Seguir con ZIP / Telemetry / IA antes de consolidar crearía deuda sobre APIs aún fluidas y desviaría foco del Product Core (EatClean).

## Decisión

1. **Congelar** la arquitectura y los contratos públicos v1.0:
   - `RuntimeEvidence` · `RuntimeCapability` · `RuntimeIncident`
   - `RuntimeKnowledge` · `RuntimeRecommendation` · `RuntimeRecovery`
2. Introducir `src/runtime/platform-contracts/` + **Platform Contract Tests** (reglas de dependencia).  
3. Introducir baseline de performance (medir, no optimizar).  
4. Corregir acoplamientos de freeze:
   - `detectRuntimePlatform` → Core (Recovery no importa Host).  
   - Recommendation **no** importa Capability; Recovery Policy resuelve `recover()`.  
5. Conservar bridges documentados (Host adapters, Doctor checks → Capability, Incident doctor-bridge).  
6. **No** eliminar el Runtime Inspector shell (monta el Host).  
7. Engines dejan de evolucionar salvo **cambios mayores** con ADR nuevo.  
8. Siguientes PRs: módulos `RuntimeCapability` y/o **Product Core** — no rediseño de engines.

## Consecuencias

- Foco del proyecto: **≈20% Developer Platform / ≈80% Product Core**.  
- Indicador de éxito: tenant EatClean completa una jornada beta sin bloqueos ni pérdida de datos.  
- ZIP / Telemetry / AI quedan **diferidos** hasta consolidación operacional del Product Core.  
- Cualquier ruptura de import boundaries falla CI vía contract tests.
