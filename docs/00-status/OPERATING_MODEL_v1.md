# OPERATING MODEL v1

**Documento:** `OPERATING_MODEL_v1.md`  
**Fecha:** 2026-07-29  
**Estado:** **ACTIVE** — constitución operativa  
**Tipo:** Modelo oficial de cómo evoluciona YourMeal OS  
**No modifica FOPEBA.** No redefine Core. No ejecuta Flow.  
**Anclas:** [PLATFORM_FLOW_TRANSITION_DECLARED](./PLATFORM_FLOW_TRANSITION_DECLARED.md) · [PLATFORM_V1_CLOSED](./PLATFORM_V1_CLOSED.md) · [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md) · [CHANGE_AUTHORITY](./CHANGE_AUTHORITY.md)

---

## Declaración

Con la transición Platform → Flow (**COMPLETE**), YourMeal OS deja de cerrar solo fases técnicas y establece su **constitución operativa**.

| Hasta PR #88 | PR #89 → #98 |
|--------------|--------------|
| Evolución por decisiones de arquitectura | Sistema de certificación, gobierno y disciplina de desarrollo |

---

## Imagen conceptual (oficial)

```text
══════════════════════════════════════════════════════════════
                 YOURMEAL OS
            OPERATING MODEL v1
══════════════════════════════════════════════════════════════

PLATFORM
    Foundation
    Auth
    Identity
    Operational Core
    Governance
            │
            ▼
FLOW
    Specification
            │
            ▼
    Implementation
            │
            ▼
    Evidence
            │
            ▼
    Certification
            │
            ▼
Operational Readiness
            │
            ▼
Modules · Services · Notifications · Jobs · Analytics · AI

══════════════════════════════════════════════════════════════
```

Capas PLATFORM = **estables** (consumir; no redefinir sin [CHANGE_AUTHORITY](./CHANGE_AUTHORITY.md)).  
Cadena FLOW = **criterio de evolución** diaria ([FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md)).  
Módulos / servicios = **consumidores** del Core y del Flow — no lo definen.

---

## Un solo idioma

| Nivel | Habla de |
|-------|----------|
| Arquitectura | **Core** |
| Gobierno | **Authority** |
| Desarrollo | **Flow** |
| Calidad | **Evidence** |
| Progreso | **Certification** |

No hay lenguajes paralelos.

---

## Frase constitutiva

> **La arquitectura ya no dirige el desarrollo; el Flow dirige el desarrollo sobre una arquitectura estable.**

---

## Mayor logro (secuencia #89 → #98)

No es haber creado más documentación.  
Es que **todos los niveles del proyecto hablen el mismo idioma**.

1. Se definió un marco.  
2. Se validó con evidencia.  
3. Se congeló cuando demostró funcionar.  
4. Se estableció un gobierno para protegerlo.  
5. Se cambió el criterio de desarrollo para que el repositorio evolucione siguiendo ese marco.

Cada nueva funcionalidad debe demostrar **qué aporta a la operación**, no simplemente que añade más código.

Esa es la diferencia entre un repositorio que acumula funcionalidades y una **plataforma que construye conocimiento operativo**.

---

## Fase actual

**Flow Certification** ▶ CURRENT — [FLOW_CERTIFICATION_OPEN](./FLOW_CERTIFICATION_OPEN.md) · [FLOW_CATALOG](./FLOW_CATALOG.md)

---

## Futuro (NO AHORA) — Operational Intelligence

**Estado:** ⏸ DEFERRED · no abrir PR · no implementar  

Cuando existan **varios Flows certificados** y el producto esté en **operación real**, podrá plantearse una fase metodológica:

```text
Operational Intelligence
```

**No es IA.**  
Es la capa que consume la evidencia de Flows certificados para preguntas como:

- ¿Dónde se producen más bloqueos?  
- ¿Qué handoff genera más incidencias?  
- ¿Qué Journey degrada más el tiempo total E2E?  
- ¿Qué certificaciones pierden calidad con el tiempo?

Misma filosofía que no abrir el Event Bus antes de tiempo: **solo con suficiente evidencia operacional**.

---

## Firma

| Campo | Valor |
|-------|-------|
| Modelo | Operating Model **v1 ACTIVE** |
| Constitución | Platform estable · Flow dirige evolución |
| Transición | [PLATFORM_FLOW_TRANSITION_DECLARED](./PLATFORM_FLOW_TRANSITION_DECLARED.md) · COMPLETE |
| Siguiente trabajo | Flow Certification |
| Operational Intelligence | DEFERRED |
