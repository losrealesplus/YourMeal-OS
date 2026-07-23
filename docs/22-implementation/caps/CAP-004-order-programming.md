# CAP-004 — Order Programming (primera mutación)

**Estado:** Scaffold → **Connected**  
**Nivel PR:** Capability  
**Patrón:** [MUTATION_PATTERN](../MUTATION_PATTERN.md)

---

## Preconditions

- CAP-001…003 Connected  
- Usuario autenticado · tenant · fila `customers` vinculada al user  
- Oferta published (CAP-003) para seleccionar platos del día  

## Postconditions

- Order `status = draft` + `order_items` en Supabase  
- `audit_log` action `create` en el mismo flujo  
- Invalidación de `orderKeys`  
- Sin transición Confirm (CAP-006)  
- Sin cambios UX/navegación del schedule  
- Typecheck + tests limpios  
- Happy Path: Parcial  

---

## Flujo

```text
UI schedule step 3
        ↓
useProgramDraftOrder (Command)
        ↓
OrderService.programDraft
        ↓
OrderRepository.insertDraft
        ↓
Supabase
        ↓
AuditService.write → audit_log
        ↓
invalidateQueries(orders)
        ↓
navigate /app
```

## Fuera de alcance

Confirmación · CAP-005 summary redesign · historial · pricing OM nuevo · estados inventados.

## Traceability

| Campo | Valor |
|-------|-------|
| Core | Order · Order Item · Weekly Menu · Dish |
| OM | Order lifecycle — **Draft** (place/program) |
| Mutaciones | Sí |
| Mock / Real | Real (persistencia) |
| Audit | Sí |

## Checklist

[PR_TECHNICAL_CHECKLIST](../PR_TECHNICAL_CHECKLIST.md) — sección mutaciones.
