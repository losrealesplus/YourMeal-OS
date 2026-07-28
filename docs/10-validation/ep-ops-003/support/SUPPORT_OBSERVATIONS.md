# Support Observations & Risks

**Pasada:** EP-OPS-003 · Support Journey  
**Gate:** FAIL  

---

## P0 (bloquean Outcome)

| ID | Hallazgo | Impacto |
|----|----------|---------|
| **P0-S-01** | Sin lifecycle de incidencia (`open` → `resolved`/`closed`) | No se puede demostrar Issues Resolved |
| **P0-S-02** | KPI “incidencias abiertas” no decrece | Contador append-only de kinds incident/complaint |

---

## P1 (Journey Support)

| ID | Hallazgo |
|----|----------|
| **OBS-S-01** | Landing: rol `support` en tip `main` puede ir a `/admin` genérico (verificar merge EP-OPS-002 landings en rama) |
| **OBS-S-02** | `operations_manager` sin `support.read`/`write` pero puede ver nav Support |
| **OBS-S-03** | Notas sin `order_id` — vínculo débil a Orders Delivered |
| **OBS-S-04** | Sin prioridad / resolución estructurada |
| **OBS-S-05** | Mock i18n `incidentStatuses` unused |

---

## Observaciones no bloqueantes (si hubiera Outcome)

| ID | Hallazgo |
|----|----------|
| **OBS-S-06** | Communications / campaigns = planned catalog only |
| **OBS-S-07** | Solape visual con `/admin/customers` (shared directory — justificado) |

---

## Upstream stability

| Journey | Estado tras esta pasada |
|---------|-------------------------|
| Kitchen | ✅ CERTIFIED (sin cambio) |
| Delivery | ✅ CERTIFIED (sin cambio) |
| Support | Gate FAIL · NOT CERTIFIED |

**No reabrir Delivery:** el Input Orders Delivered es visible y usable; el fallo es el cierre de incidencia en Support.

---

## Flow Gaps candidatos

| ID | Descripción |
|----|-------------|
| FG-D-S-01 | Tras Orders Delivered, vínculo explícito incidencia↔pedido entregado |
| FG-S-A-01 | Tras Issues Resolved, eventos para Accounting |

---

## Corrección sugerida (fuera de esta pasada · no inventar en Gate)

Para alcanzar Issues Resolved sin cambiar metodología:

1. Estado en `support_notes` o entidad Issue (`open`/`resolved`/`closed`).  
2. Acción resolve/close con `support.write`.  
3. KPI basado en abiertas.  
4. Re-Certification Support.

Metodología Frozen: es **implementación**, no evolución metodológica.
