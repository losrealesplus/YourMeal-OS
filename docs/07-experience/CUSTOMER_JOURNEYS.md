# Customer Journeys

**Tenant de referencia:** EatClean  
**Principio:** Experience First — Journey → Screen → Capability  
**Validación humana:** ¿Una persona no técnica completa el pedido sin ayuda?

Complemento del OM: el OM describe la operación; este documento describe **cómo la vive el cliente**.

---

## Índice

| ID | Journey | MVP |
|----|---------|:---:|
| [CJ-001](#cj-001--pedido-semanal) | Pedido semanal | **Sí** — núcleo |
| [CJ-002](#cj-002--cambiar-dirección-de-entrega) | Cambiar dirección de entrega | Posterior |
| [CJ-003](#cj-003--repetir-un-pedido-anterior) | Repetir un pedido anterior | Posterior |
| [CJ-004](#cj-004--gestionar-alérgenos) | Gestionar alérgenos | Posterior |
| [CJ-005](#cj-005--actualizar-método-de-pago) | Actualizar método de pago | Posterior |

---

## CJ-001 · Pedido semanal

**Objetivo del MVP:** si este recorrido es excelente, el MVP cumple.

```text
Descarga la app
        ↓
Abre EatClean
        ↓
Onboarding (2–3 pantallas máximo)
        ↓
Login / Registro
        ↓
Bienvenido
        ↓
Programa tu menú semanal
        ↓
Selecciona platos
        ↓
Resumen nutricional
        ↓
Confirma pedido
        ↓
Pedido realizado
        ↓
Recibe confirmación
        ↓
Espera la entrega
```

### Sensación objetivo

> «Qué fácil. En dos minutos ya tengo mi pedido de la semana hecho.»

### Capabilities (trazabilidad — no orden de diseño)

El journey **usa** capacidades ya existentes / HP-001; no las inventa:

- `weekly-menu.browse` · `dish-catalog.read` · `orders.schedule` · `orders.confirm` · auth / profile  

Orden de diseño: **journey primero**, capabilities después.

### Pantallas implicadas (MVP)

Splash · Bienvenida · Beneficios · Login · Home · Menú semanal · Detalle de plato · Cesta/Resumen · Confirmación · (estados: vacío / error / offline / pedido confirmado)

---

## Inventario de pantallas MVP (≤ 12–15)

No más para la primera versión publicada.

### Regla

> **Ninguna pantalla existe por sí sola. Toda pantalla pertenece exactamente a un Customer Journey.**

Trazabilidad opcional por pantalla (`SCR-xxx`): Journey · Capabilities · Operational Objects · Evidence.

### Onboarding

| SCR | Pantalla | Journey | Capabilities (trazas) | Objetos OM |
|-----|----------|---------|------------------------|------------|
| SCR-001 | Splash | CJ-001 | auth | — |
| SCR-002 | Bienvenida | CJ-001 | — (experiencia) | — |
| SCR-003 | Beneficios | CJ-001 | — (experiencia) | — |
| SCR-004 | Login / Registro | CJ-001 | auth / profile | Customer |

### Cliente

| SCR | Pantalla | Journey | Capabilities (trazas) | Objetos OM |
|-----|----------|---------|------------------------|------------|
| SCR-005 | Home | CJ-001 | `orders.schedule` · `weekly-menu.browse` | Order · WeeklyMenu |
| SCR-006 | Menú semanal | CJ-001 | `weekly-menu.browse` · `dish-catalog.read` | WeeklyMenu · Dish |
| SCR-007 | Detalle de plato | CJ-001 | `dish-catalog.read` · `weekly-menu.browse` | Dish |
| SCR-008 | Cesta / Resumen | CJ-001 | `orders.schedule` | Order · OrderItem |
| SCR-009 | Confirmación | CJ-001 | `orders.confirm` | Order |
| SCR-010 | Historial | CJ-001* | `orders.list` · `orders.read` | Order |
| SCR-011 | Perfil | CJ-001* | `profile.manage` | CustomerProfile |
| SCR-012 | Configuración / Acerca de | CJ-001* | — | — |

\* Historial / Perfil / Configuración también servirán CJ-002…005; en MVP anclan a CJ-001 como soporte del pedido semanal.

### Estados (no son pantallas sueltas — pertenecen a un SCR del journey)

| Estado | Ancla | Notas |
|--------|-------|--------|
| Sin pedidos | SCR-005 / SCR-010 | Empty state foto Tenant |
| Error | cualquier SCR CJ-001 | Claro · sin jerga técnica |
| Sin conexión | cualquier SCR CJ-001 | Recuperable |
| Pedido confirmado | SCR-009 | Cierre emocional de CJ-001 |

### Plantilla YAML (por pantalla)

```yaml
Screen:
  id: SCR-006
  name: Weekly Menu
Journey: CJ-001
Capabilities:
  - weekly-menu.browse   # o CAP-id cuando esté indexado
  - dish-catalog.read
Operational Objects:
  - Weekly Menu
  - Dish
Evidence:
  - FOV-001   # rellenar tras campo
```

Eso es suficiente para una primera versión sólida. **No** añadir SCR sin un CJ que lo justifique.

---

## CJ-002 · Cambiar dirección de entrega

*Posterior al MVP.* Perfil → Direcciones → Editar / Añadir → Guardar → (opcional) asociar al próximo pedido.

## CJ-003 · Repetir un pedido anterior

*Posterior al MVP.* Historial → Pedido → Repetir → Ajustar → Confirmar.

## CJ-004 · Gestionar alérgenos

*Posterior al MVP.* Perfil → Alérgenos / preferencias → Guardar → filtrado en menú.

## CJ-005 · Actualizar método de pago

*Posterior al MVP.* Perfil → Métodos de pago → Añadir / Editar.

---

## Antes del Experience Refactor

1. Congelar **CJ-001** como journey canónico del MVP.  
2. Limitar pantallas al inventario de arriba.  
3. Auditar cada pantalla con la [checklist](../05-architecture/TENANT_EXPERIENCE_SPEC.md#checklist-por-pantalla-obligatoria).  
4. Ejecutar brief: [TENANT_IMPLEMENTATION_EATCLEAN](../05-architecture/TENANT_IMPLEMENTATION_EATCLEAN.md).  
5. **No** abrir pantallas nuevas fuera de este inventario sin un CJ que las justifique.

---

## Relacionado

- [07-experience README](./README.md) — Experience First  
- [CUSTOMER_APP_SCREEN_MAP](../15-product/CUSTOMER_APP_SCREEN_MAP.md) — mapa técnico existente (realinear a journeys)  
- [SMOKE_HP-001](../00-status/SMOKE_HP-001.md) — evidencia operativa del mismo happy path  
- Dictionary: Customer Journey · Experience First
