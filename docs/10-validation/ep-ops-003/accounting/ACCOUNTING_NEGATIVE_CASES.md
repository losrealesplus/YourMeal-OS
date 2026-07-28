# Accounting Negative Cases

| ID | Caso | Esperado | Resultado |
|----|------|----------|:---------:|
| AN-01 | Sin `accounting.operate` | Denegado (route guard) | ✅ `assertCapabilityFromContext` |
| AN-02 | Customer → `/admin/accounting` | Redirect / denegado | ✅ staff surface |
| AN-03 | Placeholder no inventa datos | Sin mocks / KPIs fingidos | ✅ copy honesta |
| AN-04 | Flag OFF / módulo no activado | No PASS de certificación | ✅ FAIL documentado |
| AN-05 | Schema invoices ≠ jornada Accounting | No contar B2C read como Outcome | ✅ clasificado |

---

## Conclusión

Negativos de permiso y No Artificiality **PASS**.  
Outcome operacional **FAIL** (esperado con placeholder).
