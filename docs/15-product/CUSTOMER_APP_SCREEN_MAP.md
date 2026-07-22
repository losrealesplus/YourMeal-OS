# Customer App · Screen Intentionality Map

Estado: v0.1.0 · Scaffold visual (sin nueva lógica de negocio)  
Regla de intencionalidad: [`PRODUCT_RULES.md`](./PRODUCT_RULES.md)

Cada pantalla cita **objetivo operacional · Capability · Core Object** en la cabecera del archivo de ruta.

---

## Navegación

Bottom Nav (4 tabs, un solo toque):

```text
Inicio (/app)   Menú (/app/menu)   Pedidos (/app/orders)   Cuenta (/app/settings)
```

## Mapa de pantallas

| Ruta | Objetivo operacional | Capability | Core Object(s) |
|------|---------------------|------------|-----------------|
| `/app` | Momento «antes de empezar la semana» — anticipar programación | `orders.schedule` · `weekly-menu.browse` | Order · WeeklyMenu · Delivery |
| `/app/menu` | Explorar el menú semanal antes de programar | `weekly-menu.browse` | WeeklyMenu · Dish |
| `/app/menu/$dishId` | Decidir si un plato encaja (macros, alérgenos, ingredientes) | `weekly-menu.browse` · `dish-catalog.read` | Dish |
| `/app/schedule` | Cerrar el pedido semanal antes del corte | `orders.schedule` | Order · WeeklyMenu · Delivery |
| `/app/orders` | Repasar pedidos pasados y en curso | `orders.list` | Order · Delivery |
| `/app/orders/$orderId` | Verificar detalle del pedido y entrega | `orders.read` · `delivery.track` | Order · OrderItem · Delivery |
| `/app/settings` | Gestión propia (preferencias · datos · logout) | `profile.manage` | CustomerProfile |
| `/app/settings/profile` | Mantener datos personales al día | `profile.manage` | CustomerProfile |

> **No se ha inventado ninguna Capability.** Todas se declaran en el [Capability Roadmap](./CAPABILITY_ROADMAP.md) y trazan a [Capability Mapping](../17-operational-model/06-capability-mapping/README.md). Cualquier necesidad de un nuevo verbo o Core Object marcaría **REQUIRES KNOWLEDGE REVIEW** en lugar de implementarse.

## Design System (extensión de marca)

Tokens brand añadidos en `src/styles.css`:

- `--brand-cream` — off-white cálido (fondo hero, badges suaves)
- `--brand-sand` — arena pálida (superficies de plato)
- `--brand-clay` — terracota (alérgenos, marca)
- `--brand-leaf` — verde profundo (variante marca)

Sobre base «Stainless industrial precision»:  
Inter · JetBrains Mono (números) · emerald primary · radius 1rem · shadows sutiles.

## Componentes reutilizables

Ubicación: `src/components/consumer/`

| Componente | Uso |
|------------|-----|
| `ScreenHeader` | Cabecera unificada de cada pantalla mobile |
| `DishThumb` | Placeholder gradiente para foto de plato (reemplazar con Storage) |
| `DishCard` | Fila del menú → detalle |
| `MacroPill` | Macronutriente canónico (usa `useFmt().weight`) |
| `AllergenBadge` | Alérgeno destacado |
| `TagChip` | Etiquetas: vegan · glutenFree · etc. |
| `StatusPill` | Estado de pedido/entrega |
| `OrderCard` | Fila de pedido → detalle |
| `DayPicker` | Selector horizontal de días |
| `SectionHeader` | Encabezado meta-label + acción |
| `EmptyState` | Estado vacío consistente |
| `PrimaryCTA` | CTA grande (touch target ≥ 56px) |

## Datos

`src/lib/mock-catalog.ts` — scaffold visual. **No es servicio ni persistencia.**  
Cuando existan `DishService`, `OrderService`, `MenuService`, `DeliveryService`, estas pantallas se conectan por Ports declarados en `docs/14-application/`.

## Reglas respetadas

- Toda cifra/fecha/precio pasa por `useFmt()` (nunca `toLocaleString` ni `Intl.*` directo).
- Almacenamiento canónico: gramos, EUR decimal, UTC ISO — solo se localiza en presentación.
- Ninguna pantalla introduce lógica de negocio, verbo o Core Object nuevo.
- Cabecera de intencionalidad presente en cada archivo de ruta.
- Todos los textos vía i18n (6 idiomas: ES · EN · DE · FR · IT · PT).

## Fuera de alcance del sprint

- Onboarding / signup flow (existe `/auth` — retomar en sprint dedicado).
- Métodos de pago reales.
- Notificaciones push.
- Detalle real de dirección / mapa.
- Foto real de plato (pendiente `storage-per-tenant`).
