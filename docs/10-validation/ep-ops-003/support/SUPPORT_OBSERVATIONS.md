# Support Observations (Re-Certification)

**Gate:** OBSERVATIONS · **CERTIFIED**

---

## P0 cerrados

| ID | Antes | Después |
|----|-------|---------|
| P0-S-01 | Sin lifecycle | `open → resolved → closed` |
| P0-S-02 | KPI no decrecía | Cuenta solo `status=open` |

---

## Observaciones residuales (no bloquean Outcome)

| ID | Hallazgo |
|----|----------|
| OBS-S-02 | `operations_manager` sin `support.read` (escalado limitado) |
| OBS-S-03 | Notas sin `order_id` explícito |
| OBS-S-04 | Sin campo prioridad |
| OBS-S-06 | Communications planned-only |
| OBS-S-07 | Solape visual customers directory |

---

## Estabilidad upstream

| Journey | Tras Re-Certification Support |
|---------|-------------------------------|
| Kitchen | ✅ CERTIFIED (sin cambio) |
| Delivery | ✅ CERTIFIED (sin cambio) |
| Support | ✅ CERTIFIED · OBSERVATIONS |

---

## Flow Gaps → Bloque G

| ID | Descripción |
|----|-------------|
| FG-D-S-01 | Vínculo fuerte incidencia↔pedido delivered |
| FG-S-A-01 | Eventos Issues Resolved → Accounting |
