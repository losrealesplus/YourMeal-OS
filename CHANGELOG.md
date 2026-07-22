# CHANGELOG

## [v0.1.0] — FOUNDATION LOCKED — 2026-07-20

```text
YourMeal OS v0.1.0

Foundation Locked

The project architecture is now considered stable.

Future development focuses on business capabilities instead of infrastructure.

Any architectural change requires an ADR approval.
```

### Español (resumen del hito)

La arquitectura de YourMeal OS se considera **estable**.

- Foundation y Foundation Lock cerrados.
- El desarrollo futuro se centra en capacidades de negocio, no en reinventar infraestructura.
- Cualquier cambio arquitectónico requiere un ADR aprobado.
- Idioma oficial del desarrollo: **español** (código y BD en inglés). Ver ADR 0010.

### Incluye

- Multi-tenant + RLS
- RBAC en runtime (guards de ruta)
- Soft delete (`archive` / `restore` / `purge`)
- Service → Repository → Supabase
- ServiceContext unificado
- Domain errors tipados
- Feature flags + localización + auditoría preparados
- Constitución (`docs/`), ADRs, matriz de capabilities, lenguaje ubicuo
- Scaffold de eventos (`packages/events`)
- Convención de módulos `src/modules/...`

### Siguiente fase

**Module 01 — Dish Library** (dominio primero; UI al final).

---

## [Unreleased] — 2026-07-21

### Hitos

- **Foundation Validation ✅** — primera validación metodológica cerrada (`Dish` Domain Done)
- Acta: `docs/00-status/MILESTONE_VALIDACION_DOMINIO_DISH.md`
- `DOMAIN_DONE.md` adoptado como DoD del dominio
- `REPOSITORY_GUIDELINES.md` + `DishRepository.md` — contrato de persistencia modelado
- Principio Repository Minimalism en `FOUNDATION.md`
- Repository Contract Pattern (común implícito vs específico; sin BaseRepository genérico)
- Interface `DishRepository.ts` — primer contrato tipado del Core
- `APPLICATION_GUIDELINES.md` — estándar de orquestación (Application Orchestration)
- `DISH_USE_CASES.md` — catálogo UC-001…UC-008 (comportamiento de negocio + trazabilidad)
- Un caso de uso por clase (`CreateDishUseCase`, …); fachada Application Service opcional
- Principio Use Case Clarity en FOUNDATION / Application Guidelines
- **Metodología estable** — cimientos no se profundizan más; se construye producto
- `use-cases/CreateDishUseCase.md` — contrato Producto↔Desarrollo (11 secciones + invariantes)
- Principio **Use Case Specificity** — implementable leyendo solo la especificación
- `CreateDishUseCase.ts` + tests — primera planta (traducción del contrato)
- `DishAlreadyExists` — error de coordinación de unicidad
- **Dish Management completo** — UC-002…UC-008 + tests (40 tests Application/domain)
- Capability validada sin modificar Foundation ni tocar infraestructura
- Jerarquía de planificación: Platform → Capabilities → Use Cases → Domain → Infrastructure
- Disciplina: **primero evidencia, después abstracción** (no generalizar Use Cases prematuramente)
- **Infrastructure Validation ✅** — `SupabaseDishRepository` + mapper; Core intacto; 45 tests
- Migración de esquema alineada al dominio (`inactive`, `category_id`, `recipe_id`, `tags`)
- **Product Era** — fin de Validación Arquitectónica; el producto y la operación pasan a ser el foco
- Tres exámenes afirmados: Domain · Repository · Infrastructure
- Orden de pensamiento: EatClean → necesidad → evolución de YourMeal OS
- `docs/15-product/EATCLEAN_DIA_OPERATIVO.md` — día operativo + Capabilities «nunca preguntes…»
- Identidad de producto: **Asistentes Operativos** (proactivo; momentos de decisión; «¿qué necesita tu atención ahora?»)
- Dos arquitecturas: técnica + experiencia operativa; dos niveles: Asistentes (compra) / Capabilities (implementación)
- Principio de propósito + filtro *¿qué pregunta elimina?*
- **Product Blueprint** (`docs/15-product/`) — VISION · PRINCIPLES · MOMENTOS · ASSISTANTS · DASHBOARD · CAPABILITY_ROADMAP
- **Operational Discovery** completo: Findings · Questions · Time · Decisions · Workarounds · Incidents · Patterns · Candidates
- Regla de oro: Discovery nunca contiene soluciones — solo evidencia
- Disciplina: no implementamos ideas; implementamos conocimiento validado
- Misión plataforma: reducir la carga cognitiva de la operación diaria
- KPI estrella: preguntas eliminadas · ciclo cerrado operación↔producto · sin cuarto pilar
- **FASE 5:** Operational Validation — batería VS-001…006 cerrada (Extended×4 · Clarified×2 · 0 Core)
- **Operational Dynamics v0.2:** Lifecycles 2.0 · Supporting Taxonomy · Checks 2.0 (PASS/WARNING/BLOCKED/MANUAL DECISION)
- Recovery Pattern · Temporal Grammar · Capability Impact integrados en Dynamics 01
- **Tren MC-001…006 aplicado** a `17` (Amend/Revise/Pause/Hold · Lot · Location · cardinalidad · INV-031)
- **Nivel de confianza: Operational Model RC (Knowledge Certified)** — FOV/EC pendientes para G-01
- **Independent Operational Validation (IOV)** cerrado: Comprehension · Adversarial · Independent Implementation
- **Knowledge Validation Pyramid** adoptada como seña de identidad
- **FOPEBA Evidence Framework** (`docs/20`): KS · **ECL transversal** · **Stability Index S0…S3** · FOV · **Knowledge Update** · EC · **Gate G-01**
- G-01 **no aprueba código** — aprueba conocimiento suficiente para justificarlo
- Flujo: Validation → IOV → FOV → **KU** → EC → G-01 → Implementation
- Regla de diseño: cada fase elimina una incertidumbre que ninguna anterior puede eliminar
- **IVR-001** transferible · **IVR-002** estructuralmente resistente · **IVR-003** interpretabilidad determinista (IF-A only)
- **Operational Model RC (Knowledge Certified)** + [Known Limitations](./docs/00-status/03-known-limitations-rc.md) pre-FOV
- Siguiente: FOV (operación real)
- Observation EatClean: modo FOV; sin Etapa 2 hasta G-01
- Secuencia definitiva en FOUNDATION: Guidelines → Spec → Implementation → Tests → Validation
### Gobierno

