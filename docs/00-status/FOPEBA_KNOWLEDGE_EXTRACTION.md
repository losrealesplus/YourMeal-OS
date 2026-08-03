# FOPEBA-01 · Knowledge Extraction

**Documento:** `FOPEBA_KNOWLEDGE_EXTRACTION.md`  
**Fecha:** 2026-08-03  
**Fase:** FOPEBA-01 · Knowledge Extraction  
**Estado:** ✅ **INVENTORY COMPLETE** · sin migración de archivos  
**Fuente:** YourMeal OS (`main` @ `capacitor-pass` · `400a010`)  
**Destino (futuro):** repositorio FOPEBA (framework independiente)  
**Principio:** extracción de conocimiento · **no** copiar · **no** duplicar · **no** mover

> FOPEBA nació dentro de YourMeal OS.  
> Este documento separa **conocimiento universal** de **implementación específica**.  
> YourMeal OS permanece como el primer caso de estudio y validación.

```text
YourMeal OS
        │
        ▼
descubrimiento / certificación
        │
        ▼
FOPEBA (Framework)
        │
        ▼
vuelve a gobernar
        │
        ▼
YourMeal OS (+ futuros productos)
```

---

## 0. Objetivo

Que cualquier proyecto pueda:

```text
git clone FOPEBA
        ↓
aplicar metodología
        ↓
construir cualquier producto
```

No solo YourMeal OS.

**Prohibido en esta fase:** mover archivos · borrar documentación · editar contratos YourMeal · crear scripts/runners · tocar el repo FOPEBA.

**Único entregable:** este inventario metodológico.

---

## 1. Inventario completo (por estrato)

El conocimiento FOPEBA en YourMeal OS vive en **tres estratos**:

| Estrato | Qué es | Dónde concentra |
|---------|--------|-----------------|
| **A · Epistemología** | Cómo se descubre, certifica y gobierna el conocimiento operativo | `docs/20-evidence-framework/` · `docs/18–19` · Freeze |
| **B · Ciclo de ingeniería** | DoR → Spec → Runner → Gate → PASS · Land Check | `docs/00-status/` (FLOW_*, EVIDENCE_*, FOPEBA_LAND_CHECK, DoRl) |
| **C · Instancias** | Flujos, releases, Capacitor, dominio EatClean | Specs/actas de FLOW/RELEASE/CAPACITOR · `docs/10-validation/` |

### 1.1 Constitución raíz

| Path | Clasificación | Nota |
|------|---------------|------|
| `FOUNDATION.md` | **HYBRID** | Constitución reutilizable + Native Tool Artifacts Rule · dejar punteros YourMeal |
| `AGENTS.md` | **HYBRID** | Pirámide de decisión · intentionality · roles · dejar Lovable/EatClean |
| `CHANGELOG.md` | **INFRA** | Historial |

### 1.2 Gobernanza metodológica (`docs/00-status/`)

| Path | Clasificación |
|------|---------------|
| `FOPEBA_LAND_CHECK.md` | **UNIVERSAL** |
| `EVIDENCE_BEFORE_IMPLEMENTATION.md` | **UNIVERSAL** |
| `FLOW_DEFINITION_OF_READY.md` | **UNIVERSAL** |
| `FLOW_DEFINITION_OF_DONE.md` | **HYBRID** |
| `DEFINITION_OF_RELEASE.md` | **UNIVERSAL** (DoRl) |
| `DEFINITION_OF_DONE.md` | **HYBRID** |
| `FLOW_GOVERNANCE.md` | **HYBRID** (reglas 1–9 universales) |
| `FLOW_FIRST.md` | **UNIVERSAL** |
| `FLOW_WORK_HIERARCHY.md` | **UNIVERSAL** |
| `OPERATING_MODEL_v1.md` | **HYBRID** |
| `CHANGE_AUTHORITY.md` | **HYBRID** |
| `PR_TAXONOMY.md` | **HYBRID** |
| `GIT_MILESTONE_TAGS.md` | **HYBRID** (taxonomía) |
| `FOPEBA_METRICS.md` | **UNIVERSAL** |
| `04-methodology-frozen.md` | **UNIVERSAL** |
| `DUAL_TRACK_ANTECAMARA.md` | **UNIVERSAL** |
| `OPERATIONAL_CORE_CONTRACT.md` | **HYBRID** (patrón Core) |
| `CAPACITOR_SPEC.md` | **HYBRID** (§ Contract Boundary + Core Integrity) |
| `CURRENT_PHASE.md` · `NEXT_EXECUTION_PLAN.md` · `README.md` · `MILESTONES.md` | **INFRA** (tablero vivo del proyecto) |
| `FLOW_0N_*` · `RELEASE_*` · `CAPACITOR_DOR.md` | **PROJECT_SPECIFIC** (instancias; plantillas sí) |

