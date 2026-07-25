# OP-002 · Permanent Platform Owners Bootstrap

**Fecha:** 2026-07-25  
**Rama:** `cursor/op-002-platform-owners-f54a`  
**Modelo:** Auth → Profile → Membership → `user_roles` → RBAC  

---

## Objetivo

Establecer propietarios permanentes de la plataforma (no usuarios de prueba, no seeds temporales, no SQL manual post-despliegue).

Los correos **no viven en el código de aplicación**. Son configuración de bootstrap:

`config/bootstrap/platform-owners.json`

| Email (config actual) | Rol plataforma | Rol tenant | Tenant activo |
|-----------------------|----------------|------------|---------------|
| `alex1409h@gmail.com` | `saas_admin` (`tenant_id` NULL) | `company_admin` | EatClean Tenerife (`eatclean-tenerife`) |
| `alexhdezmtinez@gmail.com` | `saas_admin` (`tenant_id` NULL) | `company_admin` | EatClean Tenerife (`eatclean-tenerife`) |

---

## Configuración de bootstrap (fuente operativa)

```json
{
  "version": 1,
  "defaultTenantSlug": "eatclean-tenerife",
  "owners": [
    { "email": "alex1409h@gmail.com", "fullName": "Alex Hernandez" },
    { "email": "alexhdezmtinez@gmail.com", "fullName": "Alex Hdez Martinez" }
  ]
}
```

### Cambiar el propietario de la plataforma (sin tocar código)

1. Editar `config/bootstrap/platform-owners.json`  
2. `npm run seed:platform-owners`  
3. El script:
   - sincroniza `public.platform_owners`
   - crea/reutiliza Auth para los activos
   - asigna `saas_admin` + `company_admin`
   - **desactiva y revoca** grants de correos eliminados de la config  

No hace falta modificar TypeScript, ni roles, ni RBAC.

---

## Implementación

| Pieza | Ruta | Función |
|-------|------|---------|
| Config | `config/bootstrap/platform-owners.json` | Lista de owners + tenant por defecto |
| Schema | `config/bootstrap/platform-owners.schema.json` | Contrato JSON |
| Migración base | `…120000_op002_platform_owners_bootstrap.sql` | RPCs + trigger + índice `saas_admin` |
| Migración config | `…123000_op002_platform_owners_config.sql` | Tabla `platform_owners` + allowlist dinámica + revoke |
| Script | `scripts/seed-platform-owners.mjs` | Sync config → DB → Auth → roles |
| npm | `npm run seed:platform-owners` | Entrypoint |
| Cliente | `src/lib/ensure-platform-owner-session.ts` | Primer login → RPC (sin lista hardcodeada) |

**No** se crean roles nuevos, enums, bypasses ni allowlists en el frontend. El cliente solo invoca la RPC; los grants viven en Postgres según la tabla de bootstrap.

### Idempotencia

- `platform_owners` → upsert / `active=false` para removidos  
- `profiles` / `tenant_members` / `user_roles` → sin duplicados  
- Re-ejecutar seed es seguro  

---

## Comando

```bash
# Official project: djangucecsphnejplvic (INFRA-002)
export SUPABASE_URL=https://djangucecsphnejplvic.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=...   # Dashboard → API (service_role / secret)
# opcional — si falta, se invita por email
export PLATFORM_OWNERS_PASSWORD='........'

npm run seed:platform-owners
```

Tras aplicar migraciones, el **primer login** también invoca `ensure_platform_owner_session()` y completa grants si el email está activo en `platform_owners`.

---

## Navegación esperada

```text
Login
  ↓
Landing
  ↓
/admin                    (company_admin + saas_admin → home híbrido)
  ↓
Centro de Operaciones YourMeal OS   (SaasOpsEntry visible)
  ↓
/saas
```

---

## Evidencia de verificación

### A · Código / contrato

| Check | Resultado |
|-------|-----------|
| Owners en config de bootstrap (no en app source) | ✅ PASS |
| Tabla `platform_owners` + RPCs config-backed | ✅ PASS |
| Roles oficiales únicamente (`saas_admin`, `company_admin`) | ✅ PASS |
| Tenant slug desde config (`eatclean-tenerife`) | ✅ PASS |
| Session RPC sin allowlist hardcodeada en cliente | ✅ PASS |
| Cambio de owner = editar JSON + re-seed | ✅ PASS (diseño) |
| home-path híbrido | ✅ PASS (`company_admin`+`saas_admin` → `/admin`) |

### B · Runtime live (Auth + roles + UI)

| Check | Observado | Resultado |
|-------|-----------|-----------|
| Sync config → `platform_owners` | *Pendiente service-role* | ⏳ PENDING |
| Usuario `alex1409h@gmail.com` creado o reutilizado | *Pendiente service-role* | ⏳ PENDING |
| Usuario `alexhdezmtinez@gmail.com` creado o reutilizado | *Pendiente service-role* | ⏳ PENDING |
| Roles asignados (`saas_admin` + `company_admin`) | *Tras migración + seed/login* | ⏳ PENDING |
| Tenant asignado EatClean Tenerife | *Tras migración + seed/login* | ⏳ PENDING |
| Landing → `/admin` → SaasOpsEntry → `/saas` | *Tras login live* | ⏳ PENDING |

> El entorno del agente Cloud no tiene `SUPABASE_SERVICE_ROLE_KEY`. Ejecutar seed + recorrido UI en el proyecto Supabase enlazado tras apply de migraciones.

---

## Verdict

| Capa | Estado |
|------|--------|
| **Bootstrap Engineering (config + migración + script)** | **PASS** |
| **Live Platform Owner journey** | **PENDING** |

**OP-002 overall:** **PASS (engineering) / PENDING (live evidence)**

---

## Checklist post-deploy

1. Aplicar migraciones OP-002 (+ config table)  
2. Confirmar `config/bootstrap/platform-owners.json`  
3. `npm run seed:platform-owners`  
4. Login con cada owner → `/admin` → YourMeal OS → `/saas`  
5. Re-ejecutar seed → sin duplicados  
6. (Opcional) Probar cambio de owner: editar JSON, re-seed, verificar revoke del anterior  
7. Marcar sección B = PASS  
