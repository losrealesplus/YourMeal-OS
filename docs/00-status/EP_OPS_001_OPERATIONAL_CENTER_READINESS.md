# EP-OPS-001 · Operational Center Readiness

**Estado:** Active — **bloquea RI-001**  
**Tipo:** Correction / Certification — no Packaging / no features de cocina nuevas  
**Bloqueo:** RI-001 está temporalmente bloqueado por EP-OPS-001 (no por falta de módulos, sino por falta de **punto de entrada operacional certificado**)  
**Working board:** [EP_OPS_001_RELEASE_BOARD](./EP_OPS_001_RELEASE_BOARD.md) ← **3 preguntas ejecutivas** (no “roadmap”)  
**Canon:** [OCM-001](./EATCLEAN_OPERATIONAL_STRUCTURE.md) — contrato UI · RBAC · Operación · ORS-001  
**Principio:** [DICT-071](../20-evidence-framework/09-operational-visibility-principle.md) · [DICT-072](../05-architecture/OPERATIONAL_REPRESENTATION_PATTERN.md) · [DICT-073](../05-architecture/TENANT_OPERATIONAL_AUTONOMY.md) · [DICT-074](../99-reference/PROJECT_DICTIONARY.md#operational-canonical-model)  
**Gap:** [OPS_CENTER_DUAL_SURFACE](./OPS_CENTER_DUAL_SURFACE.md)  
**Matriz:** [RI001_FUNCTIONAL_COMPLETENESS_MATRIX](./RI001_FUNCTIONAL_COMPLETENESS_MATRIX.md) — bloque Ops primero; resto ⏸

---

## Pregunta

> **¿Puede YourMeal OS operar una empresa real de alimentación sin intervención del equipo de ingeniería?**

Hasta que este EP sea **PASS**, cualquier E2E estará condicionado por el hueco del hub.

```text
RI-001  ←── bloqueado por ──  EP-OPS-001 PASS
```

Naturaleza del proyecto: ya no construir módulos — **demostrar operación** vía Release Board + OCM-001.

---

## Objetivo

No construir nuevas capacidades de producto (Packaging, etc.).

**Certificar el Centro de Operaciones como hub operacional de EatClean y como Centro de Gobierno de YourMeal OS.**

No es un dashboard decorativo. Es el punto desde el que cualquier empleado interno inicia su jornada — y desde el que la plataforma aprovisiona tenants (DICT-073).

---

## Arquitectura objetivo

```text
Landing → Login
            ├── Customer App          → Cliente
            │
            └── Centro de Operaciones EatClean   /admin
                    ├── Dashboard (datos reales)
                    ├── Cocina
                    │   ├── Kitchen Queue
                    │   ├── Hoja de Producción
                    │   └── Kitchen Execution
                    ├── Reparto
                    ├── Atención al Cliente
                    ├── Clientes
                    ├── Empresas
                    ├── Administración
                    ├── Finanzas
                    └── Configuración

                Powered by YourMeal OS
                Centro de Operaciones YourMeal OS   /saas
                    (solo saas_admin · Centro de Gobierno)
```

---

## WP-1 · Operational Navigation

**Objetivo:** «Centro de Operaciones» = punto de entrada único para usuarios internos del tenant → `/admin`.  
**Bloqueador:** [1 · EatClean Ops Center](./EP_OPS_001_RELEASE_BOARD.md#-bloqueador-1-crítico--centro-de-operaciones-eatclean)

### Estructura EatClean (`/admin`)

| Área | Contenido |
|------|-----------|
| Dashboard | Resumen operativo · indicadores **reales** (sin mocks) |
| Cocina | Kitchen Queue · Hoja de Producción · Kitchen Execution |
| Departamentos | Reparto · Atención al Cliente · Clientes · Empresas · Administración · Finanzas · Configuración |

### Criterios

- Todas las rutas del hub accesibles según rol.
- Sin enlaces rotos, botones sin acción ni módulos vacíos fingiendo live (DICT-071).
- Sin pantallas placeholder ni datos simulados.

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

Fuente canónica ampliada (incl. parciales 🟡): [EATCLEAN_OPERATIONAL_STRUCTURE §2](./EATCLEAN_OPERATIONAL_STRUCTURE.md#2--matriz-de-acceso-rbac).

| Rol | Dashboard | Cocina | Producción | Reparto | Clientes | Empresas | Finanzas | Admin | SaaS |
|-----|:---------:|:------:|:----------:|:-------:|:--------:|:--------:|:--------:|:-----:|:----:|
| Cliente | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cocina | ✅ | ✅ | 🟡 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Producción | ✅ | 🟡 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Reparto | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Atención Cliente | ✅ | ❌ | ❌ | 🟡 | ✅ | 🟡 | ❌ | ❌ | ❌ |
| Finanzas | ✅ | ❌ | ❌ | ❌ | 🟡 | 🟡 | ✅ | ❌ | ❌ |
| Company Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| SaaS Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Cada celda: prueba **positiva** y **negativa** (URL directa incluida).  
`saas_admin` no debe tratarse automáticamente como “ops admin de menú tenant” sin el dual-role explícito acordado; Company Admin **nunca** ve `/saas`.

**Archivos típicos:** `operations-workspaces.ts`, route `beforeLoad`, permissions, RLS.

---

## WP-3 · Dual Operations Center

**Bloqueador:** [2 · YourMeal OS Governance](./EP_OPS_001_RELEASE_BOARD.md#-bloqueador-2-crítico--centro-de-operaciones-yourmeal-os)

### Entrada principal

```text
Centro de Operaciones   →  /admin
```

Visible para usuarios del tenant con permisos staff.

### Entrada secundaria (menor jerarquía visual · Centro de Gobierno)

```text
Powered by YourMeal OS
Centro de Operaciones YourMeal OS   →  /saas
```

Condiciones:

- Visible **solo** `saas_admin`.
- No es “un botón oculto”: es el Centro de Gobierno de la plataforma.
- No renderizar el control para otros roles.
- Redirige a `/saas`.

| Superficie | Responsabilidad |
|------------|-----------------|
| `/admin` | Opera **EatClean** |
| `/saas` | Gobierna **YourMeal OS** (Tenants · Company Admins · Roles · Branding · Auditoría · Flags · Config SaaS) |

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
**Bloqueador:** [2 · YourMeal OS](./EP_OPS_001_RELEASE_BOARD.md#-bloqueador-2-crítico--centro-de-operaciones-yourmeal-os) · demo: [Day-0](./EP_OPS_001_RELEASE_BOARD.md#day-0-provisioning-scenario)

| Antes (lectura débil) | Ahora (lectura correcta) |
|-----------------------|--------------------------|
| “Crear administradores” | **Aprovisionar un tenant** |
| CRUD de usuarios en SaaS | Autonomía operacional del cliente |
| Puente útil | Criterio de madurez multi-tenant |

**Limitación actual:** no hay forma completa de aprovisionar tenant + Company Admin + roles + auditoría sin depender del desarrollador. Sin esto, EatClean no puede ponerse en marcha solo → bloquea la demostración RI-001.

### Alcance mínimo

#### 1. Tenant Management (`/saas`)

- Listado de tenants · Estado · Activar / desactivar · Branding asociado · Crear tenant  

#### 2. Company Administration (por tenant)

- Crear / Editar / Desactivar Company Admin  
- Reenviar invitación o restablecer acceso  
- Ver estado de la cuenta  

#### 3. Roles

Asignar **roles** — **nunca** permisos individuales.

```text
Company Admin · Kitchen · Delivery · Customer Support · Finance · Operations
```

#### 4. Membership (decisión RI-001)

> **Un usuario pertenece a un único tenant.**

#### 5. Auditoría

Toda acción en `audit_log`: quién · cuándo · tenant · resultado.

### Criterios PASS de WP-5

- ✅ Crear un Company Admin para un tenant.  
- ✅ Iniciar sesión con esa cuenta.  
- ✅ Acceder a `/admin`.  
- ✅ Ver únicamente el tenant correspondiente.  
- ✅ Gestionar usuarios del tenant según los permisos definidos.  
- ✅ No acceder a `/saas`.  
- ✅ Todas las acciones quedan registradas en auditoría.  

**DoD WP-5:** un `saas_admin` aprovisiona un Company Admin real; ese usuario entra a `/admin`, gestiona staff del tenant y **nunca** ve `/saas` — sin SQL manual ni intervención de ingeniería.

> Nota DICT-071: si alguna subpantalla SaaS no está lista, FF OFF o «Próximamente» — **no** fingir Tenant Provisioning; WP-5 es PASS obligatorio del EP.

---

## WP-6 · Operational Certification (mini-gate)

Tras WP-1…WP-5, mini certificación del hub **antes** de Architecture Freeze.  
**Bloqueador:** [3 · Jornada Operativa](./EP_OPS_001_RELEASE_BOARD.md#-bloqueador-3-crítico--jornada-operativa-completa) (arranque; E2E completo post-PASS).

Checklist canónico: tabla DoD del [Release Board](./EP_OPS_001_RELEASE_BOARD.md#definition-of-done--ep-ops-001).

Solo con ese checklist **PASS** → **Architecture Freeze** → FCR / RBAC / E2E / Evidence / RRR / RI-001.

---

## Secuencia post-PASS (estabilizada)

Ya no se habla de roadmap de producto. Ver [Release Board · Después del PASS](./EP_OPS_001_RELEASE_BOARD.md#después-del-pass).

```text
EP-OPS-001 PASS
        │
        ▼
🔒 Architecture Freeze
        │
        ▼
Functional Completeness Review
        │
        ▼
RBAC Certification
        │
        ▼
End-to-End Operational Journey
        │
        ▼
Evidence Collection
        │
        ▼
Release Readiness Review
        │
        ▼
RI-001 Decision
```

### Architecture Freeze

| Prohibido | Permitido |
|-----------|-----------|
| ❌ Nuevos módulos | ✅ Corrección de defectos |
| ❌ Nuevos patrones arquitectónicos | ✅ Evidencia |
| ❌ Nuevas capacidades | ✅ Certificación |

---

## Fuera de alcance de este EP

- Packaging / Delivery como módulos nuevos.
- Monitoring live / métricas de cocina avanzadas.
- Rediseño estético / polish ACT-001.
- Multi-membership (usuario ↔ varios tenants).

---

## Definition of Done (EP completo)

Fuente de verdad: [Release Board DoD](./EP_OPS_001_RELEASE_BOARD.md#definition-of-done--ep-ops-001) (3 preguntas + checklist + Observability).

Resumen:

- [ ] Preguntas 1–3 = Sí.
- [ ] OCM-001 / invariantes respetados.
- [ ] ORS-001 demostrable · Observability (7 preguntas).
- [ ] Day-0 sin ingeniería.
- [ ] Architecture Freeze activado (lista explícita).
- [ ] RI-001 desbloqueado para FCR + E2E sobre base estable.
