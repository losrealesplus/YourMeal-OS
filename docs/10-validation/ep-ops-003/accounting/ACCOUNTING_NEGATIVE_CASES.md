# Accounting Negative Cases (Re-Certification)

| ID | Caso | Esperado | Resultado |
|----|------|----------|:---------:|
| AN-01 | Sin `accounting.operate` | Denegado | ✅ |
| AN-02 | Customer → Accounting | Redirect `/app` | ✅ |
| AN-03 | Facturar pedido no `delivered` | Rechazado | ✅ servicio |
| AN-04 | Facturar pedidos de clientes distintos | Rechazado | ✅ |
| AN-05 | Cobro > saldo restante | Rechazado | ✅ |
| AN-06 | Cobro sobre `paid`/`void` | Rechazado | ✅ |
| AN-07 | Importe factura = suma pedidos | Sin free-amount | ✅ |

---

## Conclusión

Negativos de permiso y anclaje a delivered **PASS** tras corrección P0.