- ADR 0011: Diario de Desarrollo + Principio de Intencionalidad
- ADR 0012: Cursor = CTO · Lovable = UI · Docs = fuente de verdad
- Diario en `docs/99-internal/development-journal/`
- Contexto estratégico: `docs/05-architecture/CONTEXTO_ESTRATEGICO_PERMANENTE.md`
- Contexto permanente: `docs/05-architecture/CONTEXTO_CTO.md`
- Docs de dominio Module 01: Dish / Ingredient / Recipe
- Definition of Done ampliada (Diario + intencionalidad)
- Cierre de jornada: paso de actualización del Diario
- `FOUNDATION.md` en la raíz como constitución global reusable
- Pirámide de decisión + principio de valor (Module 01+) en `AGENTS.md`
- Cierre de etapa constitucional → inicio de construcción de producto
- Roadmap Maestro v0.1 alineado con EatClean, Core y aprendizaje
- Dominio `Dish` cerrado en documentación
- Lenguaje del dominio `Dish` en código (VOs, errors, state machine)
- Principio Entity Simplicity en `FOUNDATION.md`
- Filosofía de Producto (`FILOSOFIA_DE_PRODUCTO.md`) — impacto operativo como criterio de éxito
- Actores oficiales del dominio (`docs/12-domain-model/ACTORS.md`) — fin de «Cliente» ambiguo
- Entity Guidelines (`docs/12-domain-model/ENTITY_GUIDELINES.md`) — estándar de modelado de entidades
- Fundación del dominio: primera validación completada (Foundation permanece vivo)
- Entidad de dominio `Dish` + tests (`vitest`) — primera validación real de Foundation
- Acta oficial: `docs/00-status/MILESTONE_VALIDACION_DOMINIO_DISH.md`
- `DOMAIN_DONE.md` — Definition of Done del dominio (Dish cerrado a nivel de dominio)
