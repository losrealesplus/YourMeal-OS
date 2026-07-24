# OCM-001 · Operational Canonical Model

**ID:** OCM-001  
**DICT:** [DICT-074 · Operational Canonical Model](../99-reference/PROJECT_DICTIONARY.md#operational-canonical-model)  
**Archivo canónico:** este documento (`EATCLEAN_OPERATIONAL_STRUCTURE.md`)  
**Marca / RI:** EatClean Tenerife — *Alimentación saludable, hecha fácil* · YourMeal OS  
**Board:** [EP_OPS_001_RELEASE_BOARD](./EP_OPS_001_RELEASE_BOARD.md)  
**Principios:** [DICT-071](../20-evidence-framework/09-operational-visibility-principle.md) · [DICT-072](../05-architecture/OPERATIONAL_REPRESENTATION_PATTERN.md) · [DICT-073](../05-architecture/TENANT_OPERATIONAL_AUTONOMY.md)

> **No es una ilustración.** Es el **contrato de arquitectura** que gobierna la certificación RI-001.  
> Fuente visual: *Actores y su impacto en cada departamento* (EatClean Tenerife by YourMeal OS).

```text
┌──────────────────────────────────────────┐
│ Operational Canonical Model (OCM-001)    │
│ EATCLEAN_OPERATIONAL_STRUCTURE.md        │
└──────────────────────────────────────────┘
                    │
     ┌──────────────┼──────────────┐
     │              │              │
     ▼              ▼              ▼
 UI / UX         RBAC         Operación
     │              │              │
     └──────────────┼──────────────┘
                    ▼
            Functional Completeness
                    │
                    ▼
           Release Readiness (RI-001)
```

### Consecuencia (defectos vs decisiones)

| Si… | Entonces… |
|-----|-----------|
| Una pantalla contradice el modelo | **Defecto** |
| Un permiso contradice la matriz | **Defecto** |
| Un flujo E2E contradice ORS-001 | **Defecto** |
| Un cambio arquitectónico modifica el modelo | Requiere **ADR / DICT** y decisión explícita |

---

## Cambio de naturaleza del proyecto

| Antes | A partir de EP-OPS-001 |
|-------|------------------------|
| **Construir** YourMeal OS | **Demostrar** que YourMeal OS puede operar una empresa real de alimentación **sin intervención del equipo de ingeniería** |

El criterio de decisión ya no es “¿falta un módulo?” sino “¿hay evidencia de operación autónoma?”.

---

## Arquitectura por responsabilidades (no por módulos)

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

Plataforma gobierna. Tenant opera. El pedido conecta los departamentos.

---

## Invariantes operacionales

1. Todo pedido pertenece a un único tenant.  
2. Todo actor opera únicamente dentro de su ámbito RBAC.  
3. `/admin` gestiona la operación del tenant.  
4. `/saas` gobierna la plataforma.  
5. Todo cambio relevante genera auditoría.  
6. No existen datos simulados en operación (DICT-071).  
7. El recorrido del pedido sigue el flujo oficial **ORS-001** definido aquí.  
8. Toda excepción debe documentarse mediante ADR o DICT **antes** de modificar el modelo.

Un auditor usa esta lista para saber cuándo algo rompe la arquitectura.

---

## Canales

| Canal | Destino |
|-------|---------|
| App Cliente | Customer Application (tenant-branded) |
| Web corporativa | [eatcleantenerifecatering.es](https://eatcleantenerifecatering.es/) |
| Ops tenant | `/admin` · Company Operations Center |
| Ops plataforma | `/saas` · SaaS Operations Center (`saas_admin`) |

---

## 1 · Actores y responsabilidades

| Actor | Superficie | Responsabilidades |
|-------|------------|-------------------|
| **Cliente** | App Cliente | Explorar menú · Pedir · Gestionar cuenta · Historial · Repetir |
| **Cocina** | `/admin` | Recibir pedidos · Planificar · Cocinar / ejecutar · Calidad |
| **Producción** | `/admin` | Planificar cantidades · Hoja de producción · Ingredientes · Stock |
| **Reparto** | `/admin` | Rutas y entregas · Actualizar estado · Confirmar entrega · Incidencias |
| **Atención al Cliente** | `/admin` | Consultas · Incidencias · Cambios / cancelaciones · Comunicación |
| **Finanzas** | `/admin` | Cobros · Facturación · Conciliación · Informes |
| **Admin. Empresa** | `/admin` | Usuarios · Configuración empresa · Catálogo / precios · Informes operativos |
| **SaaS Admin** | `/saas` (+ dual) | Tenants · Planes / suscripciones · Config plataforma · Auditoría global |

---

## 2 · Matriz de acceso (RBAC)

### Leyenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | **Acceso completo** al módulo según las capacidades del sistema para ese rol. |
| 🟡 | **Acceso parcial:** el rol puede consultar o ejecutar **únicamente una parte** de las capacidades del módulo. **No** implica permisos administrativos sobre dicho módulo. |
| — | **Sin acceso** (menú oculto · URL denegada · backend rechaza). |

### Matriz

| Módulo | Cliente | Cocina | Producción | Reparto | Atención | Finanzas | Admin Empresa | SaaS Admin |
|--------|:-------:|:------:|:----------:|:-------:|:--------:|:--------:|:-------------:|:----------:|
| Dashboard (resumen) | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cocina (Kitchen Queue) | — | ✅ | 🟡 | — | — | — | ✅ | ✅ |
| Producción (Hoja) | — | 🟡 | ✅ | — | — | — | ✅ | ✅ |
| Ejecución en Cocina | — | ✅ | 🟡 | — | — | — | ✅ | ✅ |
| Reparto (rutas / entregas) | — | — | — | ✅ | 🟡 | — | ✅ | ✅ |
| Atención al Cliente | — | — | — | — | ✅ | — | ✅ | ✅ |
| Clientes | — | — | — | — | ✅ | 🟡 | ✅ | ✅ |
| Empresas | — | — | — | — | 🟡 | 🟡 | ✅ | ✅ |
| Administración | — | — | — | — | — | — | ✅ | ✅ |
| Finanzas | — | — | — | — | — | ✅ | ✅ | ✅ |
| Configuración | — | — | — | — | — | — | ✅ | ✅ |
| **SaaS** (plataforma) | — | — | — | — | — | — | — | ✅ |

Reglas duras (refuerzan invariantes 2–4):

- **Admin Empresa** nunca ve `/saas`.
- **SaaS Admin** es el único con Centro de Gobierno de plataforma; no sustituye la operación diaria del tenant (pregunta 2 del Release Board).
- Validar **positivo y negativo** (menú + URL + CRUD + backend) — WP-2.

---

## 3 · Centros de operaciones (dual surface)

```text
┌─────────────────────────────────────┐     ┌─────────────────────────────────────┐
│  Company Operations Center          │     │  SaaS Operations Center             │
│  /admin · Tenant EatClean           │     │  /saas · Plataforma                 │
│                                     │     │  Solo saas_admin                    │
│  Dashboard · Cocina · Producción    │     │  Tenants · Company Admins · Roles   │
│  Reparto · Atención · Clientes      │     │  Branding · Auditoría · Flags       │
│  Empresas · Finanzas · Admin        │     │  Config / licencias SaaS            │
│  Configuración                      │     │                                     │
└─────────────────────────────────────┘     └─────────────────────────────────────┘
        Opera EatClean                              Gobierna YourMeal OS

Entradas separadas · datos independientes · seguridad por diseño
Powered by YourMeal OS → enlace discreto a /saas (solo saas_admin)
```

Detalle gap/código: [OPS_CENTER_DUAL_SURFACE](./OPS_CENTER_DUAL_SURFACE.md).

---

## 4 · ORS-001 · Operational Reference Scenario

**Nombre:** Operational Reference Scenario #001 · Recorrido completo del pedido  
**Uso FOPEBA:** caso de referencia. Todo E2E futuro es una **variación** de este escenario, no un flujo distinto.

```text
Cliente
    │
    ▼
Pedido
    │
    ▼
Kitchen Queue
    │
    ▼
Hoja de Producción
    │
    ▼
Kitchen Execution
    │
    ▼
Reparto
    │
    ▼
Entrega
    │
    ▼
Historial
```

### Timeline operativo

```text
1. Cliente          T − X días     Pedido (menú semanal → confirma)
2. Cocina           Día −1 mañana  Kitchen Queue · recibe y planifica
3. Producción       Día −1 tarde   Hoja · ingredientes
4. Cocina (ejec.)   Día 0 mañana   Kitchen Execution → Finalizado
5. Reparto          Día 0 mediodía Entrega
6. Cliente          Día 0 tarde    Recibe · Historial · Repetir · Favoritos
                                   → datos reales a Finanzas / Inventario / Auditoría
```

Alineación: [Bloqueador 3](./EP_OPS_001_RELEASE_BOARD.md) · [Day-0](./EP_OPS_001_RELEASE_BOARD.md#day-0-provisioning-scenario).

---

## 5 · Propuesta de valor (criterios de certificación)

| Pilar | Implica |
|-------|---------|
| Operación integrada | Departamentos conectados — hub navegable |
| Datos reales | Sin mocks (DICT-071) |
| Experiencia del cliente | App simple, rápida, fiable |
| Escalable | Multi-tenant · DICT-073 |
| Seguridad y auditoría | Toda acción registrada |
| YourMeal OS | Plataforma operacional para negocios de comida |

---

## 6 · Uso en certificación

| Artefacto | Usa OCM-001 para… |
|-----------|-------------------|
| Release Board | Tres preguntas ejecutivas + DoD |
| EP-OPS-001 | Nav · RBAC · dual hub · provisioning |
| FCR / E2E | ORS-001 como escenario base |
| Evidence | Demostrar invariantes + ORS-001 con datos reales |
| Architecture Freeze | Congelar este modelo hasta cierre RI-001 |

**No PASS** de EP-OPS-001 / RI-001 si UI, RBAC u operación contradicen OCM-001 sin ADR/DICT.
