# PROJECT DICTIONARY

> **El Project Dictionary es la fuente oficial de significado de todos los conceptos, estados, artefactos y términos utilizados en YourMeal OS y FOPEBA. Ningún término se considera oficial hasta que su definición haya sido incorporada a este documento.**

**Idioma:** español (definición) · inglés (código / BD) — ADR 0010.  
**Complemento de dominio (entidades de cocina):** [UBIQUITOUS_LANGUAGE](../12-domain-model/UBIQUITOUS_LANGUAGE.md) · [OM UL](../17-operational-model/01-ubiquitous-language/README.md).  
**Este documento** fija el lenguaje del *proyecto y la metodología*, no el glosario de platos/recetas.

---

## Regla de gobernanza

> **Cada vez que se cree un concepto nuevo aceptado por el proyecto, su definición debe añadirse al PROJECT_DICTIONARY antes de considerarlo oficial.**

```text
Nueva definición → Aceptada → PROJECT_DICTIONARY → Puede utilizarse
```

No al revés. Una conversación que fija significado (p. ej. «ORR PASSED = …») implica una entrada aquí en el mismo ciclo documental.

---

## Plantilla de entrada (obligatoria)

```markdown
# <TÉRMINO>

## Nombre
## Tipo
## Definición
## Cuándo ocurre
## Produce
## No significa
## Sinónimos
## Palabras relacionadas
## Referencias
```

---

## Índice por categoría

### Metodología

[FOPEBA](#fopeba) · [FOV](#fov) · [IOV](#iov) · [Knowledge Update](#knowledge-update) · [Gate](#gate) · [Evidence](#evidence) · [Knowledge Leakage](#knowledge-leakage) · [Operational Model](#operational-model) · [Table Validation](#table-validation) · [Field Validation](#field-validation)

### Ingeniería

[Capability](#capability) · [Repository](#repository) · [Mutation Pattern](#mutation-pattern) · [Read Pattern](#read-pattern) · [Happy Path](#happy-path) · [ORR](#orr) · [Smoke Test](#smoke-test) · [Engineering Baseline](#engineering-baseline) · [Hardening Sprint](#hardening-sprint)

### Gobernanza

[ADR](#adr) · [Current Phase](#current-phase) · [Milestone](#milestone) · [Integration Release](#integration-release) · [Evidence Gate](#evidence-gate) · [Frozen](#frozen) · [Foundation Lock](#foundation-lock) · [Project Dictionary](#project-dictionary)

### Estado

[Ready for CAP-006](#ready-for-cap-006) · [Ready for ORR](#ready-for-orr) · [Ready for FOV](#ready-for-fov) · [Operational](#operational) · [Connected](#connected) · [Scaffold](#scaffold) · [Field Validated](#field-validated)

### Dominios de trabajo

[Knowledge Engineering](#knowledge-engineering) · [Software Engineering](#software-engineering) · [Operational Engineering](#operational-engineering)

### Producto (núcleo HP-001)

[Tenant](#tenant) · [Dish](#dish) · [Weekly Menu](#weekly-menu) · [Draft Order](#draft-order) · [Confirm Order](#confirm-order) · [Recipe](#recipe) · [Production](#production)

---

# Metodología

# FOPEBA

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
Customer · RLS · CAP-001

## Referencias
OM · auth hooks

---

# Dish

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

## No significado
Draft Order.

## Sinónimos
Weekly Menu · Menú semanal

## Palabras relacionadas
Dish · Draft Order · CAP-003

## Referencias
CAP-003 · OM Weekly Menu

---

# Draft Order

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

## Historial de este diccionario

| Fecha | Cambio |
|-------|--------|
| 2026-07-23 | Creación — lenguaje Evidence Gate / ORR / FOV / dominios / HP-001 |
