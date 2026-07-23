# Operational Journeys

**Tenant de referencia:** EatClean  
**Principio:** Experience First — Journey → Screen → Capability  
**Complemento de:** [Customer Journeys](./CUSTOMER_JOURNEYS.md)

---

## FOPEBA · Dos caras de la misma plataforma

| Cara | Usuario | Organización | Pregunta |
|------|---------|--------------|----------|
| **Front Office** | Cliente | Customer Journeys (CJ) | ¿Cómo pido mi menú semanal? |
| **Back Office → Centro de Operaciones** | Equipo interno | Operational Journeys (OJ) | ¿Qué necesita hacer hoy mi departamento? |

Misma plataforma. Misma identidad EatClean. Objetivos distintos.

El Centro de Operaciones **no es un dashboard**. Es el punto de entrada al trabajo diario.

---

## Índice

| ID | Journey | MVP experiencia |
|----|---------|:---------------:|
| [OJ-001](#oj-001--iniciar-producción-del-día) | Iniciar producción del día | **Sí** |
| [OJ-002](#oj-002--preparar-rutas-de-reparto) | Preparar rutas de reparto | **Sí** |
| [OJ-003](#oj-003--gestionar-incidencias) | Gestionar incidencias | Posterior |
| [OJ-004](#oj-004--cerrar-la-jornada) | Cerrar la jornada | Posterior |

---

## Workspaces (experiencia)

De cara al usuario, cada área es un **Workspace**, no un “módulo de ERP”.

Internamente siguen siendo departamentos + roles RBAC existentes (multi-usuario por rol).

| Workspace | Entrada actual | Roles típicos |
|-----------|----------------|---------------|
| Cocina | `/admin/production` | kitchen, production |
| Reparto | `/admin/routes` | logistics |
| Stock | `/admin/inventory` | inventory, purchasing |
| Clientes | `/admin/customers` | support |
| Administración | `/admin/settings` | company_admin |
| Finanzas | `/admin/accounting` | accounting |

### Regla de entrada

- **1 workspace autorizado** → entrar directamente.
- **2 o más** → Centro de Operaciones (elegir).
- **Administrador** (`company_admin` / `saas_admin`) → siempre Centro de Operaciones con todas las áreas.

Nunca mostrar workspaces bloqueados: si no está autorizado, **no existe** para ese usuario.

---

## OJ-001 · Iniciar producción del día

**Sensación objetivo:** «Sé exactamente por dónde empezar el turno.»

```text
Login Admin EatClean
        ↓
Centro de Operaciones (o acceso directo a Cocina)
        ↓
Agenda: pedidos pendientes de producción
        ↓
CTA · Empezar producción
        ↓
Workspace Cocina / Producción
```

---

## OJ-002 · Preparar rutas de reparto

**Sensación objetivo:** «Las rutas del día están listas para salir.»

```text
Centro de Operaciones
        ↓
Agenda: rutas sin asignar
        ↓
CTA · Preparar reparto
        ↓
Workspace Reparto
```

---

## OJ-003 · Gestionar incidencias

Entrada desde Agenda o Workspace Reparto → incidencias. Prioridad: lo que requiere atención **ahora**, no histórico.

---

## OJ-004 · Cerrar la jornada

Posterior al MVP de experiencia. Cierre operativo del día (producción hecha, rutas cerradas, incidencias resueltas).

---

## Qué no es el Centro de Operaciones

- No es un panel de KPIs
- No abre con gráficos ni estadísticas financieras
- No enseña “lo que pasó el mes pasado”
- No muestra módulos deshabilitados ni “candados”

Responde solo:

> **¿Qué hago ahora?**
