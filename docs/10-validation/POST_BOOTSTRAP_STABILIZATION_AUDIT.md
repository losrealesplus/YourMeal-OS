# POST-BOOTSTRAP STABILIZATION AUDIT

**Code:** STABILIZATION AUDIT · POST-BOOTSTRAP  
**Date:** 2026-07-25  
**Scope:** Ecosystem consistency after clean Supabase bootstrap  
**Mode:** Diagnosis only — no code changes, no PR, no fixes applied by this audit  
**Evidence base:** `main` @ `d986eef` (PR #64 merged) · open PR #65 (milestone docs, not merged) · repo scan · prior live probes on legacy project

---

## Executive Summary

El bootstrap de esquema en el proyecto nuevo **`djangucecsphnejplvic` está validado** (`Finished supabase db push`, 22 migraciones, fix RLS + CI en `main`).

El ecosistema **no está estabilizado**. El bloqueador dominante ya no es migraciones: es **desalineación runtime**.

| Capa | Estado | Evidencia |
|------|--------|-----------|
| Migraciones / schema vacío | ✅ PASS | `db push` completo; PR #64 en `main` |
| CI Migration Bootstrap | ✅ PASS | Workflow en `main`; checks verdes en #64 |
| Binding app → Supabase | ❌ FAIL | `.env` + `config.toml` → **`cbeegcxkayybfncnuirg`** (legacy) |
| `.env.example` | ❌ MISSING | No existe |
| Cutover / seed Day-0 + OP-002 en proyecto nuevo | ⏳ UNVERIFIED | No hay evidencia Studio/service-role en este entorno |
| Gestión SaaS / Operaciones UI | ⏳ BLOCKED hasta roles | RBAC exige `user_roles` + `platform_owners` + tenant + Auth users |
| Generated types | ⚠ DRIFT | `types.ts` sin tablas/RPCs recientes |
| Foundation Lock principios | ⚠ PARTIAL | Soft-delete/RBAC vivos; policies solapadas post-B2B; types/module debt |

**Veredicto AUD-010 (anticipado):** se puede continuar desarrollo de módulos **solo después** de cutover de env + verificación Studio + seed de owners; de lo contrario se depurará el proyecto equivocado otra vez.

---

## AUD-003 · Pull Requests

Estado GitHub al momento de la auditoría:

| PR | Estado |
|----|--------|
| #64 | **MERGED** |
| #65 | **OPEN** (draft) — acta Clean Bootstrap + docs consolidados |
| #59–#63 | **CLOSED** (no merged; docs viven en #65) |

### PR #59 — AUD-002 Auth Session & RBAC Runtime

| Campo | Valor |
|-------|--------|
| Objetivo | Explicar por qué Platform Owners navegan como customer |
| Problema | `user_roles = []` → `isCustomer` → `/app`; OP-002 ausente en live legacy |
| ¿Sigue siendo necesario? | **Sí el conocimiento** (patrón RBAC). El live legacy ya no es el destino. |
| Decisión | **Descartar el PR** (ya cerrado). **Conservar doc vía merge #65**. No reabrir. |

### PR #60 — DEP-001 Runtime Schema Sync

| Campo | Valor |
|-------|--------|
| Objetivo | Diff migraciones Git vs schema live |
| Problema | Drift/OP-002 missing en `cbeegcx…` |
| ¿Sigue siendo necesario? | Histórico. Superseded por bootstrap limpio en `djangu…`. |
| Decisión | **Cerrado OK**. Contenido en #65 como evidencia. No merge aislado. |

### PR #61 — INFRA-001 Migration History

| Campo | Valor |
|-------|--------|
| Objetivo | Inferir corte en `schema_migrations` del proyecto viejo |
| Problema | Historial opaco / PostgREST 406 |
| ¿Sigue siendo necesario? | Histórico. |
| Decisión | **Cerrado OK**. Conservar en #65. |

### PR #62 — PRE-FLIGHT-001 GitHub DB Sync

| Campo | Valor |
|-------|--------|
| Objetivo | Readiness de layout `supabase/` para integración |
| Problema | Precondiciones de sync |
| ¿Sigue siendo necesario? | Cumplido por `db push` real + CI. |
| Decisión | **Cerrado OK**. Conservar en #65. |

### PR #63 — Supabase CLI env audit

| Campo | Valor |
|-------|--------|
| Objetivo | IPv6 / `SUPABASE_PROJECT_ID` override / caches |
| Problema | Falsos positivos de red + ref antiguo |
| ¿Sigue siendo necesario? | **Sí como runbook permanente**. |
| Decisión | **Cerrado OK**. **Merge #65** para institucionalizar el doc. No reabrir #63. |

### PR #64 — companies RLS teardown + Migration Bootstrap CI

| Campo | Valor |
|-------|--------|
| Objetivo | Fix 42710 + gate empty-DB |
| Estado | **MERGED** — acción completada |

### PR #65 — Clean Bootstrap Verified milestone

| Campo | Valor |
|-------|--------|
| Objetivo | Acta FOPEBA + consolidación docs #59–#63 |
| ¿Sigue siendo necesario? | **Sí** |
| Decisión | **Merge** (undraft + merge). No dividir. |

---

## AUD-004 · Supabase consistency

### Hallazgos

| ID | Severidad | Hallazgo | Evidencia |
|----|-----------|----------|-----------|
| S-01 | **CRITICAL** | App/CLI env apuntan al proyecto **legacy** | `.env`: `SUPABASE_PROJECT_ID`, `SUPABASE_URL`, `VITE_*` = `cbeegcxkayybfncnuirg` |
| S-02 | **CRITICAL** | `supabase/config.toml` `project_id` = legacy | `supabase/config.toml` L1 |
| S-03 | HIGH | No existe `.env.example` | glob: ausente |
| S-04 | HIGH | `SUPABASE_PROJECT_ID` en `.env` puede pisar `.temp/project-ref` en CLI | Documentado en CLI audit; issue supabase/cli#2915 |
| S-05 | MEDIUM | `config.toml` mínimo (1 línea) — no es `supabase init` completo | Lovable origin |
| S-06 | MEDIUM | CI bootstrap existe; no hay workflow de deploy remoto | `.github/workflows/migration-bootstrap.yml` only |
| S-07 | LOW | Seeds/scripts usan env vars correctas por nombre, no refs hardcodeados de URL | `seed-*.mjs`, `bootstrap-verify.mjs` |
| S-08 | INFO | 22 migraciones en repo; tenant seed SQL incluye `eatclean-tenerife` | `20260720164312_…sql` INSERT tenants |
| S-09 | INFO | `platform_owners` insertados por migración OP-002 config | `20260725123000_…sql` |

### Referencias al proyecto antiguo (no-doc)

| Ubicación | Ref |
|-----------|-----|
| `.env` | `cbeegcxkayybfncnuirg` (todas las vars Supabase) |
| `supabase/config.toml` | `cbeegcxkayybfncnuirg` |

Docs/evidence bajo `docs/10-validation/**` (rama #65) mencionan el legacy a propósito (histórico). No son binding runtime.

### Secrets

- Publishable keys presentes en `.env` del workspace (legacy project).  
- **No** se encontró `service_role` / `sb_secret` en el repo scaneado.  
- Recomendación: rotar keys del proyecto legacy si se abandonó; emitir keys nuevas solo en secret store / Lovable Cloud del proyecto nuevo.

---

## AUD-005 · Lovable / aplicación

### Arquitectura de auth (evidencia)

| Pieza | Comportamiento |
|-------|----------------|
| Client | `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` (`src/integrations/supabase/client.ts`) |
| Customer OAuth | Lovable `signInWithOAuth` → `supabase.auth.setSession` |
| Ops login | Supabase password en `/auth/admin` |
| Roles | Lectura directa `user_roles` en `useAuth` (no React Query) |
| Bootstrap owners | RPC `ensure_platform_owner_session` (allowlist en tabla `platform_owners`) |

### Hallazgos SaaS / Operaciones

| ID | Severidad | Hallazgo | Implicación |
|----|-----------|----------|-------------|
| L-01 | **CRITICAL** | Runtime Lovable/app sigue en proyecto **viejo** vía `.env` | Aunque el schema nuevo esté perfecto, la UI no lo usa |
| L-02 | **CRITICAL** | Sin filas en `user_roles` → `isCustomer` → `/app` | Gestión SaaS/Ops no se muestran |
| L-03 | **CRITICAL** | `ensure_platform_owner_session` exige email en `platform_owners` + tenant `eatclean-tenerife` + Auth user | Schema solo no basta |
| L-04 | HIGH | Fallo de ensure se traga (`.catch` + `ok:false` ignorado) | Degradación silenciosa a customer |
| L-05 | HIGH | Route guards no re-invocan ensure; solo leen `user_roles` | Race / primer hit a `/saas` o `/admin` puede redirigir a `/app` |
| L-06 | MEDIUM | Owner bootstrap otorga `saas_admin`+`company_admin` → `homePath=/admin` no `/saas` | SaaS visible vía entry secundario; no es bug si se entiende |
| L-07 | MEDIUM | Mensaje de error del client: “Connect Supabase in Lovable Cloud” | Cutover debe hacerse también en Lovable Cloud wiring |
| L-08 | LOW | No existen símbolos `isOps`/`isSaaS`; usar `isStaff`/`isSaasAdmin` | Claridad de auditoría |

### ¿Debería funcionar Gestión SaaS / Operaciones ahora?

**No asumir que sí.** Condiciones mínimas de evidencia (todas necesarias):

1. App apunta a `djangucecsphnejplvic` (env + Lovable Cloud).  
2. Migraciones aplicadas (✅ reportado).  
3. Tenant `eatclean-tenerife` existe (✅ en migración foundation — verificar en Studio).  
4. `platform_owners` tiene owners activos (✅ INSERT en migración OP-002 — verificar).  
5. Existe `auth.users` con email allowlisted.  
6. Login ejecuta ensure → aparecen roles en `user_roles`.  
7. `/admin` y entry SaaS visibles según roles.

Sin (1) y (5)–(6), la UI **seguirá** comportándose como en AUD-002.

---

## AUD-006 · Runtime orphans / drift

### Conectados (muestra)

`delivery_groups`, `kitchen_production_batches`, `customer_dish_favorites`, `platform_owners` (vía scripts/RPC), `transition_order_status`, `program_draft_order`, `ensure_platform_owner_session`, `ensure_individual_customer`, `resolve_delivery_group`, `generate_company_code`.

### Candidatos huérfanos (sin `.from`/uso en `src`/`scripts`)

| Objeto | Notas |
|--------|-------|
| `suppliers` | Schema + FK ingredients; sin UI |
| `payments` | Sin callers |
| `promotions` | Ruta stub / feature-flag; sin query |
| `customer_allergies` | Policies sí; app no |
| `tenant_domains` | Foundation; sin app |

### Código muerto / scaffold

| Path | Notas |
|------|-------|
| `src/services/placeholders.ts` | Accounting/Inventory/… sin consumidores |
| `src/lib/mock-admin.ts` | Legacy, sin imports TS |
| `SupabaseDishRepository` class export | Runtime usa otro factory |

### Riesgos de schema runtime

| ID | Severidad | Hallazgo |
|----|-----------|----------|
| R-01 | HIGH | `src/integrations/supabase/types.ts` desactualizado vs migraciones (faltan tablas/RPCs/enums/columnas B2B) |
| R-02 | HIGH | Policies solapadas: B2B `companies_read`/`cloc_read`… + migraciones posteriores `companies_select_staff` / `cloc_all` sin dropear las de B2B → OR permisivo |
| R-03 | MEDIUM | Comentario TODO en `order-repository` sobre RPC “pending” mientras la migración ya existe |

---

## AUD-007 · Foundation Lock

ADR 0009 exige: Runtime RBAC en rutas, soft-delete, Service→Repository→Supabase, typed errors, módulos, ADRs para cambios arquitectónicos.

| Principio | Evaluación | Notas |
|-----------|------------|-------|
| Runtime RBAC en rutas | ✅ / ⚠ | Guards existen; bootstrap roles incompleto bloquea paths |
| Soft-delete | ✅ | Migraciones foundation + services archive/restore pattern |
| Service → Repository → Supabase | ⚠ | Mayoría de módulos OK; placeholders y atajos cast `as never`/TODO |
| Typed domain errors | ⚠ | Parcial; types generados stale debilitan el contrato |
| Cambios con ADR | ✅ tendencia | B2B ADR 0015/0016; OP-002 config-driven |
| Desviación post-migraciones | ⚠ | Stack de policies redundantes contradice intención “staff-only” de migraciones late |
| `packages/events` inactive | ✅ conforme ADR | Sigue scaffold |

**Desviación principal:** evolución RLS (Foundation → B2B → staff rename) sin teardown completo en capas posteriores → posible **permisividad mayor** de la documentada. No invalida Foundation Lock, pero erosiona su garantía de least-privilege.

---

## AUD-008 · Technical debt (prioritized)

### CRITICAL

1. Cutover `.env` / Lovable Cloud / `config.toml` → `djangucecsphnejplvic`.  
2. Verificar Auth users + seed/ensure Platform Owners en el proyecto nuevo.  
3. Confirmar en Studio checklist del bootstrap (tablas, RLS, RPCs, `platform_owners`).

### HIGH

4. Regenerar `src/integrations/supabase/types.ts` desde el proyecto nuevo.  
5. Auditoría/teardown de policies solapadas (`companies_*`, `cloc_*`, `cdept_*`, `cemp_*`, ingredients staff rename).  
6. Añadir `.env.example` sin secretos (nombres de vars + project ref placeholder).  
7. Surface UI/logging cuando `ensure_platform_owner_session` devuelve `ok:false`.  
8. Merge PR #65 (conocimiento FOPEBA).

### MEDIUM

9. Ignorar `supabase/.temp` en `.gitignore`.  
10. Separar `SUPABASE_PROJECT_ID` de tooling CLI vs Vite (evitar override accidental).  
11. Limpiar placeholders/`mock-admin` o marcarlos EXPLICITAMENTE fuera de piloto.  
12. Required GitHub branch protection para Migration Bootstrap checks.  
13. Decidir destino del proyecto legacy (archive / freeze / delete).

### LOW

14. Tablas sin UI (`suppliers`, `payments`, …) — documentar “schema ahead of product” o diferir.  
15. Alinear comentarios TODO obsoletos en repositories.  
16. Expandir `config.toml` si se quiere local `supabase start` más predecible.

---

## AUD-009 · Pilot readiness (evidence-only)

| Área | Rating | Evidencia |
|------|--------|-----------|
| Infraestructura | **PASS** (schema) / **FAIL** (binding) | `db push` OK; env legacy |
| Backend (Edge/RPC) | **PARTIAL** | RPCs en migraciones; uso app parcial; types drift |
| Base de datos | **PASS** schema nuevo | 22 migraciones; Studio checklist ⏳ |
| Autenticación | **UNVERIFIED** en proyecto nuevo | Depende de Auth users + keys nuevas |
| RLS | **PARTIAL** | Enabled by migrations; overlap policies ⚠ |
| Operaciones (UI) | **BLOCKED** hasta roles+cutover | Guards + empty roles pattern |
| SaaS (UI) | **BLOCKED** hasta `saas_admin`+cutover | Idem |
| Frontend | **PARTIAL** | Código presente; apunta al proyecto viejo |
| Deployment | **PARTIAL** | Lovable + manual; no deploy workflow DB remoto |
| CI | **PASS** bootstrap gate | `migration-bootstrap.yml` on `main` |
| Bootstrap | **PASS** schema / **PENDING** Day-0 ops | Schema verified; seed/cutover no |
| Observabilidad | **LOW** | `audit_log` wired; no APM/error tracking evidenciado en este audit |

---

## AUD-010 · Release recommendation

### ¿Puede continuar el desarrollo normalmente?

**No todavía** — no para features que asuman el proyecto nuevo como runtime.

Desarrollo de UI/dominio **desacoplado** puede seguir, pero cualquier prueba “contra Supabase” hoy puede estar validando **`cbeegcxkayybfncnuirg`**.

### ¿Bloqueadores?

1. **Cutover de binding** (env + Lovable + config.toml).  
2. **Identidad operativa** (Auth user allowlisted + ensure roles).  
3. **Verificación Studio** del proyecto nuevo (aún checklist abierta).

### ¿Riesgos ocultos?

1. Policies OR-solapadas más permisivas de lo esperado.  
2. Types stale → bugs silenciosos / casts.  
3. Ensure swallow → “parece customer” otra vez (mismo síntoma AUD-002, nueva causa: proyecto/seed).  
4. Dos proyectos vivos → confusión de datos/seeds.

### Antes del siguiente módulo

1. Merge #65.  
2. Cutover env + Lovable Cloud al `djangu…`.  
3. Studio checklist + `migration list` en nuevo.  
4. Crear/login owner allowlisted; confirmar `user_roles`.  
5. Smoke: `/auth/admin` → Ops; entry SaaS visible.  
6. Regenerar types.  
7. (Recomendado) plan de teardown de policies redundantes — PR dedicado Infrastructure.

---

## AUD-011 · Operational Knowledge Capture

Qué institucionalizar (sin generar docs en este audit):

| Conocimiento | Clasificación | Notas |
|--------------|---------------|-------|
| Redefinir RLS exige teardown explícito (Foundation→B2B) | **Engineering Guideline** + **CI Automation** | Ya parcialmente en Migration Bootstrap Validation |
| Empty-DB `db reset` / `db start` como gate de merge | **CI Automation** + **Validation** | Ya en workflow; falta branch protection |
| `SUPABASE_PROJECT_ID` env override > `.temp` | **Runbook** | Contenido en CLI audit (#65) |
| Direct DB host IPv6-only; pooler IPv4 | **Runbook** | Idem |
| Binding app (`.env`/Lovable) ≠ link CLI | **SPEC** (environment matrix) | Una página “Active Supabase project” |
| Schema apply ≠ RBAC usable (roles/seed) | **Validation** + **Runbook** | Day-0 / OP-002 checklist |
| Platform owners config-driven (`platform_owners` + JSON) | **SPEC** (ya OP-002) | Mantener; no hardcode en frontend |
| Diagnóstico legacy drift (DEP/INFRA) | **Validation** (histórico) | Conservar evidence pack; no ADR nuevo |
| Policies solapadas post-evolución | **ADR** (candidato) o **Engineering Guideline** | “RLS redefine protocol” |
| Types generation after migrate | **Engineering Guideline** | `supabase gen types` en checklist post-push |
| Dual Lovable OAuth + Supabase password | **SPEC** (auth surfaces) | Ya implícito; explicitar en auth runbook |
| Cerrar PRs de investigación tras consolidar | **Validation** process | Hecho #59–#63 → #65 |
| No conservar: hipótesis “IPv6 es la causa raíz” como verdad | **No conservar** | Fue síntoma/confusor |

---

## Findings (índice consolidado)

| ID | Área | Sev | Resumen |
|----|------|-----|---------|
| S-01/S-02 | Supabase | CRITICAL | Env + config.toml → proyecto legacy |
| L-01–L-03 | Lovable/App | CRITICAL | Cutover + roles/seed requeridos para SaaS/Ops |
| R-01 | Runtime | HIGH | `types.ts` drift |
| R-02 | Runtime/RLS | HIGH | Policies solapadas |
| L-04/L-05 | Auth UX | HIGH | Ensure silencioso / guards sin ensure |
| S-03 | Supabase | HIGH | Sin `.env.example` |
| FL-* | Foundation | MEDIUM | Least-privilege erosion por policy stack |
| ORPH-* | Runtime | LOW–MED | Tablas/servicios sin consumidores |

---

## Risks

1. **Seguir desarrollando contra el proyecto viejo** creyendo que el nuevo está “en uso”.  
2. **Repetir AUD-002** (customer shell) por falta de seed/Auth en el nuevo.  
3. **Falsa sensación de seguridad RLS** por policies redundantes.  
4. **Regresiones de tipos** en órdenes B2B / ops transitions.  
5. **Pérdida de conocimiento** si #65 no se mergea (docs solo en rama).

---

## Evidence

| Hecho | Fuente |
|-------|--------|
| PR #64 merged; CI bootstrap on `main` | `git log` `d986eef`; `.github/workflows/migration-bootstrap.yml` |
| 22 migraciones | `supabase/migrations/` count |
| `db push` finished on empty project | Declaración operativa usuario 2026-07-25 + milestone draft #65 |
| `.env` → `cbeegcxkayybfncnuirg` | `.env` L1–L6 |
| `config.toml` → legacy | `supabase/config.toml` |
| No `.env.example` | filesystem |
| PRs #59–#63 closed; #65 open | `gh pr list` |
| RBAC empty→customer | `src/hooks/use-auth.ts` |
| Platform owner RPC requirements | migrations OP-002 + `ensure-platform-owner-session.ts` |
| Types missing new objects | `src/integrations/supabase/types.ts` vs migrations |
| Policy overlap companies/cloc | migrations `20260723183000`, `20260723193459`, `20260724132839` |
| Studio live verify nuevo proyecto | **Not executed here** (no service-role / MCP auth) |

---

## Recommendations (ordered)

1. **Merge PR #65** (acta + audits consolidados).  
2. **Cutover binding** a `djangucecsphnejplvic` (`.env`, Lovable Cloud, `config.toml`).  
3. **Studio verification checklist** (tablas, RLS, functions, `platform_owners`, migration history).  
4. **Auth user + login owner** → confirmar `user_roles` y shells Ops/SaaS.  
5. **`supabase gen types`** → commit types alineados.  
6. **PR Infrastructure:** teardown de policies redundantes (least privilege).  
7. **`.env.example` + `.gitignore` `.temp`**.  
8. **Branch protection** required checks Migration Bootstrap.  
9. Congelar/archivar proyecto legacy tras cutover.  
10. Solo entonces: siguiente módulo de producto.

---

## Checklist final

| # | Item | Status |
|---|------|--------|
| 1 | Schema bootstrap empty project | ✅ Done |
| 2 | RLS companies_read conflict fixed (#64) | ✅ Done |
| 3 | Migration Bootstrap CI on `main` | ✅ Done |
| 4 | Merge FOPEBA milestone/docs (#65) | ☐ |
| 5 | Cutover `.env` / Lovable / `config.toml` → new project | ☐ |
| 6 | Studio verification new project | ☐ |
| 7 | Platform Owner login → roles present | ☐ |
| 8 | SaaS + Ops shells smoke | ☐ |
| 9 | Regenerate Supabase types | ☐ |
| 10 | Policy overlap remediation plan | ☐ |
| 11 | `.env.example` + ignore `.temp` | ☐ |
| 12 | Required CI checks on `main` | ☐ |
| 13 | Legacy project disposition | ☐ |

---

## Appendix · Scope limits

- No se modificó código.  
- No se creó PR desde este audit.  
- No se aplicaron fixes.  
- No se verificó Dashboard Studio del proyecto nuevo desde este entorno (sin `SUPABASE_SERVICE_ROLE_KEY` / MCP Supabase sin auth).  
- Evidencia de `db push` exitoso: reportada por el operador; coherente con merge #64 y CI empty-DB PASS.
