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

## Pirámide de Autoridad Documental (Niveles L0 a L5)

Cada nivel responde a una pregunta distinta con una jerarquía de autoridad estricta. **El nivel superior prevalece siempre:**

```text
L0 — FOUNDATION.md                    → Constitución inmutable (¿Cómo pensamos y gobernamos?)
L1 — AGENTS.md / FOPEBA / PROTOCOL    → Gobernanza y metodología (¿Cómo trabajamos y razonamos?)
L2 — CONTEXTO ESTRATÉGICO / ADRs      → Arquitectura permanente (¿Qué empresa y plataforma construimos?)
L3 — MODELO DE DOMINIO / CONTRATOS    → Reglas e invariantes de negocio (¿Cómo opera el catering?)
L4 — CONTRATOS DE CAPABILITY / BLOQUE → Alcance de la implementación (¿Qué construimos en este bloque?)
L5 — RUNBOOKS / OPERATIVA DE PROV.    → Procedimientos de despliegue y soporte (¿Cómo desplegamos?)
```

> **El código es consecuencia del diseño, no su inicio.**  
Si la implementación contradice el dominio, gana el dominio. Si el dominio contradice un ADR, gana el ADR. Si existe conflicto en el mismo nivel de autoridad: **STRICT STOP** y consultar al propietario humano.

### Verificación de Contexto Obligatoria (`# DOCUMENT CONTEXT CHECK`)
Al inicio de cada bloque, antes de escribir código, es obligatorio completar el cuadro de consulta documental según la matriz canónica (ver [`ENGINEERING_OPERATING_PROTOCOL.md`](./docs/05-architecture/ENGINEERING_OPERATING_PROTOCOL.md)).

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

## SOURCE OF TRUTH & CHANGE PERSISTENCE

> **Zero Lost Changes.** Si un cambio no está en Git (commit identificable en el workspace local o en `origin`), **no existe** para la cadena de desarrollo ni para validación en dispositivo.

### Fuente física de verdad

1. El workspace Mac `~/Developer/YourMeal-OS` es la **fuente física de verdad** para desarrollo y device validation (OPPO, Android, iPhone, iOS Simulator).
2. Ninguna implementación se considera **device-ready** hasta existir en el working tree local asociado a un **commit Git identificable**.
3. Trabajo solo en VM cloud, Cursor Cloud Agent, worktree remoto, artifact remoto o texto de conversación → **NO DISPONIBLE LOCALMENTE**. No inventar ni reconstruir en silencio.

### LOCAL ↔ CLOUD

```text
CLOUD (análisis / arquitectura / paralelo)
   ↓
GitHub (branch + commit + push)
   ↓
MAC LOCAL (pull / checkout)
   ↓
tests + build
   ↓
OPPO / iPhone (mismo commit trazable)
   ↓
observación real → evidencia → CLOUD
```

GitHub es el puente. Nunca asumir que una sesión conoce cambios no sincronizados vía Git.

### Ramas y `main`

- **No trabajar directamente sobre `main`.** Cada unidad de trabajo usa `cursor/<descriptive-name>`.
- `main` no recibe commit directo, push directo, merge automático, force push ni reset destructivo.
- El **merge a `main` es decisión humana explícita** (review / PR).

### Cierre de unidad de trabajo (Nivel 1 — Checkpoint)

**No** hacer `git add .` → commit → push en cada edición parcial.

Al **completar** una unidad de trabajo:

1. Ejecutar validaciones aplicables (`typecheck` / `tests` / `build` / mobile según el alcance).
2. Revisar `git status` y `git diff` — excluir cambios ajenos, secretos y artifacts.
3. Crear **commit descriptivo** solo con archivos de la unidad.
4. **Push** de la rama a `origin`.
5. Crear o actualizar **PR** (un nivel — [PR_CHANGE_LEVELS](./docs/22-implementation/PR_CHANGE_LEVELS.md)).
6. **NO** merge a `main`.
7. Reportar: branch · SHA · push · URL del PR · resultado de validación.

Prioridad: **CORRECTNESS > TRACEABILITY > VALIDATION > PERSISTENCE > SPEED**.

### Device build identity

Antes de generar APK / IPA:

- Git branch + Git commit SHA

Después:

- Build command · timestamp · artifact path · **SHA256** · applicationId / bundle ID · dispositivo

Nunca instalar un artefacto cuya procedencia/commit no se pueda demostrar. Misma comparación Android ↔ iOS → **mismo commit**.

### Cambios no committeados

Si `git status` muestra `M` / `??` / `A` / `D`: reportarlos; no asumir basura.  
Sin autorización explícita: **prohibido** `git reset --hard`, `git clean -fd`, `git checkout .` destructivo.

### Reglas permanentes (persistencia)

1. Local Mac workspace = fuente física de verdad para device validation.
2. Sin presencia en Git local identificable → no device testing.
3. Toda unidad de implementación completada **debe** quedar committeada.
4. Toda rama committeada de una unidad **debe** pushearse a `origin`.
5. `main` nunca se modifica directamente.
6. Device builds reportan: commit SHA · branch · timestamp · artifact SHA256.
7. Cambios uncommitted se reportan explícitamente.
8. Trabajo cloud/remoto **nunca** se trata como device-ready hasta sincronizar al workspace local vía Git (o transferencia explícita del artifact + registro de SHA).

## Protocolo Operativo Permanente de Ingeniería (Workflow Canónico)

Todo desarrollo sigue obligatoriamente la secuencia de 16 compuertas:

```text
INSPECT → CONTRACT GATE (Read-Only) → IMPLEMENT → TEST → RED TEAM → HARDEN → 
FOUNDATION → PR → HUMAN REVIEW → MERGE → MAIN VERIFY → PROVIDER RECONCILIATION → 
DEPLOY → LIVE BREAK TEST → CERTIFY → FREEZE
```

### Reglas de Parada Estricta (`Strict Stop`)
- **Tras Contract Gate:** No implementar sin aprobación humana del diseño.
- **Tras Red Team & Hardening:** No crear PR si existen fallos P0 o P1.
- **Tras Creación de PR:** Parar y esperar la revisión humana. **Prohibido mergear o desplegar**.
- **Tras Merge:** Sincronizar `main` localmente y conciliar proveedores antes de cualquier despliegue.
- **Tras Certificación en Vivo:** El bloque queda congelado (`FREEZE`).

Ver la especificación operativa completa en [`docs/05-architecture/ENGINEERING_OPERATING_PROTOCOL.md`](./docs/05-architecture/ENGINEERING_OPERATING_PROTOCOL.md).

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
- **Zero Lost Changes** — ver [SOURCE OF TRUTH & CHANGE PERSISTENCE](#source-of-truth--change-persistence)  

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
