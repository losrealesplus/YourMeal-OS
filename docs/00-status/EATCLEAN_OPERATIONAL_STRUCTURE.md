# EatClean Tenerife × YourMeal OS · Estructura operacional

**Tipo:** Visual de estructura · referencia RI-001 / EP-OPS-001  
**Marca:** EatClean Tenerife — *Alimentación saludable, hecha fácil*  
**Plataforma:** YourMeal OS  
**Board:** [EP_OPS_001_RELEASE_BOARD](./EP_OPS_001_RELEASE_BOARD.md)  
**Principios:** [DICT-071](../20-evidence-framework/09-operational-visibility-principle.md) · [DICT-072](../05-architecture/OPERATIONAL_REPRESENTATION_PATTERN.md) · [DICT-073](../05-architecture/TENANT_OPERATIONAL_AUTONOMY.md)

> Fuente: visual *Actores y su impacto en cada departamento* (EatClean Tenerife by YourMeal OS).  
> Este documento es la **estructura canónica** contra la que se certifica el Release Board — no un mock de marketing.

```text
EatClean + YourMeal OS
Sistema operativo integral para la gestión de pedidos de comida saludable
```

| Canal | Destino |
|-------|---------|
| App Cliente | Customer Application (tenant-branded) |
| Web corporativa | [eatcleantenerifecatering.es](https://eatcleantenerifecatering.es/) |
| Ops tenant | `/admin` · Centro de Operaciones EatClean |
| Ops plataforma | `/saas` · Centro de Operaciones YourMeal OS (`saas_admin`) |

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

Leyenda: ✅ acceso · 🟡 parcial · — sin acceso

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

Reglas duras:

- **Admin Empresa** nunca ve `/saas`.
- **SaaS Admin** es el único con Centro de Gobierno de plataforma.
- Acceso parcial (🟡) = lectura / apoyo acotado; no sustituye al rol dueño del módulo.
- Validar **positivo y negativo** (menú + URL directa + CRUD + backend) — WP-2.

Alineación Release Board: [Bloqueador 1](./EP_OPS_001_RELEASE_BOARD.md#-bloqueador-1-crítico--centro-de-operaciones-eatclean) · [Bloqueador 2](./EP_OPS_001_RELEASE_BOARD.md#-bloqueador-2-crítico--centro-de-operaciones-yourmeal-os).

---

## 3 · Centros de operaciones (dual surface)

```text
┌─────────────────────────────────────┐     ┌─────────────────────────────────────┐
│  Centro de Operaciones EatClean     │     │  Centro de Operaciones YourMeal OS  │
│  /admin · Tenant                    │     │  /saas · Plataforma                 │
│                                     │     │  Solo saas_admin                    │
│  Dashboard · Cocina · Producción    │     │  Tenants · Company Admins · Roles   │
│  Reparto · Atención · Clientes      │     │  Branding · Auditoría · Flags       │
│  Empresas · Finanzas · Admin        │     │  Config SaaS                        │
│  Configuración                      │     │                                     │
└─────────────────────────────────────┘     └─────────────────────────────────────┘
        Opera EatClean                              Gobierna YourMeal OS

Entradas separadas · datos independientes · seguridad por diseño
Powered by YourMeal OS → enlace discreto a /saas (solo saas_admin)
```

Detalle gap/código: [OPS_CENTER_DUAL_SURFACE](./OPS_CENTER_DUAL_SURFACE.md).

---

## 4 · Recorrido completo del pedido

```text
1. Cliente          T − X días
   Pedido (menú semanal → confirma)

2. Cocina           Día −1 · mañana
   Recibe y planifica (Kitchen Queue)

3. Producción       Día −1 · tarde
   Planifica y prepara ingredientes (Hoja)

4. Cocina (ejec.)   Día 0 · mañana
   Prepara platos (Kitchen Execution → Finalizado)

5. Reparto          Día 0 · mediodía
   Entrega al cliente

6. Cliente          Día 0 · tarde
   Recibe y disfruta
        ↓
   Datos reales → Finanzas · Inventario · Auditoría
   Historial · Repetir · Favoritos
```

Este recorrido = [Bloqueador 3 · Jornada Operativa](./EP_OPS_001_RELEASE_BOARD.md#-bloqueador-3-crítico--jornada-operativa-completa) y el tramo operativo de [Day-0](./EP_OPS_001_RELEASE_BOARD.md#day-0-provisioning-scenario).

---

## 5 · Propuesta de valor (criterios de certificación)

| Pilar | Implica en EP-OPS-001 / RI-001 |
|-------|-------------------------------|
| Operación integrada | Departamentos conectados en tiempo real — hub navegable |
| Datos reales | Sin mocks (DICT-071) |
| Experiencia del cliente | App simple, rápida, fiable (EP-002A) |
| Escalable | Multi-tenant · DICT-073 autonomía |
| Seguridad y auditoría | Toda acción registrada |
| YourMeal OS | Plataforma operacional para negocios de comida |

---

## 6 · Uso en certificación

| Artefacto | Usa esta estructura para… |
|-----------|---------------------------|
| Release Board | Checklist B1 / B2 / B3 |
| EP-OPS-001 WP-1…WP-2 | Nav + matriz RBAC |
| WP-5 / Day-0 | Roles del equipo operativo |
| Matriz FCR | Filas del bloque Ops |
| Evidence | Demostrar recorrido §4 con datos reales |

**No PASS** de EP-OPS-001 si la UI o el RBAC contradicen esta estructura sin decisión documentada (KU / Correction).
