# Accounting Negative Cases (Correction P0)

| ID | Caso | Esperado | Resultado |
|----|------|----------|:---------:|
| AN-01 | Sin `accounting.operate` | Denegado | ✅ |
| AN-02 | Acceso customer fuera Workspace | Redirect `/app` | ✅ |
| AN-03 | Factura / pedido inexistente | NOT_FOUND | ✅ |
| AN-04 | Cobro sin Review | INVALID_STATE | ✅ |
| AN-05 | Cobro / review sobre ya cerrado | INVALID_STATE | ✅ |
| AN-06 | Transición inválida `paid → pending` | Rechazada | ✅ dominio |
| AN-07 | Cerrar periodo con pending | INVALID_STATE | ✅ |
| AN-08 | Cerrar periodo ya cerrado | INVALID_STATE | ✅ |
| AN-09 | Facturar no-`delivered` | INVALID_STATE | ✅ |
| AN-10 | Emitir en periodo closed | INVALID_STATE | ✅ |

---

## Conclusión

Negativos de permiso, inexistencia, cierre y transiciones **PASS**.
