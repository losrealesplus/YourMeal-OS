# INFRA-001 · Migration History Audit

**Fecha:** 2026-07-25  
**Proyecto:** `cbeegcxkayybfncnuirg`  
**Alcance:** solo auditoría. Sin SQL de escritura. Sin aplicar migraciones. Sin cambios de código.

---

## Consulta directa a `supabase_migrations.schema_migrations`

| Intento | Resultado |
|---------|-----------|
| `GET /rest/v1/schema_migrations` + `Accept-Profile: supabase_migrations` | **HTTP 406** — `Invalid schema: supabase_migrations` (solo expuestos: `public`, `graphql_public`) |
| `SUPABASE_SERVICE_ROLE_KEY` / DB URL / `supabase migration list --linked` | **No disponible** en este entorno |
| Supabase MCP | `needsAuth` (no usable aquí) |

**Conclusión:** no se pudo leer el historial oficial `supabase_migrations.schema_migrations` desde este agente.

La determinación siguiente usa **proxy de presencia de objetos** (PostgREST schema cache) por cada archivo en `supabase/migrations/`, alineado con DEP-001.

Evidencia: `docs/10-validation/evidence/infra001/object-presence-proxy.json`

---

## Respuesta operativa

### Última migración con evidencia de aplicada

`20260722172737_55b5491b-422d-4966-b5df-fb5c62d8ed02.sql`

(Timestamp `20260722172737` — objetos de control `feature_flags` / `audit_log` presentes; cadena foundation…20260722 coherente.)

### Primera migración ausente (marcador exclusivo MISSING)

`20260723120000_program_draft_order_atomic.sql`

- Timestamp: `20260723120000`
- Marcador: RPC `public.program_draft_order(...)` → **HTTP 404** (no en schema cache)

### Frase de corte

> **La sincronización se rompió después de la migración `20260722172737_55b5491b-422d-4966-b5df-fb5c62d8ed02.sql`.**  
> Primera ausente con marcador exclusivo: `20260723120000_program_draft_order_atomic.sql`.

---

## Tabla completa (Git → Live proxy)

| Migration | Present | Missing | Notas |
|-----------|---------|---------|-------|
| `20260720164312_9137d8ab-e998-4e02-816c-63bda5634159.sql` | ✓ | | Foundation (`tenants`, `user_roles`, …) |
| `20260720164327_63fdc61e-1100-4fa6-ad62-e2a91eb9f2b1.sql` | ? | | Sin marcador REST exclusivo |
| `20260720170834_2a394c23-2b57-4ded-87ae-7824d406b01e.sql` | ? | | Sin marcador REST exclusivo |
| `20260720210000_soft_delete_audit_feature_flags.sql` | ✓ | | `audit_log`, `feature_flags` |
| `20260720220000_foundation_lock_soft_delete_rbac.sql` | ? | | Sin marcador REST exclusivo |
| `20260721190000_dish_infra_align_domain.sql` | ? | | Sin marcador REST exclusivo |
| `20260722172703_596a291b-6c2c-4e61-a38a-27760d7bc0bc.sql` | ? | | Sin marcador REST exclusivo |
| `20260722172737_55b5491b-422d-4966-b5df-fb5c62d8ed02.sql` | ✓ | | **Última con evidencia PRESENT** |
| `20260723120000_program_draft_order_atomic.sql` | | ✓ | **Primera MISSING** — `program_draft_order` 404 |
| `20260723174724_de4a9047-5477-4932-abcc-94ce217570b3.sql` | ? | | Sin marcador REST exclusivo |
| `20260723183000_b2b_b2c_customer_model.sql` | parcial | parcial | `delivery_groups` **MISSING**; `ensure_individual_customer` / `resolve_delivery_group` **PRESENT** |
| `20260723190000_company_provision_staff_only.sql` | ? | | Sin marcador |
| `20260723193459_41cf7a3a-71c9-4f23-8d9d-f41660ade316.sql` | ? | | Sin marcador |
| `20260723200000_operations_workspace_statuses.sql` | ? | | Sin marcador |
| `20260723200100_operations_transition_rpc.sql` | | ✓ | `transition_order_status` 404 |
| `20260724132839_f9e39003-6584-4d8b-af26-975d95c6dd20.sql` | ✓* | | `ensure_individual_customer` PRESENT (*también creado en b2b) |
| `20260724132857_5f8e76e5-5e14-45a6-b36a-d890ab2e6d20.sql` | ? | | Solo GRANTs — sin marcador de ausencia |
| `20260724160000_customer_dish_favorites.sql` | | ✓ | `customer_dish_favorites` 404 |
| `20260724170000_kitchen_production_batches.sql` | | ✓ | `kitchen_production_batches` 404 |
| `20260724185434_2bdc2c0f-86fa-45f7-bb2a-d34dfe96ee30.sql` | ? | | Realtime publication — no vía REST |
| `20260725120000_op002_platform_owners_bootstrap.sql` | | ✓ | `ensure_platform_owner_session`, `is_platform_owner_email` 404 |
| `20260725123000_op002_platform_owners_config.sql` | | ✓ | `platform_owners`, `revoke_platform_owner_for_email` 404 |

