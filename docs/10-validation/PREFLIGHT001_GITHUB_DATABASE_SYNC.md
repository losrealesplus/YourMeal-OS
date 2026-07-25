# PRE-FLIGHT-001 · GitHub Integration Readiness

**Fecha:** 2026-07-25  
**Repo:** raíz del monorepo (Working directory: `supabase`)  
**Alcance:** auditoría de layout/migraciones para Supabase GitHub Integration.  
**Sin modificaciones de código. Sin aplicar migraciones.**

---

## Resultado

| # | Check | Resultado |
|---|-------|-----------|
| 1 | Existe `supabase/config.toml` | **PASS** |
| 2 | Existe `supabase/migrations/` | **PASS** |
| 3 | Todas las migraciones tienen timestamp válido (`YYYYMMDDHHMMSS_*.sql`) | **PASS** |
| 4 | No existen migraciones duplicadas (mismo version prefix) | **PASS** |
| 5 | No existen conflictos de orden (orden lex = orden por timestamp) | **PASS** |
| 6 | `main` contiene todas las migraciones OP-002 | **PASS** |

**PRE-FLIGHT-001 overall:** **PASS**

El repositorio está **preparado a nivel de layout** para conectar Supabase GitHub Integration (carpeta `supabase/` en raíz, `config.toml` + `migrations/` válidas, OP-002 en `main`).

> Nota: PASS de preflight **no** implica que el proyecto live `cbeegcxkayybfncnuirg` tenga esas migraciones aplicadas (ver INFRA-001 / DEP-001).

---

## Detalle

### 1 · `supabase/config.toml`

| Campo | Valor |
|-------|--------|
| Path | `supabase/config.toml` |
| Presente | Sí |
| `project_id` | `cbeegcxkayybfncnuirg` |
| Resultado | **PASS** |

### 2 · `supabase/migrations/`

| Campo | Valor |
|-------|--------|
| Path | `supabase/migrations/` |
| Presente | Sí |
| Archivos `.sql` | 22 |
| Resultado | **PASS** |

### 3 · Timestamps válidos

Patrón exigido: `^(\d{14})_(.+)\.sql$`

| Campo | Valor |
|-------|--------|
| Inválidos | ninguno |
| Resultado | **PASS** |

### 4 · Duplicados

| Campo | Valor |
|-------|--------|
| Version prefixes duplicados | ninguno |
| Resultado | **PASS** |

### 5 · Orden

| Campo | Valor |
|-------|--------|
| Orden por nombre == orden por timestamp | Sí |
| Resultado | **PASS** |

### 6 · OP-002 en `main`

Verificado contra `origin/main`:

| Archivo | En `main` |
|---------|-----------|
| `supabase/migrations/20260725120000_op002_platform_owners_bootstrap.sql` | **PASS** |
| `supabase/migrations/20260725123000_op002_platform_owners_config.sql` | **PASS** |

| Resultado | **PASS** |

---

## Inventario de migraciones (22)

| Version | File |
|---------|------|
| `20260720164312` | `20260720164312_9137d8ab-e998-4e02-816c-63bda5634159.sql` |
| `20260720164327` | `20260720164327_63fdc61e-1100-4fa6-ad62-e2a91eb9f2b1.sql` |
| `20260720170834` | `20260720170834_2a394c23-2b57-4ded-87ae-7824d406b01e.sql` |
| `20260720210000` | `20260720210000_soft_delete_audit_feature_flags.sql` |
| `20260720220000` | `20260720220000_foundation_lock_soft_delete_rbac.sql` |
| `20260721190000` | `20260721190000_dish_infra_align_domain.sql` |
| `20260722172703` | `20260722172703_596a291b-6c2c-4e61-a38a-27760d7bc0bc.sql` |
| `20260722172737` | `20260722172737_55b5491b-422d-4966-b5df-fb5c62d8ed02.sql` |
| `20260723120000` | `20260723120000_program_draft_order_atomic.sql` |
| `20260723174724` | `20260723174724_de4a9047-5477-4932-abcc-94ce217570b3.sql` |
| `20260723183000` | `20260723183000_b2b_b2c_customer_model.sql` |
| `20260723190000` | `20260723190000_company_provision_staff_only.sql` |
| `20260723193459` | `20260723193459_41cf7a3a-71c9-4f23-8d9d-f41660ade316.sql` |
| `20260723200000` | `20260723200000_operations_workspace_statuses.sql` |
| `20260723200100` | `20260723200100_operations_transition_rpc.sql` |
| `20260724132839` | `20260724132839_f9e39003-6584-4d8b-af26-975d95c6dd20.sql` |
| `20260724132857` | `20260724132857_5f8e76e5-5e14-45a6-b36a-d890ab2e6d20.sql` |
| `20260724160000` | `20260724160000_customer_dish_favorites.sql` |
| `20260724170000` | `20260724170000_kitchen_production_batches.sql` |
| `20260724185434` | `20260724185434_2bdc2c0f-86fa-45f7-bb2a-d34dfe96ee30.sql` |
| `20260725120000` | `20260725120000_op002_platform_owners_bootstrap.sql` |
| `20260725123000` | `20260725123000_op002_platform_owners_config.sql` |

---

## Working directory (recordatorio INFRA-002)

Para Supabase → Settings → Integrations → Working directory:

```text
supabase
```
