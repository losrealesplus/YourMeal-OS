# ORR · Party / B2C / B2B Operational Readiness (pre–Pilot Ready)

**ID:** ORR-PARTY-001  
**Fecha:** 2026-07-23  
**Estado:** 🟡 Abierto (checklist — ejecutar antes de Pilot Ready)  
**Knowledge Lifetime:** Iteration  
**Prerrequisitos:** [ADR 0015](../adr/0015-b2b-b2c-customer-model.md) · [ADR 0016](../adr/0016-party-model-demand-actors.md) · [Traceability](../17-operational-model/CORE_OBJECT_TRACEABILITY.md)  
**No es:** FOV · ampliación de producto · permiso para seguir construyendo módulos

> **Regla:** no marcar EatClean Pilot Ready ni iniciar piloto de campo hasta que ORR-001…006 estén PASSED o los ítems fallidos estén explícitamente fuera de alcance del piloto acotado.

---

## Principio comercial (B2B)

> **Las empresas NO se registran. Las empresas son dadas de alta por EatClean.**

```text
Empresa interesada → Contacto comercial → Negociación → Aceptación
        ↓
EatClean crea Company Account (Centro de Operaciones → Administración → Clientes Empresa)
        ↓
Company Code
        ↓
Empleados se vinculan (código y/o invitación)
```

El alta de empresa es un **evento operacional** de gestión comercial del Tenant — no autoservicio público.

---

## ORR-001 · Validación B2C (Individual Customer / Consumer)

### Onboarding

- [ ] Se puede seleccionar «Particular».
- [ ] Se crea correctamente el Individual Customer (Consumer).
- [ ] `ensure_individual_customer` provisiona `customers` + membership Tenant + rol `customer` cuando falta.
- [ ] Se completa el pedido (CJ-001).
- [ ] El pedido queda asociado al Consumer correcto (`customer_id`, `demand_channel=individual`).

### Pedido

- [ ] Guarda correctamente (draft → confirm).
- [ ] Aparece en Cocina *(requiere ops reales — si mock, marcar BLOCKED o fuera de alcance)*.
- [ ] Aparece en Reparto *(idem)*.
- [ ] Puede cerrarse *(idem)*.

**Resultado ORR-001:** ☐ PASSED · ☐ BLOCKED · ☐ N/A (alcance acotado)

---

## ORR-002 · Validación Empresa (alta por EatClean)

### Alta exclusivamente desde

```text
Centro de Operaciones → Administración → Clientes Empresa → Nueva Empresa
```

### Validar

- [ ] Crear Company Account (staff Tenant con `company.manage`).
- [ ] Crear sedes (Sites).
- [ ] Crear Organizational Units.
- [ ] Configurar condiciones comerciales / datos fiscales (campos v1).
- [ ] Generar Company Code único, no editable.
- [ ] Activar empresa (`deleted_at` null / status active).
- [ ] **No** existe registro público de empresa en Customer App.

**Resultado ORR-002:** ☐ PASSED · ☐ BLOCKED

---

## ORR-003 · Validación Empleado (Membership)

### Registro público (vínculo, no creación de empresa)

- [ ] Introduce Company Code.
- [ ] La empresa existe y está activa.
- [ ] Selecciona Site.
- [ ] Selecciona Organizational Unit.
- [ ] Ubicación interna opcional.
- [ ] Se crea Employee Membership.
- [ ] Puede realizar pedidos.

### Pedido B2B

- [ ] Hereda Company.
- [ ] Hereda Site.
- [ ] Hereda Organizational Unit.
- [ ] Se asigna Delivery Group.
- [ ] Se refleja en Operaciones *(si ops reales)*.

**Resultado ORR-003:** ☐ PASSED · ☐ BLOCKED

---

## ORR-004 · Operaciones

> **PR-034 · Operations Workspace Activation** — Cocina (`/admin/kitchen`) y Reparto (`/admin/delivery`) sobre pedidos reales. Ya **NO** queda DEFERRED por mock.

### Checklist validación piloto

