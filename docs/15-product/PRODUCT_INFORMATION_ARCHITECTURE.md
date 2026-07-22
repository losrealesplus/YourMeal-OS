# Product Information Architecture v1.0

**Estado:** 🟡 Borrador de arranque (Sprint 2.1)  
**Fuente de verdad de dominio:** Operational Model RC · **Table-Validated**  
**No inventa** objetos ni reglas — solo organiza la experiencia sobre el conocimiento existente.

---

## Propósito

```text
Actor → Objetivos → Capacidades → Pantallas → Componentes
```

Luego materializar en **Lovable** (no Figma-first): [21-product-materialization](../21-product-materialization/README.md).

Transformar el Operational Model en una experiencia coherente **sin inventar** objetos ni reglas.

---

## Actores (mapa inicial)

| Actor | Objetivo principal | Decisiones típicas (OM) | Ver primero (hipótesis UX) |
|-------|--------------------|-------------------------|----------------------------|
| **Cliente / Beneficiary side** | Pedir / recibir comida correcta | Order · Amend · Preferences | Pedido · estado · menú |
| **Producción** | Ejecutar Plan → Batch con Checks | Plan · Batch · Hold · Pause | Cola del día · Checks bloqueantes |
| **Administración** | Oferta · cuentas · gobernanza | Menu · Account · Organization | Dashboard · excepciones |
| **Reparto / Delivery** | Entregar unidad correcta a tiempo | Route · Delivery · Packaging/Label | Ruta del día · incidencias |

Rellenar en Sprint 2.1 con citas a `docs/17` (objetos · lifecycles · checks).

---

## Preguntas por actor (plantilla)

```markdown
### Actor: …

**Objetivos**
1. …

**Primera pantalla / necesidad**
…

**Decisiones que toma**
| Decisión | Check / Lifecycle OM | Info necesaria |
|----------|----------------------|----------------|
| … | … | … |

**Happy Path (pasos)**
1. …
```

---

## Navegación (esqueleto)

| Área | Entradas top-level (borrador) | Ancla OM |
|------|-------------------------------|----------|
| Oferta | Menús · Platos | Menu · Dish |
| Demanda | Pedidos · Beneficiarios | Order · Beneficiary |
| Planificación | Plan del día | Plan |
| Cocina | Batches · Stock/Lot | Batch · Stock |
| Identidad / Pack | Etiquetas · unidades | Packaging · Label |
| Logística | Rutas · Entregas | Route · Delivery |
| Cobro | Cuentas · pagos | Account · Payment |
| Admin | Org · Capabilities · Users | Organization · RBAC |

---

## Matriz de trazabilidad

Canónica en [01-screen-knowledge-matrix](../21-product-materialization/01-screen-knowledge-matrix.md).

| Pantalla / flujo | Capability | Objeto / Lifecycle OM | Evidence |
|------------------|------------|------------------------|----------|
| *(ver matriz 21)* | | | Table-Validated |

---

## Fuera de esta IA

- Heurísticas de campo (Fase D)  
- Optimizaciones no citadas en el OM  
- Features «porque la competencia las tiene»

---

## Relacionado

- [Sprint 2.1](./etapa-2/SPRINT_2_1_PRODUCT_FOUNDATION.md) · [etapa-2](./etapa-2/README.md) · [PRODUCT_VISION](./PRODUCT_VISION.md) · [OM](../17-operational-model/README.md)