### 1.3 Evidence Framework (`docs/20-evidence-framework/`)

| Área | Clasificación |
|------|---------------|
| README · Knowledge States · ECL · Stability · KU · EC · G-01/G-02 · P12/P13 · Visibility | **UNIVERSAL** |
| FOV protocol | **HYBRID** (protocolo sí · plan EatClean no) |
| `reports/*` | **INFRA** / instancia |

### 1.4 Validación operativa (`docs/16–19`)

| Área | Clasificación |
|------|---------------|
| `knowledge-lifetime.md` · knowledge states · IOV pyramid | **UNIVERSAL** |
| Discovery kit (`16-operational-discovery/`) | **HYBRID** (tipos de artefacto sí · notas de campo no) |
| Operational Model (`17/`) | **HYBRID** (esqueleto OM sí · objetos meal-prep no) |
| Escenarios / findings / IVR runs | **PROJECT_SPECIFIC** |

### 1.5 Arquitectura & ingeniería

| Path | Clasificación |
|------|---------------|
| `docs/05-architecture/OPERATIONAL_LAYER_INDEPENDENCE.md` | **UNIVERSAL** |
| `docs/23-engineering/IMPLEMENTATION_PHILOSOPHY.md` | **UNIVERSAL** |
| `docs/22-implementation/PR_CHANGE_LEVELS.md` | **UNIVERSAL** |
| `docs/22-implementation/IMPLEMENTATION_RULES.md` | **HYBRID** |
| `docs/adr/0013-implementation-is-knowledge-materialization.md` | **UNIVERSAL** |
| `docs/adr/0011-diario-desarrollo-intencionalidad.md` | **UNIVERSAL** |
| ADRs 0001–0008, 0014–0019, 0032–0033 | **PROJECT_SPECIFIC** |

### 1.6 Familias de certificación (`docs/10-validation/`) — por familia

Patrón universal embebido en todas las familias maduras:

```text
DoR → Spec (FROZEN) → Runner (Land Check en main)
  → 001…N actas incrementales (CERTIFIED_THROUGH = n)
  → PASS acta → Gate CLOSED → tag *-pass
```

| Familia | Clasificación | Extraer |
|---------|---------------|---------|
| flow-01…05 | **PROJECT_SPECIFIC** (+ patrón) | 1 set exemplar Gate/Runner/PASS/00N |
| capacitor | **HYBRID** | Distribution + Core Integrity · dejar stack |
| release-smoke…rollback | **HYBRID** | Escalera DoRl · dejar escenarios |
| release-01 / beta | **PROJECT_SPECIFIC** | Instancia de producto |
| platform-stabilization | **HYBRID** | “Platform flow-ready before domain” |
| actas individuales (~80+) | **PROJECT_SPECIFIC** | No migrar corpus · solo plantillas |

---

## 2. Qué pertenece a FOPEBA (UNIVERSAL)

### 2.1 Conceptos canónicos a destilar

