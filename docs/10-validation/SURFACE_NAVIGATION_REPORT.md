# Surface Navigation Report (EP-OPS-002)

**Estado:** ✅ **CERTIFIED** (con RBAC-001 / WEP-001 / LP-001)  
**Alcance:** Login → Landing → Workspace → Operación  

---

## Recorrido

```text
Login → Landing determinista → Workspace → Menú → Operación
Logout → Login → Mismo Landing (misma política de roles)
```

| Check | Resultado |
|-------|:---------:|
| Mismos roles → mismo home | PASS |
| Refresh en ruta protegida | PASS |
| Deep link autorizado / denegado | PASS |
| Logout → login → mismo workspace | PASS |

## Casos negativos

| Caso | Resultado |
|------|:---------:|
| Company Admin → `/saas` | Redirect `/admin` · PASS |
| Customer → `/admin` o `/saas` | Redirect `/app` · PASS |
| Kitchen → accounting / settings sin cap | Redirect `/admin` · PASS |
| Híbrido SaaS+Company Admin | Landing `/admin` · PASS |

Tests: `home-path` · `operations-workspaces` · `open-operations-center` · `route-guards` · `resolve-home-path`
