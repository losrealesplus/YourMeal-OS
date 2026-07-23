# SMOKE_HP-001 — checklist de demostración

**No es desarrollo.** Es evidencia para ORR.  
Ejecutar **después** de: PR #23 en `main` + migración `program_draft_order` aplicada.

---

## Recorrido producto

```text
Login → Dish → Weekly Menu → Program Order → Summary → Confirm
```

## Recorrido técnico

```text
Draft → Confirm → Persist → Audit → Invalidate → Confirmed
```

---

## Pasos

| # | Paso | Esperado | ☐ |
|---|------|----------|:-:|
| 1 | Login customer + tenant activo | Sesión + `tenantId` | ☐ |
| 2 | Catálogo Dish (lectura real) | Platos reales, no mocks | ☐ |
| 3 | Weekly Menu published del día | Oferta real | ☐ |
| 4 | Program Draft (schedule) | Order `draft` + items; `total` servidor | ☐ |
| 5 | Summary `/app/orders/$id` | Datos reales del pedido | ☐ |
| 6 | Confirm CTA | `status=confirmed` | ☐ |
| 7 | `audit_log` | `create` + `status_change` | ☐ |
| 8 | Invalid invalidation | UI refleja confirmed (sin CTA Confirm) | ☐ |
| 9 | Ownership / tenant | Sin cruce de pedidos ajenos | ☐ |
| 10 | Sin mocks en flujo live | Home/orders list sin MOCK_ORDERS | ☐ |

**Resultado smoke:** ok · parcial · fallo  

**Commit / tag:**  

**Notas:**  

---

Tras smoke **ok** → ejecutar [ORR](../22-implementation/ORR.md) y crear `ORR_HP-001.md` solo al cerrar.
