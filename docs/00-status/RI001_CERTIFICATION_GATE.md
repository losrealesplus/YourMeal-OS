# RI-001 Certification Gate

**ID:** CG-RI-001  
**Tipo:** Gate de certificación operacional (instancia de [DICT-005 Gate](../99-reference/PROJECT_DICTIONARY.md#gate))  
**Patrón reutilizable:** [DICT-075 · Certification Gate](../99-reference/PROJECT_DICTIONARY.md#certification-gate)  
**Estado:** Active — pendiente de entrada plena tras EP-OPS-001 PASS  
**Producto:** YourMeal OS · RI: EatClean Tenerife  
**Canon:** [OCM-001](./EATCLEAN_OPERATIONAL_STRUCTURE.md) · [ORS-001](./ORS_001_OPERATIONAL_REFERENCE_SCENARIO.md) · [Release Board](./EP_OPS_001_RELEASE_BOARD.md)  
**Informe de decisión:** [RI-001 Certification Report](./RI001_CERTIFICATION_REPORT.md) (plantilla · siguiente gran entregable)

> YourMeal OS está en **fase de certificación operacional**.  
> **Congelación metodológica:** no crear nuevos principios / DICT / EP de metodología hasta concluir RI-001.  
> **Alcance de la certificación:** no valida el software; valida la **capacidad operacional** bajo escenario real + evidencia suficiente ([Report](./RI001_CERTIFICATION_REPORT.md)).

---

## Niveles del ecosistema (responsabilidades separadas)

```text
FON AI
    │
    ▼
FOPEBA
(Framework)
    │
    ▼
Knowledge
(Principios · DICT · ADR · OCM · ORS)
    │
    ▼
YourMeal OS
(Implementación)
    │
    ▼
CG-RI-001
(Certificación)
    │
    ▼
EatClean
(Operación real)
```

### Lo que queda estabilizado (congelación metodológica)

| Capa | Estado | Evolución permitida |
|------|--------|---------------------|
| FON AI | Congelada | Ninguna durante RI-001 |
| FOPEBA | Congelada | Solo cosecha de conocimiento **tras** RI-001 |
| Knowledge (DICT, ADR, OCM, ORS) | Congelado | Correcciones documentales únicamente |
| YourMeal OS | Estable | Corrección de defectos y obtención de evidencia |
| CG-RI-001 | Activo | Ejecución de la certificación |
| EatClean | Caso de referencia | Operación y validación en campo |

Evita mezclar decisiones metodológicas con decisiones de implementación durante la certificación.

| Nivel | Responsabilidad | No debe… |
|-------|-----------------|----------|
| FON AI | Visión / ecosistema | Sustituir evidencia de campo |
| FOPEBA | Framework metodológico | Implementar producto |
| Knowledge | Principios · DICT · ADR · OCM · ORS | Mezclarse con código ad hoc |
| YourMeal OS | Implementación | Redefinir metodología en caliente |
| CG-RI-001 | Certificación / decisión | Ampliar alcance funcional |
| EatClean | Operación real | Depender de ingeniería para la jornada |

Esa separación evita que metodología, conocimiento, implementación y certificación se mezclen.

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
RI-001 Certification Report
      │
      ▼
READY | READY WITH OBSERVATIONS | NOT READY
```

---

## Pregunta metodológica (única)

| Antes | En el Certification Gate |
|-------|--------------------------|
| ¿Qué falta por implementar? | **¿Qué evidencia falta para emitir una decisión objetiva sobre RI-001?** |

### Disciplina

- Cada corrección debe producir **nueva evidencia** ([DICT-006](../99-reference/PROJECT_DICTIONARY.md#evidence)).  
- Cada evidencia debe **reducir incertidumbre**.  
- Cada bloqueador eliminado acerca una **decisión de certificación**.  
- La arquitectura permanece **estable**; evoluciona el **nivel de confianza**.  
- **No** nuevos principios metodológicos hasta cierre RI-001.

---

## Evidencia (criterio FOPEBA)

> **Evidencia:** resultado verificable obtenido mediante la ejecución de un escenario operacional definido, suficiente para aumentar o disminuir la confianza en una decisión de certificación.

| No es evidencia | Sí es evidencia |
|-----------------|-----------------|
| Opinión | Acta de ORS-001 ejecutado |
| Intención / roadmap | RBAC ± con sesión y roles reales |
| Diff de código por sí solo | Respuestas de Observability desde el sistema |
| “Parece que funciona” | Checklist RRR firmado con artefactos |

La evidencia nace cuando un escenario como **ORS-001** se ejecuta y queda documentado.

---

## Entradas al Gate

| Entrada | Estado |
|---------|:------:|
| Foundation | ✅ |
| Operational Architecture | ✅ |
| Governance | ✅ |
| OCM-001 (DICT-074) | ✅ Documentado |
| Congelación metodológica (sin nuevos DICT/EP de principio) | ✅ En vigor |
| EP-OPS-001 PASS | ☐ Bloqueante |

---

## Carriles del Gate

| Carril | Artefacto | Pregunta de evidencia |
|--------|-----------|------------------------|
| Functional Completeness | [Matriz](./RI001_FUNCTIONAL_COMPLETENESS_MATRIX.md) | ¿Lo visible existe y funciona? |
| RBAC Certification | [OCM-001 §2](./EATCLEAN_OPERATIONAL_STRUCTURE.md#2--matriz-de-acceso-rbac) | ¿± validado? |
| Operational Observability | [Release Board](./EP_OPS_001_RELEASE_BOARD.md#-condición-transversal--operational-observability) | ¿7 preguntas con datos del sistema? |
| End-to-End Validation | [ORS-001](./ORS_001_OPERATIONAL_REFERENCE_SCENARIO.md) | ¿Jornada sin ingeniería? |
| Evidence Collection | Log / actas | ¿Incertidumbre clasificada? |
| Release Readiness Review | [Readiness](./RI001_READINESS_SPRINT.md) | ¿RRR completo? |

---

## Salidas · definición objetiva y repetible

### 🟢 READY

El sistema puede operar una jornada real **sin intervención del equipo de ingeniería**.

**Criterios (todos):**

- Todos los bloqueadores críticos eliminados (Release Board 🟢).  
- [ORS-001](./ORS_001_OPERATIONAL_REFERENCE_SCENARIO.md) completado (8 criterios).  
- Sin hallazgos **CRITICAL**.  
- Sin hallazgos **HIGH** bloqueantes.  
- Evidencia suficiente para respaldar la decisión (DICT-006).  

**Consecuencia:**

```text
Autorizado para RI-001
```

---

### 🟡 READY WITH OBSERVATIONS

La operación puede realizarse, pero existen observaciones que **no impiden** el piloto.

**Ejemplos admitidos:**

- Problemas menores de UX.  
- Métricas no críticas.  
- Ajustes visuales.  
- Hallazgos **LOW** o **MEDIUM** aceptados con plan.  

**No admite:** ORS-001 FAIL · CRITICAL · HIGH bloqueante · dependencia de ingeniería.

**Consecuencia:**

```text
RI-001 autorizado
+
Plan de seguimiento
```

---

### 🔴 NOT READY

No existe evidencia suficiente **o** existen bloqueadores que impiden una jornada operativa.

**Ejemplos:**

- ORS-001 falla.  
- RBAC incorrecto.  
- Persistencia defectuosa.  
- Bloqueadores críticos abiertos.  
- Dependencia del equipo de ingeniería para operar.  

**Consecuencia:**

```text
RI-001 bloqueado
```

---

## Relación con el Release Board

El [Release Board](./EP_OPS_001_RELEASE_BOARD.md) **no es un backlog**.  
Es el tablero de **eliminación de bloqueadores** que alimenta este Gate.

Pregunta diaria: **¿qué bloqueador eliminamos hoy?**

---

## Siguiente hito

Tras completar los carriles → emitir [**RI-001 Certification Report**](./RI001_CERTIFICATION_REPORT.md) (estructura orientada a **decisión**, no a cronología):

```text
1 Executive Summary · 2 Scope · 3 Certification Basis
4 Evidence Summary · 5 Findings · 6 Decision · 7 Rationale
8 Knowledge Harvest · 9 Next Actions
```

Pregunta del informe: **¿por qué esta decisión está justificada por la evidencia disponible?**

---

## Cierre formal de RI-001

RI-001 **termina** únicamente cuando:

1. Se emite el **RI-001 Certification Report**.  
2. La decisión (READY / RWO / NOT READY) queda **firmada** y **justificada con evidencia**.  
3. El conocimiento se incorpora a **FOPEBA** como patrones reutilizables.  

```text
Principios → Conocimiento → Implementación → Certificación
        → Conocimiento validado → FOPEBA → Siguiente producto
```

**Consecuencia estratégica:** YourMeal OS deja de ser solo el primer producto del ecosistema y pasa a ser el **primer caso de referencia certificado de FOPEBA**. CompiME, LosReales+ y siguientes reutilizan arquitectura, código **y** un proceso de certificación respaldado por experiencia real.

---

## Cosecha FOPEBA (post decisión)

| Activo YourMeal OS | Patrón FOPEBA |
|--------------------|---------------|
| OCM-001 | Modelo canónico operacional |
| ORS-001 | Validación operacional |
| CG-RI-001 / DICT-075 | Certification Gate |
| Release Board | Gestión de liberaciones / bloqueadores |
| Operational Observability | Evidencia en operación |
| Evidence (DICT-006) | Criterio epistémico de certificación |
| Certification Report | Plantilla de decisión de RI |

Ciclo completo: **principios → implementación → certificación → conocimiento validado**.