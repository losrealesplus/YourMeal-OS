# ADR 0041 — Incident Engine

## Estado

**Accepted** — 2026-08-05  
**Track:** DEVELOPER-PLATFORM-005 · Roadmap **#300**  
**Producto:** Developer Platform **v1.2**  
**Detalle:** [INCIDENT_ENGINE](../05-architecture/INCIDENT_ENGINE.md) · [ROADMAP](../05-architecture/DEVELOPER_PLATFORM_ROADMAP.md)

## Contexto

Con Portal · Host · Registry · Doctor (#291–#298), los fallos generaban Evidence pero no un objeto de incidencia permanente. Sin Incident Objects, soporte y desarrollo vuelven a depender de logs, memoria y texto libre — incompatible con FOPEBA y con el objetivo de reducir el riesgo operativo del Product Core.

## Decisión

1. Introducir **Incident Engine** (`src/runtime/incident-engine/`) como segunda capa permanente.  
2. Cadena oficial: **Observation → Evidence → Incident → Knowledge**.  
3. API: `reportIncident` · `dismissIncident` · `recoverIncident` (stub) · `getOpenIncidents` · `getIncidentTimeline` · `clearResolved` · `exportIncidents`.  
4. Doctor **reporta** incidencias vía bridge; no construye el objeto.  
5. Recovery y ZIP quedan como contratos / roadmap (#303 · #304) — sin implementar ahora.  
6. Panel mínimo `Incidents` en Health vía `registerModule` (Host no se reescribe).

## Consecuencias

- Cualquier FAIL/WARNING de Doctor produce Incident + Timeline automáticos.  
- Knowledge / Export / Recovery se apoyan en `RuntimeIncident` sin re-arquitectar.  
- Principio de plataforma: nuevos módulos usan `reportIncident()`, no inventan formatos.
