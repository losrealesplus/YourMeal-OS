# Support Negative Cases

**Pasada:** EP-OPS-003 · Support Journey  
**Fecha:** 2026-07-28  

---

| ID | Caso | Esperado | Observado | Resultado |
|----|------|----------|-----------|:---------:|
| SN-01 | Sin `support.read` → `/admin/support` | Denegado | `assertCapabilityFromContext` | ✅ |
| SN-02 | Customer → Support | Redirect `/app` | `assertStaffRoute` | ✅ |
| SN-03 | Sin `support.write` | No escribe | Form oculto · service throw | ✅ |
| SN-04 | Directorio vacío | Empty honesto | Presente | ✅ |
| SN-05 | Cliente sin pedidos | Empty orders | Presente | ✅ |
| SN-06 | Cerrar incidencia | Debe existir para Outcome | **Acción inexistente** | ✗ P0 |
| SN-07 | `operations_manager` → Support | Escalado (pack) | Nav puede mostrar; **sin** `support.read` → redirect | ⚠ |
| SN-08 | Confundir con `/admin/routes/incidents` | Dominio distinto | Logistics `delivery_issue` ≠ Support | ✅ documentado |

---

## Conclusión

Permisos y límites de superficie **OK**.  
Negativo de cierre (SN-06) = **P0 del Outcome** → contribuye a Gate FAIL.
