# EP-OPS-001 · Operational Center Readiness

**Estado:** Active — sprint de certificación (bloquea RI-001)  
**Tipo:** Correction / Certification — **no** feature nueva de cocina/packaging  
**Pregunta RI-001:** ¿Podemos demostrar una jornada real EatClean × YourMeal OS?  
**Principio:** [DICT-071](../20-evidence-framework/09-operational-visibility-principle.md) · [DICT-072](../05-architecture/OPERATIONAL_REPRESENTATION_PATTERN.md)  
**Gap técnico:** [OPS_CENTER_DUAL_SURFACE](./OPS_CENTER_DUAL_SURFACE.md)  
**Matriz:** [RI001_FUNCTIONAL_COMPLETENESS_MATRIX](./RI001_FUNCTIONAL_COMPLETENESS_MATRIX.md) (bloque Ops Center primero)

---

## Por qué ahora

El Centro de Operaciones **deja de ser una funcionalidad** y pasa a ser un **requisito de certificación**.

Sin un hub operacional usable, no se puede demostrar una jornada completa: Cocina, Clientes o Administración auditados sobre una navegación inestable no representan el estado final del producto.

```text
Hasta ahora:  ¿Qué falta por construir?
Ahora:        ¿Puede cada rol entrar a su espacio y completar la jornada?
```

**Recomendación de secuencia:** pausar temporalmente el Functional Completeness Review del resto de módulos y certificar primero este hub. Luego reanudar la matriz con base estable.

---

## Objetivo

> Certificar que el Centro de Operaciones permite a cada rol acceder **únicamente** a los módulos necesarios para desempeñar su trabajo durante una jornada completa.

No es un dashboard de KPIs. Es el **hub operacional** del tenant.

---

## Arquitectura objetivo

```text
Landing
    │
    ▼
Login
    │
    ├──► Customer App  →  Cliente
    │
    ▼
Centro de Operaciones EatClean  (/admin)
    │
    ├── Dashboard
    ├── Cocina (cola)
    ├── Hoja de Producción
    ├── Kitchen Execution
    ├── Reparto
    ├── Atención al Cliente
    ├── Clientes
    ├── Empresas
    ├── Administración
    ├── Finanzas
    └── Configuración

Powered by YourMeal OS
    └── Centro de Operaciones YourMeal OS  (/saas)  ← solo saas_admin
```

---

## Criterios PASS

### 1. Navegación

- Todos los accesos del hub funcionan.
- Sin enlaces rotos, rutas huérfanas ni botones sin acción.
- Ítems fuera de alcance piloto: ocultos (FF) o «Próximamente» explícito (DICT-071).

### 2. RBAC (positivo y negativo)

| Rol | Ve en `/admin` | No ve |
|-----|----------------|-------|
| Cliente | — (no entra al Centro) | `/admin`, `/saas` |
| Cocina | Dashboard (si aplica) · Kitchen Queue · Hoja · Execution | Finanzas · SaaS · admin completo |
| Reparto | Dashboard · Reparto · Entregas (cuando existan) | Cocina mutación · SaaS |
| Atención al Cliente | Clientes · Pedidos · Soporte | Ejecución cocina · SaaS |
| Finanzas | Facturación · Pagos · Informes financieros | Cocina · SaaS |
| Company Admin | Todo el **tenant** | `/saas` |
| SaaS Admin | Tenant (según dual-role) **+** `/saas` | — |

### 3. Separación Tenant / Plataforma

| Superficie | Responsabilidad |
|------------|-----------------|
| `/admin` | Opera **EatClean** |
| `/saas` | Administra **YourMeal OS** |

Sin compartir navegación, branding ni responsabilidades. Entrada SaaS discreta (p. ej. bajo *Powered by YourMeal OS*), solo `saas_admin`.

### 4. Persistencia

Cada módulo **visible** desde el hub demuestra CREATE / READ / UPDATE / soft DELETE cuando aplica.  
Ninguna pantalla meramente decorativa.

### 5. Operational Visibility (Dashboard)

Solo información real. Prohibido: tarjetas vacías fingiendo live, KPIs ficticios, contadores inventados, mocks.  
Sin dato → «Sin datos disponibles» u oculto.

### 6. Criterio FOPEBA (matriz)

El bloque Centro de Operaciones en `RI001_FUNCTIONAL_COMPLETENESS_MATRIX.md` debe estar en verde:

```text
Visible ✔ · Navega ✔ · Guarda ✔ · Lee ✔ · RBAC ✔ · Auditoría ✔
```

Sin hallazgos CRITICAL / HIGH abiertos de acceso u operación.

---

## Work packages (Correction)

| WP | Entrega | Archivos típicos |
|----|---------|------------------|
| WP-1 | Nav EatClean acotada al hub objetivo + kitchen sheet/execution en primary | `admin-shell.tsx`, `operations-departments.ts` |
| WP-2 | RBAC por rol (ocultar depts ajenos; saas_admin ≠ ops admin automático) | `operations-workspaces.ts`, permissions |
| WP-3 | Entrada discreta `/saas` + alinear `homePathForRoles` / `decideOperationsCenterEntry` | `PoweredByLine`, `home-path.ts`, `open-operations-center.ts` |
| WP-4 | Dashboard `/admin` sin mocks (datos reales o vacío honesto) | `admin.index.tsx` |
| WP-5 | SaaS shell: placeholders → FF OFF o «Próximamente»; IA plataforma | `saas.tsx`, `saas.*.tsx` |
| WP-6 | Evidencia: matriz Ops en verde + RBAC ± registrado | matriz + log hallazgos |

Fuera de alcance de este EP: Packaging, Delivery nuevo, Monitoring live, rediseño estético.

---

## Definition of Done

El Centro de Operaciones está listo para RI-001 cuando:

- [ ] Todos los accesos del hub navegan correctamente.
- [ ] No existen botones sin función en el hub visible.
- [ ] Cada módulo visible usa solo datos persistidos (o vacío honesto).
- [ ] Separación `/admin` vs `/saas` clara y funcional.
- [ ] RBAC validado en positivo y negativo para todos los perfiles del piloto.
- [ ] Auditoría sin CRITICAL/HIGH abiertos de acceso/operación.
- [ ] Un empleado EatClean puede iniciar la jornada, entrar a su espacio y completar tareas **sin salir** del Centro de Operaciones (salvo Customer App para clientes).

Tras PASS → reanudar Functional Completeness Review del resto de superficies sobre esta base estable.
