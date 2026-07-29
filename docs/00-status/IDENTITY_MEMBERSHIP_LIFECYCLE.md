# Identity & Membership Lifecycle — Reinforcement

**Fecha:** 2026-07-29  
**Estado:** Implemented (schema + Tenant Admin provisioning)  
**ADR:** [0018](../adr/0018-identity-membership-lifecycle.md)  
**Identity Freeze:** Respected (no Auth/OAuth/RBAC redesign)

## Regla dura

> **Crear un usuario ≠ conceder acceso.**  
> Acceso efectivo = Membership `Approved` + Role (+ Workspace via capabilities).

## Canales

| Canal | Quién inicia | Resultado inmediato |
|-------|--------------|---------------------|
| Self Registration | Usuario | Membership Pending (UI pública pendiente de cablear) |
| Invitation | Tenant Admin | Membership Pending + `user_invitations` |
| Provisioning | Tenant Admin | Membership Pending (+ invite Auth si email nuevo) |

## Capability

- `users.create` — provisionar / invitar en el tenant propio
- `employee.manage` — aprobar membership y asignar roles

## Superficie

`/admin/users` — Nuevo usuario · Aprobar · Asignar role

## Migración

`supabase/migrations/20260729100000_identity_membership_lifecycle.sql`

Aplicar en Supabase antes de usar el flujo en producción.

## Fuera de alcance (RI-001)

Multi-membership (una identidad en varios tenants) permanece **gated** en aplicación.
