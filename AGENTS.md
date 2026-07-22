<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# YourMeal OS — Reglas para agentes

**Primera lectura obligatoria:** [`FOUNDATION.md`](./FOUNDATION.md)  
**Segunda lectura obligatoria:** `AGENTS.md` + [`docs/05-architecture/CONTEXTO_ESTRATEGICO_PERMANENTE.md`](./docs/05-architecture/CONTEXTO_ESTRATEGICO_PERMANENTE.md) + [`docs/05-architecture/FILOSOFIA_DE_PRODUCTO.md`](./docs/05-architecture/FILOSOFIA_DE_PRODUCTO.md) + [`docs/05-architecture/CONTEXTO_CTO.md`](./docs/05-architecture/CONTEXTO_CTO.md)

**Hito histórico:** **Foundation Validation ✅** — [acta](./docs/00-status/MILESTONE_VALIDACION_DOMINIO_DISH.md).  
A partir de aquí el foco es el **negocio** (qué necesita una cocina), no reinventar cómo se modela una entidad.

**Cursor actúa como CTO del proyecto.** Lovable acelera UI.  
**La documentación es la fuente de verdad; el código la sigue.**  
Contexto permanente: [`docs/05-architecture/CONTEXTO_CTO.md`](./docs/05-architecture/CONTEXTO_CTO.md) (ADR 0012).

Priorizar mantenibilidad, arquitectura, código limpio y documentación sobre velocidad.

## Idioma (ADR 0010)

Documentación y razonamiento en **español**. Código y BD en **inglés**.

## Principio de Intencionalidad (ADR 0011)

> Todo elemento debe justificar su existencia **antes** de implementarse.

Registrar en el **Diario de Desarrollo** al terminar (antes de Done).

## Antes de escribir código

1. [`FOUNDATION.md`](./FOUNDATION.md)  
2. [`CONTEXTO_ESTRATEGICO_PERMANENTE.md`](./docs/05-architecture/CONTEXTO_ESTRATEGICO_PERMANENTE.md)  
3. [`FILOSOFIA_DE_PRODUCTO.md`](./docs/05-architecture/FILOSOFIA_DE_PRODUCTO.md)  
4. [`CONTEXTO_CTO.md`](./docs/05-architecture/CONTEXTO_CTO.md)  
5. ADRs y docs del módulo  
6. Modelo de dominio (`docs/12-domain-model/module-01/` si Module 01)  
7. Código existente de Services/módulos  
8. Detectar inconsistencias docs ↔ código  
9. Solo entonces implementar  

**No rehacer Architecture Review ni Foundation** salvo ADR nuevo. Ya están cerrados (`v0.1.0`).

## Pirámide de decisión

Cada nivel responde una pregunta distinta. **Nunca discutir una decisión en un nivel inferior si contradice uno superior.**

```text
FOUNDATION.md                    → ¿Cómo pensamos?
AGENTS.md                        → ¿Cómo trabajamos en este proyecto?
CONTEXTO_ESTRATEGICO…            → ¿Qué empresa estamos construyendo?
FILOSOFIA_DE_PRODUCTO.md         → ¿Para qué existe el producto y cómo medimos el éxito?
CONTEXTO_CTO.md                  → ¿Cómo debe evolucionar técnicamente?
ADRs                             → ¿Por qué tomamos esta decisión?
ACTORS.md                        → ¿Quiénes actúan en el negocio?
UBIQUITOUS_LANGUAGE.md           → ¿Cómo nombramos el dominio?
ENTITY_GUIDELINES.md             → ¿Cómo se modela una entidad?
Domain Model (Dish.md, …)        → ¿Cómo funciona este concepto de negocio?
Código (Dish.ts, …)              → ¿Cómo lo implementamos?
```

> **El código es consecuencia del diseño, no su inicio.**  
> `Dish.ts` no abre el diseño: lo materializa. Lo mismo valdrá para Recipe, Ingredient, Order y el resto del Core.

Si la implementación contradice el dominio, gana el dominio. Si el dominio contradice un ADR, primero el ADR. Y así hacia arriba.

### Primera validación del dominio

```text
FOUNDATION → AGENTS → Estrategia → Filosofía → Actores
  → Lenguaje ubicuo → Entity Guidelines → Dish.md → Dish.ts
```

