# Índice de documentación

**Fuente de verdad de arquitectura.** Idioma de docs: **español** (ADR 0010).

**Orden de lectura:** [`FOUNDATION.md`](../FOUNDATION.md) → [`AGENTS.md`](../AGENTS.md) → `docs/`

| Documento | Propósito |
|-----------|-----------|
| [**Project Dictionary**](./99-reference/PROJECT_DICTIONARY.md) | **Autoridad semántica** (`DICT-xxx` · Status · Madurez) — no se solapa con FOUNDATION / ADR / OM |
| [Customer Journeys](./07-experience/CUSTOMER_JOURNEYS.md) | Experience First · CJ-001 Pedido semanal (cómo vive el usuario) |
| [Project Domains](./00-status/PROJECT_DOMAINS.md) | Knowledge · Engineering · Experience · Operations |
| [Estado](./00-status/README.md) | Fase oficial — Antesala · dual track |
| [Dual Track · Antesala](./00-status/DUAL_TRACK_ANTECAMARA.md) | Carril A (cerrar Etapa 1) · Carril B (UX/infra sin engines) |
| [Product Blueprint](./15-product/README.md) | Qué construir y por qué |
| [Operational Discovery](./16-operational-discovery/README.md) | Por qué evolucionar — solo evidencia |
| [Operational Model](./17-operational-model/README.md) | Core Operativo — lenguaje / objetos permanentes |
| [Operational Dynamics v0.2](./17-operational-model/07-operational-dynamics/README.md) | Comportamiento: transitions · Supporting taxonomy · Checks 2.0 |
| [Operational Validation](./18-operational-validation/README.md) | Mesa · [FOPEBA](./18-operational-validation/00-operational-product-engineering.md) · Beta |
| [Independent Operational Validation](./19-independent-operational-validation/README.md) | IOV · transferibilidad · [Pirámide](./19-independent-operational-validation/00-knowledge-validation-pyramid.md) |
| [Evidence Framework](./20-evidence-framework/README.md) | FOV · EC · ECL · Gate G-01 |
| [PRODUCT_VISION](./15-product/PRODUCT_VISION.md) | Qué es YourMeal OS para el cliente |
| [Operational Checks](./15-product/OPERATIONAL_CHECKS.md) | Datos → comprobación → acción (transversal) |
| [Milestone · Infrastructure Validation](./00-status/MILESTONE_INFRASTRUCTURE_VALIDATION.md) | Core independiente de la tecnología ✅ |
| [Milestone · Foundation Validation](./00-status/MILESTONE_VALIDACION_DOMINIO_DISH.md) | Hito histórico ✅ — metodología validada |
| [Milestone · EatClean Pilot Ready](./00-status/MILESTONE_EATCLEAN_PILOT_READY.md) | Hito abierto 🟡 — EP-001…EP-005 · ciclo E2E |
| [ACT-001 · Experience Baseline Frozen](./00-status/ACT-001_EATCLEAN_EXPERIENCE_BASELINE_FROZEN.md) | Congelación experiencia EatClean (#24→#30) |
| [ACT-002 · Materialization Frozen](./00-status/ACT-002_FOUNDATION_OF_MATERIALIZATION_FROZEN.md) | Foundation of Materialization Frozen v1 (#24→#31) |
| [Four Layers](./05-architecture/FOUR_LAYERS.md) | Knowledge · Platform · Materialization · Operational |
| [Pilot Execution Guide](./18-operational-validation/PILOT_EXECUTION_GUIDE.md) | Validación: demostrar una semana EatClean con YourMeal OS |
| [Knowledge Lifetime](./18-operational-validation/knowledge-lifetime.md) | Caducidad documental · Contract · Implementation · Iteration |
| [Definition of Done](./00-status/DEFINITION_OF_DONE.md) | Checklist de módulo |
| [Foundation Lock](./05-architecture/FOUNDATION_LOCK.md) | ✅ Cerrado v0.1.0 |
| [Tenant Branding](./05-architecture/TENANT_BRANDING.md) | Contrato BrandConfig · Customer App white-label (ADR 0014) |
| [ADR 0015 · B2B/B2C Customer Model](./adr/0015-b2b-b2c-customer-model.md) | Separación Consumer / Company Account antes del piloto |
| [ADR 0016 · Party Model](./adr/0016-party-model-demand-actors.md) | Party → Individual Customer \| Company → Memberships |
| [Core Object Traceability](./17-operational-model/CORE_OBJECT_TRACEABILITY.md) | OM Party ↔ tablas físicas del piloto |
| [ORR Party / B2B / B2C](./00-status/ORR_B2B_B2C_PARTY.md) | Checklist pre–Pilot Ready (alta empresa = EatClean) |
| [Company Account B2B](./17-operational-model/02-core-objects/company-account-b2b.md) | Site · Organizational Unit · Delivery Group |
| [Tenant Experience Spec](./05-architecture/TENANT_EXPERIENCE_SPEC.md) | Identidad EatClean · Experience Refactor |
| [Tenant Implementation · EatClean](./05-architecture/TENANT_IMPLEMENTATION_EATCLEAN.md) | Brief Cursor/Lovable · Tenant Assets |
| [Tenant Branding](./05-architecture/TENANT_BRANDING.md) | BrandConfig · Tenant-Managed runtime · `brand.manage` |
| [Brand Contract](./05-architecture/BRAND_CONTRACT.md) | Límites de logo/colores/accesibilidad |
| [Brand Validation Checklist](./05-architecture/BRAND_VALIDATION_CHECKLIST.md) | Coherencia de marca tras gestión por el Tenant |
| [Tenant Brand (OM)](./17-operational-model/02-core-objects/tenant-brand.md) | Configuration Object Nivel 3 |
| [Tenant Experience Spec](./05-architecture/TENANT_EXPERIENCE_SPEC.md) | Reglas permanentes de experiencia Tenant |
| [Tenant Implementation · EatClean](./05-architecture/TENANT_IMPLEMENTATION_EATCLEAN.md) | Implementación específica EatClean |
| [Contexto estratégico](./05-architecture/CONTEXTO_ESTRATEGICO_PERMANENTE.md) | Dirección empresarial y del Core |
| [Filosofía de producto](./05-architecture/FILOSOFIA_DE_PRODUCTO.md) | Propósito, éxito e impacto operativo |
| [Contexto CTO](./05-architecture/CONTEXTO_CTO.md) | Arranque operativo de sesión Cursor (CTO) |
| [Cierre de jornada](./05-architecture/CIERRE_DE_JORNADA.md) | Protocolo diario |
| [Diario de Desarrollo](./99-internal/development-journal/README.md) | Historial del *porqué* |
| [Module 01 — Dish](./12-domain-model/module-01/Dish.md) | Dominio Dish |
| [Module 01 — Ingredient](./12-domain-model/module-01/Ingredient.md) | Dominio Ingredient |
| [Module 01 — Recipe](./12-domain-model/module-01/Recipe.md) | Dominio Recipe |
| [Actores](./12-domain-model/ACTORS.md) | Roles oficiales del dominio |
| [Entity Guidelines](./12-domain-model/ENTITY_GUIDELINES.md) | Estándar de modelado de entidades |
| [Domain Done](./12-domain-model/DOMAIN_DONE.md) | DoD del dominio (sin infra/UI) |
| [Repository Guidelines](./13-repositories/REPOSITORY_GUIDELINES.md) | Estándar de repositorios del Core |
| [DishRepository](./13-repositories/DishRepository.md) | Contrato de dominio Dish (docs) |
| [Application Guidelines](./14-application/APPLICATION_GUIDELINES.md) | Estándar de la capa de Aplicación |
| [DISH_USE_CASES](./14-application/DISH_USE_CASES.md) | Qué puede hacer la cocina con un Dish |
| [CreateDishUseCase](./14-application/use-cases/CreateDishUseCase.md) | Diseño UC-001 (implementación) |
| [Capability Matrix](./09-security/CAPABILITY_MATRIX.md) | AuthZ |
| [ADRs](./adr/README.md) | Decisiones |
| [Roadmap](./roadmap/README.md) | Secuencia |
| [CHANGELOG](../CHANGELOG.md) | Hitos |

[/AGENTS.md](../AGENTS.md)
