# Surface Navigation Report (EP-OPS-002 · Bloque D + F)

**Estado:** Validado (2026-07-28)  
**Alcance:** Login → Landing → Workspace → Menú → Operación → Logout → Login  
**Sin cambios:** Auth · sesiones · RLS · capabilities (solo redirect negativo Platform)

---

## Recorrido positivo

```text
Login
  → resolveHomePath / homePathForRoles
Landing (determinista)
  → Workspace path o Ops Center
Menú de superficie
  → Operación (capability guard en ruta hija)
Logout
  → /auth (o flujo auth existente)
Login
  → Mismo Landing / Workspace (misma política, sin estado de “última pantalla” obligatorio)
```

| Check | Resultado | Notas |
|-------|:---------:|-------|
| Persistencia de roles → mismo home | PASS | Código puro sobre roles |
| Refresh en ruta protegida | PASS | `beforeLoad` revalida guards |
| Deep link workspace autorizado | PASS | Ruta hija + `assertCapabilityFromContext` |
| Deep link workspace no autorizado | PASS | Redirect a `/admin` o `/app` según guard |
| Logout → login → mismo workspace | PASS | LP no depende de historial |

---

## Casos negativos (Bloque F)

| Caso | Entrada | Esperado | Resultado |
|------|---------|----------|:---------:|
| Company Admin → `/saas` | sin `saas.manage` | Redirect **`/admin`** (Tenant home) | PASS (`assertSaasRoute`) |
| Customer → `/saas` | sin staff | Redirect **`/app`** | PASS |
| Customer → `/admin` | sin staff | Redirect **`/app`** | PASS |
| Employee Kitchen → módulo Admin settings | sin `admin.settings` | Redirect **`/admin`** | PASS (capability context) |
| Customer → workspace interno Support | sin staff | No entra Tenant Surface | PASS |
| Pure SaaS Admin → Tenant `/admin` | `hasStaffAccess` incluye `saas_admin` | Acceso Tenant **permitido por RBAC vigente**; landing nativo sigue `/saas` | PASS (documentado; sin rediseño RBAC) |
| Hybrid SaaS+Company Admin → Tenant | roles Bootstrap | Landing `/admin`; Platform vía entry | PASS |
| Kitchen → `/admin/accounting` | sin `accounting.operate` | Redirect `/admin` | PASS |

---

## Navegación desde raíces

| Origen | Sesión | Destino |
|--------|--------|---------|
| `"/"` | autenticado | `resolveHomePath` |
| `"/"` | anónimo | marketing / auth según ruta |
| `/auth` post-login | OK | `resolveHomePath` |
| `/auth/admin` post-login | staff | `resolvePostAdminLoginPath` (WEP) |

---

## Evidencia automatizada

- `src/lib/home-path.spec.ts`
- `src/lib/operations-workspaces.test.ts`
- `src/lib/open-operations-center.spec.ts`
- `src/permissions/route-guards.spec.ts`
- `src/lib/resolve-home-path.spec.ts`
- `src/bootstrap/profiles.spec.ts`