**Leyenda:** ✓ Present · ✓ Missing · ? No verificable sin `schema_migrations` / marcador REST.

---

## Listado completo desde el punto de corte

A partir de (e incluyendo) la primera ausente:

1. `20260723120000_program_draft_order_atomic.sql` — **MISSING**
2. `20260723174724_de4a9047-5477-4932-abcc-94ce217570b3.sql` — unknown marker
3. `20260723183000_b2b_b2c_customer_model.sql` — **PARTIAL** (tablas missing / RPCs present)
4. `20260723190000_company_provision_staff_only.sql` — unknown
5. `20260723193459_41cf7a3a-71c9-4f23-8d9d-f41660ade316.sql` — unknown
6. `20260723200000_operations_workspace_statuses.sql` — unknown
7. `20260723200100_operations_transition_rpc.sql` — **MISSING**
8. `20260724132839_f9e39003-6584-4d8b-af26-975d95c6dd20.sql` — RPC present (no prueba apply completo)
9. `20260724132857_5f8e76e5-5e14-45a6-b36a-d890ab2e6d20.sql` — unknown
10. `20260724160000_customer_dish_favorites.sql` — **MISSING**
11. `20260724170000_kitchen_production_batches.sql` — **MISSING**
12. `20260724185434_2bdc2c0f-86fa-45f7-bb2a-d34dfe96ee30.sql` — unknown
13. `20260725120000_op002_platform_owners_bootstrap.sql` — **MISSING**
14. `20260725123000_op002_platform_owners_config.sql` — **MISSING**

---

## Relación con AUD-002 / DEP-001

| Informe | Project ref | Corte |
|---------|-------------|-------|
| AUD-004 / binding | `cbeegcxkayybfncnuirg` | mismo proyecto |
| DEP-001 | `cbeegcxkayybfncnuirg` | OP-002 ausente; drift desde ~`20260723183000` |
| INFRA-001 | `cbeegcxkayybfncnuirg` | Precisa el corte en **después de `20260722172737`**, primera missing **`20260723120000`** |

OP-002 (`20260725120000` / `20260725123000`) está **dentro** de la cola ausente — coherente con AUD-002 (RPC Platform Owner 404).

---

## Limitaciones

1. Sin lectura de `supabase_migrations.schema_migrations`, el veredicto es **inferido**, no el journal oficial.  
2. Migraciones `NO_MARKER` entre `20260722172737` y `20260723120000` no pueden confirmarse individuales.  
3. Estado **PARTIAL** en b2b (`delivery_groups` missing vs RPCs present) sugiere apply incompleto / divergencia manual — requiere SQL service-role para cerrar.

Para confirmación canónica: consultar con service-role / DB URL:

```text
select version, name from supabase_migrations.schema_migrations order by version;
```

(No ejecutado aquí.)
