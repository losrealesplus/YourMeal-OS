# PROJECT DICTIONARY

> **El Project Dictionary es la fuente oficial de significado de todos los conceptos, estados, artefactos y términos utilizados en YourMeal OS y FOPEBA. Ningún término se considera oficial hasta que su definición haya sido incorporada a este documento.**

**Idioma:** español (definición) · inglés (código / BD) — ADR 0010.  
**Complemento de dominio (entidades de cocina):** [UBIQUITOUS_LANGUAGE](../12-domain-model/UBIQUITOUS_LANGUAGE.md) · [OM UL](../17-operational-model/01-ubiquitous-language/README.md).  
**Este documento** fija el lenguaje del *proyecto y la metodología*, no el glosario de platos/recetas.

---

## Cuatro pilares documentales (no se solapan)

| Documento | Responde a |
|-----------|------------|
| [FOUNDATION](../../FOUNDATION.md) | ¿Cuáles son las reglas permanentes del proyecto? |
| [ADR](../adr/README.md) | ¿Por qué decidimos hacer esto? |
| [Operational Model](../17-operational-model/README.md) | ¿Cómo funciona el dominio? |
| **PROJECT_DICTIONARY** (este) | ¿Qué significa exactamente cada concepto? |

---

## Regla de gobernanza (autoridad semántica)

```text
Nuevo concepto
        ↓
Discusión
        ↓
Aceptado
        ↓
PROJECT_DICTIONARY  (entrada con ID DICT-xxx)
        ↓
Puede utilizarse en:
- ADR
- Operational Model
- Código
- Documentación
```

> **Solo conceptos estables y Accepted.** Hipótesis, ideas en discusión o términos provisionales permanecen en ADRs, notas o actas hasta ser aprobados. El diccionario no es un block de borradores.

Cuando una conversación fija significado (p. ej. «ORR PASSED = …»), la siguiente tarea documental es: **nueva entrada DICT → commit**.

### Primera pregunta ante un término nuevo

> **¿Es un concepto nuevo o es una forma distinta de nombrar un concepto existente?**

| Respuesta | Acción |
|-----------|--------|
| Ya existe en el Dictionary | **Reutilizar** el término oficial (`DICT-xxx`) |
| No existe | **Discutir** (ADR / nota / acta) |
| Aceptado | Asignar `DICT-xxx` → entrada Accepted → uso oficial |

Así se evita que aparezcan sinónimos no oficiales («Evidence Review», «Operational Gate», «Production Readiness») para conceptos que ya tienen significado preciso.

### Disciplina de evolución (pilares)

| Pilar | Cuándo cambia |
|-------|----------------|
| **FOUNDATION** | Solo circunstancias excepcionales |
| **ADR** | Cuando hay una decisión nueva |
| **Operational Model** | Solo tras *Knowledge Update* aprobado |
| **PROJECT_DICTIONARY** | Solo al aceptar un concepto nuevo o modificar oficialmente uno existente |

Cada documento cumple una función; no se mezclan definición, decisión y conocimiento.

---

## Metadatos de cada entrada

| Campo | Valores |
|-------|---------|
| **ID** | `DICT-001` … identificador estable (citable desde ADR / CAP / Gate) |
| **Status** | `Draft` · `Accepted` · `Deprecated` · `Replaced` |
| **Madurez** | `Core` · `Operational` · `Engineering` · `Historical` |

| Madurez | Significado |
|---------|-------------|
| **Core** | Concepto fundamental del framework FOPEBA / gobernanza |
| **Operational** | Concepto del dominio de producto / operación |
| **Engineering** | Concepto de implementación YourMeal OS |
| **Historical** | Se mantiene por compatibilidad; ya no se usa activamente |

### Status

| Status | Significado |
|--------|-------------|
| **Draft** | En revisión — **no** usar en docs oficiales todavía (excepcional; preferir fuera del Dictionary) |
| **Accepted** | Oficial |
| **Deprecated** | Evitar en texto nuevo; sigue documentado |
| **Replaced** | Sustituido por otro DICT-xxx (indicar en Referencias) |

---

## Plantilla de entrada (obligatoria)

```markdown
# <TÉRMINO>

## ID
DICT-xxx

## Nombre
## Tipo
## Status
Accepted

## Madurez
Core | Operational | Engineering | Historical

## Definición
## Cuándo ocurre
## Produce
## No significa
## Sinónimos
## Palabras relacionadas
## Referencias
```

---

## Índice por ID


