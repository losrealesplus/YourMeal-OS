# Surface Navigation Report (EP-OPS-002 · Correction)

**Estado:** **READY FOR RE-CERTIFICATION**  
**Alcance:** Login → Landing → Workspace → Operación (consistencia post-corrección)  
**Sin cambios:** Auth · sesiones · RLS · matriz de capabilities (solo redirect negativo Platform)

---

## Flujo corregido

```text
Login
  → resolveHomePath / homePathForRoles
Landing (determinista)
  → Workspace path o Ops Center
Menú de superficie
  → Operación (capability guard)
Logout → Login
  → Mismo Landing (misma política de roles)
```

| Check | Comportamiento final |
|-------|----------------------|
| Mismos roles → mismo home | Sí (`homePathForRoles`) |
| Refresh en ruta protegida | `beforeLoad` revalida guards |
| Deep link autorizado | Ruta hija + capability |
| Deep link no autorizado | Redirect `/admin` o `/app` |
| Logout → login | Sin dependencia de “última pantalla” |

---

## Casos negativos (comportamiento final)

| Caso | Resultado esperado |
|------|--------------------|
| Company Admin → `/saas` sin `saas.manage` | Redirect `/admin` |
| Customer → `/saas` | Redirect `/app` |
| Customer → `/admin` | Redirect `/app` |
| Kitchen → settings sin `admin.settings` | Redirect `/admin` |
| Customer → workspaces internos | Bloqueado (no staff) |
| Puro `saas_admin` | Landing `/saas`; Tenant solo si RBAC vigente lo concede |
| Híbrido SaaS+Company Admin | Landing `/admin`; Platform vía entry |

Tests: `home-path.spec` · `operations-workspaces.test` · `open-operations-center.spec` · `route-guards.spec` · `resolve-home-path.spec`

---

## Re-Certification Gate

```text
STATUS: READY FOR RE-CERTIFICATION
Gate: — (no PASS · pendiente pasada RI-001)
```
