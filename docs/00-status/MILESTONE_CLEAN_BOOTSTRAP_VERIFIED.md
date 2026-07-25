# Milestone · Clean Bootstrap Verified

**Estado:** ✅ **VERIFIED** (evidencia operativa 2026-07-25)  
**Nombre corto:** Primer bootstrap limpio verificado  
**Proyecto Supabase destino:** `djangucecsphnejplvic`  
**Evidencia primaria:** `Finished supabase db push.` (22 migraciones, proyecto vacío → esquema completo)

---

## Definición cumplida

> YourMeal OS puede materializar su esquema completo **desde cero** en un proyecto Supabase nuevo, con historial de migraciones coherente y sin parches manuales en Studio.

```text
Repo (22 migrations)
        ↓
supabase db push  (proyecto vacío)
        ↓
schema + RLS + functions/triggers
        ↓
✅ Bootstrap limpio verificado
```

---

## Por qué es un hito FOPEBA (no solo un “fix”)

No fue un fallo de infraestructura. Fue un caso de **Knowledge Evolution** en el historial de migraciones:

```text
Foundation Lock
        ↓
Redefinición de RLS (companies_*)

↓

B2B Customer Model
        ↓
Redefinición de RLS (más rica)

↓

Faltó teardown explícito de la definición anterior

↓

Bootstrap limpio → SQLSTATE 42710 (companies_read already exists)

↓

Auditoría → teardown + comentario metodológico

↓

db push completo

↓
Gate CI: Migration Bootstrap Validation
```

**Lección permanente:** cuando una migración **redefine** comportamiento previo, debe declarar el **teardown** de la definición anterior. Un despliegue desde cero y una actualización incremental deben converger al mismo estado.

Método / CI: [MIGRATION_BOOTSTRAP_VALIDATION](../10-validation/MIGRATION_BOOTSTRAP_VALIDATION.md) · PR #64

---

## Secuencia real de diagnóstico (sesión 2026-07-25)

Hipótesis inicial errónea: “Supabase / IPv6 no funciona”.

Secuencia real:

```text
Proyecto Supabase antiguo (cbeegcxkayybfncnuirg)
        ↓
.env + config.toml + SUPABASE_PROJECT_ID → proyecto viejo
        ↓
CLI resolvía el ref equivocado (env > .temp)
        ↓
Síntomas IPv6 / sugerencia de link al ref antiguo
        ↓
Alineación de project_ref al nuevo (djangucecsphnejplvic)
        ↓
CLI conecta
        ↓
Aparece el problema real: conflicto entre migraciones
        ↓
Corrección teardown companies_*
        ↓
Finished supabase db push
```

Auditoría CLI (permanente): [SUPABASE_CLI_ENV_AUDIT](../10-validation/SUPABASE_CLI_ENV_AUDIT.md)

---

## Evidencia de cierre

| Criterio | Estado | Notas |
|----------|--------|-------|
| 22 migraciones aplicadas en proyecto vacío | ✅ | `Finished supabase db push.` |
| Historial de migraciones coherente | ✅ | Cadena ordenada sin abort |
| Conflicto `companies_read` resuelto | ✅ | Teardown en `20260723183000_…` · PR #64 |
| CLI / pooler / proyecto nuevo operativos | ✅ | Tras alineación de ref |
| Gate CI Migration Bootstrap Validation | ✅ | Checks verdes en PR #64 (static + empty DB) |
| Docs de auditoría consolidados en repo | ✅ | Ver índice abajo |
| App `.env` cutover al proyecto nuevo | ⏳ | Pendiente decisión de cutover runtime |
| Verificación Studio (tablas / RLS / RPCs / `platform_owners`) | ⏳ | Checklist abajo — ejecutar en Dashboard |

---

## Checklist Studio (post-push)

Ejecutar en [Dashboard · djangucecsphnejplvic](https://supabase.com/dashboard/project/djangucecsphnejplvic):

| # | Comprobación | Resultado |
|---|--------------|-----------|
| 1 | Tablas núcleo presentes (`tenants`, `companies`, `customers`, `dishes`, `orders`, `delivery_groups`, `platform_owners`, …) | ☐ |
| 2 | RLS enabled en tablas `public` expuestas | ☐ |
| 3 | Policies `companies_read` / `companies_write` / `companies_insert` (modelo B2B) | ☐ |
| 4 | Funciones esperadas (`ensure_individual_customer`, `program_draft_order`, `ensure_platform_owner_session`, …) | ☐ |
| 5 | `platform_owners` existe; filas tras `npm run seed:platform-owners` (si aplica) | ☐ |
| 6 | `supabase_migrations.schema_migrations` refleja las 22 versiones | ☐ |

---

## PRs de esta campaña

| PR | Rol | Decisión de cierre |
|----|-----|-------------------|
| **#64** | Fix teardown + CI Migration Bootstrap | **Merge** (CI verde; validado con `db push` real) |
| #63 | Auditoría CLI env / IPv6 / project-ref | Docs **consolidados** aquí → cerrar draft |
| #62 | PRE-FLIGHT GitHub DB sync | Cumplido por bootstrap real + CI → cerrar draft |
| #61 | INFRA-001 migration history (proyecto viejo) | Evidencia histórica consolidada → cerrar draft |
| #60 | DEP-001 schema sync (proyecto viejo) | Superseded por bootstrap limpio → cerrar draft |
| #59 | AUD-002 Auth/RBAC runtime | Docs **consolidados** aquí → cerrar draft (seguimiento runtime aparte) |

---

## Siguiente (fuera de este hito)

1. Merge de PR #64 a `main` (undraft + merge).  
2. Cutover de `.env` / `VITE_*` al proyecto `djangucecsphnejplvic` cuando se decida abandonar el runtime antiguo.  
3. Completar checklist Studio + seed OP-002 Platform Owners.  
4. Activar required status checks del workflow Migration Bootstrap Validation en `main`.

---

## Relacionado

- [MIGRATION_BOOTSTRAP_VALIDATION](../10-validation/MIGRATION_BOOTSTRAP_VALIDATION.md)  
- [SUPABASE_CLI_ENV_AUDIT](../10-validation/SUPABASE_CLI_ENV_AUDIT.md)  
- [AUD002_AUTH_SESSION_RBAC_RUNTIME](../10-validation/AUD002_AUTH_SESSION_RBAC_RUNTIME.md)  
- [DEP001_RUNTIME_SCHEMA_SYNC](../10-validation/DEP001_RUNTIME_SCHEMA_SYNC.md)  
- [INFRA001_MIGRATION_HISTORY](../10-validation/INFRA001_MIGRATION_HISTORY.md)  
- [PREFLIGHT001_GITHUB_DATABASE_SYNC](../10-validation/PREFLIGHT001_GITHUB_DATABASE_SYNC.md)  
- [OP002_PLATFORM_OWNER_BOOTSTRAP](../10-validation/OP002_PLATFORM_OWNER_BOOTSTRAP.md)  
