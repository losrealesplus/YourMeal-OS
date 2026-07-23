# CAP-006 — Order Confirmation

**Estado:** Scaffold → **Operational** (cierra HP-001)  
**Depende de:** CAP-001…005 Connected  
**ORR:** tras este CAP → puerta [PASSED \| BLOCKED](../ORR.md)

---

## Preconditions

- CAP-005 Connected (resumen real del Draft)  
- Auth · tenant · Order Draft existente  

## Postconditions

- Transición **Draft → Confirmed** persistida  
- `audit_log` en el mismo flujo de mutación  
- Query invalidation · UI muestra estado confirmado  
- Sin mocks en el recorrido de confirmación  
- Typecheck limpio  

---

## Única responsabilidad

```text
Draft → Confirm → Persist → Audit → Invalidate → Estado confirmado
```

## Fuera de alcance (este PR)

Notificaciones · correos · integraciones · CAP-007 historial · UX nueva · reglas OM nuevas.

## Traceability

| Campo | Valor |
|-------|-------|
| Core | Order |
| OM | Order Lifecycle · Confirm |
| Patrón | [MUTATION_PATTERN](../MUTATION_PATTERN.md) |
| Mock / Real | Real |

## Prompt

```text
CAP-006 — solo Draft→Confirm→Persist→Audit→Invalidate.
Sin notificaciones, emails ni integraciones.
Sin UX nueva. Sin reglas OM nuevas.
Si falta regla: STOP · REQUIRES KNOWLEDGE REVIEW.
Estado: Operational (HP-001).
```
