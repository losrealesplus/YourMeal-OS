# Accounting Observations

**Gate:** FAIL · **NOT CERTIFIED**

---

## P0 (bloquean Outcome)

| ID | Hallazgo |
|----|----------|
| P0-A-01 | `/admin/accounting` es `PlaceholderPanel` — sin operaciones |
| P0-A-02 | Sin lifecycle financiero (facturar → cobrar → conciliar → cerrar) |
| P0-A-03 | Sin servicio de dominio Accounting que consuma Orders / Issues Resolved / billing |

---

## Observaciones / deuda (no cambian el Gate)

| ID | Hallazgo |
|----|----------|
| OBS-A-01 | Tablas `invoices` / `payments` existen · no expuestas a actor `accounting` |
| OBS-A-02 | Flag `admin_module_accounting` · cero humo correcto |
| OBS-A-03 | `homePathForRoles` no aterriza `accounting`-only en `/admin/accounting` (Entry residual · no reabre EP-OPS-002 sin evidencia) |
| OBS-A-04 | Lectura de facturas en `/app/payment-methods` ≠ jornada Accounting |

---

## Estabilidad upstream

| Journey | Tras FAIL Accounting |
|---------|----------------------|
| Kitchen | ✅ CERTIFIED (sin cambio) |
| Delivery | ✅ CERTIFIED (sin cambio) |
| Support | ✅ CERTIFIED (sin cambio) |
| Accounting | ❌ NOT CERTIFIED · FAIL |

```text
Un Journey FAIL
NO invalida
ningún Journey previamente CERTIFIED.
```

---

## Flow Gaps → Bloque G

| ID | Descripción |
|----|-------------|
| FG-D-A-01 | Pedido `delivered` → evento facturable |
| FG-S-A-01 | Issues Resolved → impacto financiero / abono |
| FG-A-G-01 | Cierre contable como handoff a Flow / ORR |
