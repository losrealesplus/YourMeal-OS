# Índice de Capabilities (orientativo)

Hipótesis v0.1. Cada fila debe evolucionar a un archivo de trazabilidad como [dish-management.md](./dish-management.md).

| Capability | Objetos principales | Trazabilidad | Estado |
|------------|---------------------|--------------|--------|
| **Dish Management** | Dish | [dish-management.md](./dish-management.md) | ✅ |
| Recipe Builder | Recipe · Dish · Ingredient | ⏳ plantilla | ⏳ |
| Ingredient | Ingredient · Supplier | ⏳ | ⏳ |
| Inventory | Stock · Ingredient | ⏳ | ⏳ |
| Menu | Weekly Menu · Dish | ⏳ | ⏳ |
| Orders | Order · Order Item · Weekly Menu | ⏳ | ⏳ |
| Production Planning | Production Plan · Order | ⏳ | ⏳ |
| Production | Production Batch · Plan · Recipe · Stock | ⏳ | ⏳ |
| Packaging / Labels | Packaging · Label · Order | ⏳ | ⏳ |
| Routes / Drivers | Delivery Route · Vehicle · Delivery | ⏳ | ⏳ |
| Deliveries | Delivery · Order | ⏳ | ⏳ |
| Payments | Payment · Order | ⏳ | ⏳ |

---

## Asistente → Capabilities (resumen)

| Asistente | Capabilities | Checks típicos |
|-----------|--------------|----------------|
| Menu | Menu · Dish | Repetición · nutrición |
| Production | Plan · Batch · Recipe · Stock | Stock · descongelación |
| Packaging | Packaging · Label · Order | Etiquetas · alergias |
| Purchasing | Stock · Supplier · Ingredient | Stock mínimo |
| Route / Delivery Builder | Route · Vehicle · Order | Viabilidad de ruta |
| Delivery | Delivery · Payment · Order | Cobro · entrega |
| Closing | Stock · Plan · Incidents | Anticipación cierre |
| Operations (Centro de Control) | Orquesta Checks | Estado operación |

Detalle: [CAPABILITY_ROADMAP.md](../../15-product/CAPABILITY_ROADMAP.md).
