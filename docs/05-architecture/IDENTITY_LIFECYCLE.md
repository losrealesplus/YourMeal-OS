# Identity Lifecycle

**Estado:** Hardened v1 · Architecture stable  
**ADR:** [0018](../adr/0018-identity-membership-lifecycle.md) · [0019](../adr/0019-identity-hardening-v1.md)

## Pipeline canónico

```text
Identity (auth.users)
    ↓
Profile (profiles)          ← persona global, no tenant
    ↓
Membership (tenant_members) ← Persona ↔ Tenant · membership_id operacional
    ↓
Role (user_roles)           ← RBAC sin cambios
    ↓
Workspace                   ← capabilities / surfaces
```

**Crear usuario ≠ conceder acceso.** Acceso efectivo requiere:

1. Identity existe  
2. Profile existe (no archivado)  
3. Membership `approved` (no archivado)  
4. Al menos un Role en el tenant  
5. Tenant `active`

## Capas

| Capa | Tabla | Pertenece a |
|------|-------|-------------|
| Identity | `auth.users` | Persona (Supabase Auth — no modificar) |
| Profile | `profiles` | Persona |
| Membership | `tenant_members` | Persona ↔ Tenant |
| Invitation | `user_invitations` | Tenant |
| Employment | `employee_profiles` | Tenant staff labour |
| Role | `user_roles` | Tenant + RBAC |
| Audit negocio | `identity_events` | Timeline |

## Soft delete

`profiles`, `tenant_members`, `employee_profiles` usan `deleted_at` + `deleted_by`.  
Eliminar = **Archived**. Nunca hard-delete en flujos de aplicación.

## membership_id (P1)

`tenant_members.id` es la identidad operacional. Nuevos writes de dominio deberían preferir:

`created_by_membership_id` (futuro en orders / support / kitchen / delivery)

sin romper `user_id` existente.

## RI-001

Sigue vigente: **1 user → 1 tenant** en capa de aplicación.  
Multi-membership / SSO / SCIM / impersonation: **no implementados** (ver ADR 0019).

## Ver también

- [MEMBERSHIP_LIFECYCLE.md](./MEMBERSHIP_LIFECYCLE.md)  
- [IDENTITY_AUDIT.md](./IDENTITY_AUDIT.md)  
- [USER_PROVISIONING.md](./USER_PROVISIONING.md)
