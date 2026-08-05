# Knowledge Engine

**Documento:** `KNOWLEDGE_ENGINE.md`  
**Track:** DEVELOPER-PLATFORM-007  
**Producto:** YourMeal OS **Developer Platform v1.4**  
**Código:** `src/runtime/knowledge-engine/`  
**ADR:** [0043 — Diagnostic Knowledge Model](../adr/0043-diagnostic-knowledge-model.md)  
**Roadmap:** [DEVELOPER_PLATFORM_ROADMAP](./DEVELOPER_PLATFORM_ROADMAP.md)

> El Knowledge Engine **no conoce** el Doctor.  
> El Doctor (UI) **sí** puede conocer Knowledge.  
> Un solo origen de verdad para recomendaciones futuras.

---

## Objetivo

Crear el **modelo de conocimiento** compartido por toda la Developer Platform.

No genera IA.  
No ejecuta Recovery.  
No escribe ZIP.

Define y indexa conocimiento declarativo que Recommendation / Recovery / Support consumirán después.

---

## Arquitectura

```text
Check → Evidence → Incident → Knowledge → Recommendation → Recovery
```

| Pieza | Rol |
|-------|-----|
| `KnowledgeRegistry` | `registerKnowledge` · `getKnowledge` |
| `KnowledgeIndex` | `searchKnowledge` · índices por tag/capability |
| `KnowledgeMatcher` | `matchIncident` · `matchCapability` |
| `KnowledgeArticle` (types) | Contrato `RuntimeKnowledge` |
| Foundation articles | Assets · Branding · Supabase · Android · Runtime |

---

## Contrato

```ts
type RuntimeKnowledge = {
  id, title, description, category, severity,
  tags, capabilities, incidentPatterns,
  recommendations, references?
}
```

---

## Matching (sin IA)

```text
Incident-shaped input → matchIncident() → KnowledgeMatch[]
```

Señales: `incidentPatterns` · capability · category · checkId · tags.  
Score declarativo 0–1.

---

## Dependencias

```text
Knowledge  ←  Doctor UI / Host panel
Knowledge  ↛  Doctor Engine
Knowledge  ↛  Incident Engine  (matcher usa shape plano)
```

Incident Engine **sin cambios internos**.  
Doctor Engine **sin cambios** — solo el panel UI muestra coincidencias.

---

## Host

Módulo `knowledge` · categoría **Knowledge**:

Articles · Search · Capability filter · Related capabilities · Recommendations

---

## Doctor UI

Sección **Knowledge · N articles** cuando hay match con open incidents / fail|warning checks.

---

## Futura IA

Un modelo LLM podrá **proponer** artículos o enriquecer `recommendations`, pero el contrato `RuntimeKnowledge` permanece el origen de verdad versionable.

---

## Non-goals

Recovery · AI · Export ZIP · Cloud Sync · Telemetry · nuevos checks Doctor.
