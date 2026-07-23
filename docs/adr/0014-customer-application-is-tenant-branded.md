# ADR 0014 — Customer Application is Tenant-Branded

## Estado

**Aceptado** — 2026-07-23

## Contexto

YourMeal OS es una plataforma SaaS multi-tenant para empresas de meal prep, catering y operaciones gastronómicas (ADR [0003](./0003-multi-tenant.md)).

La plataforma se compone de **dos productos** claramente diferenciados:

### Producto A — YourMeal OS (superficie corporativa)

Aplicación y web del proveedor SaaS. Dirigida a empresas interesadas en contratar la plataforma.

Funciones típicas: landing corporativa · documentación · módulos · pricing · contacto · demo · soporte.

**Branding:** YourMeal OS.

### Producto B — Customer Application

Aplicación utilizada por los **clientes finales** de cada empresa (tenant).

Ejemplo: el usuario de EatClean no utiliza «YourMeal OS»; utiliza **EatClean**.

Hasta esta ADR, el chrome de plataforma y el copy de onboarding podían presentar YourMeal OS como marca principal en superficies de cliente. Eso confunde la relación SaaS ↔ Tenant y debilita la confianza del usuario final.

## Decisión

```text
La Customer Application pertenece al Tenant.
YourMeal OS pertenece al proveedor del servicio.
```

La Customer Application es **100% Tenant-Branded**.

Todo el branding visual y verbal pertenece al Tenant, incluyendo:

- nombre · logo · colores · tipografía · imágenes  
- tono de comunicación · onboarding · mensajes · iconografía  
- favicon · splash · store assets  

YourMeal OS **únicamente** puede aparecer como:

```text
Powered by YourMeal OS
```

(o equivalente configurable). **Nunca** como marca principal.

### Resolución de branding

El branding se resuelve dinámicamente desde la configuración del Tenant:

```text
Tenant → BrandConfig → Logo → Typography → Palette
       → Illustrations → Copy → PoweredBy
```

Contrato técnico: [TENANT_BRANDING](../05-architecture/TENANT_BRANDING.md).

### Front Office

La app publicada en App Store / Google Play representa **exclusivamente** al Tenant (p. ej. EatClean).

- No muestra módulos internos de operación.  
- No expone conceptos operacionales del back office.  
- No menciona YourMeal OS como producto principal.

### Back Office

Los módulos internos (Kitchen, Delivery, Purchasing, Inventory, Finance, Administration, …) solo son visibles con permisos adecuados (RBAC — ADR [0004](./0004-authentication-rbac.md)). Forman parte de la operación del Tenant; **nunca** de la experiencia pública del cliente final.

### Autenticación

La autenticación usa el branding del Tenant:

```text
Bienvenido a EatClean
Comida preparada para ayudarte a comer mejor.
```

No: «Bienvenido a YourMeal OS».

### Store publishing

Nombre, icono, screenshots y descripción publicados son del **Tenant**, no de YourMeal OS.

### Relación con el sitio web del Tenant

La Customer Application es una extensión digital del sitio web del Tenant: misma identidad visual, tono, diseño, lenguaje y experiencia — como un único producto.

## Consecuencias

**Ventajas**

- Mayor confianza del usuario final.  
- Continuidad web ↔ app.  
- Plataforma realmente white-label.  
- Escalabilidad multi-tenant (2.º, 3.º, n-ésimo cliente).  
- YourMeal OS permanece como **infraestructura / motor operativo**, no como marca visible frente al cliente final.

**Analogía de producto**

YourMeal OS no compite por ser la marca visible. Compite por ser el motor operativo — el mismo rol que Shopify, Toast o Stripe respecto a las marcas de sus clientes.

**Implicaciones de implementación**

1. `BrandConfig` es una **Capability transversal** (no un retoque de diseño).  
2. Tokens / copy / assets de la Customer App se inyectan desde el Tenant; no se hardcodea la marca YourMeal OS en front office.  
3. Superficies corporativas (Producto A) siguen branding YourMeal OS.  
4. Cambios de branding de Tenant no requieren fork de código de producto.

**Superseder** esta ADR requiere evidencia y un ADR nuevo explícito.

## Relacionado

- [TENANT_BRANDING](../05-architecture/TENANT_BRANDING.md) — contrato técnico  
- [ADR 0003](./0003-multi-tenant.md) — aislamiento multi-tenant  
- [ADR 0004](./0004-authentication-rbac.md) — autenticación / RBAC  
- [docs/03-brand](../03-brand/README.md)  
- Dictionary: `DICT-045`…`DICT-049`
