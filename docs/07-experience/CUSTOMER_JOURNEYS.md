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

### Onboarding

| Pantalla | Notas |
|----------|--------|
| Splash | Logo EatClean · Powered by discreto |
| Bienvenida | Tono Tenant |
| Beneficios | 1 pantalla (máx. 2–3 onboarding total con bienvenida) |
| Login / Registro | Copy Tenant — nunca «tu operación» |

### Cliente

| Pantalla | Notas |
|----------|--------|
| Home | App de comida · CTA Programar pedido |
| Menú semanal | Selección de platos |
| Detalle de plato | Macros · alérgenos · foto real |
| Cesta / Resumen | Incluye resumen nutricional |
| Confirmación | Pedido realizado |
| Historial | Pedidos pasados |
| Perfil | Datos · direcciones · preferencias |
| Configuración / Acerca de | Powered by aquí |

### Estados

| Estado | Notas |
|--------|--------|
| Sin pedidos | Empty state con foto Tenant |
| Error | Claro · calmado · sin jerga técnica |
| Sin conexión | Recuperable |
| Pedido confirmado | Cierre emocional del CJ-001 |

Eso es suficiente para una primera versión sólida.

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
