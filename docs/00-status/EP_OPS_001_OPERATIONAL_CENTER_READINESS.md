# EP-OPS-001 · Operational Center Readiness

**Estado:** Active — **bloquea RI-001**  
**Tipo:** Correction / Certification — no Packaging / no features de cocina nuevas  
**Bloqueo:** RI-001 está temporalmente bloqueado por EP-OPS-001 (no por falta de módulos, sino por falta de **punto de entrada operacional certificado**)  
**Principio:** [DICT-071](../20-evidence-framework/09-operational-visibility-principle.md) · [DICT-072](../05-architecture/OPERATIONAL_REPRESENTATION_PATTERN.md) · [DICT-073 Tenant Operational Autonomy](../05-architecture/TENANT_OPERATIONAL_AUTONOMY.md)  
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

## WP-5 · Tenant Provisioning (capacidad de plataforma)

> **Principio (DICT-073):** un tenant no está operacionalmente activo hasta que puede autogestionar su organización **sin intervención del proveedor SaaS**.

WP-5 **no es una pantalla**. Es el puente crítico elevado a capacidad de plataforma.

| Antes (lectura débil) | Ahora (lectura correcta) |
|-----------------------|--------------------------|
| “Crear administradores” | **Aprovisionar un tenant** |
| CRUD de usuarios en SaaS | Autonomía operacional del cliente |
| Puente útil | Criterio de madurez multi-tenant |

**Limitación actual:** no hay forma completa de aprovisionar tenant + Company Admin + roles + auditoría sin depender del desarrollador. Sin esto, EatClean no puede ponerse en marcha solo → bloquea la demostración RI-001.

### Alcance mínimo

#### 1. Tenant Management (`/saas`)

- Listado de tenants  
- Crear tenant  
- Activar / desactivar  
- Estado  
- Branding asociado  

#### 2. Company Administration (por tenant)

- Crear Company Admin  
- Editar  
- Desactivar  
- Restablecer contraseña **o** enviar invitación (según flujo elegido)  
- Ver estado de la cuenta  

#### 3. Roles

Asignar **roles** soportados por el tenant — **no** permisos individuales. Los permisos los define el sistema.

```text
Company Admin
Kitchen
Delivery
Customer Support
Finance
Operations
Custom (futuro)
```

#### 4. Membership (decisión RI-001)

> **Un usuario pertenece a un único tenant.**

Multi-membership (una cuenta en varios tenants) queda **fuera de RI-001** y debe documentarse como cambio de modelo si se adopta después.

#### 5. Auditoría

Toda acción genera evidencia en `audit_log` (o equivalente persistido):

```text
Company Admin creado
        ↓
Rol asignado
        ↓
Cuenta activada
        ↓
Permisos / roles modificados
        ↓
Cuenta desactivada
```

Cada evento: **quién** · **cuándo** · **tenant afectado** · **resultado**.

### Criterios PASS de WP-5

- ✅ Crear un Company Admin para un tenant.  
- ✅ Iniciar sesión con esa cuenta.  
- ✅ Acceder a `/admin`.  
- ✅ Ver únicamente el tenant correspondiente.  
- ✅ Gestionar usuarios del tenant según los permisos definidos.  
- ✅ No acceder a `/saas`.  
- ✅ Todas las acciones quedan registradas en auditoría.  

**DoD WP-5:** un `saas_admin` aprovisiona un Company Admin real; ese usuario entra a `/admin`, gestiona staff del tenant y **nunca** ve `/saas` — sin SQL manual ni intervención de ingeniería.

**Archivos típicos:** rutas `/saas/*`, servicios de tenant/membership/roles, RLS, `audit_log`.

> Nota DICT-071: si alguna subpantalla SaaS no está lista, FF OFF o «Próximamente» — **no** fingir Tenant Provisioning; WP-5 es PASS obligatorio del EP.

### Primera prueba de certificación (post WP-5)

**No la ejecuta el equipo de ingeniería.** Escenario de autonomía:

1. Un `saas_admin` crea un nuevo `company_admin` para EatClean.  
2. El `company_admin` inicia sesión por primera vez.  
3. Accede al Centro de Operaciones (`/admin`).  
4. Crea usuarios de Cocina, Reparto y Atención al Cliente.  
5. Asigna sus roles.  
6. Cada usuario inicia sesión y accede **únicamente** a su área.  

Si ese flujo funciona sin intervención adicional de desarrollo, se ha demostrado aprovisionamiento autónomo del tenant — no solo un CRUD.

---

## WP-6 · Operational Certification (mini-gate)

Tras WP-1…WP-5, mini certificación del hub **antes** de Architecture Freeze y del resto de la auditoría.

```text
□ Navegación completa (WP-1)
□ RBAC positivo (WP-2)
□ RBAC negativo + URL directa (WP-2)
□ Persistencia en módulos visibles
□ Dashboard sin mocks (WP-4)
□ Separación /admin vs /saas (WP-3)
□ Tenant Provisioning + autonomía (WP-5 · DICT-073)
□ Escenario de certificación autónomo (saas_admin → company_admin → staff)
□ Sin hallazgos CRITICAL
□ Sin hallazgos HIGH bloqueantes
□ Matriz bloque Ops en verde
```

Solo con este checklist **PASS** → **Architecture Freeze** → reanudar Functional Completeness Review del resto.

---

## Hoja de ruta

```text
EP-OPS-001 PASS
        │
        ▼
Architecture Freeze
        │
        ▼
Functional Completeness Review (resto)
        │
        ▼
RBAC Certification (ampliada) / E2E
        │
        ▼
Evidence Review
        │
        ▼
RI-001 Readiness Decision
```

### Architecture Freeze (tras EP-OPS-001 PASS)

Hasta finalizar RI-001:

| Prohibido | Permitido |
|-----------|-----------|
| ❌ Nuevos módulos | ✅ Corrección de defectos |
| ❌ Nuevos patrones arquitectónicos | ✅ Evidencia |
| ❌ Nuevas capacidades | ✅ Certificación |

Objetivo: alcance estable mientras FOPEBA obtiene evidencia de campo de esta primera implementación.

Detalle: [DICT-073 · Tenant Operational Autonomy](../05-architecture/TENANT_OPERATIONAL_AUTONOMY.md).

---

## Fuera de alcance de este EP

- Packaging / Delivery nuevos módulos.
- Monitoring live / métricas de cocina avanzadas.
- Rediseño estético / polish ACT-001.
- Multi-membership (usuario ↔ varios tenants).

---

## Definition of Done (EP completo)

- [ ] WP-1…WP-6 PASS.
- [ ] Un empleado EatClean inicia jornada en el hub, trabaja en su departamento y no necesita salir (salvo clientes → Customer App).
- [ ] Tenant Provisioning: `saas_admin` aprovisiona Company Admin; Company Admin gestiona staff; auditoría completa (DICT-073).
- [ ] Escenario de certificación autónomo ejecutado **sin** intervención de ingeniería.
- [ ] Separación `/admin` vs `/saas` evidente y enforceable.
- [ ] Membership RI-001: un usuario ↔ un tenant (documentado).
- [ ] Architecture Freeze activado hasta cierre de RI-001.
- [ ] RI-001 **desbloqueado** para FCR + E2E sobre base estable.