# EP-002A.1.1 · Operations Center Entry

**Estado:** Done (implementation)  
**Tras:** [EP-002A.1 Próxima entrega](./EP002A1_UPCOMING_DELIVERY.md)  
**Cara:** Customer App → Centro de Operaciones  
**Principio:** [Operational Visibility](../20-evidence-framework/09-operational-visibility-principle.md) (DICT-071)

---

## Objetivo

El botón **Centro de Operaciones** deja de ser un enlace ciego y pasa a ser la **entrada segura al backoffice** de EatClean.

```text
Customer App / Login footer
        │
openOperationsCenter()
        │
¿Sesión staff válida?
   ┌────┴────┐
   Sí        No
   │         │
   ▼         ▼
Ops Center   /auth/admin?returnTo=/admin
(o workspace)     │
único)            ▼
            Login administrativo
                  │
                  ▼
            Centro de Operaciones
```

---

## Implementación

| Pieza | Rol |
|-------|-----|
| `decideOperationsCenterEntry` | Decide auth vs navigate (sin lógica en UI) |
| `BrandLeafMark` | Control de entrada (Home + Login) |
| `/auth/admin` | Puerta oficial; honra `returnTo` seguro; no redirige clientes al `/app` en silencio |
| `departmentsForRoles` | Catálogo RBAC + Feature Flags para departamentos |
| Ops Home | Atención del día + listado de departamentos autorizados |

---

## Criterios de aceptación

- [x] El botón no hace `navigate("/admin")` directo sin comprobar sesión staff.
- [x] Sin sesión staff → `/auth/admin` con `returnTo=/admin`.
- [x] Tras login staff → vuelve al Centro (o `returnTo` seguro bajo `/admin` / `/saas`).
- [x] Sesión cliente en `/auth/admin` → pedir cambiar de cuenta (no bounce silencioso a `/app`).
- [x] Menú / departamentos respetan RBAC.
- [x] Módulos bajo Feature Flag (Stock, Finanzas, …) no aparecen si el flag está off.
- [x] Toda entrada listada abre un módulo real.

---

## Definition of Done

Un miembro del personal puede abrir **Centro de Operaciones** desde la Customer App, autenticarse si hace falta, y ver únicamente los departamentos que su rol permite — sin pantallas vacías ni enlaces muertos.
