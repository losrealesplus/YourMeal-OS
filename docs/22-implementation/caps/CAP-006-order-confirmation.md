# CAP-006 — Order Confirmation

**Estado:** Connected → **Operational** (Happy Path)  
**Depende de:** CAP-005  
**Puente FOV:** [HAPPY_PATH_E2E](../HAPPY_PATH_E2E.md)

---

## Objetivo

Confirmar pedido con persistencia real + `audit_log`. Citar lifecycle OM de confirmación. Sin mocks.

## No modificar

UX de confirmación · navegación.

## Traceability

| Campo | Valor |
|-------|-------|
| Core | Order |
| OM | Order Lifecycle · Confirm |
| Infra | Supabase · auditService · RLS |

## Prompt

```text
Implementar CAP-006 Order Confirmation.
No modificar UX ni componentes.
Persistir Order en Supabase con RLS.
Emitir audit_log (Who/What/When/Old/New/Tenant).
Citar referencia OM del lifecycle Confirm.
Sin mocks. Typecheck limpio. Formato de cierre oficial.
Estado objetivo: Operational (Happy Path).
Si falta una regla en el OM: DETENER · REQUIRES KNOWLEDGE REVIEW.
```
