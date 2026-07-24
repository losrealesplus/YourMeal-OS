# Release Board · EP-OPS-001

**Modo:** Certificación operacional — **eliminar bloqueadores**, no backlog de desarrollo  
**Estado:** Active — alimenta el [RI-001 Certification Gate](./RI001_CERTIFICATION_GATE.md)  
**Naturaleza:** producto en **fase de certificación operacional** (no “SaaS en desarrollo”)  
**Canon:** [OCM-001](./EATCLEAN_OPERATIONAL_STRUCTURE.md) · [ORS-001](./ORS_001_OPERATIONAL_REFERENCE_SCENARIO.md) · [DICT-074](../99-reference/PROJECT_DICTIONARY.md#operational-canonical-model)  
**Principios:** [DICT-071](../20-evidence-framework/09-operational-visibility-principle.md) · [DICT-072](../05-architecture/OPERATIONAL_REPRESENTATION_PATTERN.md) · [DICT-073](../05-architecture/TENANT_OPERATIONAL_AUTONOMY.md)  
**Informe de decisión:** [RI-001 Certification Report](./RI001_CERTIFICATION_REPORT.md)  
**Gate:** [CG-RI-001](./RI001_CERTIFICATION_GATE.md) · [DICT-075](../99-reference/PROJECT_DICTIONARY.md#certification-gate)  
**Spec de corrección:** [EP_OPS_001_OPERATIONAL_CENTER_READINESS](./EP_OPS_001_OPERATIONAL_CENTER_READINESS.md)  
**Matriz:** [RI001_FUNCTIONAL_COMPLETENESS_MATRIX](./RI001_FUNCTIONAL_COMPLETENESS_MATRIX.md)

```text
Antes:  Construir YourMeal OS · ¿qué desarrollamos hoy?
Ahora:  Certificar operación · ¿qué bloqueador eliminamos hoy?
        ¿Qué evidencia falta para una decisión objetiva sobre RI-001?
```

---

## Tablero de eliminación de bloqueadores

**No es un backlog.** Cada fila tiene estado de certificación.

Leyenda: 🔴 bloquea · 🟡 en progreso / evidencia parcial · 🟢 eliminado · ⚪ pendiente de fase

| Bloqueador | Evidencia requerida | Estado |
|------------|---------------------|:------:|
| `/admin` Operativo | FCR bloque Ops + EP-OPS-001 (P1) | 🟡 |
| `/saas` Gobierno | Tenant Provisioning (P2 · DICT-073) · entry dual ✅ en código | 🟡 |
| Jornada completa | [ORS-001](./ORS_001_OPERATIONAL_REFERENCE_SCENARIO.md) ejecutado | 🔴 |
| Observability | KPIs + auditoría verificados (7 preguntas) | 🔴 |
| RRR | Checklist completo (tras Gate abierto) | ⚪ |
| RBAC hardening (impl.) | [CHECK-IT 04](./CHECK_IT_04_RBAC_HARDENING.md) | 🟢 |
| Evidence Audit | [CHECK-IT 05](./CHECK_IT_05_EVIDENCE_AUDIT.md) | 🔴 NOT READY |

Pregunta diaria: **¿qué bloqueador eliminamos hoy?**  
Foco: [CERTIFICATION_SPRINT](./CERTIFICATION_SPRINT.md)
---

## Visión ejecutiva · tres preguntas

Si las **tres** son **Sí** (y Observability), EP-OPS-001 puede PASS y se abre el trabajo pleno del Certification Gate.

| # | Pregunta | Responsable | Sí ☐ |
|---|----------|-------------|:----:|
| 1 | ¿Puede operar EatClean? | Company Admin | ☐ |
| 2 | ¿Puede gobernarse YourMeal OS? | SaaS Admin | ☐ |
| 3 | ¿Puede completarse una jornada real? | Cliente · Cocina · Reparto · Atención · Finanzas · Company Admin | ☐ |

### 1 · ¿Puede operar EatClean?

Company Admin, **sin** depender del SaaS Admin:

- Gestionar su empresa  
- Gestionar su equipo  
- Gestionar clientes  
- Gestionar pedidos  
- Gestionar la operación diaria  

→ [Bloqueador 1](#-bloqueador-1--company-operations-center-eatclean) · OCM-001 `/admin`

### 2 · ¿Puede gobernarse YourMeal OS?

SaaS Admin, **sin** entrar en la operación diaria de EatClean:

- Crear tenants  
- Configurar branding  
- Aprovisionar Company Admin  
- Gestionar licencias  
- Gestionar configuración global  
- Auditar toda la plataforma  

→ [Bloqueador 2](#-bloqueador-2--saas-operations-center-yourmeal-os) · DICT-073

### 3 · ¿Puede completarse una jornada real?

Cada actor trabaja **solo** desde su área. El sistema conecta todo.  
Prueba de referencia: [ORS-001](./ORS_001_OPERATIONAL_REFERENCE_SCENARIO.md) — si falla, RI-001 no certificable.

→ [Bloqueador 3](#-bloqueador-3--jornada-operativa--ors-001)

---

## Arquitectura por responsabilidades

```text
                    YourMeal OS
               (Platform Governance)
                        │
                SaaS Operations Center
                        │
────────────────────────┼────────────────────────
                        │
                  Tenant Provisioning
                        │
                        ▼
                   EatClean Tenant
                        │
             Company Operations Center
                        │
      ┌──────────┬──────────┬──────────┬──────────┐
      │          │          │          │          │
  Clientes   Cocina   Reparto   Finanzas   Administración
      │
      ▼
 Pedido → Producción → Entrega → Historial
```

---

## 🔴 Bloqueador 1 · Company Operations Center (EatClean)

**Objetivo:** `/admin` = centro de trabajo real de EatClean.  
**Canon:** [OCM-001 §3](./EATCLEAN_OPERATIONAL_STRUCTURE.md#3--centros-de-operaciones-dual-surface)

```text
Centro de Operaciones EatClean   /admin

├── Dashboard
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
```

### PASS cuando

| Condición | ☐ |
|-----------|:-:|
| Todos los módulos existen | ☐ |
| Todos navegan | ☐ |
| Todos respetan RBAC (OCM-001) | ☐ |
| No existen botones muertos | ☐ |
| No existen pantallas placeholder | ☐ |
| No existen datos simulados | ☐ |

WPs: WP-1 · WP-2 · WP-4.

---

## 🔴 Bloqueador 2 · SaaS Operations Center (YourMeal OS)

Centro de **Gobierno** de la plataforma — no un botón oculto. DICT-073.

```text
Powered by YourMeal OS
Centro de Operaciones YourMeal OS   →  /saas
```

Visible **únicamente** para `saas_admin`.

| Área | Contenido |
|------|-----------|
| Tenant Management | Listado · estado · activación · branding · crear |
| Company Administration | Crear / editar / desactivar · invitación o reset · estado |
| Roles | Solo roles de sistema (nunca permisos sueltos) |
| Membership | RI-001: Usuario → **1** Tenant |
| Auditoría | Todo cambio registrado |

WPs: WP-3 · WP-5.

---

## 🔴 Bloqueador 3 · Jornada operativa · ORS-001

Responde la pregunta de RI-001.  
**Activo principal:** [ORS-001 · Operational Reference Scenario](./ORS_001_OPERATIONAL_REFERENCE_SCENARIO.md) (8 criterios de aceptación).

```text
1. Company Admin → crea equipo → verifica accesos
2. Cliente → pedido
3. Kitchen Queue → Hoja → Execution → Finalizado
4. Reparto → entrega
5. Cliente → resultado · Historial
```

WPs: WP-6 + E2E en el Certification Gate.

> Packaging / Delivery avanzados en cola: tramo Reparto certificado o acotado (DICT-071) — no se finge.

**Regla:** ORS-001 FAIL ⇒ RI-001 no certificable.

---

## 🟠 Condición transversal · Operational Observability

**No es WP-7.** No es un módulo nuevo.  
Es una **propiedad del sistema** que emerge de Dashboard + Kitchen Queue + Kitchen Execution + Reparto + Auditoría (+ resto integrado).

Durante Day-0 / la jornada, en cualquier momento debe poder responderse **con datos del sistema**:

| Pregunta | ☐ |
|----------|:-:|
| ¿Cuántos pedidos hay pendientes? | ☐ |
| ¿Qué está cocinándose ahora? | ☐ |
| ¿Qué está listo para reparto? | ☐ |
| ¿Qué está en ruta? | ☐ |
| ¿Qué se entregó hoy? | ☐ |
| ¿Qué incidencias existen? | ☐ |
| ¿Quién hizo cada cambio? | ☐ |

Si alguna no puede responderse, la jornada **aún no** está completamente demostrada.

---

## Definition of Done · EP-OPS-001

Tres preguntas ejecutivas = **Sí** **y** checklist simultáneo:

| Criterio | Estado |
|----------|:------:|
| ¿Puede operar EatClean? (P1) | ☐ |
| ¿Puede gobernarse YourMeal OS? (P2) | ☐ |
| ¿Puede completarse una jornada real? (P3) | ☐ |
| Centro de Operaciones EatClean funcional | ☐ |
| Todos los departamentos accesibles | ☐ |
| RBAC positivo validado | ☐ |
| RBAC negativo validado | ☐ |
| Centro de Operaciones YourMeal OS operativo | ☐ |
| Tenant Provisioning funcional | ☐ |
| Company Admin creado desde `/saas` | ☐ |
| Company Admin accede a `/admin` | ☐ |
| Equipo operativo creado sin intervención de ingeniería | ☐ |
| Dashboard sin mocks | ☐ |
| Persistencia validada | ☐ |
| Auditoría registrada | ☐ |
| Operational Observability (7 preguntas) | ☐ |
| Alineado con OCM-001 / invariantes | ☐ |

Solo entonces:

```text
EP-OPS-001
PASS
```

---

## Después del PASS · entrada al Certification Gate

```text
EP-OPS-001 PASS
        │
        ▼
🔒 Architecture Freeze
        │
        ▼
══════════════════════════════════
     RI-001 CERTIFICATION GATE
══════════════════════════════════
        │
        ├── Functional Completeness Review
        ├── RBAC Certification
        ├── Operational Observability
        ├── End-to-End Validation (ORS-001)
        ├── Evidence Collection
        └── Release Readiness Review
        │
        ▼
RI-001 Decision · READY | READY WITH OBSERVATIONS | NOT READY
```

Detalle: [RI001_CERTIFICATION_GATE](./RI001_CERTIFICATION_GATE.md).

### Congelado (explícito)

- Modelo RBAC (OCM-001)  
- Estructura `/admin`  
- Estructura `/saas`  
- Tenant Provisioning  
- Roles  
- Navegación principal  
- Patrones Service → Report / Workspace (DICT-072)  
- DICT-071 · DICT-072 · DICT-073 · DICT-074 (OCM-001) · DICT-075 · DICT-076 (ORS)  
- ORS-001 como prueba de referencia  

### Permitido durante el freeze

- Corrección de defectos (**debe producir evidencia**)  
- Ajustes de UX · Rendimiento  
- Evidencia · Documentación  
- Validaciones de RI-001 / carriles del Gate  

### No permitido

- Nuevos módulos · nuevos roles  
- Cambios estructurales de arquitectura · nuevos patrones  
- Ampliación del alcance funcional  
- Trabajo que no reduzca incertidumbre de certificación  

---

## Day-0 Provisioning Scenario

**Primera demostración pública.** Incluye aprovisionamiento + [ORS-001](./ORS_001_OPERATIONAL_REFERENCE_SCENARIO.md) + Observability.  
Sin ingeniería · demuestra DICT-073 + OCM-001.

Ver criterios 1–8 en ORS-001. Ejecutor preferido: ops / producto / FOPEBA.

### Éxito ante observador (decisión informada)

1. La plataforma crea y aprovisiona un nuevo tenant.  
2. El tenant se autogestiona sin ayuda del proveedor.  
3. Un cliente realiza un pedido.  
4. La cocina lo procesa.  
5. El reparto lo entrega.  
6. Toda la operación queda registrada, auditable y **observable**.  

---

## Relación WPs ↔ board

| Elemento | WPs |
|----------|-----|
| Pregunta 1 / `/admin` | WP-1, WP-2, WP-4 |
| Pregunta 2 / `/saas` | WP-3, WP-5 |
| Pregunta 3 / ORS-001 | WP-6 + E2E (Gate) |
| Observability | Propiedad transversal (no WP-7) |
| Day-0 | WP-5 + ORS-001 + Observability |

Detalle de corrección: [EP-OPS-001](./EP_OPS_001_OPERATIONAL_CENTER_READINESS.md).  
Cosecha FOPEBA post-decisión: [Certification Gate §](./RI001_CERTIFICATION_GATE.md#cosecha-fopeba-post-ri-001).