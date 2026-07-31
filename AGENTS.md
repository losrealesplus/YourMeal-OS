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
Engineering Phase: Complete (pending operational authorization)
Evidence Gate · Primary Artifact: Field Evidence
Pregunta: ¿Hay evidencia para ORR? (no la siguiente Capability)
Hito: ORR PASSED → Ready for FOV → FOV-001
```

> **El Project Dictionary es la autoridad semántica.** Solo conceptos estables y **Accepted** (`DICT-xxx` · Status · Madurez).  
> Ante un término: ¿concepto nuevo o sinónimo de uno existente? → reutilizar / discutir / solo entonces `DICT-xxx`.  
> **Congelación funcional:** hasta que ORR emita PASSED \| BLOCKED, ningún commit modifica el comportamiento del producto — salvo bloqueo de Smoke, corrección imprescindible de HP-001, o docs de evidencia.  
> **Ops:** Smoke HP-001 · ORR · **Experience:** ¿mi madre podría pedir sin ayuda? (CJ-001 → SCR).  
> Cursor no implementa funcionalidades nuevas. Conecta capacidades / produce evidencia / Experience Refactor sin tocar HP-001.  
> Regla nueva → **STOP** · `REQUIRES KNOWLEDGE REVIEW` · Carril A.  
> Ninguna pantalla sin Customer Journey.  
> Un PR · un nivel — sin «ya que estamos…».

**Tablero:** [CURRENT_PHASE](./docs/00-status/CURRENT_PHASE.md) · [PROJECT_DOMAINS](./docs/00-status/PROJECT_DOMAINS.md) · [ENGINEERING_PHASE](./docs/00-status/ENGINEERING_PHASE.md)  
**Diccionario:** [PROJECT_DICTIONARY](./docs/99-reference/PROJECT_DICTIONARY.md) (`DICT-xxx`)  
**Journeys:** [CUSTOMER_JOURNEYS](./docs/07-experience/CUSTOMER_JOURNEYS.md)  
**Siguiente:** merge [#25](https://github.com/losrealesplus/YourMeal-OS/pull/25) → migración → [SMOKE_HP-001](./docs/00-status/SMOKE_HP-001.md) → [ORR](./docs/22-implementation/ORR.md)  
**Pre-piloto:** [PRE_PILOT_AUDIT](./docs/00-status/PRE_PILOT_AUDIT.md)  

**Cierre metodológico:** [Acta](./docs/00-status/ACTA_METHODOLOGY_CONSTRUCTION_CLOSED.md)  
**Historia:** [MILESTONES](./docs/00-status/MILESTONES.md)  
**PRs:** un nivel por PR — [PR_CHANGE_LEVELS](./docs/22-implementation/PR_CHANGE_LEVELS.md)  
**ADR:** [0013 Implementation is Knowledge Materialization](./docs/adr/0013-implementation-is-knowledge-materialization.md)  
**FOV (post-ORR):** [FOV-001](./docs/30-field-validation/FOV-001_HP-001.md)  

**Filosofía:** [IMPLEMENTATION_PHILOSOPHY](./docs/23-engineering/IMPLEMENTATION_PHILOSOPHY.md)

| Herramienta | Rol |
|-------------|-----|
| **FOPEBA** | Certifica conocimiento |
| **Lovable** | Materializó UX/estructura — no más infraestructura |
| **Cursor** | Ingeniería / conexión |
| **GitHub** | Historia y evidencia |

| Carril | Entrada |
|--------|---------|
| A campo | [Mission Brief](./docs/00-status/FOV_MISSION_BRIEF.md) |
| B conectar | [22-implementation](./docs/22-implementation/README.md) · [caps](./docs/22-implementation/caps/README.md) · [MODULE_STATE_CRITERIA](./docs/00-status/MODULE_STATE_CRITERIA.md) |

### Principio de valor (Capabilities)

> Cada línea de código debe aportar valor a la **Organización actual** (EatClean) o fortalecer el **Core** para Organizaciones futuras. Si no cumple ninguna de las dos, no debería existir.

## Gobierno

| Quién | Rol |
|-------|-----|
| **Cursor** | Ingeniero de materialización — conecta skeleton (ver [IMPLEMENTATION_RULES](./docs/22-implementation/IMPLEMENTATION_RULES.md)) |
| **`docs/` + ADRs** | Fuente de verdad |
| **Lovable** | Arquitecto visual — Product Skeleton (no reinventar dominio) |
| **Código** | Materializa OM; no inventa reglas |

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

## Cursor Cloud specific instructions

Durable, non-obvious notes for running this repo in a Cloud Agent VM (dependencies are installed automatically by the startup update script — `npm install`). Standard commands live in `package.json` `scripts`; only the gotchas are listed here.

- **Package manager: `npm`.** Two lockfiles coexist (`package-lock.json` and `bun.lock`); npm is authoritative (it matches CI, which runs `npm ci`). Don't run `bun install` — pick one installer.
- **App boots against a hosted Supabase.** A `.env` is committed with a hosted project URL + a *publishable* (public) key, so `npm run dev` works out of the box with no extra secrets. The web dev server is `npm run dev` → Vite on **port 8080** (SSR handled in-process; Nitro/Cloudflare only matters for the production `npm run build`).
- **`npm run lint` fails on a clean checkout** due to a large number of pre-existing repo-wide `prettier/prettier` violations (not caused by your change). `npm run typecheck` (tsc) is clean. Judge lint by whether *your* files add new errors.
- **`npm run test` (vitest) reports 2 failing "suites" even though 268 unit tests pass.** Vitest's default glob picks up `scripts/lib/*.spec.mjs`, which are Node `node --test` files, not Vitest. Run those with their intended runners instead: `npm run test:canonical-pipeline` and `npm run test:bootstrap-config`.
- **Auth is real + email-gated + rate-limited.** Signup/sign-in hit the hosted Supabase Auth. New signups require email confirmation (no session is returned immediately), and the shared project **rate-limits auth emails** (HTTP 429 `over_email_send_rate_limit`) after a few attempts — expect flaky UI auth demos, not a bug.
- **To exercise the product UI without login, use Bootstrap / "Functional Review" Mode.** Set `VITE_BOOTSTRAP_MODE="true"` in a gitignored `.env.local`, then **restart** `npm run dev` (Vite inlines `VITE_*` at startup, so a restart is required). The root screen becomes a profile selector (Customer / Kitchen / Company Admin / SaaS Admin / …) that injects a synthetic identity to navigate `/app`, `/admin`, and `/saas`. Data mutations needing a real JWT may fail (RLS). See [BOOTSTRAP_MODE](./docs/00-status/BOOTSTRAP_MODE.md). Never enable in production.
- **Optional extras:** `npm run bootstrap:e2e` (installs Playwright browsers) for the smoke scripts under `scripts/`; `npm run seed` (Day-0 admin) and `gen:types` need `SUPABASE_SERVICE_ROLE_KEY` / Supabase CLI, which are not present by default. Capacitor (`build:mobile`, `sync:mobile`) is not needed to run the web product.
