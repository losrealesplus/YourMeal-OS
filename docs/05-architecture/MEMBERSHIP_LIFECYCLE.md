# Membership Lifecycle

**Estado:** Hardened v1  
**Tabla:** `tenant_members`  
**Identidad operacional:** `membership_id` = `tenant_members.id`

## Estados

```text
pending ──approve──► approved ──suspend──► suspended ──reactivate──► approved
   │                    │
   └──reject──► rejected     └──revoke──► revoked
                                      ▲
rejected / revoked ──reopen──► pending
```

Archived (`deleted_at`) corta cualquier transición operativa.

## Campos de trazabilidad (P5)

| Acción | Campos |
|--------|--------|
| Approve | `approved_by`, `approved_at` |
| Reject | `rejected_by`, `rejected_at` |
| Suspend | `suspended_by`, `suspended_at` |
| Revoke | `revoked_by`, `revoked_at` |
| Reactivate | `reactivated_by`, `reactivated_at` |
| Archive | `deleted_by`, `deleted_at` |

## Tipos

`customer` · `employee` · `supplier` · `company` · `company_employee`

## Reglas de acceso

- Solo `status = approved` **y** `deleted_at IS NULL` cuenta en `is_tenant_member` / `current_user_tenants`.
- Role sin Membership Approved → sin acceso.
- Membership Approved sin Role → sin acceso a workspaces staff.

## Canales de origen

`self_registration` · `invitation` · `provisioning`