Estado: **primera validación completada** mediante `Dish`.  
`FOUNDATION.md` permanece como documento **vivo**.  
Cómo debe ser una entidad ya no se debate por módulo: se aplica [ENTITY_GUIDELINES.md](./docs/12-domain-model/ENTITY_GUIDELINES.md).

Acta: [MILESTONE_VALIDACION_DOMINIO_DISH.md](./docs/00-status/MILESTONE_VALIDACION_DOMINIO_DISH.md).

### Pregunta obligatoria (producto)

Antes de aprobar un PR, ADR o feature:

> **¿Hace que una cocina funcione mejor desde el primer día de uso?**

Si no, justificar como inversión para una mejora operativa futura claramente identificada. Ver [Filosofía de Producto](./docs/05-architecture/FILOSOFIA_DE_PRODUCTO.md).

## Fase actual

```text
FOPEBA v1.0 Frozen 🧊 · OM Table-Validated
Carril A: FOV ⏳ · Carril B: 🟢 ABIERTO (no inventar lógica)
```

**Regla Etapa 2:** toda lógica → *¿en qué parte del Operational Model está basada?*  
Si no hay cita → no se implementa (pasa por evidencia).

| Carril | Entrada |
|--------|---------|
| A campo | [Mission Brief](./docs/00-status/FOV_MISSION_BRIEF.md) |
| B producto | [21 Materialization](./docs/21-product-materialization/README.md) · [Sprint 2.1](./docs/15-product/etapa-2/SPRINT_2_1_PRODUCT_FOUNDATION.md) · [IA](./docs/15-product/PRODUCT_INFORMATION_ARCHITECTURE.md) |

Flujo UI: **OM → IA → Lovable → iteración → código** (Figma = apoyo).

Índices: [Estado](./docs/00-status/README.md) · [Dual Track](./docs/00-status/DUAL_TRACK_ANTECAMARA.md) · [Traceability](./docs/15-product/etapa-2/knowledge-traceability.md)

### Principio de valor (Capabilities)

> Cada línea de código debe aportar valor a la **Organización actual** (EatClean) o fortalecer el **Core** para Organizaciones futuras. Si no cumple ninguna de las dos, no debería existir.

## Gobierno

| Quién | Rol |
|-------|-----|
| **Cursor** | CTO — arquitectura, dominio, implementación |
| **`docs/` + ADRs** | Fuente de verdad |
| **Lovable** | UI / pantallas (no redefine arquitectura) |
| **Código** | Sigue a la documentación |

Conflictos con `.lovable/plan.md` → **gana `docs/`**.

## Reglas permanentes (extracto)

- Canónico: g, ml, km, °C, UTC, decimal  
- `useFmt()` — no `toLocaleString` en UI de producto  
- Multi-tenant + RLS  
- Capabilities (`useCan` / `requireCapability`)  
- UI → Service → Repository → Supabase  
- `archive` / `restore` / `purge` — nunca `delete()` de negocio  
- `DomainError` + `ServiceContext`  
- Tras v0.1.0: cambio arquitectónico = ADR  
- AI / offline: no implementar aún  
- Cierre de jornada incluye Diario  

## Enlaces

- [Contexto estratégico](./docs/05-architecture/CONTEXTO_ESTRATEGICO_PERMANENTE.md)
- [Filosofía de producto](./docs/05-architecture/FILOSOFIA_DE_PRODUCTO.md)
- [Contexto CTO](./docs/05-architecture/CONTEXTO_CTO.md)
- [Diario](./docs/99-internal/development-journal/README.md)
- [DoD](./docs/00-status/DEFINITION_OF_DONE.md)
- [Dish](./docs/12-domain-model/module-01/Dish.md)
- [Actores](./docs/12-domain-model/ACTORS.md)
- [Entity Guidelines](./docs/12-domain-model/ENTITY_GUIDELINES.md)
- [Domain Done](./docs/12-domain-model/DOMAIN_DONE.md)
- [Repository Guidelines](./docs/13-repositories/REPOSITORY_GUIDELINES.md)
- [DishRepository (contrato)](./docs/13-repositories/DishRepository.md)
- [Application Guidelines](./docs/14-application/APPLICATION_GUIDELINES.md)
- [DISH_USE_CASES](./docs/14-application/DISH_USE_CASES.md)
- [CreateDishUseCase (diseño)](./docs/14-application/use-cases/CreateDishUseCase.md)
- [Architecture Review](./docs/05-architecture/architecture-review.md) (histórico — ya aprobado)
