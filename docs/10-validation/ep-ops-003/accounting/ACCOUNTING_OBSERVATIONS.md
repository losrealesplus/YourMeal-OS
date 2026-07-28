# Accounting Observations (Correction P0 · Re-Cert)

**Gate:** OBSERVATIONS · **CERTIFIED**

---

## P0 cerrados (causa FAIL)

| ID | Antes | Después |
|----|-------|---------|
| P0-A-01 | PlaceholderPanel | Financial Workspace |
| P0-A-02 | Sin lifecycle | Pending → Review → Processed → Closed |
| P0-A-03 | Sin Outcome alcanzable | `closeFinancialPeriod` |

---

## Observaciones residuales (no bloquean)

| ID | Hallazgo |
|----|----------|
| OBS-A-01 | Conciliación thin (paid vs amount) |
| OBS-A-02 | Flag nav `admin_module_accounting` (URL directa OK) |
| OBS-A-03 | Cobro manual · sin pasarela |
| OBS-A-04 | Sin PDF / numeración fiscal |
| OBS-A-05 | Issues Resolved → crédito diferido a Flow |

---

## Estabilidad

| Journey | Estado |
|---------|--------|
| Kitchen | ✅ CERTIFIED |
| Delivery | ✅ CERTIFIED |
| Support | ✅ CERTIFIED |
| Accounting | ✅ CERTIFIED · OBSERVATIONS |

---

## Bloque G

**NOT STARTED.** Elegible solo porque 4/4 Journeys = CERTIFIED.  
No iniciar Flow en este Correction.
