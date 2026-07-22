# 21 · Product Materialization

**Carril B** — materializar el Operational Model Table-Validated en experiencia de producto.

> **FOPEBA certifica el conocimiento.**  
> **Lovable materializa ese conocimiento en una experiencia de producto.**

No es un flujo Figma → desarrollo.  
Es:

```text
Operational Model
        ↓
Information Architecture
        ↓
Lovable
        ↓
Iteración UX
        ↓
Código
```

---

## Regla

> **Toda pantalla debe justificar qué conocimiento operacional materializa.**

Sin fila en la [matriz](./01-screen-knowledge-matrix.md) → no se pide esa pantalla a Lovable.

---

## Flujo de herramientas

| Herramienta | Rol |
|-------------|-----|
| **Operational Model** (`docs/17`) | Fuente de conocimiento |
| **IA / matriz** (`15-product` · este dir) | Modelo del producto |
| **Lovable** | Generación UI + sync repo — **herramienta principal** |
| **Figma** | **Apoyo** (interacción compleja · componente específico · usabilidad · patrón DS) |
| **Cursor / código** | Materialización Fase C + trazabilidad |

Figma **no** es paso obligatorio para dibujar todas las pantallas.

---

## Antes de abrir Lovable

Modelo del producto (no «hazme un dashboard»):

```text
Actor → Objetivos → Capacidades → Pantallas → Componentes
```

Ejemplo EatClean (resumen):

| Actor | Objetivo | Capacidades | Pantallas |
|-------|----------|-------------|-----------|
| Cliente | Pedir comida | Programar pedido · pagar · historial | Dashboard · Menú semanal · Mis pedidos · Facturación |
| Producción | Preparar pedidos | Ver producción · lotes · etiquetas | Producción · Lotes · Etiquetas |
| Reparto | Entregar | Ruta · confirmar · incidencias | Ruta · Entregas |
| Administrador | Gestionar operación | Config · clientes · menús | Admin Suite |

Detalle y citas OM: [PRODUCT_INFORMATION_ARCHITECTURE](../15-product/PRODUCT_INFORMATION_ARCHITECTURE.md) · [matriz](./01-screen-knowledge-matrix.md).

---

## Índice

| Doc | Contenido |
|-----|-----------|
| [01 Screen ↔ Knowledge Matrix](./01-screen-knowledge-matrix.md) | Pantalla · Capability · Objeto · Referencia |
| [02 Lovable Brief](./02-lovable-brief.md) | Cómo pedir a Lovable sin inventar reglas |
| [03 Figma Support](./03-figma-support.md) | Cuándo sí usar Figma |

Sprint: [2.1 Product Foundation](../15-product/etapa-2/SPRINT_2_1_PRODUCT_FOUNDATION.md).

---

## Relacionado

- [etapa-2](../15-product/etapa-2/README.md) · [Dual Track](../00-status/DUAL_TRACK_ANTECAMARA.md) · [Knowledge Traceability](../15-product/etapa-2/knowledge-traceability.md)