| Concepto | Definición operativa |
|----------|----------------------|
| **FOPEBA** | Framework para descubrir, certificar y gobernar conocimiento operativo — luego construir software |
| **Evidence before Implementation** | Spec + contrato de evidencia + Runner antes de código de dominio |
| **DoR** | Checklist que autoriza Implementation PRs |
| **Spec / Freeze** | Contrato congelado; sin Freeze no hay Runner productivo |
| **Runner** | Instrumento canónico (`test:*`) → PASS / FAIL / BLOCKED + evidencia |
| **Gate** | READY / CLOSED / NOT READY · nunca cierra porque un PR “pase” |
| **PASS / FAIL / BLOCKED** | BLOCKED ≠ defecto · significa siguiente tramo no implementado |
| **Incremental Certification** | `CERTIFIED_THROUGH=n` · una transición / PR |
| **Land Check** | Contrato aterrizado en `main` · Missing script ⇒ NOT READY |
| **PASS acta + tag `-pass`** | Cierre institucional del ciclo |
| **Contract Boundary** | START / END explícitos · fuera de bound = otro dominio |
| **Core Integrity** | Capas de distribución/infra no alteran el Core certificado |
| **Native Tool Artifacts Rule** | Artefactos IDE ≠ producto hasta aceptación explícita |
| **Flow First / Flow Governance** | Features pertenecen a Flows · pantallas no definen operación |
| **DoRl** | Certificabilidad de versión de producto por encima de Flows |
| **Change Authority** | No todas las capas son igualmente mutables · consumir ≠ redefinir |
| **Layer Independence** | Crecer arriba no reabre certificaciones inferiores |
| **Dual Track A/B** | Campo certifica conocimiento · ingeniería materializa |
| **Knowledge Lifetime** | Contract / Implementation / Iteration |
| **Methodology Freeze** | Sin evidencia de campo, no inventar metodología |
| **Knowledge States · ECL · Stability** | Ejes de conocimiento / confianza / volatilidad |
| **FOV → KU → EC → G-01** | Camino para evolucionar metodología congelada |
| **Implementation = Knowledge Materialization** | El código no origina reglas operativas |
| **PR Taxonomy · Change Levels** | Un PR · un nivel de cambio |
| **Milestone tag taxonomy** | Platform / Flow / Release-gate / Release / Distribution |
| **FOPEBA Metrics** | Métricas de proceso · no estimaciones de negocio |
| **Module capability states** | Scaffold → Connected → Operational → Field Validated |

### 2.2 Shortlist de fuentes (must extract)

```text
FOUNDATION.md                          (Native Tool Artifacts + constitución)
docs/00-status/FOPEBA_LAND_CHECK.md
docs/00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md
docs/00-status/FLOW_DEFINITION_OF_READY.md
docs/00-status/FLOW_DEFINITION_OF_DONE.md
docs/00-status/DEFINITION_OF_RELEASE.md
docs/00-status/FLOW_GOVERNANCE.md
docs/00-status/FLOW_FIRST.md
docs/00-status/FLOW_WORK_HIERARCHY.md
docs/00-status/OPERATING_MODEL_v1.md
docs/00-status/CHANGE_AUTHORITY.md
docs/00-status/PR_TAXONOMY.md
docs/00-status/GIT_MILESTONE_TAGS.md
docs/00-status/FOPEBA_METRICS.md
docs/00-status/04-methodology-frozen.md
docs/00-status/DUAL_TRACK_ANTECAMARA.md
docs/00-status/CAPACITOR_SPEC.md       (§ Contract Boundary + Core Integrity)
docs/05-architecture/OPERATIONAL_LAYER_INDEPENDENCE.md
docs/18-operational-validation/knowledge-lifetime.md
docs/20-evidence-framework/**          (capítulos núcleo)
docs/adr/0013-*.md
docs/23-engineering/IMPLEMENTATION_PHILOSOPHY.md
docs/22-implementation/PR_CHANGE_LEVELS.md
docs/22-implementation/IMPLEMENTATION_RULES.md  (bloque constitución)
```

---

## 3. Qué permanece en YourMeal OS (PROJECT SPECIFIC)

