# Identity Audit & Activity Timeline

**Tabla:** `identity_events`  
**Complementa:** `audit_log` (técnico) — no lo sustituye.

## Propósito

Auditoría de **negocio** para soporte, RGPD, incidencias y certificaciones RI.

## Eventos

| Evento | Significado |
|--------|-------------|
| USER_REGISTERED | Identity creada |
| PROFILE_CREATED / UPDATED | Perfil global |
| INVITATION_SENT / RESENT / ACCEPTED / EXPIRED / CANCELLED / REVOKED | Ciclo de invitación |
| MEMBERSHIP_* | Ciclo membership (created → approved/rejected/suspended/revoked/reactivated/archived) |
| ROLE_ASSIGNED / REMOVED | Cambios RBAC |
| USER_LAST_LOGIN | Último acceso (cuando se cablee desde Auth hooks) |
| PASSWORD_RESET / EMAIL_CHANGED / PHONE_CHANGED | Cambios sensibles |
| ACCESS_DENIED_INCONSISTENT | Fallo de consistency check |

## Campos

`id` · `tenant_id` · `user_id` · `membership_id` · `event_type` · `performed_by` · `performed_at` · `metadata`

## UI

**Admin → Usuarios → Timeline** — línea temporal por usuario (`listUserIdentityTimeline`).

Ejemplo:

```text
09:12  Cuenta creada
09:13  Invitación enviada
09:40  Invitación aceptada
09:41  Membership aprobado
09:42  Role asignado
17:35  Último acceso
```

Soft-delete **nunca** borra `identity_events`.
