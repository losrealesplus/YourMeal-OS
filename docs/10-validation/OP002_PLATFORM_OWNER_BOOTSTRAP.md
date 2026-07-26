# OP-002 · Permanent Platform Owners Bootstrap

**Última actualización:** 2026-07-26  
**Proyecto oficial:** `djangucecsphnejplvic`  
**Modelo:** Auth → Profile → Membership → `user_roles` → RBAC  

**Runbook:** [BOOTSTRAP_RUNBOOK.md](./BOOTSTRAP_RUNBOOK.md)  
**Validación live:** [PLATFORM_OWNER_VALIDATION.md](./PLATFORM_OWNER_VALIDATION.md) · [evidence/op002](./evidence/op002/validation-run.json)

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

## 1. ¿De dónde sale el rol Platform Owner?

**No** proviene de JWT claims custom ni de `user_metadata` para autorización.

| Pieza | Rol en el flujo |
|-------|-----------------|
| `config/bootstrap/platform-owners.json` | Allowlist operativa (fuente de verdad de emails) |
| `scripts/seed-platform-owners.mjs` | Sync JSON → `platform_owners` + Auth Admin create/reuse + RPC ensure |
| `public.platform_owners` | Tabla de bootstrap (`active`, email, tenant_slug) |
| RPC `ensure_platform_owner_for_user` | Seed: grants profile / membership / roles |
| RPC `ensure_platform_owner_session` | Login: si email activo en tabla → mismos grants (idempotente) |
| `user_roles` | `saas_admin` (global) + `company_admin` (tenant) |
| `tenant_members` | Membership EatClean |
| `src/lib/ensure-platform-owner-session.ts` | Cliente llama RPC — **sin** lista de emails |
| `homePathForRoles` | `saas_admin`+`company_admin` → `/admin` (entry UI a `/saas`) |

```text
config JSON
  → seed (Auth Admin API)
  → auth.users + platform_owners
  → ensure_platform_owner_for_user
  → profiles + tenant_members + user_roles
  → login
  → ensure_platform_owner_session (no-op si ya granted)
  → resolveHomePath → /admin → UI → /saas
```

---

## 2. Procedimiento oficial elegido

**Mecanismo:** Bootstrap Script ya soportado — `npm run seed:platform-owners`.

| Alternativa | ¿Usada? | Motivo |
|-------------|---------|--------|
| Signup público UI | No como bootstrap primario | Requiere confirm email; seed es idempotente y confirmado |
| Invite email | Sí si no hay `PLATFORM_OWNERS_PASSWORD` | `inviteUserByEmail` en el mismo script |
| Auth Admin `createUser` | Sí (default con password) | Flujo Admin API oficial Supabase |
| SQL `INSERT auth.users` | **Prohibido** | — |

No se crearon mecanismos paralelos.

---

## 3. Configuración

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

### Cambiar el propietario (sin tocar código app)

1. Editar `config/bootstrap/platform-owners.json`  
2. `npm run seed:platform-owners`  
3. Removidos → deactivate + revoke  

---

## 4. Implementación

| Pieza | Ruta |
|-------|------|
| Config | `config/bootstrap/platform-owners.json` |
| Schema | `config/bootstrap/platform-owners.schema.json` |
| Migraciones | `…_op002_platform_owners_*.sql` (ya en cadena) |
| Script | `scripts/seed-platform-owners.mjs` |
| npm | `npm run seed:platform-owners` |
| Cliente | `src/lib/ensure-platform-owner-session.ts` |

### Idempotencia

- Auth: reuse por email  
- `platform_owners` upsert  
- Roles/membership: ensure sin duplicar  
- Re-run 2026-07-26: `auth: reused` PASS  

---

## 5. Comando

```bash
export SUPABASE_URL=https://djangucecsphnejplvic.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=...
export PLATFORM_OWNERS_PASSWORD='........'   # opcional

npm run seed:platform-owners
```

---

## 6. Navegación esperada

```text
Login
  ↓
/admin                    (company_admin + saas_admin → home híbrido)
  ↓
Centro de Operaciones YourMeal OS / BrandLeaf SaaS
  ↓
/saas
```

---

## 7. Evidencia live (2026-07-26)

| Check | Resultado |
|-------|-----------|
| Sync config → `platform_owners` | ✅ PASS |
| Auth users ambos emails | ✅ PASS |
| Roles `saas_admin` + `company_admin` | ✅ PASS |
| Membership EatClean | ✅ PASS |
| Login / refresh / re-login | ✅ PASS |
| `ensure_platform_owner_session` | ✅ PASS |
| List + create tenant (privilegio SaaS) | ✅ PASS |
| Negativo no-owner | ✅ PASS |
| Sin SQL Auth manual | ✅ PASS |

Detalle: [PLATFORM_OWNER_VALIDATION.md](./PLATFORM_OWNER_VALIDATION.md).

---

## 8. Verdict

| Capa | Estado |
|------|--------|
| Bootstrap Engineering | ✅ PASS |
| Live Platform Owner identities | ✅ PASS |
| Password human setup | ⬜ Forgot-password por operador |

**OP-002 overall:** **PASS** (operador: fijar passwords vía recovery).