| Dominio | Ejemplos · no migrar como núcleo FOPEBA |
|---------|----------------------------------------|
| Producto / tenant | YourMeal OS · EatClean · meal-prep SaaS |
| Business Flows | FLOW-01…05 Specs/actas · Order States B1–B8 |
| Release programa | RELEASE-01 · beta · smoke/crossflow/e2e/deploy/rollback *instancias* |
| Distribution tech | Capacitor · Android Studio · Xcode · WebView (patrón sí · stack no) |
| Entidades | Dish · Recipe · Order · Party · Order Intake |
| Capabilities | CAP-001… · HP-001 · ORR · PS/FCR · RI-001 · EP-OPS |
| Stack | Supabase · RLS · Lovable · `useFmt` · soft-delete verbs |
| Brand / UX | Tenant branding · CJ-001 · BR-03 |
| Tableros vivos | `CURRENT_PHASE` · `NEXT_EXECUTION_PLAN` · milestones de producto |
| ADRs de dominio | Multi-tenant · Auth · Party · Mobile strategy |

**Rol futuro de YourMeal OS respecto a FOPEBA:**

```text
Caso de estudio #1
        +
Validación empírica del framework
        +
Ejemplares de plantillas (Flow · Release · Distribution)
```

---

## 4. Dependencias

### 4.1 Dependencias conceptuales (orden lógico FOPEBA)

```text
Epistemología (KS · ECL · Lifetime · Freeze)
        ↓
Dual Track A/B
        ↓
Evidence before Implementation
        ↓
DoR → Spec/Freeze → Runner → Incremental Cert → Land Check → Gate → PASS/Tag
        ↓
DoRl (Release axis)
        ↓
Integrity (Contract Boundary · Core Integrity · Layer Independence · Change Authority)
        ↓
Hygiene (Native Tool Artifacts · PR Taxonomy · Metrics)
```

### 4.2 Dependencias de instancia (YourMeal → FOPEBA)

| YourMeal | Depende de (universal) |
|----------|------------------------|
| FLOW-05 CERTIFIED | DoR · Runner · Gate · Land Check · Incremental Certification |
| RELEASE-01 CERTIFIED | DoRl · escalera de gates |
| CAPACITOR / `capacitor-pass` | Contract Boundary · Core Integrity · Native Tool Artifacts |
| EatClean tenant | Core Contract · Layer Independence · Brand-as-tenant (producto) |

### 4.3 Relación de repositorios (objetivo)

```text
FOPEBA (fuente de verdad metodológica)
        ↑  referencia / consume
YourMeal OS (instancia + evidencia histórica)
```

Hoy la dependencia es inversa (FOPEBA embebido). FOPEBA-01 prepara la inversión **sin romper** YourMeal.

---

## 5. Orden recomendado de migración

### Fase 0 · Inventory (esta entrega)

- Publicar este documento en YourMeal OS.  
- Congelar el mapa.  
- **No** tocar repo FOPEBA todavía.

### Fase 1 · Epistemología (máximo leverage)

Destilar: Evidence Framework (README, KS, ECL, Stability, FOV, KU, EC, G-01/G-02, P12/P13) · Knowledge Lifetime · Methodology Freeze · Dual Track · ADR 0013 · Implementation Philosophy · IOV pyramid.

### Fase 2 · Ciclo de ingeniería

Destilar (de-YourMeal): Evidence before Implementation · DoR · Flow DoD · DoRl · Flow Governance 1–9 · Flow First · Work Hierarchy · Land Check · PASS/FAIL/BLOCKED · Incremental Certification · Tag taxonomy · Metrics · PR Taxonomy · Change Levels.

### Fase 3 · Integrity & estabilidad

Change Authority · Layer Independence · Core Contract *pattern* · Contract Boundary · Core Integrity · Native Tool Artifacts · Operating Model *pattern* · Module states · Beta FAIL severity.

### Fase 4 · Plantillas desde instancias (solo ejemplos)

Un exemplar de cada:

