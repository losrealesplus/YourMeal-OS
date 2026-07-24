# TENANT IMPLEMENTATION · EatClean

**Knowledge Lifetime:** Implementation  
**Para:** Cursor · Lovable · ingeniería de experiencia  
**ADR:** [0014](../adr/0014-customer-application-is-tenant-branded.md)  
**Reglas permanentes:** [TENANT_EXPERIENCE_SPEC](./TENANT_EXPERIENCE_SPEC.md)  
**Contrato técnico:** [TENANT_BRANDING](./TENANT_BRANDING.md)  
**Assets:** [`tenants/eatclean/`](../../tenants/eatclean/README.md)  
**Journeys:** [CJ-001](../07-experience/CUSTOMER_JOURNEYS.md#cj-001--pedido-semanal) · [OPERATIONAL_JOURNEYS](../07-experience/OPERATIONAL_JOURNEYS.md)  
**Estructura operacional (RI-001):** [EATCLEAN_OPERATIONAL_STRUCTURE](../00-status/EATCLEAN_OPERATIONAL_STRUCTURE.md) — actores · RBAC · dual hub · recorrido  
**Bitácora de sprint:** [EXPERIENCE_REFACTOR_EATCLEAN_V1_1](../07-experience/EXPERIENCE_REFACTOR_EATCLEAN_V1_1.md)  
**Prompt Lovable bloqueado:** [EATCLEAN_BRAND_CONTINUITY_LOCKED](../21-product-materialization/EATCLEAN_BRAND_CONTINUITY_LOCKED.md)  
**Milestone:** [EatClean Pilot Ready](../00-status/MILESTONE_EATCLEAN_PILOT_READY.md)

> **Qué es este doc:** la implementación **específica** de EatClean (copy, pantallas, assets, nav).  
> **Qué no es:** el contrato BrandConfig, ni las reglas permanentes, ni el changelog del sprint.  
> Ante duda de principio → SPEC. Ante duda de schema → BRANDING. Ante «qué se hizo en el PR» → bitácora.  
> Prompt para Lovable sin reinterpretar → [EATCLEAN_BRAND_CONTINUITY_LOCKED](../21-product-materialization/EATCLEAN_BRAND_CONTINUITY_LOCKED.md).

---

## Objetivo EatClean

Transformar la Customer Application en la app oficial de **EatClean Tenerife Catering**, y el staff entry en el **Centro de Operaciones** EatClean — misma marca, dos usuarios.

Si **CJ-001** es excelente:

> «Qué fácil. En dos minutos ya tengo mi pedido de la semana hecho.»

- Sin percepción SaaS / YourMeal OS como marca principal.  
- Sin copiar el **layout** de [eatcleantenerifecatering.es](https://eatcleantenerifecatering.es/).  
- Sin modificar HP-001 · sin forks · sin `if (eatclean)` — solo BrandConfig + `tenants/eatclean/`.

---

## Fuentes de identidad EatClean

| Fuente | Aporta |
|--------|--------|
| [Web oficial](https://eatcleantenerifecatering.es/) | Brand · confianza · tono institucional |
| Instagram EatClean | Product identity · platos · menú · comunicación diaria |

| Campo | Valor |
|-------|--------|
| Marca | Eat Clean Tenerife Catering |
| Primary | `#145B32` |
| Attention (golden) | `#EDB32A` — chips / indicadores; **nunca** CTA primario |
| Background | `#F7F5F1` |
| Tipografía | Montserrat (display) · Open Sans (body) |
| Logo | `tenants/eatclean/logo.svg` (+ espejo en `src/tenant/resources/`) |

Detalle de carpetas: [`tenants/eatclean/README.md`](../../tenants/eatclean/README.md).

---

## Personalidad

| Transmitir | Nunca |
|------------|--------|
| Comida saludable · cercanía · calidad | ERP · SaaS · «sistema operativo» |
| Confianza · sencillez | Módulos · departamentos · inventario |

---

## Login (cliente) — estado objetivo

```text
[ Logo EatClean ]

¡Bienvenido!

Inicia sesión y programa tu menú semanal.
```

- Logo con protagonismo y aire respecto al título.  
- Footer: enlace **Centro de Operaciones** + Powered by en dos líneas discretas.  
- Copy / claims: `tenants/eatclean/copy.es.json` · `brand.json`.

---

## Splash

Logo EatClean · fondo limpio · animación sencilla · Powered by discreto.

---

## Home (cliente)

App de comida, no dashboard.

```text
Hola, {nombre}

¿Ya programaste tu pedido de esta semana?
```

CTA: **Programar pedido**

| Bloque | Contenido |
|--------|-----------|
| Próxima entrega | Día + ventana horaria (cuando haya dato vivo) |
| Pedido de esta semana | Ver resumen |
| Menú semanal | Entrada al browse |
| Favoritos | Cuando exista contenido |
| Promoción semanal | Contenido Tenant (`promotions/`) |

---

## Navegación inferior

```text
Inicio · Pedidos · Favoritos · Mi cuenta
```

---

## Pedido semanal (CJ-001)

```text
Semana → Seleccionar platos → Resumen → Confirmar → Pedido realizado
```

Presentación Tenant-Branded; **misma** lógica HP-001.

| Pantalla | Dirección EatClean |
|----------|-------------------|
| Menú | Hero editorial · posts/tarjetas grandes · fotos reales · macros · CTA Añadir |
| Resumen | Foto real · «Tu pedido está listo» · Confirmar |

---

## Centro de Operaciones (staff)

Acceso: pie del Login → `/auth/admin` → `resolveHomePath` → `/admin`.

| Elemento | EatClean |
|----------|----------|
| Título | Centro de Operaciones / Operaciones |
| Primera pantalla | Agenda del día + workspaces (no KPIs) |
| Workspaces | Cocina · Reparto · Stock · Clientes · Administración · Finanzas |
| Nav | Operaciones · Pedidos · Clientes · Inventario · Más |

Reglas permanentes de entrada: [TENANT_EXPERIENCE_SPEC § Centro de Operaciones](./TENANT_EXPERIENCE_SPEC.md#centro-de-operaciones-reglas) · [OPERATIONAL_JOURNEYS](../07-experience/OPERATIONAL_JOURNEYS.md).

---

## Copy canónico EatClean

Editable en `tenants/eatclean/copy.es.json` (no duplicar largas listas en otros docs):

- Cocinamos para que tú solo tengas que disfrutar.  
- Soluciones nutritivas. · Ingredientes naturales. · Cocina 100% grill y al horno.  
- Servicio personalizado. · Reparto gratuito. · Comida saludable en tu día a día.

---

## Fotografía y contenido vivo (prioridad siguiente)

Orden de valor para dejar de ser maqueta:

1. Menú semanal real (nombres · fotos · macros) → `weekly-menu/` + catálogo  
2. Promoción semanal → `promotions/`  
3. Próxima entrega con ventana horaria  
4. Favoritos  
5. Aviso «Ya está el menú de esta semana»

---

## Qué NO aparece en Front Office

Kitchen · Inventory · Purchasing · Finance · Administration · Modules · Operations · Platform · Analytics · System Status · YourMeal OS Dashboard

---

## Restricción

```text
BrandConfig + tenants/eatclean/  únicamente
```

Checklist: [TENANT_EXPERIENCE_SPEC § Checklist](./TENANT_EXPERIENCE_SPEC.md#checklist-por-pantalla-obligatoria).

---

## Brief corto Cursor / Lovable

```text
Experience First: CJ-001 → pantallas MVP. Reglas: TENANT_EXPERIENCE_SPEC.
EatClean: TENANT_IMPLEMENTATION + tenants/eatclean/. Brand: eatcleantenerifecatering.es (identidad, NO layout).
App oficial EatClean. Centro de Operaciones para staff. NO HP-001. NO forks. NO if (eatclean).
```
