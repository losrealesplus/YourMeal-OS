# OP-002 · Permanent Platform Owners Bootstrap

**Fecha:** 2026-07-25  
**Rama:** `cursor/op-002-platform-owners-f54a`  
**Modelo:** Auth → Profile → Membership → `user_roles` → RBAC  

---

## Objetivo

Establecer propietarios permanentes de la plataforma (no usuarios de prueba, no seeds temporales, no SQL manual post-despliegue).

| Email | Rol plataforma | Rol tenant | Tenant activo |
|-------|----------------|------------|---------------|
| `alex1409h@gmail.com` | `saas_admin` (`tenant_id` NULL) | `company_admin` | EatClean Tenerife (`eatclean-tenerife`) |
| `alexhdezmtinez@gmail.com` | `saas_admin` (`tenant_id` NULL) | `company_admin` | EatClean Tenerife (`eatclean-tenerife`) |

---

## Implementación (permanente)

| Pieza | Ruta | Función |
|-------|------|---------|
| Migración | `supabase/migrations/20260725120000_op002_platform_owners_bootstrap.sql` | Allowlist + `ensure_platform_owner_for_user` + session RPC + trigger `handle_new_user` + backfill |
| Script | `scripts/seed-platform-owners.mjs` | Crea/reutiliza Auth users e invoca el ensure (idempotente) |
| npm | `npm run seed:platform-owners` | Entrypoint operativo |
| Cliente | `src/lib/ensure-platform-owner-session.ts` | Primer login / sesión → RPC |
| Tipos | `src/integrations/supabase/types.ts` | RPCs tipados |

**No** se crean roles nuevos, enums, bypasses ni permisos hardcoded en el frontend. El cliente solo llama a la RPC oficial; los grants viven en Postgres.

### Idempotencia

- `profiles` → `ON CONFLICT DO NOTHING` / update no destructivo  
- `tenant_members` → `ON CONFLICT DO NOTHING`  
- `saas_admin` → `NOT EXISTS` + índice único parcial `user_roles_saas_admin_uidx`  
- `company_admin` → `NOT EXISTS` / unique `(user_id, tenant_id, role)`  
- Re-ejecutar migración backfill / script / RPC no duplica filas  

---

## Comando (Auth create/reuse)

```bash
export SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...
# opcional — si falta, se invita por email
export PLATFORM_OWNERS_PASSWORD='........'

npm run seed:platform-owners
```

Tras aplicar la migración, el **primer login** (password u OAuth) de cualquiera de los dos correos también invoca `ensure_platform_owner_session()` y completa grants si faltan.

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
| Migración OP-002 presente | ✅ PASS |
| Roles oficiales únicamente (`saas_admin`, `company_admin`) | ✅ PASS |
| Tenant slug `eatclean-tenerife` | ✅ PASS |
| Session RPC + seed script idempotentes | ✅ PASS |
| Sin bypass RBAC / sin permisos frontend | ✅ PASS |
| home-path híbrido ya cubierto por tests | ✅ PASS (`company_admin`+`saas_admin` → `/admin`) |

### B · Runtime live (Auth + roles + UI)

| Check | Observado | Resultado |
|-------|-----------|-----------|
| Usuario `alex1409h@gmail.com` creado o reutilizado | *Pendiente service-role en este entorno* | ⏳ PENDING |
| Usuario `alexhdezmtinez@gmail.com` creado o reutilizado | *Pendiente service-role en este entorno* | ⏳ PENDING |
| Roles asignados (`saas_admin` + `company_admin`) | *Tras migración + seed/login* | ⏳ PENDING |
| Tenant asignado EatClean Tenerife | *Tras migración + seed/login* | ⏳ PENDING |
| Landing observado → `/admin` | *Tras login live* | ⏳ PENDING |
| Acceso `/admin` + SaasOpsEntry visible | *Tras login live* | ⏳ PENDING |
| Click → `/saas` | *Tras login live* | ⏳ PENDING |

> En el entorno del agente Cloud solo hay clave publishable; no `SUPABASE_SERVICE_ROLE_KEY`. El seed live y el recorrido UI deben ejecutarse en el proyecto Supabase enlazado (Lovable / CI con service role) después de aplicar la migración.

---

## Verdict

| Capa | Estado |
|------|--------|
| **Bootstrap Engineering (código + migración + script)** | **PASS** |
| **Live Platform Owner journey** | **PENDING** (requiere apply migration + `npm run seed:platform-owners` o primer login post-deploy) |

**OP-002 overall:** **PASS (engineering) / PENDING (live evidence)**  

Cuando el recorrido live se complete, actualizar la sección B a PASS y cambiar el overall a **PASS**.

---

## Checklist post-deploy

1. Aplicar migraciones (incluye `20260725120000_op002_platform_owners_bootstrap.sql`)  
2. `npm run seed:platform-owners` (crea/reutiliza Auth + ensure)  
3. Login con cada correo  
4. Confirmar landing `/admin` → entrada YourMeal OS → `/saas`  
5. Re-ejecutar seed → sin duplicados  
6. Marcar sección B = PASS  
