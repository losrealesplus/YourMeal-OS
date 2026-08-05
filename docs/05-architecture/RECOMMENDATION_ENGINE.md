# Recommendation Engine

**Documento:** `RECOMMENDATION_ENGINE.md`  
**Track:** DEVELOPER-PLATFORM-008  
**Producto:** YourMeal OS **Developer Platform v1.5**  
**Código:** `src/runtime/recommendation-engine/`  
**ADR:** [0044 — Recommendation Engine](../adr/0044-recommendation-engine.md)  
**Roadmap:** [DEVELOPER_PLATFORM_ROADMAP](./DEVELOPER_PLATFORM_ROADMAP.md)

> El Recommendation Engine **no crea** conocimiento.  
> Consume **Knowledge** y produce decisiones priorizadas.

---

## Arquitectura

```text
Check → Evidence → Incident → Knowledge → Recommendation Engine → Recommendation
```

**Nunca** `Incident → Recommendation`. Siempre pasa por Knowledge.

### Principio permanente (cadena unidireccional)

> Un Engine nunca depende de otro Engine situado *más arriba* en la cadena.  
> Cada Engine solo consume contratos de niveles anteriores.

```text
Check → Evidence → Incident → Knowledge → Recommendation → Recovery
```

---

## Contrato

```ts
type RuntimeRecommendation = {
  id, title, description,
  priority: low|medium|high|critical,
  confidence: number,
  incidentIds, knowledgeIds, evidenceIds,
  actions: RuntimeRecommendationAction[]
}
```

Acciones: `manual` · `documentation` · `recovery` (`supported: false` hasta Recovery Engine).

---

## API

| Método | Rol |
|--------|-----|
| `buildRecommendations()` | Incidentos abiertos → match Knowledge → agrupar → priorizar |
| `getRecommendations()` | Lista ordenada |
| `clearRecommendations()` | Vaciar store |
| `exportRecommendations()` | JSON array (no ZIP) |

---

## Agrupación

```text
3 Incidents → same Knowledge article → 1 Recommendation
```

---

## Priorización

Critical → High → Medium → Low (severity Knowledge + Incident).

---

## Dependencias permitidas

Lee: **Knowledge** · **Incident** · Evidence ids.  
No importa: Doctor · Host · UI.

Doctor UI **pregunta** al Engine y renderiza.

---

## Host

Módulo `recommendations` · categoría **Recommendations**:

Priority · Confidence · Knowledge · Related Incidents · Actions (Copy / Open Knowledge / View Incident)

---

## Futuro Recovery

`actions` tipo `recovery` ya existen con `supported: false`.  
Recovery Engine solo cambiará `supported` e implementará ejecución.

---

## Non-goals

Recovery execute · ZIP · Cloud · AI · Telemetry · inventar Knowledge.
