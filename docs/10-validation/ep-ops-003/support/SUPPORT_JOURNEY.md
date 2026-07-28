# Support Journey · SJ-01 → SJ-05 (Re-Certification)

**Epic:** EP-OPS-003 · Support Correction + Re-Certification  
**Metodología:** FROZEN  
**Workspace:** `/admin/support`  
**Actor:** `support`  
**Input:** **Orders Delivered** (Delivery CERTIFIED)  
**Outcome:** **Issues Resolved**  
**Pasada FAIL:** 2026-07-28 · **Re-Certification:** 2026-07-28  
**Gate:** **OBSERVATIONS** · **Status:** **CERTIFIED**  

```text
FAIL (no lifecycle)
        ↓
Correction: open → resolved → closed
        ↓
Re-Certification
        ↓
Issues Resolved ✅
```

Upstream Kitchen + Delivery **permanecen CERTIFIED** (regla de estabilidad).

---

## Continuidad Input

| Check | Resultado |
|-------|:---------:|
| Ve pedidos `delivered` | ✅ |
| Abre incidencia sobre cliente entregado | ✅ |
| No reabre Delivery | ✅ |

---

## SJ stages post-corrección

| Stage | Resultado | Evidencia |
|-------|:---------:|-----------|
| SJ-01 Recepción | ✅ | Directory + ficha + pedidos |
| SJ-02 Clasificación | ⚠ | `kind` tipificado · sin prioridad (OBS) |
| SJ-03 Seguimiento | ✅ | Notas + status visible |
| SJ-04 Resolución | ✅ | `transitionSupportNote` → `resolved` · UI Resolver |
| SJ-05 Cierre | ✅ | → `closed` · KPI `openIncidents` solo `status=open` |

**Outcome:**

```text
Issues Resolved = issue kind (incident|complaint) alcanza status closed
                  (vía resolved → closed o open → closed)
```

---

## Recorrido E2E

```text
Input: Orders Delivered
  → /admin/support
  → localizar cliente con pedido delivered
  → crear incident/complaint (open)
  → Resolver → Cerrar
Outcome: Issues Resolved
```

Migración: `20260728200000_support_note_lifecycle.sql`  
Dominio: `canTransitionSupportNote` · tests PASS  

---

## Pregunta maestra

> ¿Puede un agente, partiendo de Orders Delivered, gestionar una incidencia completa sin abandonar su Workspace?

**Sí** (actor `support`) — con observaciones menores.

**Gate:** OBSERVATIONS · **CERTIFIED** · Outcome **Issues Resolved**