| ID | Término | Madurez | Status |
|----|---------|---------|--------|
| `DICT-001` | [FOPEBA](#fopeba) | Core | Accepted |
| `DICT-002` | [FOV](#fov) | Core | Accepted |
| `DICT-003` | [IOV](#iov) | Core | Accepted |
| `DICT-004` | [Knowledge Update](#knowledge-update) | Core | Accepted |
| `DICT-005` | [Gate](#gate) | Core | Accepted |
| `DICT-006` | [Evidence](#evidence) | Core | Accepted |
| `DICT-007` | [Knowledge Leakage](#knowledge-leakage) | Core | Accepted |
| `DICT-008` | [Operational Model](#operational-model) | Core | Accepted |
| `DICT-009` | [Table Validation](#table-validation) | Core | Accepted |
| `DICT-010` | [Field Validation](#field-validation) | Core | Accepted |
| `DICT-011` | [Capability](#capability) | Engineering | Accepted |
| `DICT-012` | [Repository](#repository) | Engineering | Accepted |
| `DICT-013` | [Mutation Pattern](#mutation-pattern) | Engineering | Accepted |
| `DICT-014` | [Read Pattern](#read-pattern) | Engineering | Accepted |
| `DICT-015` | [Happy Path](#happy-path) | Engineering | Accepted |
| `DICT-016` | [ORR](#orr) | Core | Accepted |
| `DICT-017` | [Smoke Test](#smoke-test) | Engineering | Accepted |
| `DICT-018` | [Engineering Baseline](#engineering-baseline) | Engineering | Accepted |
| `DICT-019` | [Hardening Sprint](#hardening-sprint) | Engineering | Accepted |
| `DICT-020` | [ADR](#adr) | Core | Accepted |
| `DICT-021` | [Current Phase](#current-phase) | Engineering | Accepted |
| `DICT-022` | [Milestone](#milestone) | Engineering | Accepted |
| `DICT-023` | [Integration Release](#integration-release) | Engineering | Accepted |
| `DICT-024` | [Evidence Gate](#evidence-gate) | Core | Accepted |
| `DICT-025` | [Frozen](#frozen) | Core | Accepted |
| `DICT-026` | [Foundation Lock](#foundation-lock) | Core | Accepted |
| `DICT-027` | [Project Dictionary](#project-dictionary) | Core | Accepted |
| `DICT-028` | [Knowledge Engineering](#knowledge-engineering) | Core | Accepted |
| `DICT-029` | [Software Engineering](#software-engineering) | Engineering | Accepted |
| `DICT-030` | [Operational Engineering](#operational-engineering) | Core | Accepted |
| `DICT-031` | [Ready for CAP-006](#ready-for-cap-006) | Engineering | Accepted |
| `DICT-032` | [Ready for ORR](#ready-for-orr) | Engineering | Accepted |
| `DICT-033` | [Ready for FOV](#ready-for-fov) | Core | Accepted |
| `DICT-034` | [Operational](#operational) | Engineering | Accepted |
| `DICT-035` | [Connected](#connected) | Engineering | Accepted |
| `DICT-036` | [Scaffold](#scaffold) | Engineering | Accepted |
| `DICT-037` | [Field Validated](#field-validated) | Core | Accepted |
| `DICT-038` | [Tenant](#tenant) | Operational | Accepted |
| `DICT-039` | [Dish](#dish) | Operational | Accepted |
| `DICT-040` | [Weekly Menu](#weekly-menu) | Operational | Accepted |
| `DICT-041` | [Draft Order](#draft-order) | Operational | Accepted |
| `DICT-042` | [Confirm Order](#confirm-order) | Operational | Accepted |
| `DICT-043` | [Recipe](#recipe) | Operational | Accepted |
| `DICT-044` | [Production](#production) | Operational | Accepted |
| `DICT-045` | [Customer Application](#customer-application) | Core | Accepted |
| `DICT-046` | [YourMeal OS (Corporate Surface)](#yourmeal-os-corporate-surface) | Core | Accepted |
| `DICT-047` | [BrandConfig](#brandconfig) | Engineering | Accepted |
| `DICT-048` | [Tenant-Branded](#tenant-branded) | Core | Accepted |
| `DICT-049` | [Powered by YourMeal OS](#powered-by-yourmeal-os) | Core | Accepted |
| `DICT-050` | [Platform owns capability / Tenant owns experience](#platform-owns-capability--tenant-owns-experience) | Core | Accepted |
| `DICT-051` | [Tenant Experience Spec](#tenant-experience-spec) | Operational | Accepted |
| `DICT-052` | [Tenant Assets](#tenant-assets) | Engineering | Accepted |
| `DICT-053` | [Experience First](#experience-first) | Core | Accepted |
| `DICT-054` | [Customer Journey](#customer-journey) | Operational | Accepted |
| `DICT-055` | [Experience Domain](#experience-domain) | Core | Accepted |
| `DICT-056` | [Screen (SCR)](#screen-scr) | Engineering | Accepted |
| `DICT-057` | [Knowledge Lifetime](#knowledge-lifetime) | Core | Accepted |

---

## Índice por categoría

### Metodología

[FOPEBA](#fopeba) (`DICT-001`) · [FOV](#fov) (`DICT-002`) · [IOV](#iov) (`DICT-003`) · [Knowledge Update](#knowledge-update) (`DICT-004`) · [Gate](#gate) (`DICT-005`) · [Evidence](#evidence) (`DICT-006`) · [Knowledge Leakage](#knowledge-leakage) (`DICT-007`) · [Operational Model](#operational-model) (`DICT-008`) · [Table Validation](#table-validation) (`DICT-009`) · [Field Validation](#field-validation) (`DICT-010`) · [Knowledge Lifetime](#knowledge-lifetime) (`DICT-057`)

### Ingeniería

[Capability](#capability) (`DICT-011`) · [Repository](#repository) (`DICT-012`) · [Mutation Pattern](#mutation-pattern) (`DICT-013`) · [Read Pattern](#read-pattern) (`DICT-014`) · [Happy Path](#happy-path) (`DICT-015`) · [ORR](#orr) (`DICT-016`) · [Smoke Test](#smoke-test) (`DICT-017`) · [Engineering Baseline](#engineering-baseline) (`DICT-018`) · [Hardening Sprint](#hardening-sprint) (`DICT-019`)

### Gobernanza

[ADR](#adr) (`DICT-020`) · [Current Phase](#current-phase) (`DICT-021`) · [Milestone](#milestone) (`DICT-022`) · [Integration Release](#integration-release) (`DICT-023`) · [Evidence Gate](#evidence-gate) (`DICT-024`) · [Frozen](#frozen) (`DICT-025`) · [Foundation Lock](#foundation-lock) (`DICT-026`) · [Project Dictionary](#project-dictionary) (`DICT-027`)

### Dominios de trabajo

[Knowledge Engineering](#knowledge-engineering) (`DICT-028`) · [Software Engineering](#software-engineering) (`DICT-029`) · [Operational Engineering](#operational-engineering) (`DICT-030`)

### Estado

[Ready for CAP-006](#ready-for-cap-006) (`DICT-031`) · [Ready for ORR](#ready-for-orr) (`DICT-032`) · [Ready for FOV](#ready-for-fov) (`DICT-033`) · [Operational](#operational) (`DICT-034`) · [Connected](#connected) (`DICT-035`) · [Scaffold](#scaffold) (`DICT-036`) · [Field Validated](#field-validated) (`DICT-037`)

### Producto (núcleo HP-001)

[Tenant](#tenant) (`DICT-038`) · [Dish](#dish) (`DICT-039`) · [Weekly Menu](#weekly-menu) (`DICT-040`) · [Draft Order](#draft-order) (`DICT-041`) · [Confirm Order](#confirm-order) (`DICT-042`) · [Recipe](#recipe) (`DICT-043`) · [Production](#production) (`DICT-044`)

### Identidad SaaS (ADR 0014)

[Customer Application](#customer-application) (`DICT-045`) · [YourMeal OS (Corporate Surface)](#yourmeal-os-corporate-surface) (`DICT-046`) · [BrandConfig](#brandconfig) (`DICT-047`) · [Tenant-Branded](#tenant-branded) (`DICT-048`) · [Powered by YourMeal OS](#powered-by-yourmeal-os) (`DICT-049`) · [Platform owns capability / Tenant owns experience](#platform-owns-capability--tenant-owns-experience) (`DICT-050`) · [Tenant Experience Spec](#tenant-experience-spec) (`DICT-051`) · [Tenant Assets](#tenant-assets) (`DICT-052`) · [Experience First](#experience-first) (`DICT-053`) · [Customer Journey](#customer-journey) (`DICT-054`) · [Experience Domain](#experience-domain) (`DICT-055`) · [Screen (SCR)](#screen-scr) (`DICT-056`) · [Knowledge Lifetime](#knowledge-lifetime) (`DICT-057`)

---

# Metodología

# FOPEBA

## ID
DICT-001

## Status
Accepted

## Madurez
Core

## Nombre
Framework for Operational Product Engineering by Evidence-Based Analysis

## Tipo
Metodología / Framework

## Definición
Método por el cual el conocimiento operacional certificado se materializa en software y se valida en campo mediante evidencia, no por opinión ni por acumulación de features.

## Cuándo ocurre
Ciclo continuo: Observation → Discovery → Model → Validation → IOV → Skeleton → Connected Capabilities → ORR → FOV → Knowledge Update → Gate.

## Produce
Conocimiento verificable · software alineado al OM · evidencia de campo · Knowledge Updates.

## No significa
Un generador de pantallas · un ERP genérico · “metodología ágil” genérica.

## Sinónimos
FOPEBA · Framework operacional por evidencia

## Palabras relacionadas
Operational Model · FOV · Gate · Evidence · Knowledge Update

## Referencias
`docs/18-operational-validation/00-operational-product-engineering.md` · ADR 0013

---

# FOV

## ID
DICT-002

## Status
Accepted

## Madurez
Core

## Nombre
Field Operational Validation

## Tipo
Fase de observación (Carril A)

## Definición
Observación del sistema y del cliente en operación real, sin intervenir el modelo ni “enseñar” el producto. Recoge evidencia; no decide cambios.

## Cuándo ocurre
Tras **ORR PASSED**. Phase 3.

## Produce
Evidencias de campo · hipótesis confirmadas/refutadas · candidatos a Knowledge Update (sin aprobar).

## No significa
QA de bugs · UAT comercial · permiso para editar el OM en caliente.

## Sinónimos
FOV · Field Validation (cuando el contexto es campo)

## Palabras relacionadas
ORR · Gate · Evidence · Knowledge Leakage · FOV-001

## Referencias
`docs/30-field-validation/` · `docs/00-status/FOV_MISSION_BRIEF.md` · ORR.md

---

# IOV

## ID
DICT-003

## Status
Accepted

## Madurez
Core

## Nombre
Independent Operational Validation

## Tipo
Fase de validación de transferencia

## Definición
Validación de que el conocimiento operacional es transferible e independiente del contexto inmediato de un solo cliente/mesa.

## Cuándo ocurre
Tras validación operacional de mesa / antes o en paralelo al camino a FOV según campaña.

## Produce
Findings · transferibilidad · pirámide de validación de conocimiento.

## No significa
FOV · ORR.

## Sinónimos
IOV · Independent Operational Validation

## Palabras relacionadas
Table Validation · Field Validation · FOPEBA

## Referencias
`docs/19-independent-operational-validation/`

---

# Knowledge Update

## ID
DICT-004

## Status
Accepted

## Madurez
Core

## Nombre
Knowledge Update

## Tipo
Artefacto de cambio de conocimiento

## Definición
Propuesta fundamentada en evidencia de campo para modificar el Operational Model u otras fuentes de verdad del conocimiento. Se aprueba en el **Gate**, no durante la FOV.

## Cuándo ocurre
Tras FOV (o hallazgo Carril A). Candidatos se listan en FOV; decisión en Gate.

## Produce
KUR / cambio de OM (si el Gate aprueba) · o rechazo documentado.

## No significa
Hotfix en producción · parche de UI “porque lo vimos”.

## Sinónimos
KU · Knowledge Update · KUR (request)

## Palabras relacionadas
Gate · FOV · Evidence · Operational Model

## Referencias
`docs/20-evidence-framework/ku/` · FOV-001

---

# Gate

## ID
DICT-005

## Status
Accepted

## Madurez
Core

## Nombre
Gate (decisión post-evidencia)

## Tipo
Puerta de decisión

## Definición
Momento formal en el que, a partir de evidencia, se decide si el conocimiento o el producto deben cambiar. **La FOV produce evidencia; el Gate decide cambios.**

## Cuándo ocurre
Tras FOV (p. ej. G-01) · también ORR es una puerta binaria previa a FOV.

## Produce
Aprobación / rechazo de KU · siguiente ciclo · o mantenimiento del modelo.

## No significa
Daily standup · merge de PR.

## Sinónimos
Gate · G-01 (instancia de campaña)

## Palabras relacionadas
FOV · Knowledge Update · Evidence · ORR

## Referencias
`docs/20-evidence-framework/g01/` · ENGINEERING_PHASE.md

---

# Evidence

## ID
DICT-006

## Status
Accepted

## Madurez
Core

## Nombre
Evidence (evidencia)

## Tipo
Artefacto epistémico

## Definición
Hecho verificable (técnico o de campo) que sustenta una afirmación sobre el sistema o el conocimiento operacional. Sin evidencia, no hay ORR PASSED ni KU válido.

## Cuándo ocurre
Smoke / ORR (evidencia técnica) · FOV (evidencia operacional).

## Produce
Logs · actas · FO-V / FO-E / FO-C · checklists firmados.

## No significa
Opinión · “parece que funciona” · capturas sin contexto.

## Sinónimos
Evidencia · Field Evidence · Technical Evidence

## Palabras relacionadas
Smoke Test · ORR · FOV · Evidence Gate

## Referencias
SMOKE_HP-001.md · ORR.md · `docs/20-evidence-framework/`

---

# Knowledge Leakage

## ID
DICT-007

## Status
Accepted

## Madurez
Core

## Nombre
Knowledge Leakage

## Tipo
Hallazgo operacional

## Definición
Reglas, decisiones o prácticas tácitas que la operación usa y que **no** están modeladas en el Operational Model. Se detectan en FOV; no se “parchean” en silencio.

## Cuándo ocurre
Durante FOV / observación de campo.

## Produce
Candidato a Knowledge Update · o registro de limitación conocida.

## No significa
Bug de UI · deuda técnica de código.

## Sinónimos
Knowledge Leakage · fuga de conocimiento operacional

## Palabras relacionadas
FOV · Operational Model · Knowledge Update · Gate

## Referencias
FOV-001 · FOV Mission Brief

---

# Operational Model

## ID
DICT-008

## Status
Accepted

## Madurez
Core

## Nombre
Operational Model (OM)

## Tipo
Fuente de verdad del conocimiento operacional

## Definición
Modelo certificado de cómo opera el negocio (objetos, lifecycles, invariantes, capacidades). El software lo materializa; no lo inventa.

## Cuándo ocurre
Tras Discovery / Validation · vive en `docs/17`.

## Produce
Contrato para Capabilities · criterio de ORR (“¿coincide con el OM?”).

## No significa
Wireframe · schema SQL · backlog de features.

## Sinónimos
OM · Operational Model · Core Operativo (contexto)

## Palabras relacionadas
FOPEBA · Capability · Knowledge Update · Table Validation

## Referencias
`docs/17-operational-model/` · ADR 0013

---

# Table Validation

## ID
DICT-009

## Status
Accepted

## Madurez
Core

## Nombre
Table Validation

## Tipo
Estado de madurez del conocimiento

## Definición
El conocimiento operacional ha sido validado en mesa / escenarios controlados, **aún no** en campo con cliente real.

## Cuándo ocurre
Post–Operational Validation · pre–FOV.

## Produce
Estado Table-Validated (p. ej. OM EatClean).

## No significa
Field Validated · ORR PASSED.

## Sinónimos
Table-Validated · validación de mesa

## Palabras relacionadas
Field Validation · IOV · FOV

## Referencias
`docs/00-status/` · `docs/18-operational-validation/`

---

# Field Validation

## ID
DICT-010

## Status
Accepted

## Madurez
Core

## Nombre
Field Validation

## Tipo
Estado de madurez del conocimiento / módulo

## Definición
El conocimiento o el módulo ha sido validado con evidencia de operación real (FOV). Nivel superior a Operational en la escala de módulo cuando aplica Field Validated.

## Cuándo ocurre
Tras FOV + Gate según criterios.

## Produce
Field Validated · evidencia de campaña.

## No significa
“Hay usuarios en staging”.

## Sinónimos
Field-Validated · Field Validation

## Palabras relacionadas
FOV · Table Validation · MODULE_STATE_CRITERIA

## Referencias
MODULE_STATE_CRITERIA.md · FOV-001

---

# Ingeniería

# Capability

## ID
DICT-011

## Status
Accepted

## Madurez
Engineering

## Nombre
Capability

## Tipo
Unidad de materialización

## Definición
Capacidad operacional certificada conectada al software en un PR de un solo nivel (p. ej. CAP-004 Order Programming). Una Capability por tarea.

## Cuándo ocurre
Etapa 2 Connection / Workflow (CAP-001…007+).

## Produce
Código + doc CAP · avance Scaffold → Connected → Operational.

## No significa
Pantalla · epic · “feature request”.

## Sinónimos
CAP · CAP-00x

## Palabras relacionadas
Read Pattern · Mutation Pattern · Happy Path · PR Change Levels

## Referencias
`docs/22-implementation/caps/` · PR_CHANGE_LEVELS.md

---

# Repository

## ID
DICT-012

## Status
Accepted

## Madurez
Engineering

## Nombre
Repository

## Tipo
Capa de persistencia

## Definición
Puerto de acceso a datos (Supabase). Sin reglas de negocio: esas viven en Service / dominio.

## Cuándo ocurre
En cada Capability Connected.

## Produce
Lecturas/escrituras tipadas · inputs a Queries/Commands.

## No significa
Service · Use Case · UI hook.

## Sinónimos
Repo · *Repository (p. ej. OrderRepository)

## Palabras relacionadas
Read Pattern · Mutation Pattern · Service

## Referencias
`docs/13-repositories/` · CAPABILITY_CONNECTION_PATTERN.md

---

# Mutation Pattern

## ID
DICT-013

## Status
Accepted

## Madurez
Engineering

## Nombre
Mutation Pattern

## Tipo
Patrón de implementación

## Definición
Cadena oficial de escritura: UI → Command → Service → Repository → Supabase → audit_log → invalidate → UI.

## Cuándo ocurre
Desde CAP-004 (mutaciones de pedido) en adelante.

## Produce
Mutaciones auditables e invalidación de caché coherente.

## No significa
`supabase.from().insert` directo desde la UI.

## Sinónimos
Mutation Pattern · patrón de mutación

## Palabras relacionadas
Read Pattern · Audit · ORR · CAP-004 · CAP-006

## Referencias
MUTATION_PATTERN.md

---

# Read Pattern

## ID
DICT-014

## Status
Accepted

## Madurez
Engineering

## Nombre
Read Pattern

## Tipo
Patrón de implementación

## Definición
Cadena oficial de lectura: Operational Model → Repository → TanStack Query → Hook → UI.

## Cuándo ocurre
CAP-002 / CAP-003 / CAP-005 (lecturas).

## Produce
Datos reales en UI sin mocks en el flujo Connected.

## No significa
Fetch ad hoc en componentes.

## Sinónimos
Read Pattern · Capability Connection Pattern (lectura)

## Palabras relacionadas
Mutation Pattern · Repository · Hook

## Referencias
CAPABILITY_CONNECTION_PATTERN.md

---

# Happy Path

## ID
DICT-015

## Status
Accepted

## Madurez
Engineering

## Nombre
Happy Path

## Tipo
Recorrido operacional E2E

## Definición
Secuencia mínima de Capabilities que materializa un resultado operativo real (p. ej. HP-001: Login → Dish → Menu → Program → Summary → Confirm).

## Cuándo ocurre
Diseño en HAPPY_PATHS · verificación en Smoke · autorización en ORR · observación en FOV.

## Produce
HP-001 Operational (tras smoke + ORR) · evidencia FOV.

## No significa
Cobertura funcional completa del módulo · “todas las pantallas”.

## Sinónimos
HP · HP-001 · Happy Path E2E

## Palabras relacionadas
Smoke Test · ORR · FOV · Capability

## Referencias
HAPPY_PATHS.md · SMOKE_HP-001.md

---

# ORR

## ID
DICT-016

## Status
Accepted

## Madurez
Core

## Nombre
Operational Readiness Review

## Tipo
Gate (puerta binaria)

## Definición
Existe evidencia suficiente para afirmar que un Happy Path puede ejecutarse en operación real y que cualquier aprendizaje posterior provendrá de la observación del sistema, no de incertidumbres conocidas en su implementación.

## Cuándo ocurre
Después del Smoke. Antes de FOV.

## Produce
`PASSED` o `BLOCKED` (sin estados intermedios).

## No significa
Producto terminado · software perfecto · Operational Model definitivo · revisión de código (eso fue Hardening).

## Sinónimos
ORR · Operational Readiness Review

## Palabras relacionadas
Smoke Test · FOV · HP-001 · Evidence Gate · Ready for FOV

## Referencias
`docs/22-implementation/ORR.md` · CURRENT_PHASE.md · ORR_HP-001.md

---

# Smoke Test

## ID
DICT-017

## Status
Accepted

## Madurez
Engineering

## Nombre
Smoke Test (HP-001)

## Tipo
Demostración / evidencia técnica

## Definición
Ejecución extremo a extremo del Happy Path con datos reales (sin mocks en flujo live) para producir evidencia previa a la ORR.

## Cuándo ocurre
Tras merge Hardening + migración aplicada. Antes de ORR.

## Produce
Checklist firmado (ok / parcial / fallo) · insumos de ORR.

## No significa
FOV · suite unitaria · “probar en local con mocks”.

## Sinónimos
Smoke · Smoke HP-001

## Palabras relacionadas
ORR · Happy Path · Evidence · Migration

## Referencias
SMOKE_HP-001.md

---

# Engineering Baseline

## ID
DICT-018

## Status
Accepted

## Madurez
Engineering

## Nombre
Engineering Baseline

## Tipo
Tag / punto de restauración

## Definición
Snapshot del tronco tras Integration Release (IR-001): metodología cerrada, skeleton, patrones, CAP conectadas, gobernanza. Tag: `v0.2.0-engineering-baseline`.

## Cuándo ocurre
Tras IR-001 en `main`.

## Produce
Punto de comparación para evolución post-FOV.

## No significa
Release a clientes · “done”.

## Sinónimos
Engineering Baseline · v0.2.0-engineering-baseline · v0.2.0-pre-pilot (alias conceptual)

## Palabras relacionadas
Integration Release · IR-001 · Hardening Sprint

## Referencias
IR-001_FIRST_ENGINEERING_INTEGRATION.md · ENGINEERING_PHASE.md

---

# Hardening Sprint

## ID
DICT-019

## Status
Accepted

## Madurez
Engineering

## Nombre
Hardening Sprint / Engineering Hardening

## Tipo
Sprint de integridad (no Capability)

## Definición
Ciclo que cierra hallazgos P1 de auditoría (Integrity + Completeness) sin UX/OM/Capabilities nuevas, para elevar el repo hacia Ready for ORR.

## Cuándo ocurre
Tras IR-001 · PR #23.

## Produce
P1 cerrados · migración atómica · gates de flags · empty states live.

## No significa
Feature sprint · rediseño · CAP-007.

## Sinónimos
Hardening · Engineering Fix Sprint · Engineering Hardening Sprint

## Palabras relacionadas
ORR · Evidence Gate · Engineering Baseline

## Referencias
ENGINEERING_REVIEW_SPRINT0.md · PR #23

---

# Gobernanza

# ADR

## ID
DICT-020

## Status
Accepted

## Madurez
Core

## Nombre
Architecture Decision Record

## Tipo
Artefacto de decisión

## Definición
Registro inmutable del *porqué* de una decisión arquitectónica. Tras Foundation Lock, cambio arquitectónico = ADR.

## Cuándo ocurre
Antes/al tomar decisión estructural.

## Produce
ADR numerado en `docs/adr/`.

## No significa
Ticket · comentario en PR.

## Sinónimos
ADR · Architecture Decision Record

## Palabras relacionadas
Foundation Lock · Frozen

## Referencias
`docs/adr/`

---

# Current Phase

## ID
DICT-021

## Status
Accepted

## Madurez
Engineering

## Nombre
Current Phase

## Tipo
Tablero de estado vivo

## Definición
Documento que indica en qué punto está el proyecto *ahora* (fase, puertas, objetivo). No sustituye MILESTONES.

## Cuándo ocurre
Actualización continua en Evidence Gate / fases.

## Produce
Orientación inmediata para humanos y agentes.

## No significa
Historia inmutable · backlog.

## Sinónimos
CURRENT_PHASE · Project State board

## Palabras relacionadas
Milestone · Evidence Gate · ENGINEERING_PHASE

## Referencias
`docs/00-status/CURRENT_PHASE.md`

---

# Milestone

## ID
DICT-022

## Status
Accepted

## Madurez
Engineering

## Nombre
Milestone

## Tipo
Hito histórico

## Definición
Entrada inmutable en MILESTONES: hechos consumados (IR-001, Methodology Closed, etc.). Solo se añaden filas; no se reescriben.

## Cuándo ocurre
Al completar un hito objetivo.

## Produce
Memoria del proyecto.

## No significa
Sprint goal · Current Phase.

## Sinónimos
Milestone · hito

## Palabras relacionadas
Integration Release · MILESTONES.md

## Referencias
`docs/00-status/MILESTONES.md`

---

# Integration Release

## ID
DICT-023

## Status
Accepted

## Madurez
Engineering

## Nombre
Integration Release (IR)

## Tipo
Hito de integración

## Definición
Momento en que una pila de trabajo deja de vivir solo en ramas y pasa al tronco (`main`). IR-001 = First Engineering Integration (stack CAP → main).

## Cuándo ocurre
Cuando la pila está mergeable y se aterriza en trunk.

## Produce
IR-00x · a menudo un tag baseline.

## No significa
Capability · ORR PASSED.

## Sinónimos
IR · IR-001 · Integration Release

## Palabras relacionadas
Engineering Baseline · Milestone · main

## Referencias
IR-001_FIRST_ENGINEERING_INTEGRATION.md

---

# Evidence Gate

## ID
DICT-024

## Status
Accepted

## Madurez
Core

## Nombre
Evidence Gate

## Tipo
Régimen de gobernanza

## Definición
Fase en la que el progreso se mide por evidencia (merge, migración, smoke, ORR), no por nuevas features. Incluye **congelación funcional** hasta que ORR emita resultado.

## Cuándo ocurre
Tras Engineering Phase complete · pre-ORR / pre-FOV.

## Produce
Disciplina de commits · ORR con validez.

## No significa
Bloqueo total de docs · freeze de metodología (ya frozen).

## Sinónimos
Evidence Gate · Congelación funcional (regla asociada)

## Palabras relacionadas
ORR · Smoke Test · Hardening Sprint

## Referencias
CURRENT_PHASE.md · ENGINEERING_PHASE.md · AGENTS.md

---

# Frozen

## ID
DICT-025

## Status
Accepted

## Madurez
Core

## Nombre
Frozen

## Tipo
Estado de gobernanza

## Definición
Artefacto o metodología cerrada a cambios (p. ej. FOPEBA Frozen, Methodology Construction Closed). Solo se reabre con proceso explícito (Carril A / Gate).

## Cuándo ocurre
Tras actas de cierre.

## Produce
Estabilidad del lenguaje y del OM.

## No significa
Código congelado para siempre.

## Sinónimos
Frozen · Methodology Frozen · FOPEBA Frozen

## Palabras relacionadas
Foundation Lock · Acta · Gate

## Referencias
`docs/00-status/04-methodology-frozen.md` · ACTA_METHODOLOGY_CONSTRUCTION_CLOSED.md

---

# Foundation Lock

## ID
DICT-026

## Status
Accepted

## Madurez
Core

## Nombre
Foundation Lock

## Tipo
Hito / constitución técnica

## Definición
Cierre de la constitución de arquitectura (v0.1.0). Tras él, cambios arquitectónicos requieren ADR.

## Cuándo ocurre
Histórico · ya cerrado.

## Produce
FOUNDATION_LOCK · reglas permanentes de ingeniería.

## No significa
Producto listo para FOV.

## Sinónimos
Foundation Lock · v0.1.0 foundation

## Palabras relacionadas
ADR · Frozen · FOUNDATION.md

## Referencias
`docs/05-architecture/FOUNDATION_LOCK.md`

---

# Project Dictionary

## ID
DICT-027

## Status
Accepted

## Madurez
Core

## Nombre
Project Dictionary

## Tipo
Fuente oficial de significado

## Definición
Este documento. Ningún término del proyecto/FOPEBA es oficial hasta figurar aquí.

## Cuándo ocurre
Cada vez que se acepta un concepto nuevo.

## Produce
Consistencia de lenguaje humano ↔ IA ↔ docs.

## No significa
Ubiquitous Language de dominio culinario (complementario).

## Sinónimos
PROJECT_DICTIONARY · diccionario oficial del proyecto

## Palabras relacionadas
ADR · Current Phase · Ubiquitous Language

## Referencias
Este archivo · AGENTS.md

---

# Dominios de trabajo

# Knowledge Engineering

## ID
DICT-028

## Status
Accepted

## Madurez
Core

## Nombre
Knowledge Engineering

## Tipo
Dominio de trabajo

## Definición
Construcción y cierre del conocimiento: FOPEBA, OM, validaciones, gobernanza metodológica.

## Cuándo ocurre
Etapa 1 / cierre metodológico — **cerrado**.

## Produce
OM Table-Validated · FOPEBA Frozen · ADRs de conocimiento.

## No significa
Escribir CAP código.

## Sinónimos
Knowledge Engineering

## Palabras relacionadas
Software Engineering · Operational Engineering · FOPEBA

## Referencias
ENGINEERING_PHASE.md · CURRENT_PHASE.md

---

# Software Engineering

## ID
DICT-029

## Status
Accepted

## Madurez
Engineering

## Nombre
Software Engineering

## Tipo
Dominio de trabajo

## Definición
Materialización del OM en código (Capabilities, patrones, Hardening, baseline).

## Cuándo ocurre
Etapa 2 — **implementación completa**; integración final #23 pendiente.

## Produce
Código · tests · IR · Hardening.

## No significa
FOV · evidencia de campo.

## Sinónimos
Software Engineering · Engineering Phase

## Palabras relacionadas
Knowledge Engineering · Operational Engineering · Capability

## Referencias
ENGINEERING_PHASE.md

---

# Operational Engineering

## ID
DICT-030

## Status
Accepted

## Madurez
Core

## Nombre
Operational Engineering

## Tipo
Dominio de trabajo

## Definición
Disciplina post-ORR: observar operación real, recoger evidencia, proponer KU, decidir en Gate.

## Cuándo ocurre
Tras ORR PASSED — **aún no comienza**.

## Produce
FOV · Evidence · Gate decisions.

## No significa
Seguir midiendo éxito por número de PRs.

## Sinónimos
Operational Engineering

## Palabras relacionadas
FOV · Gate · Field Evidence

## Referencias
ENGINEERING_PHASE.md · `docs/30-field-validation/`

---

# Estado

# Ready for CAP-006

## ID
DICT-031

## Status
Accepted

## Madurez
Engineering

## Nombre
Ready for CAP-006

## Tipo
Puerta / estado

## Definición
No hay P0 de arquitectura que impida implementar Confirm; CAP-006 es implementable.

## Cuándo ocurre
Post–auditoría Sprint 0 (ya superado: CAP-006 implementado).

## Produce
Autorización a implementar Confirm (histórica).

## No significa
Ready for ORR · Ready for FOV.

## Sinónimos
Ready for CAP-006

## Palabras relacionadas
CAP-006 · Ready for ORR

## Referencias
ENGINEERING_REVIEW_SPRINT0.md

---

# Ready for ORR

## ID
DICT-032

## Status
Accepted

## Madurez
Engineering

## Nombre
Ready for ORR

## Tipo
Puerta / estado

## Definición
P1 cerrados + Hardening integrado + migración + smoke listo para revisión ORR (evidencia, no código nuevo).

## Cuándo ocurre
Tras Evidence Gate completo.

## Produce
Entrada a sesión ORR.

## No significa
ORR PASSED.

## Sinónimos
Ready for ORR

## Palabras relacionadas
ORR · Smoke Test · Hardening Sprint

## Referencias
CURRENT_PHASE.md · ORR.md

---

# Ready for FOV

## ID
DICT-033

## Status
Accepted

## Madurez
Core

## Nombre
Ready for FOV

## Tipo
Puerta / estado

## Definición
Autorización a observación de campo. **Solo** tras ORR **PASSED**.

## Cuándo ocurre
Inmediatamente después de ORR PASSED.

## Produce
Apertura de FOV-001 / Phase 3.

## No significa
Producto terminado · Field Validated automático.

## Sinónimos
Ready for FOV

## Palabras relacionadas
ORR · FOV · HP-001 Operational

## Referencias
ORR.md · CURRENT_PHASE.md

---

# Operational

## ID
DICT-034

## Status
Accepted

## Madurez
Engineering

## Nombre
Operational (estado de módulo / Capability)

## Tipo
Estado MODULE_STATE

## Definición
Nivel en el que la Capability/módulo ejecuta el flujo real con audit, sin mocks en el recorrido, listo para verificación operacional (criterios en MODULE_STATE_CRITERIA).

## Cuándo ocurre
Tras Connected + mutaciones/auditoría según criterios · CAP-006 marcado Operational en código; demostración vía Smoke/ORR.

## Produce
Candidato a HP Operational / ORR.

## No significa
Field Validated · “feature complete”.

## Sinónimos
Operational · ▓▓▓░

## Palabras relacionadas
Connected · Scaffold · Field Validated · ORR

## Referencias
MODULE_STATE_CRITERIA.md

---

# Connected

## ID
DICT-035

## Status
Accepted

## Madurez
Engineering

## Nombre
Connected

## Tipo
Estado MODULE_STATE

## Definición
UI conectada a infraestructura real (Supabase, auth, i18n, useFmt, audit, featureFlagService). Lectura/escritura real; lógica de negocio puede estar incompleta.

## Cuándo ocurre
Tras Scaffold · CAP-002…005 tipicamente.

## Produce
Datos reales en el flujo de esa Capability.

## No significa
Operational · sin P1.

## Sinónimos
Connected · ▓▓░░

## Palabras relacionadas
Scaffold · Operational · Capability

## Referencias
MODULE_STATE_CRITERIA.md

---

# Scaffold

## ID
DICT-036

## Status
Accepted

## Madurez
Engineering

## Nombre
Scaffold

## Tipo
Estado MODULE_STATE

## Definición
Estructura UX/código presente; datos o flujo aún mock / incompletos.

## Cuándo ocurre
Inicio de módulo o CAP (p. ej. CAP-007 History).

## Produce
Base para Connection.

## No significa
Listo para ORR.

## Sinónimos
Scaffold · ▓░░░

## Palabras relacionadas
Connected · Product Skeleton

## Referencias
MODULE_STATE_CRITERIA.md

---

# Field Validated

## ID
DICT-037

## Status
Accepted

## Madurez
Core

## Nombre
Field Validated

## Tipo
Estado MODULE_STATE

## Definición
Máximo nivel de módulo: validado con evidencia de campo (FOV + Gate según criterios).

## Cuándo ocurre
Post–FOV exitoso según campaña.

## Produce
▓▓▓▓ en MODULE_STATE.

## No significa
ORR PASSED (ORR es puerta previa, no este estado).

## Sinónimos
Field Validated · ▓▓▓▓

## Palabras relacionadas
FOV · Field Validation · Operational

## Referencias
MODULE_STATE_CRITERIA.md

---

# Producto (núcleo HP-001)

# Tenant

## ID
DICT-038

## Status
Accepted

## Madurez
Operational

## Nombre
Tenant

## Tipo
Objeto multi-organización

## Definición
Unidad de aislamiento (organización). Todo dato de negocio es tenant-scoped; RLS + membership.

## Cuándo ocurre
Auth / CAP-001.

## Produce
`tenantId` en contexto de servicio.

## No significa
Usuario · customer profile.

## Sinónimos
Tenant · Organización (contexto EatClean)

## Palabras relacionadas
Customer · RLS · CAP-001 · BrandConfig · Customer Application

## Referencias
OM · auth hooks · ADR 0014

---

# Dish

## ID
DICT-039

## Status
Accepted

## Madurez
Operational

## Nombre
Dish

## Tipo
Core Object

## Definición
Plato del catálogo operacional. Lectura Connected en CAP-002.

## Cuándo ocurre
Menú / programación / producción.

## Produce
Catálogo real · oferta de Weekly Menu.

## No significa
Recipe (relación distinta en dominio).

## Sinónimos
Dish · Plato

## Palabras relacionadas
Weekly Menu · Recipe · CAP-002

## Referencias
`docs/12-domain-model/module-01/Dish.md` · CAP-002

---

# Weekly Menu

## ID
DICT-040

## Status
Accepted

## Madurez
Operational

## Nombre
Weekly Menu

## Tipo
Core Object

## Definición
Oferta published de platos por días de una semana. Lectura CAP-003.

## Cuándo ocurre
Antes de programar pedido.

## Produce
Slots por `day_date` · constraint de oferta para Draft.

## No significa
Draft Order.

## Sinónimos
Weekly Menu · Menú semanal

## Palabras relacionadas
Dish · Draft Order · CAP-003

## Referencias
CAP-003 · OM Weekly Menu

---

# Draft Order

## ID
DICT-041

## Status
Accepted

## Madurez
Operational

## Nombre
Draft Order

## Tipo
Estado de Order / acción

## Definición
Pedido en estado `draft`, creado por programación (CAP-004) con items y total servidor; aún no confirmed.

## Cuándo ocurre
Tras Program Order · antes de Confirm.

## Produce
Fila `orders` + `order_items` · audit `create`.

## No significa
Confirmed · carrito UI efímero sin persistir.

## Sinónimos
Draft · program Draft · Order Programming

## Palabras relacionadas
Confirm Order · Mutation Pattern · CAP-004

## Referencias
CAP-004 · MUTATION_PATTERN.md

---

# Confirm Order

## ID
DICT-042

## Status
Accepted

## Madurez
Operational

## Nombre
Confirm Order

## Tipo
Transición de lifecycle

## Definición
Transición Draft → Confirmed (CAP-006): persist · audit `status_change` · invalidate.

## Cuándo ocurre
Desde summary cuando status = draft.

## Produce
Order confirmed · cierre técnico de HP-001.

## No significa
Entrega · producción · pago.

## Sinónimos
Confirm · CAP-006 · Draft→Confirmed

## Palabras relacionadas
Draft Order · ORR · HP-001

## Referencias
CAP-006 · spine-transitions OM

---

# Recipe

## ID
DICT-043

## Status
Accepted

## Madurez
Operational

## Nombre
Recipe

## Tipo
Core Object

## Definición
Fórmula / composición del plato en dominio (ingredientes, rendimientos). Parte del Core; no es el foco de HP-001 customer path.

## Cuándo ocurre
Cocina / producción / costeo (fases posteriores al Happy Path customer).

## Produce
Conocimiento de elaboración.

## No significa
Dish (el plato ofrecido al customer).

## Sinónimos
Recipe · Receta

## Palabras relacionadas
Dish · Ingredient · Production

## Referencias
`docs/12-domain-model/module-01/Recipe.md`

---

# Production

## ID
DICT-044

## Status
Accepted

## Madurez
Operational

## Nombre
Production

## Tipo
Área operacional / módulo futuro

## Definición
Planificación y ejecución de cocina/batch a partir de pedidos confirmados. Fuera del Happy Path HP-001 customer.

## Cuándo ocurre
Post–HP-001 en roadmap de Capabilities.

## Produce
Órdenes de producción · no parte de ORR HP-001.

## No significa
Confirm Order.

## Sinónimos
Production · Planning / Batch (contexto)

## Palabras relacionadas
Confirm Order · Recipe · Operational Model

## Referencias
OM · IMPLEMENTATION_BACKLOG (posterior)

---

# Identidad SaaS (ADR 0014)

# Customer Application

## ID
DICT-045

## Status
Accepted

## Madurez
Core

## Nombre
Customer Application

## Tipo
Producto / superficie

## Definición
Aplicación utilizada por los **clientes finales** de cada Tenant. Pertenece al Tenant en identidad: el usuario no usa «YourMeal OS»; usa la marca del Tenant (p. ej. EatClean).

## Cuándo ocurre
Front office · auth de cliente · stores · emails al consumidor.

## Produce
Experiencia white-label continua con el sitio web del Tenant.

## No significa
SaaS corporativo YourMeal OS · back office operacional · consola `saas_admin`.

## Sinónimos
Customer App · Front office (cliente) · App del Tenant

## Palabras relacionadas
Tenant-Branded · BrandConfig · YourMeal OS (Corporate Surface) · Powered by YourMeal OS

## Referencias
ADR 0014 · [TENANT_BRANDING](../05-architecture/TENANT_BRANDING.md) · PM-001

---

# YourMeal OS (Corporate Surface)

## ID
DICT-046

## Status
Accepted

## Madurez
Core

## Nombre
YourMeal OS (Corporate Surface)

## Tipo
Producto / superficie del proveedor

## Definición
Superficie corporativa del SaaS (landing, docs, módulos, pricing, contacto, demo, soporte). Branding **YourMeal OS**. No es la marca principal de la Customer Application.

## Cuándo ocurre
Adquisición · onboarding de empresas · administración de plataforma.

## Produce
Identidad del proveedor del servicio / motor operativo.

## No significa
La app que ve el cliente final del Tenant.

## Sinónimos
Producto A · SaaS corporativo · plataforma YourMeal OS

## Palabras relacionadas
Customer Application · Powered by YourMeal OS · Tenant

## Referencias
ADR 0014 · [03-brand](../03-brand/README.md)

---

# BrandConfig

## ID
DICT-047

## Status
Accepted

## Madurez
Engineering

## Nombre
BrandConfig

## Tipo
Contrato / Capability transversal

## Definición
Configuración de branding del Tenant (nombre, logo, colores, tipografía, copy, store assets, splash, PoweredBy, …). Se resuelve dinámicamente y alimenta la Customer Application.

## Cuándo ocurre
Carga de sesión / dominio del Tenant · render de front office · emails · stores.

## Produce
Identidad visual y verbal inyectada en runtime.

## No significa
Design system fijo de EatClean en código · retoque cosmético sin contrato.

## Sinónimos
`tenants.brand` · Tenant brand JSON

## Palabras relacionadas
Tenant-Branded · Customer Application · Tenant

## Referencias
[TENANT_BRANDING](../05-architecture/TENANT_BRANDING.md) · ADR 0014

---

# Tenant-Branded

## ID
DICT-048

## Status
Accepted

## Madurez
Core

## Nombre
Tenant-Branded

## Tipo
Principio de arquitectura de producto

## Definición
Propiedad de la Customer Application: **100%** del branding visible pertenece al Tenant. YourMeal OS no es la marca principal frente al cliente final.

Principio: *The Platform owns the capability. The Tenant owns the experience.*

## Cuándo ocurre
Toda superficie de cliente (UI, auth, stores, emails al consumidor).

## Produce
Plataforma white-label multi-tenant escalable.

## No significa
Que el back office no exista · que YourMeal OS no pueda citarse como Powered by.

## Sinónimos
White-label (Customer App) · Tenant identity

## Palabras relacionadas
BrandConfig · Customer Application · Powered by YourMeal OS

## Referencias
ADR 0014

---

# Powered by YourMeal OS

## ID
DICT-049

## Status
Accepted

## Madurez
Core

## Nombre
Powered by YourMeal OS

## Tipo
Mención de plataforma

## Definición
Única forma admitida (o equivalente configurable) de mostrar YourMeal OS en la Customer Application. Nunca como marca principal.

## Cuándo ocurre
Footer / about / emails · si `BrandConfig.poweredBy.visible`.

## Produce
Atribución del motor operativo sin sustituir la identidad del Tenant.

## No significa
Bienvenida, título de app, store name o hero con marca YourMeal OS.

## Sinónimos
PoweredBy · atribución de plataforma

## Palabras relacionadas
BrandConfig · Customer Application · YourMeal OS (Corporate Surface)

## Referencias
ADR 0014 · [TENANT_BRANDING](../05-architecture/TENANT_BRANDING.md)

---

# Platform owns capability / Tenant owns experience

## ID
DICT-050

## Status
Accepted

## Madurez
Core

## Nombre
Platform owns capability / Tenant owns experience

## Tipo
Principio de arquitectura de producto

## Definición
La plataforma (YourMeal OS) es propietaria de las **capabilities** y del motor operativo. El Tenant es propietario de la **experiencia** (marca, copy, tono, presentación) frente a sus usuarios.

## Cuándo ocurre
Diseño de pantallas · BrandConfig · separación Producto A / Producto B · filtro «¿Plataforma o Tenant?».

## Produce
SaaS multi-tenant escalable sin confundir marca del proveedor con marca del cliente.

## No significa
Que el Tenant invente reglas operacionales · que la plataforma no pueda mostrar Powered by.

## Sinónimos
La plataforma es propietaria de la capacidad; el tenant es propietario de la experiencia

## Palabras relacionadas
Tenant-Branded · BrandConfig · Customer Application · Capability

## Referencias
ADR 0014

---

# Tenant Experience Spec

## ID
DICT-051

## Status
Accepted

## Madurez
Operational

## Nombre
Tenant Experience Spec

## Tipo
Especificación de experiencia / incremento de producto

## Definición
Documento que fija cómo la Customer Application hereda la **identidad, tono y lenguaje** de un Tenant concreto (primera instancia: EatClean), sin copiar la web literalmente y sin personalizar código por cliente.

Implica: login/home/nav/copy/fotos alineados al Tenant; back office solo vía RBAC; `BrandConfig` como única vía de personalización visual.

## Cuándo ocurre
Experience Refactor · onboarding de un Tenant nuevo · revisión Lovable/Cursor de superficies cliente.

## Produce
App que el usuario percibe como desarrollada por el Tenant.

## No significa
Fork del producto · cambios a HP-001 · inventar reglas del OM.

## Sinónimos
Experience Spec · Spec de identidad del Tenant

## Palabras relacionadas
BrandConfig · Tenant-Branded · Customer Application · Platform owns capability / Tenant owns experience

## Referencias
[TENANT_EXPERIENCE_SPEC](../05-architecture/TENANT_EXPERIENCE_SPEC.md) · ADR 0014

---

# Tenant Assets

## ID
DICT-052

## Status
Accepted

## Madurez
Engineering

## Nombre
Tenant Assets

## Tipo
Patrón de recursos / carpeta por Tenant

## Definición
Conjunto de recursos y configuración por Tenant (`tenants/<slug>/`: `brand.json`, `copy.*.json`, logo, splash, hero, onboarding, empty states) que alimentan `BrandConfig` y la Customer Application **sin** modificar el código fuente del producto.

## Cuándo ocurre
Onboarding de un Tenant · Experience Refactor · cambio de identidad visual.

## Produce
Experiencia white-label reutilizable (nuevo cliente = nuevos assets, no fork).

## No significa
Código específico por cliente · fork de la app · lógica de negocio en la carpeta de assets.

## Sinónimos
Tenant Resources · carpeta `tenants/`

## Palabras relacionadas
BrandConfig · Tenant Experience Spec · Tenant-Branded

## Referencias
[`tenants/`](../../tenants/README.md) · [TENANT_IMPLEMENTATION_EATCLEAN](../05-architecture/TENANT_IMPLEMENTATION_EATCLEAN.md) · ADR 0014

---


---

# Experience First

## ID
DICT-053

## Status
Accepted

## Madurez
Core

## Nombre
Experience First

## Tipo
Principio de diseño de producto

## Definición
Orden de diseño de la Customer Application: **Customer Journey → Screen → Capability**. La capability no cambia; la pantalla se diseña desde el recorrido del usuario, no desde la estructura interna del sistema.

Pregunta guía: ¿Mi madre podría hacer un pedido sin que nadie le explique la app?

## Cuándo ocurre
Experience Refactor · definición de pantallas MVP · auditoría de UX.

## Produce
Apps usables por clientes finales no técnicos.

## No significa
Ignorar capabilities · inventar reglas del OM · saltarse FOPEBA.

## Sinónimos
Journey-first · recorrido primero

## Palabras relacionadas
Customer Journey · Tenant Experience Spec · Capability

## Referencias
[07-experience](../07-experience/README.md) · [CUSTOMER_JOURNEYS](../07-experience/CUSTOMER_JOURNEYS.md)

---

# Customer Journey

## ID
DICT-054

## Status
Accepted

## Madurez
Operational

## Nombre
Customer Journey

## Tipo
Recorrido de experiencia / artefacto

## Definición
Secuencia de pasos que un cliente final atraviesa para completar un objetivo (p. ej. CJ-001 Pedido semanal). Complementa al Operational Model: el OM describe la operación; el Journey describe cómo la vive el usuario.

## Cuándo ocurre
Antes del Experience Refactor · diseño de pantallas · validación de usabilidad.

## Produce
Inventario de pantallas justificado · criterio de éxito emocional («en dos minutos…»).

## No significa
User flow técnico de rutas · Capability Roadmap · diagrama de módulos.

## Sinónimos
CJ-xxx · recorrido del cliente

## Palabras relacionadas
Experience First · CJ-001 · Tenant Experience Spec

## Referencias
[CUSTOMER_JOURNEYS](../07-experience/CUSTOMER_JOURNEYS.md)



---

# Experience Domain

## ID
DICT-055

## Status
Accepted

## Madurez
Core

## Nombre
Experience Domain

## Tipo
Dominio del proyecto

## Definición
Cuarto dominio de YourMeal OS junto a Knowledge, Engineering y Operations. Entregable: Customer Journeys + Screens. No es conocimiento ni implementación: es cómo el usuario final vive el producto (Tenant-Branded · Experience First).

## Cuándo ocurre
Diseño de Customer App · Experience Refactor · onboarding de Tenant.

## Produce
CJ-xxx · SCR-xxx · BrandConfig / Tenant Assets aplicados a pantallas.

## No significa
Operational Model · código de plataforma · evidencia de campo (Operations).

## Sinónimos
Dominio Experience · capa Experience

## Palabras relacionadas
Experience First · Customer Journey · Screen (SCR) · Tenant-Branded

## Referencias
[PROJECT_DOMAINS](../00-status/PROJECT_DOMAINS.md) · [07-experience](../07-experience/README.md)

---

# Screen (SCR)

## ID
DICT-056

## Status
Accepted

## Madurez
Engineering

## Nombre
Screen (SCR)

## Tipo
Artefacto de experiencia

## Definición
Pantalla de la Customer Application identificada como `SCR-xxx`. Debe pertenecer exactamente a un Customer Journey y puede trazar Capabilities, objetos del OM y Evidence.

Regla: ninguna pantalla existe por sí sola.

## Cuándo ocurre
Inventario MVP · Experience Refactor · auditoría de UX.

## Produce
UI justificada por un journey · trazabilidad Journey → Screen → Capability.

## No significa
Ruta técnica suelta · módulo de back office · pantalla «por si acaso».

## Sinónimos
SCR-xxx · pantalla de journey

## Palabras relacionadas
Customer Journey · Experience First · Capability

## Referencias
[CUSTOMER_JOURNEYS](../07-experience/CUSTOMER_JOURNEYS.md)


---

# Knowledge Lifetime

## ID
DICT-057

## Status
Accepted

## Madurez
Core

## Nombre
Knowledge Lifetime

## Tipo
Regla metodológica de documentación (FOPEBA)

## Definición
Disciplina que clasifica cada documento en exactamente un nivel de caducidad:

| Nivel | Propósito | Cambia |
|-------|-----------|--------|
| **Contract** | Reglas permanentes | Muy raramente |
| **Implementation** | Cómo un producto/tenant aplica el contrato | Con la evolución del producto |
| **Iteration** | Trabajo de una fase/sprint/PR | Nunca tras el cierre |

Distinto de **Knowledge State** (cuán validado está el conocimiento operacional).  
No es un ADR. No añade fases ni tipos de evidencia al framework congelado.

## Cuándo ocurre
Al crear o fusionar documentación · al cerrar sprints · al evitar que reglas permanentes vivan solo en bitácoras.

## Produce
Sistema documental evolutivo · búsqueda fiable de reglas · bitácoras inmutables al cierre.

## No significa
Knowledge State · ADR · nueva fase FOPEBA · permiso para evolucionar el framework de validación por intuición.

## Sinónimos
Contract / Implementation / Iteration · caducidad documental

## Palabras relacionadas
FOPEBA · Project Dictionary · Milestone · Tenant Experience Spec

## Referencias
[knowledge-lifetime.md](../18-operational-validation/knowledge-lifetime.md) · [Knowledge States](../20-evidence-framework/01-knowledge-states.md)


## Historial de este diccionario

| Fecha | Cambio |
|-------|--------|
| 2026-07-23 | Creación — lenguaje Evidence Gate / ORR / FOV / dominios / HP-001 |
| 2026-07-23 | IDs DICT-xxx · Status · Madurez · autoridad semántica · cuatro pilares |
| 2026-07-23 | Primera pregunta (nuevo vs sinónimo) · disciplina de evolución de pilares |
| 2026-07-23 | ADR 0014 — DICT-045…049 Customer Application / BrandConfig / Tenant-Branded |
| 2026-07-23 | ADR 0014 ampliación — cinco capas · filtro Plataforma/Tenant · DICT-050 |
| 2026-07-23 | TENANT_EXPERIENCE_SPEC EatClean · DICT-051 · consecuencia BrandConfig-only |
| 2026-07-23 | TENANT_IMPLEMENTATION_EATCLEAN · `tenants/eatclean/` · DICT-052 Tenant Assets |
| 2026-07-23 | Experience First · CUSTOMER_JOURNEYS · DICT-053/054 |
| 2026-07-23 | Experience Domain · SCR trazabilidad · DICT-055/056 · PROJECT_DOMAINS |
| 2026-07-23 | Knowledge Lifetime · DICT-057 · Milestone EatClean Pilot Ready |

