
# Experience Refactor EatClean v1

**Referencia doc:** `docs/07-experience/EXPERIENCE_REFACTOR_EATCLEAN_V1.md` + `TENANT_IMPLEMENTATION_EATCLEAN.md` + CJ-001.

**Regla:** solo presentación. Cero cambios en lógica de negocio, repositorios, servicios, HP-001, BD, capabilities.

**Pregunta guía:** ¿Mi madre podría pedir sin que nadie le explique la app?

## Alcance (5 pantallas del sprint)

1. **Landing `/`** — reemplazar el actual landing "YourMeal OS SaaS" por la puerta pública de EatClean (hero de comida, tono cálido, CTA "Iniciar sesión"). Un cliente que abre la app nunca ve la marca SaaS aquí. Powered by discreto al pie.
2. **Splash + Onboarding + Login (`/auth`)** — refactor visual: hero cálido, foto real de comida, tipografía y color más suaves, menos "form corporativo". Powered by solo en Login/Splash.
3. **Home (`/app`)** — reforzar sensación de "app de comida": hero grande con foto, saludo cálido, CTA único **Programar pedido**, cards limpias (Próximo pedido · Pedido de esta semana · Favoritos · Promociones). Sin apariencia de dashboard.
4. **Menú semanal (`/app/menu`)** — presentación tipo carta: día prominente, platos con foto grande, filtro claro, jerarquía visual más ligera.
5. **Resumen del pedido (`/app/schedule` paso 3 → resumen en `/app/orders/$orderId`)** — tarjeta limpia, confirmación clara, cierre emocional del journey.

## Fuera de alcance (hard)

- Lógica, servicios, BD, HP-001, capabilities, navegación (4 tabs se mantienen), textos operativos del back office.
- Rediseño del Admin / Production / Delivery / Design System routes.
- Nuevas fotografías propietarias (uso de imágenes generadas coherentes con paleta y bowl/verduras hasta que el tenant provea assets reales en `tenants/eatclean/`).

## Cómo se materializa

- Todo cambio de tokens (radio, calidez, sombras) sale de `BrandConfig` / `applyBrandTheme` — sin ramas `if (eatclean)`.
- Copy visible: `tenants/eatclean/copy.es.json` (extender si falta) + `src/i18n/locales/*/customer.ts`. Nada literal en JSX.
- Assets: se generan imágenes cálidas (bowl, verduras, hero home) vía imagegen, se suben con `lovable-assets` y se referencian desde `src/tenant/resources/brand.json` (`heroHome`, `splash`, etc.).
- Componentes reutilizables ya existentes (`PrimaryCTA`, `DishCard`, `ScreenHeader`) — refino estilo, no invento nuevos primitives.
- Powered by YourMeal OS: solo Splash · Login · Ajustes / Acerca de. Se elimina de la landing pública principal (queda en footer discreto).
- Back office: sigue oculto por RBAC (`isStaff`) — verifico que en `/app` no aparezca ningún acceso admin para clientes normales.

## Entrega

Un solo cambio de UI cohesionado (varios archivos), sin tocar hooks de datos ni migraciones. Cierre con checklist Experience (5 preguntas) por pantalla afectada.

## Estado del módulo

Customer App Experience: Connected → **Connected + Tenant-Branded v1** (no cambia el nivel funcional; solo la piel).

---

¿Apruebas para ejecutar las 5 pantallas en un solo sprint, o prefieres que empiece por las 3 primeras (Landing + Splash/Login + Home) y luego Menú + Resumen?
