# Tenant Experience Spec — reglas permanentes

**Knowledge Lifetime:** Contract  
**ADR:** [0014 — Customer Application is Tenant-Branded](../adr/0014-customer-application-is-tenant-branded.md)  
**Contrato técnico:** [TENANT_BRANDING](./TENANT_BRANDING.md)  
**Ejemplo de implementación:** [TENANT_IMPLEMENTATION_EATCLEAN](./TENANT_IMPLEMENTATION_EATCLEAN.md)  
**Bitácora de sprint:** [EXPERIENCE_REFACTOR_EATCLEAN_V1_1](../07-experience/EXPERIENCE_REFACTOR_EATCLEAN_V1_1.md)

> Este documento fija **reglas que no cambian con cada PR de UI**.  
> Copy, assets y pantallas concretas de un tenant viven en su implementación + `tenants/<slug>/`.  
> No duplicar aquí el BrandConfig TypeScript ni el changelog del sprint.

---

## Objetivo

Que la Customer Application sea una **extensión natural** de la identidad digital del Tenant.

> Que cualquier cliente descargue la app y piense que es la **app oficial del Tenant**.

No copiar la web literalmente. Heredar **identidad**, **tono** y **lenguaje**.

### Tres niveles (SaaS)

| Nivel | Responsable | ¿Cambia por cliente? |
|-------|-------------|----------------------|
| **Platform** | YourMeal OS | **No** — una sola codebase |
| **BrandConfig** | Tenant | **Sí** — configuración |
| **Tenant Experience** | Tenant | **Sí** — contenido y recursos |

Eso evita forks por cliente y reducir el branding a «un logo y dos colores».

---

## Principio rector — Brand Recognition Filter (no negociable)

Antes de dar por válida **cualquier** pantalla Tenant (Customer App **o** Centro de Operaciones):

> **Si ocultamos el nombre "YourMeal OS", ¿un cliente o un empleado reconocería inmediatamente que esta aplicación pertenece al Tenant gracias al logo, los colores, la tipografía, el lenguaje y la fotografía?**

| Respuesta | Dictamen |
|-----------|----------|
| **Sí** | Respeta [ADR 0014](../adr/0014-customer-application-is-tenant-branded.md) |
| **No** | La pantalla **no** está lista — falta identidad, no «más UI SaaS» |

Continuidad visual esperada:

```text
Instagram / redes del Tenant  →  Web oficial  →  App
```

No copiar el **layout** de la web. Sí heredar la **identidad** (marca, tono, foto, tipografía).

Customer App → calma · apetito · simplicidad.  
Centro de Operaciones → claridad · prioridad · acción.  
Misma marca. Distinto propósito.

---

## Principios permanentes

1. El usuario final **nunca** siente que usa YourMeal OS como producto.  
2. La app parece desarrollada por el Tenant.  
3. La experiencia móvil es continuidad de la identidad digital del Tenant (web / redes).  
4. El copy habla de **alimentación / servicio**, no de tecnología.  
5. Todo el sistema visual deriva de `BrandConfig` + recursos del Tenant.  
6. Filtro: **¿Plataforma o Tenant?** → Customer App y Centro de Operaciones son **Tenant**.

### Regla de arquitectura

> **Cada Tenant debe poder hacer que un usuario crea que la aplicación fue desarrollada específicamente para su empresa, sin modificar el código fuente del producto.**

---

## Dos experiencias · una identidad

```text
                    YourMeal OS
                         │
                   Tenant (BrandConfig)
          ┌──────────────┴──────────────┐
          ▼                             ▼
     Customer App              Centro de Operaciones
     "Quiero comer"            "Tengo que trabajar"
          │                             │
   Customer Journeys          Operational Journeys
```

| Cara | Pregunta | Sensación |
|------|----------|-----------|
| Customer App | ¿Qué quiero comer esta semana? | Calma · apetito · simplicidad |
| Centro de Operaciones | ¿Qué necesita hacer hoy mi equipo? | Claridad · prioridad · acción |

Misma marca. Distinto usuario. Misma plataforma.  
Detalle CJ: [CUSTOMER_JOURNEYS](../07-experience/CUSTOMER_JOURNEYS.md) · OJ: [OPERATIONAL_JOURNEYS](../07-experience/OPERATIONAL_JOURNEYS.md).

---

## Identidad que debe heredar la app

| Sí | No |
|----|-----|
| Comida / servicio del Tenant | ERP · SaaS · «sistema operativo» |
| Cercanía · calidad | Módulos · departamentos · inventario |
| Fotografía real de producto | Stock genérico / ilustración tech |

---

## Copy — reglas (no textos fijos)

