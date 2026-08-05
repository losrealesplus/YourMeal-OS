# Incident Engine

**Documento:** `INCIDENT_ENGINE.md`  
**Track:** DEVELOPER-PLATFORM-005 · Roadmap **#300**  
**Producto:** YourMeal OS **Developer Platform v1.2**  
**Código:** `src/runtime/incident-engine/`  
**ADR:** [0041 — Incident Engine](../adr/0041-incident-engine.md)  
**Roadmap:** [DEVELOPER_PLATFORM_ROADMAP](./DEVELOPER_PLATFORM_ROADMAP.md)

> Observation → Evidence → **Incident** → Knowledge  
> No logs. No strings sueltos. No `console.log` como fuente de verdad.

---

## Objetivo

Convertir cualquier fallo detectado por cualquier módulo (empezando por Doctor) en un **Incident Object** estructurado.

El Developer Platform deja de ser solo un conjunto de módulos de diagnóstico y pasa a tener una **segunda capa**:

```text
Portal → Host → Registry → Modules → Doctor → Evidence → Incident Engine
```

---

## Filosofía (FOPEBA)

Ninguna observación tiene valor hasta convertirse en conocimiento verificable:

```text
Check → Evidence → Incident → Knowledge
```

---

## Arquitectura

| Pieza | Rol |
|-------|-----|
| `IncidentEngine` | API pública (`reportIncident`, …) |
| `IncidentRegistry` | Almacén en memoria de `RuntimeIncident` |
| `IncidentTimeline` | Eventos automáticos del ciclo de vida |
| `IncidentSeverity` / `IncidentCategories` | Taxonomía |
| `IncidentEvidenceLink` | Enlace a evidencias (sin duplicar payload) |
| `IncidentRecommendation` | Texto de acción |
| `IncidentRecovery` | Contrato · `NOT_IMPLEMENTED` hasta #303 |
| `doctor-bridge` | Doctor llama `reportIncident()` — no construye objetos |

---

## Contrato `RuntimeIncident`

```ts
type RuntimeIncident = {
  id: string
  timestamp: number
  capability: string
  moduleId: string
  severity: "info" | "warning" | "error" | "critical"
  category: string
  title: string
  description: string
  recommendation?: string
  recoveryAvailable: boolean
  recoveryStatus: ...
  confidence: number // 0–1
  evidenceIds: string[]
  status: "open" | "dismissed" | "resolved"
  checkId?: string
}
```

---

## API

| Método | Comportamiento |
|--------|----------------|
| `reportIncident()` | Crea / dedupe open · timeline automática |
| `dismissIncident()` | Marca dismissed |
| `recoverIncident()` | **`NOT_IMPLEMENTED`** (contrato futuro) |
| `getOpenIncidents()` | Lista abiertos |
| `getIncidentTimeline()` | Timeline (global o por incidente) |
| `clearResolved()` | Limpia resolved/dismissed |
| `exportIncidents()` | `RuntimeIncident[]` JSON — **no ZIP** |

---

## Integración con Doctor

Doctor **no** construye Incident Objects.

Cuando un check emite evidence (fail/warning):

```ts
reportIncidentFromDoctorCheck({ check, result, evidence, runAt })
```

Timeline automática:

```text
Doctor executed → Check FAIL → Incident created → Evidence linked → Recommendation
```

---

## Panel Host

Módulo `incidents` (categoría **Health**):

Open · Resolved · Severity · Timeline · Copy JSON · Recover stub

Sin UI avanzada (eso es evolución de #299 / Fase 1).

---

## Integración futura

| Track | Uso de Incident Engine |
|-------|------------------------|
| #301 Timeline Engine | Expansión del timeline actual |
| #302 Recommendation Engine | Enriquecer `recommendation` + confidence |
| #303 Recovery Engine | Implementar `recoverIncident` de verdad |
| #304 Export ZIP | Incluir `incidents` + `timeline.json` |
| #305 Knowledge | Agrupar incidentes → patrones |

---

## Non-goals (este PR)

- Recovery real  
- ZIP export  
- Knowledge clustering  
- UI avanzada  
- Modificar Host / Portal / Assets / DOM / Consistency engines  

---

**Incident Objects are the language of support.**
