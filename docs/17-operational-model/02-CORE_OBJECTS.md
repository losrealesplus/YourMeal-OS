# 02 — Core Operational Objects

**Tipo:** Operational Model · Core Operativo  
**Pregunta:** ¿Qué objetos existen en cualquier negocio de comida preparada?

Hipótesis v0.1 — validar en Observation.  
Definiciones: [01-ubiquitous-language/](./01-ubiquitous-language/README.md).

---

## Objetos de la espina (flujo principal)

| Objeto | Código | Por qué es permanente |
|--------|--------|------------------------|
| Weekly Menu | `WeeklyMenu` | Sin oferta publicada no hay Orders |
| Order | `Order` | Unidad de demanda del periodo |
| Order Item | `OrderItem` | Granularidad de qué producir / empaquetar |
| Production Plan | `ProductionPlan` | Agrega demanda → necesidad de cocina |
| Production Batch | `ProductionBatch` | Ejecución real de producción |
| Packaging | `Packaging` | Cruce producción ↔ destinatario |
| Label | `Label` | Identidad de la unidad entregable |
| Delivery Route | `DeliveryRoute` | Plan logístico en ventana temporal |
| Delivery | `Delivery` | Hecho de entrega / confirmación |
| Payment | `Payment` | Cierre económico de la operación |

---

## Objetos de soporte (alrededor)

| Objeto | Código | Por qué es permanente |
|--------|--------|------------------------|
| Dish | `Dish` | Unidad vendible / producible |
| Recipe | `Recipe` | Cómo se construye el Dish |
| Ingredient | `Ingredient` | Input reutilizable |
| Stock | `Stock` | Estado disponible para operar |
| Supplier | `Supplier` | Abastecimiento |
| Vehicle | `Vehicle` | Recurso de reparto |
| Organization | `Organization` | Tenant / dueño de la operación |
| Kitchen | `Kitchen` | Ámbito de ejecución |

---

## Actores (no son «objetos de flujo», pero son permanentes)

| Actor | Código |
|-------|--------|
| Consumidor | `Consumer` |
| Cuenta Empresa | `CompanyAccount` |
| Beneficiario | `Beneficiary` |
| Empleado | `Employee` |
| Administrador | `Administrator` |

Ver [ACTORS.md](../12-domain-model/ACTORS.md).

---

## Qué no entra aún (a propósito)

No añadimos aquí objetos «por si acaso» (CRM genérico, loyalty, BI…).

Solo lo necesario para que la espina **Menu → Order → Plan → Batch → Packaging → Route → Delivery → Payment** tenga sentido en cualquier meal-prep / catering.

Si Observation encuentra un objeto recurrente ausente → se propone aquí con evidencia (OF), no por brainstorming.

---

## Criterio de permanencia

Un objeto entra al Core Operativo si:

1. Existe en **casi cualquier** negocio de comida preparada / meal prep / catering; y  
2. Sin él, algún tramo de la espina queda ciego; y  
3. Puede enunciarse sin depender de una pantalla concreta.

---

## Relación con Domain Model

| Operational Model | Domain / Entity catalog |
|-------------------|-------------------------|
| Sentido operativo | Entidad, aggregate, tabla |
| Primero | Después (cuando se implemente) |

Algunos objetos ya tienen ficha en [ENTITIES.md](../12-domain-model/ENTITIES.md) (`ProductionBatch`, `Order`…).  
Otros (`ProductionPlan`, `Packaging`, `Label`, `Vehicle`) pueden ser nuevos o emergents — Observation + Domain los formalizan.
