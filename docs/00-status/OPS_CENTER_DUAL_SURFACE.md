# Ops Center · Dual Surface (EatClean vs YourMeal OS)

**Estado:** Gap documentado · corrección pendiente (RI-001 Readiness · Fase 3)  
**Tipo:** Correction / Readiness — **no** nueva capacidad de cocina  
**Sprint:** [RI001_READINESS_SPRINT](./RI001_READINESS_SPRINT.md)

---

## Principio

```text
EatClean              →  Opera el negocio (tenant)
YourMeal OS           →  Administra la plataforma (SaaS)
```

Dos niveles. Un solo producto plataforma; un Centro de Operaciones por tenant + un Centro discreto de plataforma.

---

## Objetivo UX

### 1. Centro de Operaciones EatClean (`/admin`)

Uso diario. Solo módulos del tenant. IA objetivo:

```text
Dashboard
Cocina
Producción
Reparto
Atención al Cliente
Administración
Configuración
```

### 2. Centro de Operaciones YourMeal OS (`/saas`)

Debajo del acceso principal / *Powered by YourMeal OS*. Sin protagonismo.  
**Solo `saas_admin`.** Nunca usuarios normales del tenant.

Contenido objetivo:

```text
Tenants · Administradores · Licencias · Branding
Auditoría global · Feature Flags · Configuración SaaS · Monitoring
```

---

## Estado actual (código)

| Aspecto | Hoy | Gap |
|---------|-----|-----|
| Rutas | `/admin` vs `/saas` separados | ✅ Base sana |
| Guard SaaS | `saas.manage` → solo `saas_admin` | ✅ |
| Nav tenant | ERP amplio (`admin-shell.tsx`) | Demasiados ítems; Producción enterrada |
| Nav SaaS | Placeholder panels | Faltan Admins, Audit global, Flags, Monitoring |
| Entry SaaS desde admin | No hay botón discreto | ❌ |
| `PoweredByLine` | Texto estático | No es enlace SaaS |
| `saas_admin` en tenant | Tratado como ops admin completo | Mezcla plataformas |
| `homePathForRoles` vs `decideOperationsCenterEntry` | Divergentes si dual-role | Inconsistente |

Archivos clave:

- `src/components/admin-shell.tsx`
- `src/lib/operations-departments.ts`
- `src/lib/open-operations-center.ts`
- `src/lib/home-path.ts`
- `src/routes/_authenticated/saas.tsx`
- `src/components/tenant/tenant-brand-scope.tsx` (`PoweredByLine`)

---

## Criterio de aceptación (Fase 3)

1. Nav EatClean acotada a departamentos del tenant (extras ocultos por flag o fuera de nav).
2. Entrada discreta a `/saas` **solo** para `saas_admin`.
3. Company Admin **nunca** ve superficie SaaS.
4. `homePathForRoles` y `decideOperationsCenterEntry` alineados para dual-role.
5. Sin fingir módulos SaaS: placeholder → Feature Flag OFF o «Próximamente» explícito (DICT-071).

---

## Fuera de alcance de este documento

Implementar Packaging, Monitoring live, o rediseño visual. Solo clarificar la separación de superficies.
