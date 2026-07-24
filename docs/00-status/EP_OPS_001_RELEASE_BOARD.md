# Release Board · EP-OPS-001

**Modo:** Certificación — **demostrar operación**, no construir features  
**Estado:** Active — bloquea RI-001  
**Naturaleza del proyecto:** demostrar que YourMeal OS opera una empresa real de alimentación **sin intervención de ingeniería**  
**Canon:** [OCM-001](./EATCLEAN_OPERATIONAL_STRUCTURE.md) · [DICT-074](../99-reference/PROJECT_DICTIONARY.md#operational-canonical-model)  
**Principios:** [DICT-071](../20-evidence-framework/09-operational-visibility-principle.md) · [DICT-072](../05-architecture/OPERATIONAL_REPRESENTATION_PATTERN.md) · [DICT-073](../05-architecture/TENANT_OPERATIONAL_AUTONOMY.md)  
**Spec de corrección:** [EP_OPS_001_OPERATIONAL_CENTER_READINESS](./EP_OPS_001_OPERATIONAL_CENTER_READINESS.md)  
**Matriz:** [RI001_FUNCTIONAL_COMPLETENESS_MATRIX](./RI001_FUNCTIONAL_COMPLETENESS_MATRIX.md)

```text
Antes:  Construir YourMeal OS
Ahora:  Demostrar que YourMeal OS puede operar una empresa real
        de alimentación sin intervención del equipo de ingeniería
```

---

## Visión ejecutiva · tres preguntas

Si las **tres** son **Sí**, EP-OPS-001 está listo para certificación.

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
Escenario base: [ORS-001](./EATCLEAN_OPERATIONAL_STRUCTURE.md#4--ors-001--operational-reference-scenario).

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

Responde la pregunta de RI-001. Base: [ORS-001](./EATCLEAN_OPERATIONAL_STRUCTURE.md#4--ors-001--operational-reference-scenario).

```text
1. Company Admin → crea equipo (Kitchen · Delivery · Support) → verifica accesos
2. Cliente → registro → login → menú semanal → confirma pedido
3. Kitchen Queue → Hoja → Kitchen Execution → Finalizado
4. Reparto → rutas → entrega → confirma
5. Cliente → recibe → Historial → Repetir → Favoritos
```

WPs: WP-6 + E2E post-PASS.

> Packaging / Delivery avanzados en cola: el tramo Reparto usa lo certificado o se marca acotado (DICT-071) — no se finge.

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

## Después del PASS · Architecture Freeze

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
End-to-End Operational Journey (ORS-001 + variaciones)
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

### Congelado (explícito)

- Modelo RBAC (OCM-001)  
- Estructura `/admin`  
- Estructura `/saas`  
- Tenant Provisioning  
- Roles  
- Navegación principal  
- Patrones Service → Report / Workspace (DICT-072)  
- DICT-071 · DICT-072 · DICT-073 · DICT-074 (OCM-001)  
- ORS-001 como escenario de referencia  

### Permitido durante el freeze

- Corrección de defectos  
- Ajustes de UX  
- Rendimiento  
- Evidencia  
- Documentación  
- Validaciones de RI-001  

### No permitido

- Nuevos módulos  
- Nuevos roles  
- Cambios estructurales de arquitectura  
- Nuevos patrones  
- Ampliación del alcance funcional  

---

## Day-0 Provisioning Scenario

**Primera demostración pública de YourMeal OS.**  
Tenant vacío · sin ingeniería · demuestra DICT-073 + OCM-001 + ORS-001 + Observability.

```text
1. saas_admin crea el tenant EatClean
2. Configura branding y parámetros básicos
3. Crea el company_admin
4. company_admin crea el equipo (Cocina, Reparto, Atención al Cliente, …)
5. El equipo inicia sesión y empieza a trabajar
6. Un cliente realiza un pedido y el sistema completa ORS-001
7. En cualquier momento: las 7 preguntas de Observability tienen respuesta
```

### Éxito RI-001 (demostración ante observador)

1. La plataforma crea y aprovisiona un nuevo tenant.  
2. El tenant se autogestiona sin ayuda del proveedor.  
3. Un cliente realiza un pedido.  
4. La cocina lo procesa.  
5. El reparto lo entrega.  
6. Toda la operación queda registrada y es auditable.  

Sin bloqueos funcionales + evidencia de cada paso = validación de EatClean **y** del modelo operativo para futuros clientes.

Ejecutor preferido: **no** el equipo de desarrollo (ops / producto / FOPEBA).

---

## Relación WPs ↔ board

| Elemento | WPs |
|----------|-----|
| Pregunta 1 / Bloqueador 1 | WP-1, WP-2, WP-4 |
| Pregunta 2 / Bloqueador 2 | WP-3, WP-5 |
| Pregunta 3 / Bloqueador 3 | WP-6 + E2E |
| Observability | Propiedad transversal (no WP-7) |
| Day-0 | WP-5 + B3 + Observability |

Detalle de corrección: [EP-OPS-001](./EP_OPS_001_OPERATIONAL_CENTER_READINESS.md).
