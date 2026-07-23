# CAP-004 — Order Programming

**Estado:** Scaffold → Connected  
**Depende de:** CAP-001…003 Connected  

---

## Preconditions

- CAP-001 Auth Connected  
- CAP-002 Dish Catalog Connected  
- CAP-003 Weekly Menu Connected  
- Usuario autenticado · tenant activo  

## Postconditions

- Programación de pedido persistida en Supabase  
- `audit_log` donde el OM lo exija  
- Tenant / RBAC respetados  
- Sin cambios UX del schedule  
- Typecheck + tests limpios  
- Happy Path: Parcial (hacia HP-001)  

---

## Objetivo

Primera **mutación** real del Happy Path: conectar programación del pedido a persistencia — **sin** inventar reglas de confirmación (CAP-006).

## Fuera de alcance

Confirmación final · resumen (CAP-005) · UX nueva · stock/promos.

## Traceability

| Campo | Valor |
|-------|-------|
| Core | Order · Order Item · Weekly Menu |
| OM | Order lifecycle (pre-confirm) |
| Mutaciones | Sí |
| Mock / Real | ⏳ → ✅ |

## Checklist

[PR_TECHNICAL_CHECKLIST](../PR_TECHNICAL_CHECKLIST.md) — sección mutaciones.

## Prompt

```text
Implementar CAP-004 Order Programming.
Primera mutación: persistir programación + audit si aplica.
No modificar UX. No inventar confirmación (CAP-006).
Tenant/RBAC. Typecheck + tests.
Estado: Connected.
```
