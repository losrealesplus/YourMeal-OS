# TENANT EXPERIENCE SPEC — EatClean

**ADR:** [0014 — Customer Application is Tenant-Branded](../adr/0014-customer-application-is-tenant-branded.md)  
**Contrato técnico:** [TENANT_BRANDING](./TENANT_BRANDING.md) (`BrandConfig`)  
**Implementación Cursor/Lovable:** [TENANT_IMPLEMENTATION_EATCLEAN](./TENANT_IMPLEMENTATION_EATCLEAN.md)  
**Assets:** [`tenants/eatclean/`](../../tenants/eatclean/README.md)  
**Tenant:** EatClean Tenerife Catering  
**Audiencia del documento:** Cursor · Lovable · diseño (Experience Refactor)  
**Ámbito:** identidad, tono, copy y navegación de la **Customer Application** — **sin** cambiar HP-001 ni lógica operativa.

---

## Objetivo

Convertir la Customer Application en una **extensión natural** de la identidad digital del Tenant.

> Que cualquier cliente descargue la app y piense que es la **app oficial de EatClean**.

No copiar la web literalmente. Heredar su **identidad**, su **tono** y su **lenguaje**.

### Tres niveles (separación SaaS)

| Nivel | Responsable | ¿Cambia por cliente? |
|-------|-------------|----------------------|
| **Platform** | YourMeal OS | **No** — una sola base de código |
| **BrandConfig** | Tenant | **Sí** — mediante configuración |
| **Tenant Experience** | Tenant | **Sí** — mediante contenido y recursos |

Eso evita:

* forks del producto por cliente;  
* reducir el branding a «un logo y dos colores».

El Tenant define una **experiencia completa** (identidad · lenguaje · tono · recursos); la plataforma sigue siendo una única codebase.

---

## Fuente de verdad (branding)

| Campo | Valor |
|-------|--------|
| Marca | EatClean Tenerife Catering |
| Web oficial | https://eatcleantenerifecatering.es/ |
| Producto de plataforma | YourMeal OS (solo *Powered by*, nunca marca principal) |

Toda personalización visual/verbal debe resolverse con **`BrandConfig` + recursos del Tenant**.  
**Prohibido** bifurcar código de producto por cliente (ADR 0014).

---

## Principios

1. El usuario **nunca** siente que usa YourMeal OS.  
2. La app parece desarrollada por EatClean.  
3. La experiencia móvil es una extensión de la web.  
4. Todo el copy respeta el tono del Tenant (alimentación, no tecnología).  
5. Todo el sistema visual deriva de `BrandConfig`.  
6. Filtro obligatorio: **¿Plataforma o Tenant?** → esta app es **Tenant**.

### Regla de arquitectura (SaaS)

> **Cada Tenant debe poder hacer que un usuario crea que la aplicación fue desarrollada específicamente para su empresa, sin necesidad de modificar el código fuente del producto.**

---

## Identidad que debe heredar la app

La web transmite cuatro ideas:

| Sí | No |
|----|-----|
| Comida saludable | ERP |
| Cercanía | Sistema operativo |
| Calidad gastronómica | Tecnología / módulos |
| Profesionalidad | Inventario / departamentos |

Eso es exactamente lo que debe sentir el usuario al abrir la app.

---

## Copy canónico (reutilizar)

Tomado del tono y mensajes de la web — adaptar a pantallas, no inventar voz SaaS:

| Uso | Texto |
|-----|--------|
| Hero / claim | Cocinamos para que tú solo tengas que disfrutar. |
| Propuesta | Soluciones nutritivas. |
| Calidad | Ingredientes naturales. |
| Método | Cocina 100% grill y al horno. |
| Servicio | Servicio personalizado. |
| Entrega | Reparto gratuito. |
| Pie / ambiente | Comida saludable en tu día a día. |

**Tono:** empresa de alimentación. No empresa tecnológica.  
Sin: «operación», «módulos», «plataforma», «capabilities», «tenant».

---

## Login

```text
Bienvenido a EatClean

Comida preparada para ayudarte
a comer mejor.
```

Footer (discreto):

```text
Powered by YourMeal OS
```

**Eliminar / no usar:**

```text
Bienvenido
Inicia sesión en tu operación
```

ni cualquier copy que presente YourMeal OS o «la operación» como producto.

Campos BrandConfig: `copy.welcomeTitle` · `copy.welcomeSubtitle` · `poweredBy`.

---

## Home del cliente

**Eliminar completamente** de la experiencia cliente:

- Kitchen · Inventory · Purchasing · Delivery · Finance  
- Modules · Platform Landing · chrome YourMeal OS  

**Sustituir por** un dashboard de cliente:

```text
Hola {nombre}

¿Ya programaste tu pedido de esta semana?
```

CTA principal:

```text
Programar pedido
```

Luego, solo:

| Bloque | Notas |
|--------|--------|
| Pedido actual | Estado del pedido en curso |
| Próxima entrega | Fecha / ventana |
| Historial | Pedidos pasados |
| Facturas | Si aplica al actor cliente |
| Direcciones | Gestión propia |
| Perfil | Cuenta |

