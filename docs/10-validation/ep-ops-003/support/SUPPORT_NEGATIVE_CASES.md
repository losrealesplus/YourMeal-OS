# Support Negative Cases (Re-Certification)

| ID | Caso | Esperado | Resultado |
|----|------|----------|:---------:|
| SN-01 | Sin `support.read` | Denegado | ✅ |
| SN-02 | Customer → Support | Redirect `/app` | ✅ |
| SN-03 | Sin `support.write` | No write / no transition | ✅ |
| SN-04 | Transición ilegal `closed → open` | Rechazada | ✅ dominio |
| SN-05 | Cerrar incidencia | Acción UI + service | ✅ |
| SN-06 | Abrir → cerrar sin resolve | Permitido (`open → closed`) | ✅ |
| SN-07 | Logistics incidents ≠ Support | Dominios separados | ✅ |

---

## Conclusión

Negativos de permiso y lifecycle **PASS** tras corrección P0.
