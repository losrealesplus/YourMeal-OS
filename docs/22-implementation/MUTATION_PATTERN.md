# Mutation Pattern — oficial desde CAP-004

Toda mutación de Capability sigue este flujo. CAP-004 es la **referencia**.

```text
UI (existente)
        ↓
Command / useMutation hook
        ↓
Application Service
        ↓
Repository
        ↓
Supabase (persistencia + RLS)
        ↓
auditService.write
        ↓
audit_log
        ↓
Query Invalidation
        ↓
UI actualizada
```

## Requisitos

| Paso | Obligatorio |
|------|-------------|
| `requireCapability` / RBAC | Sí |
| `tenantId` en ServiceContext | Sí |
| Persistencia vía Repository | Sí |
| `AuditService.write` en el mismo flujo | Sí |
| Invalidación de queries afectadas | Sí |
| Sin rediseño UX | Sí |
| Sin reglas OM nuevas | Sí |

## Anti-patrones

- Mutar desde la UI sin Service  
- Persistir sin `audit_log`  
- Confirmar pedido en CAP-004 (eso es CAP-006)  
- Inventar estados (`pending`, etc.) no presentes en el enum as-built  

## Primera referencia

[CAP-004 Order Programming](./caps/CAP-004-order-programming.md) — `status: draft` únicamente.