| Tipo | Fuente sugerida |
|------|-----------------|
| Flow | FLOW-05 Gate/Runner/PASS/00N |
| Release-gate | release-smoke |
| Distribution | CAPACITOR_SPEC § Boundary + Integrity + C5 Acceptance |
| Discovery kit | esqueleto vacío de `16-operational-discovery` |
| OM skeleton | estructura de `17-operational-model` |

### Fase 5 · No migrar

Specs/actas FLOW-01…05 · RELEASE-01 producto · EatClean/Dish/Orders/CAP · ADRs de stack · tableros vivos.

### Fase 6 · FOPEBA se certifica a sí mismo

Aplicar FOPEBA a FOPEBA: DoR de paquetes metodológicos · Freeze FOPEBA vN · Land Check de docs+ejemplos · métricas de extracción · prohibir conceptos nuevos sin evidencia multi-proyecto.

---

## 6. Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Copiar carpetas en lugar de destilar | FOPEBA = clone de YourMeal | Solo conceptos + plantillas vacías · instancias como annex |
| Romper referencias en YourMeal al “mover” | Links rotos · CI docs | **No mover** · FOPEBA recibe destilados nuevos · YourMeal cita FOPEBA después |
| Sobre-extraer dominio (Dish, FLOW-05 Spec) | Framework no reutilizable | Test: “¿sirve para un ecommerce o un ERP?” |
| Sub-extraer (dejar DoR solo en YourMeal) | FOPEBA incompleto | Shortlist §2.2 + fases 1–3 |
| Duplicar verdad (dos masters) | Drift metodológico | Tras migración: FOPEBA = master · YourMeal referencia |
| Migrar runners/scripts | Acoplamiento a Node/Vite/Capacitor | FOPEBA-01 = conocimiento · runners en fase posterior como *adapters* |
| Perder historia de validación | Menos confianza en FOPEBA | Conservar YourMeal como caso de estudio #1 |
| Abrir MOBILE-RELEASE-01 y FOPEBA-01 a la vez | Contaminación de foco | Secuenciar: cerrar extracción documentada → luego Mobile o extracción Fase 1 |

---

## 7. Conocimiento duplicado

| Conocimiento | Repetido en | Acción en FOPEBA |
|--------------|-------------|------------------|
| Evidence before Implementation | `EVIDENCE_*` · Governance R7 · DoR · Specs · CURRENT_PHASE | Un solo capítulo Engineering Cycle |
| PASS / FAIL / BLOCKED | DoR · cada Runner · Specs | Página canónica de semántica |
| Land Check / Merged ≠ main | Land Check · Governance R9 · Specs | Un estándar Land Check |
| DoR checklist | `FLOW_DEFINITION_OF_READY` · cada `*_DOR.md` | Template + instancias en proyectos |
| Spec→Freeze→Runner→Acta | DoR · Governance R8 · Metrics · Tags | Un diagrama de lifecycle |
| Methodology Freeze | `04-methodology-frozen` · Acta closed · AGENTS · Dual Track | Capítulo Freeze Governance |
| Implementation materializa | ADR 0013 · Philosophy · Rules · Dual Track | Un capítulo epistemología |
| Flow First / orphan PRs | FLOW_FIRST · Governance · PR_TAXONOMY | Flow Governance unificado |
| Core Integrity / Boundary | CAPACITOR_SPEC · runners · planes | Elevado a Integrity Domains |
| Native Tool Artifacts | FOUNDATION · Land Check · Tags | Foundation + cita Land Check |
| Roles de herramientas | AGENTS · CTO · Philosophy · ADR 0012 | Roles abstractos (sin Lovable obligatorio) |
| Tableros de fase | CURRENT_PHASE · README · MILESTONES | Solo *template* Phase Lifecycle en FOPEBA |

---

## 8. Conocimiento faltante (gaps FOPEBA)

