# Knowledge Lifetime

**Tipo:** regla metodológica de **documentación FOPEBA**  
**No es:** un ADR de YourMeal OS · un Knowledge State · una fase de validación nueva  
**Complementa:** [Knowledge States](../20-evidence-framework/01-knowledge-states.md) (estado del *conocimiento operacional*)  
**Ejemplo aplicado:** [TENANT_BRANDING](../05-architecture/TENANT_BRANDING.md) · [TENANT_EXPERIENCE_SPEC](../05-architecture/TENANT_EXPERIENCE_SPEC.md) · [TENANT_IMPLEMENTATION_EATCLEAN](../05-architecture/TENANT_IMPLEMENTATION_EATCLEAN.md) · [EXPERIENCE_REFACTOR_EATCLEAN_V1_1](../07-experience/EXPERIENCE_REFACTOR_EATCLEAN_V1_1.md)

---

## Por qué existe

FOPEBA genera mucho conocimiento. Sin disciplina de **caducidad**, tres tipos distintos terminan mezclados en el mismo archivo:

* decisiones permanentes;
* cómo un producto concreto aplica esas decisiones;
* lo que se hizo en un sprint o PR.

Eso convierte la documentación en una colección de notas.  
Con **Knowledge Lifetime**, se convierte en un **sistema evolutivo**.

> Knowledge States responden: *¿cuán validado está el conocimiento operacional?*  
> Knowledge Lifetime responde: *¿dónde vive cada tipo de documento y cuándo puede cambiar?*

No son el mismo eje. No se sustituyen.

---

## Los tres niveles

Todo documento debe pertenecer a **uno** de estos niveles:

| Nivel | Propósito | Cambia |
|-------|-----------|--------|
| **Contract** | Reglas permanentes del sistema / metodología / experiencia | Muy raramente |
| **Implementation** | Cómo un producto o tenant concreto aplica el contrato | Cuando evoluciona ese producto |
| **Iteration** | Trabajo realizado durante una fase, sprint o PR | **Nunca** se reedita tras cerrarse (solo lectura / apéndice) |

```text
Contract
│
├── ADR
├── TENANT_BRANDING
├── TENANT_EXPERIENCE_SPEC
│   (y otros contratos / reglas permanentes)
│
▼
Implementation
│
├── TENANT_IMPLEMENTATION_EATCLEAN
│   (y otras implementaciones de tenant / módulo)
│
▼
Iteration
│
└── EXPERIENCE_REFACTOR_EATCLEAN_V1_1
    (bitácoras, actas de sprint, changelogs de fase)
```

---

## Reglas

### 1. Un documento · un nivel

Si un archivo mezcla Contract + Iteration, **separarlo**.  
No «actualizar la bitácora» para corregir una regla permanente: subir la regla al Contract.

### 2. Iteration es inmutable al cierre

Cuando un sprint/PR/fase se declara cerrado, su bitácora **deja de editarse**.  
Hallazgos posteriores → Implementation o Contract (con el proceso FOPEBA que corresponda), no reescritura silenciosa del pasado.

Paralelo: [MILESTONES](../00-status/MILESTONES.md) es append-only. Iteration sigue la misma ética.

### 3. Buscar reglas en Contract, no en Iteration

Dentro de seis meses nadie debería tener que abrir `EXPERIENCE_REFACTOR_*` para saber cómo debe comportarse el Login.  
Eso vive en **TENANT_EXPERIENCE_SPEC** (Contract) o **TENANT_IMPLEMENTATION_*** (Implementation).

### 4. No es evolución del framework de validación

Knowledge Lifetime **no** añade:

* nuevas fases FOPEBA;
* nuevos tipos de evidencia;
* nuevos Knowledge States.

Organiza **artefactos documentales**. El Methodology Frozen sigue vigente para el framework de validación operacional ([04-methodology-frozen](../00-status/04-methodology-frozen.md)).

### 5. Encabezado recomendado

Cada doc nuevo debería declarar su nivel cerca del título:

```markdown
**Knowledge Lifetime:** Contract | Implementation | Iteration
```

---

## Relación con FOPEBA (experiencias de extremo a extremo)

Hasta ahora FOPEBA validaba sobre todo **objetos operacionales**.

Con un milestone de piloto (p. ej. [EatClean Pilot Ready](../00-status/MILESTONE_EATCLEAN_PILOT_READY.md)), la misma disciplina documental sostiene una demostración más fuerte:

```text
Customer Journey
        ↓
Operational Objects
        ↓
Operational Journey
        ↓
Outcome
```

Contract fija las reglas de esas caras.  
Implementation concreta el tenant.  
Iteration registra cómo se llegó — sin contaminar el contrato.

---

## Checklist al escribir o fusionar docs

| Pregunta | Si la respuesta es… |
|----------|---------------------|
| ¿Debe valer para cualquier tenant / dentro de un año? | → **Contract** |
| ¿Es cómo EatClean (u otro producto) lo aplica hoy? | → **Implementation** |
| ¿Es lo que hicimos en este PR / sprint? | → **Iteration** |
| ¿Estoy editando una bitácora cerrada para «arreglar» una regla? | → **No** — mueve la regla al nivel correcto |

---

## Dictionary

Término oficial: [DICT-057 · Knowledge Lifetime](../99-reference/PROJECT_DICTIONARY.md#knowledge-lifetime).
