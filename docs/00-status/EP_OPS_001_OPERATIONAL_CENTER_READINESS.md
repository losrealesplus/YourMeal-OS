# EP-OPS-001 · Operational Center Readiness

**Estado:** Active — **bloquea RI-001**  
**Tipo:** Correction / Certification — no Packaging / no features de cocina nuevas  
**Bloqueo:** RI-001 está temporalmente bloqueado por EP-OPS-001 (no por falta de módulos, sino por falta de **punto de entrada operacional certificado**)  
**Principio:** [DICT-071](../20-evidence-framework/09-operational-visibility-principle.md) · [DICT-072](../05-architecture/OPERATIONAL_REPRESENTATION_PATTERN.md)  
**Gap:** [OPS_CENTER_DUAL_SURFACE](./OPS_CENTER_DUAL_SURFACE.md)  
**Matriz:** [RI001_FUNCTIONAL_COMPLETENESS_MATRIX](./RI001_FUNCTIONAL_COMPLETENESS_MATRIX.md) — bloque Ops primero; resto ⏸

---

## Pregunta

> **¿Podemos demostrar una jornada real EatClean × YourMeal OS?**

Hasta que este EP sea **PASS**, cualquier E2E estará condicionado por el hueco del hub.

```text
RI-001  ←── bloqueado por ──  EP-OPS-001 PASS
```

---

## Objetivo del sprint

No construir nuevas capacidades de producto (Packaging, etc.).

**Certificar el Centro de Operaciones como hub operacional de EatClean y de la plataforma YourMeal OS.**

No es un dashboard decorativo. Es el punto desde el que cualquier empleado interno inicia su jornada.

---

## Arquitectura objetivo

```text
Landing → Login
            ├── Customer App          → Cliente
            │
            └── Centro de Operaciones EatClean   /admin
                    ├── Dashboard (datos reales)
                    ├── Cocina
                    ├── Producción (Hoja + Execution)
                    ├── Reparto
                    ├── Atención al Cliente
                    ├── Clientes
                    ├── Empresas
                    ├── Administración
                    ├── Finanzas
                    └── Configuración

                Powered by YourMeal OS
                Centro de Operaciones YourMeal OS   /saas
                    (solo saas_admin)
```

---

## WP-1 · Operational Navigation

**Objetivo:** «Centro de Operaciones» = punto de entrada único para usuarios internos del tenant → `/admin`.

### Estructura EatClean (`/admin`)

| Área | Contenido |
|------|-----------|
| Dashboard | Resumen operativo · indicadores **reales** (sin mocks) |
| Departamentos | Cocina · Producción · Reparto · Atención al Cliente · Clientes · Empresas · Administración · Finanzas · Configuración |

Producción incluye entradas a Hoja de Producción y Kitchen Execution (o subnav clara).

### Criterios

- Todas las rutas del hub accesibles según rol.
- Sin enlaces rotos, botones sin acción ni módulos vacíos fingiendo live (DICT-071).

**DoD WP-1:** Todos los departamentos son navegables y funcionales según el rol correspondiente.

**Archivos típicos:** `admin-shell.tsx`, `operations-departments.ts`, i18n admin.

---

## WP-2 · Operational RBAC

Crítico: no basta ocultar el menú. Validar:

1. Visibilidad del menú  
2. Acceso directo por URL  
3. Acciones CRUD  
4. Persistencia  
5. Respuestas del backend  

### Matriz de acceso (piloto)

| Rol | Dashboard | Cocina | Producción | Reparto | Clientes | Empresas | Finanzas | Admin | SaaS |
|-----|:---------:|:------:|:----------:|:-------:|:--------:|:--------:|:--------:|:-----:|:----:|
| Cliente | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cocina | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Reparto | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Atención Cliente | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Finanzas | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Company Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| SaaS Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Cada celda: prueba **positiva** y **negativa** (URL directa incluida).  
`saas_admin` no debe tratarse automáticamente como “ops admin de menú tenant” sin el dual-role explícito acordado; Company Admin **nunca** ve `/saas`.

**Archivos típicos:** `operations-workspaces.ts`, route `beforeLoad`, permissions, RLS.

---

