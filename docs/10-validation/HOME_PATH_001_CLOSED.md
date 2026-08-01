# HOME-PATH-001 · CLOSED

**Fecha cierre:** 2026-08-01  
**Estado:** **CLOSED** — no es defect de navegación / home-path  
**Evidencia:** PS-002-C local + HOME-PATH-002 (`home_path_gap`) + AUTH-SESSION-002

---

## Veredicto

`HOME_PATH_RESOLVED` no se emite **por diseño** cuando el usuario no es staff.

```text
ROLE_READY
  roles = []
  roleCount = 0
  membership = null
  tenant = null
        ↓
hasStaffAccess([]) → false
        ↓
enterOperationsCenter → { status: "not_staff" }
        ↓
STOP { reason: "not_staff" }
        ↓
HOME_PATH_RESOLVED  (no emitido)
```

Código: `src/lib/admin-auth-bootstrap.ts` (`enterOperationsCenter`).

---

## Qué queda fuera de alcance de HOME-PATH

| No hacer | Por qué |
|----------|---------|
| Cambiar `resolvePostAdminLoginPath` / `homePathForRoles` | Path resolution no se alcanzó |
| Cambiar FCR-008 | Pipeline correcto hasta el staff gate |
| “Forzar” HOME_PATH sin roles | Violaria el gate de Ops |

---

## Siguiente trabajo (datos · no Auth)

Proyecto: `djangucecsphnejplvic`  
Usuario observado: `74914617-ced2-4b89-b3b9-c622cf056bd2`

Verificar / provisionar:

1. Fila(s) en `user_roles` con rol staff (`company_admin` · `operations_manager` · kitchen/delivery · `saas_admin`)  
2. Membership / tenant asociados  
3. Si el email PS002 debe ser Platform Owner → [BOOTSTRAP_RUNBOOK](./BOOTSTRAP_RUNBOOK.md) / `config/bootstrap/platform-owners.json` + `npm run seed:platform-owners`  

Hasta que exista rol staff, **PS-002-C seguirá FAIL correctamente** (`not_staff`).

Relacionado: [HOME_PATH_002_EVIDENCE](./HOME_PATH_002_EVIDENCE.md)
