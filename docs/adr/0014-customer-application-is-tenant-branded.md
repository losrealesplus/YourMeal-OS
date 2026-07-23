# ADR 0014 — Customer Application is Tenant-Branded

## Estado

**Aceptado** — 2026-07-23

## Principio canónico

> **The Platform owns the capability. The Tenant owns the experience.**

> **La plataforma es propietaria de la capacidad; el tenant es propietario de la experiencia.**

Esta frase resume la separación entre YourMeal OS (motor operativo) y cada Customer Application (marca y experiencia de cara al usuario).

### Tres niveles de personalización

| Nivel | Responsable | ¿Cambia por cliente? |
|-------|-------------|----------------------|
| **Platform** | YourMeal OS | No |
| **BrandConfig** | Tenant | Sí — configuración |
| **Tenant Experience** | Tenant | Sí — contenido y recursos |

Una sola base de código. Experiencia completa por Tenant sin forks.

---

## Contexto

YourMeal OS es una plataforma SaaS multi-tenant para empresas de meal prep, catering y operaciones gastronómicas (ADR [0003](./0003-multi-tenant.md)).

### Cambio de modelo mental

Hasta esta ADR, la arquitectura se pensaba (a menudo de forma implícita) así:

```text
YourMeal OS
        ↓
Aplicación
        ↓
Clientes
```

Con ADR 0014 pasa a ser:

```text
YourMeal OS Platform
        │
        ├──────────────┐
        ▼              ▼
 EatClean App     Cliente B App
        │              │
        ▼              ▼
 Clientes        Clientes
```

Esa es la diferencia entre un software personalizado y un SaaS multi-tenant bien diseñado: el sistema operativo se **materializa** por Tenant, no se presenta como una app genérica única.

### Cinco capas

```text
FOPEBA
        │
        ▼
Knowledge Layer
        │
        ▼
Platform Layer (YourMeal OS)
        │
        ▼
Tenant Layer (p. ej. EatClean)
        │
        ▼
End User Experience
```

| Capa | Responsabilidad |
|------|-----------------|
| **FOPEBA** | Cómo se genera conocimiento |
| **Knowledge** | Qué sabe el sistema |
| **Platform** | Cómo se implementa ese conocimiento (capabilities) |
| **Tenant** | Cómo se presenta ese conocimiento para una empresa concreta |
| **UX** | Cómo interactúa el usuario final |

El branding **no** pertenece al Platform Layer: pertenece al Tenant Layer (y se percibe en UX).

### Dos productos

#### Producto A — YourMeal OS (superficie corporativa)

Aplicación y web del proveedor SaaS. Dirigida a empresas interesadas en contratar la plataforma.

Funciones típicas: landing corporativa · documentación · módulos · pricing · contacto · demo · soporte.

**Branding:** YourMeal OS. **Capa:** Platform.

#### Producto B — Customer Application

Aplicación utilizada por los **clientes finales** de cada empresa (tenant).

Ejemplo: el usuario de EatClean no utiliza «YourMeal OS»; utiliza **EatClean**.

**Branding:** Tenant 100%. **Capa:** Tenant → UX.

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
Tenant → BrandConfig → Logo · Typography · Palette
       → Illustrations · Copy · PoweredBy
       → (futuro) features · store ids · …
```

Contrato técnico: [TENANT_BRANDING](../05-architecture/TENANT_BRANDING.md).

### Filtro de diseño (obligatorio)

Ante cada pantalla / superficie, la primera pregunta es:

> **¿Esta pantalla pertenece a la Plataforma o al Tenant?**

| Superficie | Capa |
|------------|------|
| Login / onboarding (cliente) | **Tenant** |
| Dashboard del cliente | **Tenant** |
| Confirmar pedido | **Tenant** |
| Cocina / Delivery / … (back office) | **Tenant** (BackOffice, RBAC) |
| Panel Superadmin YourMeal OS | **Platform** |
| Gestión de tenants | **Platform** |
| Facturación SaaS | **Platform** |

Ese filtro evita mezclar landing/chrome de plataforma con la experiencia del Tenant.

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
5. Un incremento futuro de **Experience Refactor** (Lovable) puede alinear onboarding, login, dashboard, navegación, tono e iconografía del Tenant **sin tocar HP-001 ni lógica operativa** — priorizable por Gate / producto, no como bloqueo de Smoke/ORR. Spec: [TENANT_EXPERIENCE_SPEC](../05-architecture/TENANT_EXPERIENCE_SPEC.md).

**Consecuencia explícita (configuración, no forks)**

> **La experiencia del usuario final debe poder recrear fielmente la identidad digital del Tenant utilizando únicamente la configuración de `BrandConfig` y los recursos asociados al Tenant. No se realizarán personalizaciones de código por cliente para adaptar el branding o la experiencia visual.**

Cuando llegue el segundo o el décimo cliente, el cambio de identidad es **configuración + contenido**, no bifurcar la aplicación.

**Regla de arquitectura SaaS**

> **Cada Tenant debe poder hacer que un usuario crea que la aplicación fue desarrollada específicamente para su empresa, sin necesidad de modificar el código fuente del producto.**

**Dos decisiones de largo recorrido (contexto FOPEBA)**

1. FOPEBA termina cuando empieza la **evidencia de campo**, no cuando termina el código.  
2. YourMeal OS es el **motor operativo**; el Tenant es la **marca** de cara al usuario.

La primera protege la evolución del conocimiento. La segunda protege la escalabilidad del SaaS.

**Superseder** esta ADR requiere evidencia y un ADR nuevo explícito.

## Relacionado

- [TENANT_BRANDING](../05-architecture/TENANT_BRANDING.md) — contrato técnico  
- [TENANT_EXPERIENCE_SPEC](../05-architecture/TENANT_EXPERIENCE_SPEC.md) — identidad EatClean (Experience Refactor)  
- [ADR 0003](./0003-multi-tenant.md) — aislamiento multi-tenant  
- [ADR 0004](./0004-authentication-rbac.md) — autenticación / RBAC  
- [docs/03-brand](../03-brand/README.md)  
- Dictionary: `DICT-045`…`DICT-051`
