# PS-002-C · Staff data gate (post Auth-infra)

**Fecha:** 2026-08-01  
**Prioridad:** P0 para cerrar PS-002-C  
**Bloquea:** PASS canónico (`HOME_PATH_RESOLVED` → `NAVIGATE` → `DASHBOARD_RENDERED`)  
**No bloquea:** Auth layout · login · cold session · pipeline hasta `ROLE_READY`

---

## Evidencia consolidada

```text
LOGIN … ROLE_READY     ✅
roles                  []
roleCount              0
membership             null
tenant                 null
STOP reason            not_staff
HOME_PATH_RESOLVED     (omitido por diseño)
```

AUTH-SESSION-001 / HOME-PATH-001 → **CLOSED** (ver actas).

---

## Objeto a verificar (proyecto oficial)

| Campo | Valor |
|-------|--------|
| Project | `djangucecsphnejplvic` |
| User id (evidencia) | `74914617-ced2-4b89-b3b9-c622cf056bd2` |
| Email PS002 | el de `.env` → `PS002_EMAIL` (local) |

Checklist Dashboard / SQL (service role · operador):

1. **Authentication → Users** — existe el user id / email PS002  
2. **`public.user_roles`** — filas para ese `user_id` (hoy: ninguna → `roles=[]`)  
3. **`tenant_members` / membership** — vínculo a tenant EatClean si aplica  
4. **`platform_owners`** — si debe ser PO, email activo en tabla + config  

Rol staff mínimo para `/auth/admin` → home Ops: uno de  
`company_admin` · `operations_manager` · kitchen/delivery/… · `saas_admin`.

---

## Camino oficial (preferido)

No SQL manual en `user_roles` ([BOOTSTRAP_RUNBOOK](./BOOTSTRAP_RUNBOOK.md)).

Si el usuario PS002 debe ser Platform Owner:

1. Confirmar que su **email exacto** está en `config/bootstrap/platform-owners.json`  
2. `npm run seed:platform-owners` (requiere `SUPABASE_SERVICE_ROLE_KEY`)  
3. Login → `ensure_platform_owner_session` aplica `saas_admin` + `company_admin`  
4. Re-ejecutar `npm run test:ps002-canonical-auth`

### Nota de config actual (repo)

Owners en JSON hoy:

- `alex1409h@gmail.com`  
- `alexhdezmtinez@gmail.com`  

Si `PS002_EMAIL` es **otro** email (p.ej. `alex.hdez.mtinez@gmail.com`), **no** recibirá grants de PO hasta añadirlo a la config y re-seedear. Eso explica `roles=[]` + `not_staff` sin bug de Auth.

---

## Criterio de salida

```text
ROLE_READY.roles  ⊇ staff
STOP not_staff    ausente
HOME_PATH_RESOLVED ✅
NAVIGATE ✅
DASHBOARD_RENDERED ✅
→ PS-002-C PASS
```
