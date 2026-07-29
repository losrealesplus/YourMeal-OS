# User Provisioning

**Capability:** `users.create` (crear/invitar) · `employee.manage` (aprobar/roles/transiciones)

## Tres canales (mismo pipeline)

| Canal | Quién inicia | Resultado inmediato |
|-------|--------------|---------------------|
| Self Registration | Usuario | Membership `pending` |
| Invitation | Tenant Admin | Membership `pending` + `user_invitations` |
| Provisioning | Tenant Admin | Membership `pending` (+ Auth invite si email nuevo) |

```text
Identity → Profile → Membership(pending) → [Approve] → [Assign Role] → Workspace
```

## Reglas

- 1 email = 1 Identity. Si existe → solo Membership.
- Create **nunca** escribe `user_roles`.
- Invitaciones: Pending / Accepted / Expired / Cancelled / Revoked · reenvío permitido.
- Soft-archive en fallo parcial (no hard-delete de profiles/memberships/employment).

## Operaciones masivas (P9)

Stubs en `src/modules/user-provisioning/domain/bulk-stubs.ts`:

- `validateBulkInviteDraft`
- `BulkUserProvisioningPort` (inviteMany / suspendMany / reactivateMany / assignRoleMany)

**No implementado:** import CSV / workers. Añadir sin reescribir el pipeline single-item.

## SaaS vs Tenant

| Acción | Quién |
|--------|-------|
| Crear Tenant / Tenant Owner | Solo SaaS Admin |
| Provisionar usuarios del tenant | Tenant Admin (`users.create`) |
| Aprobar / Role / Suspender | `employee.manage` |

## Código

- Dominio: `src/modules/user-provisioning`
- Server: `src/lib/user-provisioning.functions.ts`
- UI: `/admin/users`