1. **Canonical Engineering Cycle** — unificado (hoy partido entre docs “que complementan FOPEBA”).  
2. **Runner Protocol standard** — schema JSON · exit codes · `duplicates/missing/out_of_order` · `--live` vs runner-only.  
3. **Incremental Certification Protocol** — formalizar `CERTIFIED_THROUGH` · PASS parcial · apertura de `001`.  
4. **Gate Protocol** — estados READY / CLOSED / NOT READY · “Gate never closes because a PR passes”.  
5. **DoRl first-class** — certificación de versión por encima de Flows.  
6. **Domain taxonomy** — Business / Platform / Release / Distribution + Integrity por dominio.  
7. **Land Check primitive** — fetch-tags · restore evidence · clean tree · Native Tool Artifacts.  
8. **FOPEBA Metrics v1** — plantillas vacías (v0 existe, poco rellenado).  
9. **PR / Change governance pack** portable.  
10. **Operating Model constitution template** sin capas YourMeal.  
11. **Worked-example annex policy** — cómo citar instancias sin importarlas.  
12. **FOUNDATION vs AGENTS packaging** — constitución global vs constitución de proyecto.  
13. **Evidence store conventions** — dónde viven actas/JSON · lifetime Iteration.  
14. **Transfer tests** — ¿sobrevive la metodología sin el autor? (IOV aplicado a FOPEBA).  
15. **Multi-project adoption guide** — `git clone FOPEBA` → primer DoR en producto nuevo.

---

## 9. Mapa conceptual final

```text
                    ┌─────────────────────────┐
                    │         FOPEBA          │
                    │  (conocimiento universal)│
                    └────────────┬────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           │                     │                     │
           ▼                     ▼                     ▼
   Epistemología          Ciclo ingeniería        Integrity
   KS · ECL · Freeze      DoR→Spec→Runner         Boundary
   Dual Track · FOV       Gate→PASS→Tag           Core Integrity
   Lifetime · IOV         Land Check · DoRl       Layer Indep.
                          Incremental Cert        Change Authority
                          Native Tool Artifacts
                                 │
                                 │ gobierna
                                 ▼
                    ┌─────────────────────────┐
                    │      YourMeal OS        │
                    │   (primer caso real)    │
                    ├─────────────────────────┤
                    │ FLOW-01…05              │
                    │ RELEASE-01              │
                    │ CAPACITOR / Distribution│
                    │ EatClean · Dish · Orders│
                    └─────────────────────────┘
                                 │
                                 │ patrón reutilizable
                                 ▼
                    ┌─────────────────────────┐
                    │   Próximo producto      │
                    │   (FOPEBA desde día 0)  │
                    └─────────────────────────┘
```

### Lectura del mapa

```text
Antes:   FOPEBA ⊂ YourMeal OS   (descubrimiento)
Ahora:   FOPEBA-01 inventory     (separación consciente)
Después: YourMeal OS ⊃ FOPEBA   (referencia) · FOPEBA ⊄ YourMeal
```

### Criterio de clasificación (permanente)

| Pregunta | Si SÍ | Si NO |
|----------|-------|-------|
| ¿Sirve en un producto que no sea meal-prep / YourMeal? | → FOPEBA | → YourMeal |
| ¿Nombra un Flow, Release, tenant o entidad de negocio concreta? | → YourMeal (o exemplar) | → FOPEBA |
| ¿Define semántica PASS/FAIL/BLOCKED, DoR, Land Check, Freeze? | → FOPEBA | — |
| ¿Es un tablero vivo de “dónde estamos”? | → YourMeal INFRA | — |

---

## Next (fuera de FOPEBA-01)

```text
FOPEBA-01 ✅ Knowledge Extraction (este documento)
        ↓
FOPEBA-02 · Epistemology package (Fase 1) en repo FOPEBA
        ↓
FOPEBA-03 · Engineering Cycle package (Fase 2)
        ↓
YourMeal OS actualiza referencias → FOPEBA master
        ↓
(paralelo producto) MOBILE-RELEASE-01 DoR
```

---

## End of FOPEBA-01 Knowledge Extraction
