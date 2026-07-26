# OP-002 · BOOTSTRAP_RUNBOOK

**Procedimiento oficial** para provisionar Platform Owners en producción.  
**Proyecto:** `djangucecsphnejplvic`  
**No usar SQL manual sobre Auth / `user_roles`.**

---

## Prerrequisitos

```text
□ Migraciones aplicadas (incl. platform_owners + RPCs OP-002)
□ Tenant default existe (slug eatclean-tenerife) — o el slug de config
□ SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY disponibles (local .env.local / secrets)
□ config/bootstrap/platform-owners.json revisado
```

---

## Procedimiento (una vez / idempotente)

### 1. Confirmar config

```bash
cat config/bootstrap/platform-owners.json
```

Owners actuales:

- `alex1409h@gmail.com`
- `alexhdezmtinez@gmail.com`  
Tenant: `eatclean-tenerife`

### 2. Ejecutar seed (Auth Admin — flujo soportado)

```bash
export SUPABASE_URL=https://djangucecsphnejplvic.supabase.co
export SUPABASE_SERVICE_ROLE_KEY='…'   # secret — nunca VITE_*

# Opcional: password inicial si el usuario aún no existe (min 8).
# Si se omite, el script invita por email (inviteUserByEmail).
export PLATFORM_OWNERS_PASSWORD='…'

npm run seed:platform-owners
```

El script:

1. Upsert `public.platform_owners` desde JSON  
2. `auth.admin.createUser` o reutiliza si ya existe  
3. RPC `ensure_platform_owner_for_user` → profile + membership + `saas_admin` + `company_admin`  
4. Revoca owners quitados de la config  

Re-ejecutar es seguro (`auth: reused`).

### 3. Primer login (operador humano)

1. Abrir `/auth` (o `/auth/admin` para Ops).  
2. Si no conoces la password del seed → **Forgot password** con el email owner.  
3. Login email/password.  
4. Cliente llama `ensure_platform_owner_session` (idempotente).  
5. Destino: **`/admin`** (home híbrido `company_admin`+`saas_admin`).  
6. Entrar a SaaS: Centro de Operaciones / BrandLeaf → **`/saas`**.

### 4. Verificar

```text
□ Ambos emails existen en Authentication → Users
□ Login OK
□ /admin accesible
□ /saas accesible (listado tenants, crear tenant)
□ Usuario no-owner: ensure applied=false · sin saas_admin · sin listar tenants
```

---

## Cambiar ownership

1. Editar `config/bootstrap/platform-owners.json`  
2. `npm run seed:platform-owners`  
3. Emails eliminados → `active=false` + `revoke_platform_owner_for_email`

---

## Qué NO hacer

- `INSERT` en `auth.users` / `user_roles` por SQL  
- Hardcodear emails en el frontend  
- Poner `SUPABASE_SERVICE_ROLE_KEY` en `VITE_*`  
- Crear tenants de bootstrap con SQL ad hoc (usar UI `/saas` o `createTenant`)

---

## Troubleshooting

| Síntoma | Acción |
|---------|--------|
| `Tenant slug missing` | Provisionar tenant default / migraciones |
| Login OK pero sin SaaS | Re-seed; comprobar fila activa en `platform_owners`; llamar ensure en login |
| `not_platform_owner` | Email no está en config/tabla activa |
| Invite pendiente | Completar email invite o re-seed con `PLATFORM_OWNERS_PASSWORD` |