## WP-3 · Dual Operations Center

### Entrada principal

```text
Centro de Operaciones   →  /admin
```

Visible para usuarios del tenant con permisos staff.

### Entrada secundaria (menor jerarquía visual)

```text
Powered by YourMeal OS
Centro de Operaciones YourMeal OS   →  /saas
```

Condiciones:

- Visible **solo** `saas_admin`.
- No renderizar el control para otros roles.
- Redirige a `/saas`.

| Superficie | Responsabilidad |
|------------|-----------------|
| `/admin` | Opera **EatClean** |
| `/saas` | Administra **YourMeal OS** (Tenants, Admins, Roles globales, Branding, Licencias, Feature Flags, Auditoría global, Config SaaS) |

Alinear `homePathForRoles` y `decideOperationsCenterEntry` para dual-role.

**Archivos típicos:** `PoweredByLine` / brand mark, `home-path.ts`, `open-operations-center.ts`, `saas.tsx`.

---

## WP-4 · Dashboard operacional

Eliminar cualquier dato ficticio en `/admin`.

- Solo información persistida.
- Sin datos → «Sin datos disponibles» **o** ocultar el widget.
- Nunca números inventados / mocks que parezcan live.

**Archivos típicos:** `admin.index.tsx`, deps de `mock-admin` si aún alimentan el dashboard.

---

## WP-5 · Gestión de administradores (imprescindible)

**Limitación actual:** no hay forma completa de que la plataforma asigne Company Admin, permisos y actores del tenant sin depender del desarrollador.

Sin esto, EatClean no puede autogestionar su organización → bloquea demostración RI-001 de “operar sin el equipo de ingeniería”.

### Mínimo en Centro YourMeal OS (`/saas`)

- Crear Company Admin.
- Asignar roles.
- Revocar roles.
- Activar / desactivar cuentas.
- Asociar usuarios al tenant correcto.
- Auditar cambios de permisos (`audit_log`).

Este WP es el **puente** plataforma → operación del cliente.

**DoD WP-5:** un `saas_admin` puede aprovisionar un Company Admin real y ese usuario entra a `/admin` con permisos correctos — sin SQL manual.

**Archivos típicos:** rutas `/saas/*`, servicios de membership/roles, RLS, audit.

> Nota DICT-071: si alguna subpantalla SaaS no está lista, FF OFF o «Próximamente» — **no** fingir la gestión de admins; WP-5 es PASS obligatorio del EP.

---

## WP-6 · Operational Certification (mini-gate)

Tras WP-1…WP-5, mini certificación del hub **antes** de reanudar el resto de la auditoría.

```text
□ Navegación completa (WP-1)
□ RBAC positivo (WP-2)
□ RBAC negativo + URL directa (WP-2)
□ Persistencia en módulos visibles
□ Dashboard sin mocks (WP-4)
□ Separación /admin vs /saas (WP-3)
□ Gestión de administradores (WP-5)
□ Sin hallazgos CRITICAL
□ Sin hallazgos HIGH bloqueantes
□ Matriz bloque Ops en verde
```

Solo con este checklist **PASS** → reanudar Functional Completeness Review del resto.

---

## Hoja de ruta

```text
EP-OPS-001
        │
        ▼
Centro de Operaciones PASS
        │
        ▼
Functional Completeness Review (resto)
        │
        ▼
RBAC Certification (ampliada)
        │
        ▼
End-to-End Operational Journey
        │
        ▼
Evidence Review
        │
        ▼
RI-001 Readiness Decision
```

---

## Fuera de alcance de este EP

- Packaging / Delivery nuevos módulos.
- Monitoring live / métricas de cocina avanzadas.
- Rediseño estético / polish ACT-001.

---

## Definition of Done (EP completo)

- [ ] WP-1…WP-6 PASS.
- [ ] Un empleado EatClean inicia jornada en el hub, trabaja en su departamento y no necesita salir (salvo clientes → Customer App).
- [ ] Un `saas_admin` puede crear/asignar Company Admin y auditar el cambio.
- [ ] Separación `/admin` vs `/saas` evidente y enforceable.
- [ ] RI-001 **desbloqueado** para continuar FCR + E2E sobre base estable.
