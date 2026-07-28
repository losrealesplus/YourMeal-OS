# Accounting Observations (Re-Certification)

**Gate:** OBSERVATIONS · **CERTIFIED**

---

## P0 cerrados

| ID | Antes | Después |
|----|-------|---------|
| P0-A-01 | PlaceholderPanel | Workspace operativo |
| P0-A-02 | Sin lifecycle | pending → paid / void · period complete |
| P0-A-03 | Sin servicio | `AccountingService` + `invoice_orders` |

---

## Observaciones residuales (no bloquean Outcome)

| ID | Hallazgo |
|----|----------|
| OBS-A-01 | Conciliación thin (paid vs amount) · sin ledger formal |
| OBS-A-02 | Flag `admin_module_accounting` oculta nav (URL directa OK) |
| OBS-A-03 | Sin pasarela de pago · cobro manual |
| OBS-A-04 | Sin PDF / numeración fiscal avanzada |
| OBS-A-05 | Issues Resolved → abono/crédito diferido a Flow (FG-S-A-01) |

---

## Estabilidad upstream

| Journey | Tras Re-Certification Accounting |
|---------|----------------------------------|
| Kitchen | ✅ CERTIFIED (sin cambio) |
| Delivery | ✅ CERTIFIED (sin cambio) |
| Support | ✅ CERTIFIED (sin cambio) |
| Accounting | ✅ CERTIFIED · OBSERVATIONS |

---

## Flow Gaps → Bloque G

| ID | Descripción |
|----|-------------|
| FG-D-A-01 | Auto-sugerir factura al pasar a `delivered` |
| FG-S-A-01 | Issues Resolved → crédito / ajuste |
| FG-A-G-01 | Periodo complete como handoff ORR |
