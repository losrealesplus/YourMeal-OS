# Release Board · EP-OPS-001

**Modo:** Certificación — **eliminar bloqueos**, no desarrollar funcionalidades  
**Estado:** Active — bloquea RI-001  
**Principios:** [DICT-071](../20-evidence-framework/09-operational-visibility-principle.md) · [DICT-072](../05-architecture/OPERATIONAL_REPRESENTATION_PATTERN.md) · [DICT-073](../05-architecture/TENANT_OPERATIONAL_AUTONOMY.md)  
**Spec de corrección:** [EP_OPS_001_OPERATIONAL_CENTER_READINESS](./EP_OPS_001_OPERATIONAL_CENTER_READINESS.md)  
**Estructura visual (canon):** [EATCLEAN_OPERATIONAL_STRUCTURE](./EATCLEAN_OPERATIONAL_STRUCTURE.md) — actores · RBAC · dual hub · recorrido pedido  
**Matriz:** [RI001_FUNCTIONAL_COMPLETENESS_MATRIX](./RI001_FUNCTIONAL_COMPLETENESS_MATRIX.md)

> DICT-073 cierra el último principio arquitectónico previo a RI-001.  
> A partir de aquí no hay “roadmap de features”: hay un **Release Board** de bloqueos críticos.

```text
Objetivo del board
  ❌ Desarrollar funcionalidades nuevas
  ✅ Eliminar bloqueos que impiden certificar la operación
```

---

## 🔴 Bloqueador 1 (Crítico) · Centro de Operaciones EatClean

**Objetivo:** que `/admin` sea el verdadero centro de trabajo de EatClean.  
**Canon visual:** [EATCLEAN_OPERATIONAL_STRUCTURE §3](./EATCLEAN_OPERATIONAL_STRUCTURE.md#3--centros-de-operaciones-dual-surface)

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
| Todos respetan RBAC | ☐ |
| No existen botones muertos | ☐ |
| No existen pantallas placeholder | ☐ |
| No existen datos simulados | ☐ |

WPs: WP-1 · WP-2 · WP-4 · (nav Cocina / Producción).

---

## 🔴 Bloqueador 2 (Crítico) · Centro de Operaciones YourMeal OS

Aquí cobra sentido **DICT-073**.

No es un botón oculto. Es el **Centro de Gobierno de la plataforma**.

```text
Powered by YourMeal OS
Centro de Operaciones YourMeal OS   →  /saas
```

Visible **únicamente** para `saas_admin`.

### Debe incluir

#### Tenant Management

- Listado de tenants  
- Estado  
- Activación  
- Branding  

#### Company Administration

- Crear Company Admin  
- Editar  
- Desactivar  
- Reenviar invitación o restablecer acceso  
- Estado de la cuenta  

#### Roles

Gestionar **únicamente roles**. Nunca permisos individuales.

```text
Company Admin
Kitchen
Delivery
Customer Support
Finance
Operations
```

#### Membership (RI-001)

```text
Usuario
   ↓
1 Tenant
```

La relación **1:1** queda explícita. Multi-membership fuera de RI-001.

#### Auditoría

Todo cambio queda registrado (actor · fecha/hora · tenant · resultado).

WPs: WP-3 · WP-5.

---

## 🔴 Bloqueador 3 (Crítico) · Jornada Operativa Completa

Aquí se responde la pregunta de RI-001. Recorrido como ocurre en EatClean:

```text
1. Company Admin
        ↓
   Crea el equipo operativo
        ↓
   Kitchen · Delivery · Customer Support
        ↓
   Verifica accesos

────────────────────────

2. Cliente
        ↓
   Registro → Login
        ↓
   Programa menú semanal
        ↓
   Confirma pedido

────────────────────────

3. Kitchen Queue
        ↓
   Planificación
        ↓
   Hoja Producción
        ↓
   Kitchen Execution
        ↓
   Estado Finalizado

────────────────────────

4. Reparto
        ↓
   Recibe rutas → Entrega → Confirma entrega

────────────────────────

5. Cliente
        ↓
   Recibe pedido
        ↓
   Historial → Repetir pedido → Favoritos
```

Ese flujo demuestra la operación del negocio de extremo a extremo.

WPs: WP-6 + guion E2E post-PASS (tras Freeze).

> Nota honesta: Packaging / Delivery avanzados siguen en cola; el tramo Reparto usa lo que esté certificado o se marca explícitamente acotado (DICT-071) — no se finge.

---

## Definition of Done · EP-OPS-001

No se da **PASS** hasta cumplir **simultáneamente**:

| Criterio | Estado |
|----------|:------:|
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

Solo entonces:

```text
EP-OPS-001
PASS
```

---

## Después del PASS

Secuencia estabilizada (ya no es roadmap de producto):

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

Durante Architecture Freeze:

| ❌ | ✅ |
|----|-----|
| Nuevos módulos | Corrección de defectos |
| Nuevos patrones arquitectónicos | Evidencia |
| Nuevas capacidades | Certificación |

---

## Day-0 Provisioning Scenario

**Primera demostración pública de YourMeal OS.**  
Parte de un **tenant vacío**. Sin intervención del equipo de ingeniería.

Demuestra DICT-073 de punta a punta: no solo “RI-001 funciona”, sino que **YourMeal OS puede poner en marcha un nuevo cliente de forma autónoma**.

```text
1. saas_admin crea el tenant EatClean
2. Configura branding y parámetros básicos
3. Crea el company_admin
4. company_admin crea el equipo (Cocina, Reparto, Atención al Cliente, …)
5. El equipo inicia sesión y empieza a trabajar
6. Un cliente realiza un pedido y el sistema completa el ciclo operativo
   (Bloqueador 3 · Jornada Operativa Completa)
```

### PASS Day-0

| Paso | ☐ |
|------|:-:|
| Tenant creado desde `/saas` (vacío → activo) | ☐ |
| Branding / parámetros básicos aplicados | ☐ |
| Company Admin aprovisionado y login OK | ☐ |
| Equipo operativo creado **sin** ingeniería | ☐ |
| Staff opera solo su área (RBAC ±) | ☐ |
| Pedido cliente → cocina → reparto → historial/repetir/favoritos | ☐ |
| Auditoría de provisioning + operación | ☐ |

Ejecutor preferido: **no** el equipo de desarrollo (ops / producto / FOPEBA).

---

## Relación WPs ↔ Bloqueadores

| Bloqueador | WPs |
|------------|-----|
| 1 · EatClean Ops Center | WP-1, WP-2, WP-4 |
| 2 · YourMeal OS Governance | WP-3, WP-5 |
| 3 · Jornada operativa | WP-6 + E2E post-PASS |
| Day-0 | WP-5 + Bloqueador 3 |

Detalle de corrección: [EP-OPS-001](./EP_OPS_001_OPERATIONAL_CENTER_READINESS.md).