- [ ] Cocina visible (`kitchen` · `operations_manager` · `company_admin` · `saas_admin`).
- [ ] Cocina funcional (lista, filtros, detalle, transiciones).
- [ ] Reparto visible (`delivery` · `logistics` · `operations_manager` · `saas_admin`).
- [ ] Reparto funcional (lista, filtros, detalle, transiciones).
- [ ] Estados cambian correctamente (Cocina: Pendiente → En preparación → Preparado → Listo; Reparto: Listo → En reparto → Entregado / Incidencia).
- [ ] Persistencia correcta (`transition_order_status` + audit).
- [ ] Timeline operacional actualizado en detalle de pedido.
- [ ] RBAC correcto (Kitchen solo Cocina · Delivery solo Reparto · Operations Manager todo Operaciones · SaaS Admin todo).

### Cocina (detalle funcional)

- [ ] Distingue pedidos B2C / B2B (`demand_channel`).
- [ ] Filtra por fecha / empresa / sede / Delivery Group.
- [ ] Muestra platos, cantidades, observaciones, OU, hora/día.

### Reparto (detalle funcional)

- [ ] Filtra por fecha / empresa / Delivery Group (ruta cuando exista).
- [ ] Ve empresa, sede, dirección, contacto, observaciones.

**Fuera de alcance (no bloquean ORR-004):** optimización de rutas, mapas, GPS, ETA, app conductor, firma, tracking.

**Resultado ORR-004:** ☐ PASSED · ☐ BLOCKED  
~~DEFERRED~~ — retirado; el mock de cocina/reparto ya no aplica como salida válida.

---

## ORR-005 · RBAC

| Actor | Debe poder | No debe |
|-------|------------|---------|
| Consumer (Individual) | Pedir B2C · perfil | Crear empresas · ver portal admin empresa ajeno |
| Employee (Membership) | Pedir B2B · ver mi empresa/sede/unidad | Crear empresas · admin Tenant |
| Company Admin (membership.is_admin) | Portal limitado (si EatClean lo concede) | Alta comercial de otras empresas |
| Company Staff (EatClean) | Alta empresas · sedes · OU | — |
| SaaS Admin | Todo + SaaS | — |

- [ ] Consumer  
- [ ] Employee  
- [ ] Company Admin (Membership)  
- [ ] Company Staff / Tenant `company_admin`  
- [ ] SaaS Admin  

**Resultado ORR-005:** ☐ PASSED · ☐ BLOCKED

---

## ORR-006 · Integridad de datos (pedido)

| Pregunta | Obligatorio | Campo |
|----------|:-----------:|-------|
| ¿Quién hizo el pedido? | ✅ | `customer_id` |
| ¿Es B2C o B2B? | ✅ | `demand_channel` |
| ¿A qué tenant pertenece? | ✅ | `tenant_id` |
| ¿Qué empresa? (si B2B) | ✅ | `company_id` |
| ¿Qué sede? (si B2B) | ✅ | `site_id` |
| ¿Qué unidad organizativa? (si B2B) | ✅ | `organizational_unit_id` |
| ¿Qué Delivery Group? (si B2B) | ✅ | `delivery_group_id` |
| ¿Dónde se entrega? | ✅ | address / site address / `delivery_address_id` |

Si alguna queda vacía cuando debería existir → **no iniciar piloto**.

**Resultado ORR-006:** ☐ PASSED · ☐ BLOCKED

---

## Incorporación de empleados (modos)

Configurable por empresa (EatClean / futuro portal):

| Modo | Uso | Estado |
|------|-----|--------|
| **Código abierto** | Empresas pequeñas · alta presencial | ✅ v1 (Company Code) |
| **Invitación** | Empresas grandes · control de altas | 📋 Previsto (Company Invite) — no bloquea ORR si Mode 1 PASSED |

Flujo Invite (objetivo):

```text
Company Admin o EatClean → Invitar → enlace seguro → empresa preseleccionada → completar datos
```

---

## Decisión de salida

| Condición | Acción |
|-----------|--------|
| ORR-001 + 002 + 003 + 006 PASSED; ORR-004 validable (PR-034) | Piloto operativo posible tras checklist Cocina/Reparto |
| ORR-004 PASSED | Piloto E2E operativo posible |
| Cualquier BLOCKED en 001–003 o 006 | **No** Pilot Ready |

Firma / fecha: _______________