- El tono lo define el Tenant (claims en `copy.<locale>.json`).  
- Prohibido en Front Office: «operación», «módulo», «plataforma», «capability», «tenant», «ERP».  
- YourMeal OS solo como **Powered by** (firma discreta).  
- Textos exactos de pantallas → implementación del tenant + assets.

---

## Login (reglas)

- El **logo del Tenant** es el ancla de marca (protagonismo y aire respecto al título).  
- El copy invita al valor del producto (p. ej. pedido semanal), no a «entrar en la operación».  
- **Powered by** es firma tipográfica mínima, no contenido principal.  
- El acceso de staff usa lenguaje natural del producto operativo (p. ej. **Centro de Operaciones**), no abreviaturas «Adm» / «Admin».  
- Seguridad = autenticación + RBAC — [ADR 0014 · Administrative entry](../adr/0014-customer-application-is-tenant-branded.md#administrative-entry-regla-reutilizable).

---

## Home del cliente (reglas)

- No es un dashboard administrativo.  
- Responde la pregunta del Customer Journey principal (pedido / servicio).  
- CTA principal claro.  
- Bloques típicos: pedido actual · próxima entrega · favoritos · promociones del Tenant — **sin** módulos internos.

**Eliminar de la experiencia cliente:** Kitchen · Inventory · Purchasing · Delivery · Finance · Modules · Platform chrome.

---

## Navegación cliente (reglas)

Pensada para **clientes**, no operadores. Bottom nav corto (Inicio · Pedidos · … · Cuenta).  
El [CUSTOMER_APP_SCREEN_MAP](../15-product/CUSTOMER_APP_SCREEN_MAP.md) se realinea a esta IA: mismas capabilities; distinta presentación.

---

## Centro de Operaciones (reglas)

- Visible solo con **RBAC** (ADR 0004).  
- Primera pantalla = **trabajo del día**, no KPIs / gráficos financieros.  
- Workspaces autorizados únicamente — nunca módulos «bloqueados» visibles.  
- 1 workspace → entrada directa · 2+ → picker · admin → todas las áreas.  
- Misma identidad visual del Tenant; otro objetivo.

---

## Sistema visual (reglas)

- Extraer colores, tipografía, radios y logo oficiales → `BrandConfig`.  
- App y web/redes del Tenant deben parecer **un solo producto**.  
- Fotografía real de producto; no ilustraciones SaaS.  
- Hasta Connected: tokens de marca plataforma en rutas cliente = deuda ADR 0014.

---

## Powered by (reglas)

Únicamente Login · Splash · Acerca de (y equivalentes). Nunca protagonista.

---

## Restricciones hard (Front Office)

No mostrar: YourMeal OS como marca principal · arquitectura SaaS · departamentos internos · conceptos de cocina/compras · copy de ERP / sistema operativo.

---

## Checklist por pantalla (obligatoria)

Cada pantalla Tenant debe cumplir **todas**:

| # | Criterio | Pregunta |
|---|----------|----------|
| 0 | **Reconocimiento** | ¿Pasa el [Brand Recognition Filter](#principio-rector--brand-recognition-filter-no-negociable)? |
| 1 | **Branding** | ¿Parece del Tenant o de un SaaS genérico? |
| 2 | **Copy** | ¿Mismo tono que la identidad digital del Tenant? |
| 3 | **Continuidad** | ¿La transición web/redes → app resulta natural? |
| 4 | **Rol** | ¿Front Office o Centro de Operaciones? (cliente ≠ operador) |
| 5 | **Powered by** | ¿YourMeal OS solo donde corresponde? |
| 6 | **Configuración** | ¿Lo visible viene de BrandConfig / recursos, sin `if (tenant)`? |

Si todas las pantallas pasan, se valida el **patrón reutilizable** para cualquier Tenant.

---

## Cadena

```text
Tenant Experience Spec (reglas permanentes)
        ↓
Tenant Implementation (tenant concreto)
        ↓
Experience Refactor bitácora (sprint)
        ↓
BrandConfig + Tenant Resources
```

---

## Relacionado

- [ADR 0014](../adr/0014-customer-application-is-tenant-branded.md)  
- [TENANT_BRANDING](./TENANT_BRANDING.md)  
- [TENANT_IMPLEMENTATION_EATCLEAN](./TENANT_IMPLEMENTATION_EATCLEAN.md)  
- [`tenants/`](../../tenants/README.md)  
- [CUSTOMER_JOURNEYS](../07-experience/CUSTOMER_JOURNEYS.md) · [OPERATIONAL_JOURNEYS](../07-experience/OPERATIONAL_JOURNEYS.md)
