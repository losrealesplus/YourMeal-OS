
# Sprint — Client App (EatClean Tenerife · YourMeal OS)

**Alcance:** solo Cliente. Solo scaffold visual + navegación + Design System + componentes reutilizables. Sin lógica de negocio, sin datos reales, sin nuevos Core Objects. Todo con `useFmt()` y `useTranslation()`.

**Fuera de alcance este sprint:** Admin, Producción, Reparto (ya existen shells vacíos; se abordarán después en este orden).

---

## 1. Alineación con Operational Model

Todas las pantallas se derivan de objetos ya certificados en `docs/17-operational-model/02-core-objects/` y del flujo de la espina:

```text
Weekly Menu → Order → Production Plan → Delivery → Payment
```

Objetos que el Cliente ve (Nivel 1 canónico, sin inventar):
Weekly Menu · Dish · Order · Delivery · Payment · Beneficiary (self) · Subscription.

Cualquier concepto que no exista en el modelo → **REQUIRES KNOWLEDGE REVIEW** (no se implementa).

---

## 2. Arquitectura de Información (Cliente)

Bottom navigation de 4 tabs (una mano, pulgar):

```text
Home     · «¿Qué necesita tu atención ahora?»
Menu     · Weekly Menu + Dish detail
Orders   · Pedido activo + historial + entregas
Profile  · Cuenta, direcciones, pagos, suscripción, ayuda, ajustes
```

Se sustituye la tab actual `Settings` por `Orders` + `Profile` (Settings pasa a ser subpágina de Profile). El shell móvil ya existe (`mobile-shell.tsx`) — se amplía a 4 items.

### Mapa de rutas (`src/routes/_authenticated/app.*`)

```text
/app                         Home (assistant feed)
/app/menu                    Weekly Menu (semana actual + navegación semanas)
/app/menu/$dishId            Dish detail (macros · ingredientes · alérgenos)
/app/menu/plan               Programar pedido semanal (bottom sheet flow)
/app/checkout                Checkout (resumen · dirección · pago)
/app/orders                  Pedido activo + historial
/app/orders/$orderId         Order detail + delivery timeline
/app/profile                 Profile hub
/app/profile/addresses
/app/profile/payment-methods
/app/profile/subscription
/app/profile/invoices
/app/profile/notifications
/app/profile/settings        (regional, idioma, tema)
/app/profile/help
```

Onboarding / auth ya existen (`/`, `/auth`, `/reset-password`). Se añade `/onboarding` (post-signup, 3 pasos: idioma+región · dirección · alérgenos) — solo UI, sin persistencia esta iteración.

---

## 3. Flujos de usuario (máx. 3 taps)

- **Programar semana:** Home → «Planifica tu semana» → Menu/plan → Checkout (3 taps).
- **Ver pedido activo:** Orders tab → tarjeta destacada (1 tap).
- **Repetir última semana:** Home → «Repetir» → Confirmar (2 taps).
- **Cambiar dirección de entrega:** Orders/$id → Cambiar dirección → seleccionar (3 taps).

---

## 4. Design System

Tokens ya vigentes en `src/styles.css` (Stainless industrial precision). Se **extiende** con capa "consumer" sin romper Admin:

- `--surface-elevated`, `--surface-sunken` para cards y bottom sheets
- `--brand-fresh` (verde EatClean, derivado de `--primary`)
- `--brand-warm` (crema/off-white para fondos hero)
- Radios: cards `rounded-3xl`, chips `rounded-full`, botones `rounded-2xl`
- Sombras suaves (`--shadow-card`, `--shadow-sheet`)
- Motion: reveal 200-260ms `--ease-out-expo`

Sin hardcodear colores en componentes. Todo vía tokens.

---

## 5. Componentes reutilizables (`src/components/consumer/`)

Solo primitivos presentacionales, sin datos:

```text
DishCard              foto + título + kcal + tag
DishHero              header de detalle
MacroCard             kcal · P · C · G
AllergenBadge         icono + label
StatusChip            estado de pedido/entrega
OrderCard             resumen semanal
DeliveryTimeline      pasos verticales
WeeklyMenuGrid        grilla de días
DayColumn             columna de un día
BottomSheet           wrapper Radix
SectionHeader         título + acción
EmptyState            ilustración + CTA
AssistantCard         tarjeta "atención ahora"
QuantityStepper       − n +
AddressRow · PaymentRow
FormField (móvil)     input táctil grande
PrimaryCTA            botón sticky bottom
```

Cada componente: props tipadas, sin fetch, sin i18n hardcoded (recibe strings o usa `useTranslation`).

---

## 6. Pantallas base (vacías, con placeholders)

Cada ruta renderiza:
- Header contextual
- Contenido con componentes reales del Design System
- Datos mock locales tipados (para que la UI se vea, no persistencia)
- CTA en su sitio

No se conecta a Supabase esta iteración. Comentario en cada archivo: `// UI scaffold — data wiring en siguiente sprint (Cursor)`.

---

## 7. i18n

Nuevo namespace `customer` ya existe. Se amplían claves para: home, menu, dish, orders, delivery, profile, onboarding, checkout. Traducciones en ES (completo) + EN (completo); DE/FR/IT/PT copian ES como placeholder marcado `// TODO l10n`. Toda cadena visible pasa por `t()`. Todo formato por `useFmt()`.

---

## 8. Entregables del sprint

1. Extensión de tokens en `src/styles.css`
2. `src/components/consumer/*` (≈18 componentes)
3. Rutas nuevas bajo `src/routes/_authenticated/app.*`
4. `mobile-shell.tsx` con 4 tabs
5. Onboarding route (`/onboarding`)
6. Claves i18n ES/EN completas, resto marcadas
7. Doc breve: `docs/04-design/CLIENT_APP.md` con IA + mapa + componentes (para que Cursor continúe)

---

## 9. Fuera de este sprint (siguiente)

- Wiring a `DishService`, `OrderService`, etc.
- Admin/Producción/Reparto redesign
- Push notifications
- Persistencia de onboarding y perfil regional avanzado
- Suscripciones/facturación reales

---

## 10. Riesgos / notas

- El shell móvil actual tiene 3 tabs; ampliarlo a 4 no rompe rutas existentes (se conservan `/app`, `/app/menu`, `/app/settings` moviendo settings bajo profile con redirect).
- Ningún concepto nuevo introducido. Si durante el diseño aparece necesidad (p. ej. "wishlist", "favoritos"), se marca **REQUIRES KNOWLEDGE REVIEW** y se omite.

¿Apruebas para ejecutar?