Nada más. Sin módulos internos. Sin saludo con emoji obligatorio — el tono es cercano; el gesto tipográfico puede omitirse si el design system del Tenant lo prefiere sobrio.

---

## Navegación (cliente)

Pensada para **clientes**, no para operadores:

```text
Inicio
Pedidos
Mi cuenta
Más
```

Dentro de **Más**:

- Ayuda  
- Contacto  
- Facturación  
- Configuración  

Mapa de pantallas existente ([CUSTOMER_APP_SCREEN_MAP](../15-product/CUSTOMER_APP_SCREEN_MAP.md)) se **realinea** a esta IA: mismas capabilities de fondo; distinta presentación de marca y nav.

---

## BackOffice

Solo visible mediante **RBAC** (ADR 0004).

El **cliente nunca** ve:

- Kitchen · Purchasing · Inventory · Delivery · Finance · Administration  

El administrador del Tenant sí (back office del Tenant — sigue siendo capa Tenant, no Platform).

---

## Sistema visual

No inventar una identidad nueva. Extraer / mapear a `BrandConfig` desde la web oficial:

| Token | Origen |
|-------|--------|
| Colores principales / secundarios | Web EatClean |
| Radios · sombras · espaciados | Web EatClean |
| Tipografía | Oficial del Tenant (o equivalente licenciable si la web no puede reutilizarse) |
| Botones · tarjetas · bordes | Web EatClean |
| Logo · favicon · icon app | Assets oficiales del Tenant |

La app y la web deben parecer **un solo producto**.

Hasta que `BrandConfig` esté Connected en runtime, cualquier token hardcodeado de «marca plataforma» en rutas cliente es **deuda ADR 0014**.

---

## Imágenes

La web usa **fotografías reales** de comida. La app debe igual:

- bowls · platos · ingredientes · cocina  

**No** usar ilustraciones genéricas de SaaS, dashboards abstractos ni stock «tech».

---

## Restricciones (hard)

No mostrar en Customer Application:

- YourMeal OS como marca principal  
- Arquitectura SaaS  
- Departamentos internos  
- Conceptos operacionales de cocina/compras  
- Módulos técnicos  
- Copy de «sistema operativo» / ERP  

---

## Experience Refactor (ejecución)

| Incluye | Excluye |
|---------|---------|
| Onboarding · login · home · nav · tono · imágenes · iconografía · copy | Cambios a HP-001 |
| Mapeo visual → `BrandConfig` | Nueva lógica de negocio |
| Ocultar back office sin RBAC | Nuevas capabilities |

**No bloquea** Smoke / ORR. Priorizable en paralelo como incremento Lovable/Cursor de experiencia.

### Cadena de experiencia

```text
Tenant Experience Spec
        ↓
Experience Refactor
        ↓
BrandConfig Validation
        ↓
EatClean Release UX
```

No abordar pantalla por pantalla de forma aislada: **auditoría de toda la experiencia**.

### Checklist por pantalla (obligatoria)

Cada pantalla de Customer Application debe cumplir **todas** estas preguntas antes de darse por válida:

| # | Criterio | Pregunta |
|---|----------|----------|
| 1 | **Branding** | ¿Parece una pantalla de EatClean o de un SaaS genérico? |
| 2 | **Copy** | ¿Usa el mismo tono y lenguaje que la web del Tenant? |
| 3 | **Continuidad** | ¿La transición web → app resulta natural? |
| 4 | **Rol** | ¿Corresponde a Front Office o Back Office? (cliente ≠ operador) |
| 5 | **Powered by** | ¿YourMeal OS aparece **únicamente** donde corresponde? |
| 6 | **Configuración** | ¿Todo lo visible proviene de `BrandConfig` o recursos del Tenant, **sin** lógica específica hardcodeada para EatClean? |

Si **todas** las pantallas pasan la checklist, se valida no solo la UX de EatClean, sino el **patrón reutilizable** para cualquier Tenant futuro.

### Brief corto para Lovable / Cursor

Usar el brief completo: [TENANT_IMPLEMENTATION_EATCLEAN](./TENANT_IMPLEMENTATION_EATCLEAN.md).

```text
Implementa TENANT IMPLEMENTATION · EatClean v1 (+ Spec + ADR 0014).
App oficial EatClean — no SaaS. Identidad de eatcleantenerifecatering.es, NO layout web.
BrandConfig + tenants/eatclean/ only. NO HP-001. NO forks. NO if (eatclean).
Checklist Branding/Copy/Continuidad/Rol/Powered by/Configuración.
```

---

## Relacionado

- [ADR 0014](../adr/0014-customer-application-is-tenant-branded.md)  
- [TENANT_BRANDING](./TENANT_BRANDING.md)  
- [TENANT_IMPLEMENTATION_EATCLEAN](./TENANT_IMPLEMENTATION_EATCLEAN.md)  
- [`tenants/eatclean/`](../../tenants/eatclean/README.md)  
- [03-brand](../03-brand/README.md)  
- [CUSTOMER_APP_SCREEN_MAP](../15-product/CUSTOMER_APP_SCREEN_MAP.md)  
- [Lovable Brief](../21-product-materialization/02-lovable-brief.md)  
- Dictionary: `DICT-045`…`DICT-052`
