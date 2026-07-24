# RI-001 Certification Gate

**ID:** CG-RI-001  
**Tipo:** Gate de certificación operacional (instancia de [DICT-005 Gate](../99-reference/PROJECT_DICTIONARY.md#gate))  
**Patrón reutilizable:** [DICT-075 · Certification Gate](../99-reference/PROJECT_DICTIONARY.md#certification-gate)  
**Estado:** Active — pendiente de entrada plena tras EP-OPS-001 PASS  
**Producto:** YourMeal OS · RI: EatClean Tenerife  
**Canon:** [OCM-001](./EATCLEAN_OPERATIONAL_STRUCTURE.md) · [ORS-001](./ORS_001_OPERATIONAL_REFERENCE_SCENARIO.md) · [Release Board](./EP_OPS_001_RELEASE_BOARD.md)

> YourMeal OS no está en “desarrollo de SaaS”. Está en **fase de certificación operacional**.

---

## Cadena hasta la decisión

```text
FOUNDATION
      │
      ▼
Operational Architecture
      │
      ▼
Governance
      │
      ▼
Operational Canonical Model (OCM-001)
      │
      ▼
EP-OPS-001
      │
      ▼
══════════════════════════════════
     RI-001 CERTIFICATION GATE
══════════════════════════════════
      │
      ├── Functional Completeness Review
      ├── RBAC Certification
      ├── Operational Observability
      ├── End-to-End Validation (ORS-001)
      ├── Evidence Collection
      └── Release Readiness Review
══════════════════════════════════
      │
      ▼
RI-001 Decision
READY
READY WITH OBSERVATIONS
NOT READY
```

---

## Pregunta metodológica (única)

| Antes | En el Certification Gate |
|-------|--------------------------|
| ¿Qué falta por implementar? | **¿Qué evidencia falta para emitir una decisión objetiva sobre RI-001?** |

Toda priorización, corrección y PR de Certification Mode debe responder solo a esa pregunta.

### Disciplina

- Cada corrección debe producir **nueva evidencia**.  
- Cada evidencia debe **reducir incertidumbre**.  
- Cada bloqueador eliminado acerca una **decisión de certificación**.  
- La arquitectura permanece **estable**; evoluciona el **nivel de confianza** en que el sistema sostiene una operación real.

---

## Entradas al Gate

| Entrada | Estado |
|---------|:------:|
| Foundation | ✅ |
| Operational Architecture | ✅ |
| Governance | ✅ |
| OCM-001 (DICT-074) | ✅ Documentado |
| EP-OPS-001 PASS | ☐ Bloqueante |

Sin EP-OPS-001 PASS no se abre el trabajo pleno del Gate (FCR amplio / E2E / RRR). La corrección del hub es la vía de entrada.

---

## Carriles del Gate

| Carril | Artefacto | Pregunta de evidencia |
|--------|-----------|------------------------|
| Functional Completeness | [Matriz](./RI001_FUNCTIONAL_COMPLETENESS_MATRIX.md) | ¿Lo visible existe y funciona? |
| RBAC Certification | [OCM-001 §2](./EATCLEAN_OPERATIONAL_STRUCTURE.md#2--matriz-de-acceso-rbac) | ¿± validado (menú · URL · CRUD · backend)? |
| Operational Observability | [Release Board](./EP_OPS_001_RELEASE_BOARD.md#-condición-transversal--operational-observability) | ¿Las 7 preguntas tienen respuesta en sistema? |
| End-to-End Validation | [ORS-001](./ORS_001_OPERATIONAL_REFERENCE_SCENARIO.md) | ¿Jornada completa sin ingeniería? |
| Evidence Collection | Log de hallazgos / FOPEBA | ¿Incertidumbre clasificada? |
| Release Readiness Review | [Readiness sprint](./RI001_READINESS_SPRINT.md) | ¿Checklist RRR completo? |

---

## Salidas válidas (decisión RI-001)

| Decisión | Significa |
|----------|-----------|
| **READY** | Evidencia suficiente · ORS-001 PASS · sin bloqueadores CRITICAL/HIGH abiertos |
| **READY WITH OBSERVATIONS** | Operable con hallazgos acotados documentados (no invalidan la tesis RI) |
| **NOT READY** | Falta evidencia objetiva o ORS-001 / Observability / hub fallan |

La evidencia **informa**; este Gate **decide** (DICT-005).

---

## Relación con el Release Board

El [Release Board](./EP_OPS_001_RELEASE_BOARD.md) **no es un backlog**.  
Es el tablero de **eliminación de bloqueadores** que alimenta este Gate.

Pregunta diaria:

> ¿Qué bloqueador eliminamos hoy?

No: ¿qué desarrollamos hoy?

---

## Cosecha FOPEBA (post RI-001)

Tras la decisión RI-001, **no** archivar solo dentro de YourMeal OS. Extraer patrones validados hacia FOPEBA para CompiME, LosReales+ y futuros productos:

| Activo YourMeal OS | Patrón FOPEBA |
|--------------------|---------------|
| OCM-001 | Patrón metodológico reutilizable (modelo canónico operacional) |
| ORS-001 | Patrón de validación operacional |
| CG-RI-001 / DICT-075 | Patrón de Certification Gate |
| Release Board | Patrón de gestión de liberaciones / eliminación de bloqueadores |
| Operational Observability | Patrón de evidencia en operación |

Conocimiento validado en un caso real → no empezar de cero en el siguiente producto.
