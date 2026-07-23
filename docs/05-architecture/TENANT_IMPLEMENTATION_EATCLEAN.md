# TENANT IMPLEMENTATION · EatClean v1

**Para:** Cursor · Lovable (Experience Refactor)  
**ADR:** [0014](../adr/0014-customer-application-is-tenant-branded.md)  
**Spec de identidad:** [TENANT_EXPERIENCE_SPEC](./TENANT_EXPERIENCE_SPEC.md)  
**Contrato:** [TENANT_BRANDING](./TENANT_BRANDING.md)  
**Assets:** [`tenants/eatclean/`](../../tenants/eatclean/README.md)

> La web es la **referencia de marca, tono y contenido**.  
> La app debe sentirse como **la app oficial de EatClean**, no como una web metida en un móvil.  
> **No copiar el layout** de [eatcleantenerifecatering.es](https://eatcleantenerifecatering.es/).

---

## Objetivo

Transformar la Customer Application en la aplicación oficial de **EatClean Tenerife Catering**, publicada para clientes finales.

- No debe percibirse como una aplicación SaaS.  
- No debe mostrar YourMeal OS como marca principal.  
- Toda la identidad visual, lenguaje y experiencia pertenecen al Tenant.  
- YourMeal OS únicamente aparece como: **Powered by YourMeal OS**.

**Sin** modificar lógica de negocio / HP-001.  
**Sin** forks.  
**Sin** código específico para EatClean — solo `BrandConfig` + Tenant Resources.

---

## Fuente oficial

| Campo | Valor |
|-------|--------|
| Marca | Eat Clean Tenerife Catering |
| Web | https://eatcleantenerifecatering.es/ |

**Sí heredar:** identidad · colores · tono · estilo · mensajes · fotografía · sensación de marca.  
**No heredar:** layout de la web.

---

## Personalidad de la marca

| Transmitir | Nunca transmitir |
|------------|------------------|
| Comida saludable · calidad · cercanía | ERP · Software · SaaS |
| Confianza · sencillez · profesionalidad | Plataforma tecnológica · Sistema operativo |

---

## Login

**Eliminar:**

```text
Bienvenido
Inicia sesión en tu operación
```

**Sustituir:**

| Elemento | Texto |
|----------|--------|
| Título | Bienvenido a EatClean |
| Subtítulo | Comida preparada para ayudarte a comer mejor. |
| CTA | Iniciar sesión |
| Footer | Powered by YourMeal OS *(pequeño y discreto)* |

Origen: `tenants/eatclean/copy.es.json` + `brand.json` → `BrandConfig`.

---

## Splash

- Logo EatClean  
- Fondo limpio  
- Animación sencilla  
- Powered by YourMeal OS  

Assets: `logo.svg` · `splash.webp` · `icon.png`.

---

## Home

La primera pantalla **no** es un dashboard administrativo. Debe sentirse como una **app de comida**.

### Hero

```text
Hola, {nombre}

¿Ya programaste tu pedido de esta semana?
```

CTA principal: **Programar pedido**

### Cards

| Card | Contenido |
|------|-----------|
| Próximo pedido | Fecha de entrega · Estado |
| Pedido de esta semana | Ver resumen |
| Mis menús favoritos | Acceso a favoritos |
| Promociones | Si hay contenido del Tenant |

---

## Navegación inferior

```text
Inicio · Pedidos · Favoritos · Mi cuenta
```

Nada más en el bottom nav.

---

## Perfil (Mi cuenta)

- Datos personales  
- Direcciones  
- Métodos de pago  
- Facturas  
- Historial  
- Preferencias alimentarias  
- Alérgenos  
- Cerrar sesión  
- Acerca de *(Powered by aquí, discreto)*  

---

## Pedido semanal (experiencia principal)

Toda la aplicación gira alrededor de este flujo (HP-001 — **no cambiar lógica**):

```text
Semana → Seleccionar platos → Resumen → Confirmar → Pedido realizado
```

Solo rediseñar **presentación** Tenant-Branded.

---

## Estilo visual

Inspirarse en la web:

- mucho espacio en blanco  
- fotografías reales  
- tarjetas limpias  
- botones grandes  
- bordes suaves  
- diseño minimalista  

**Eliminar** apariencia de dashboard empresarial.

---

## Fotografía

**Usar:** bowls · verduras · platos saludables · ingredientes frescos.  

**Nunca:** ilustraciones de oficina · iconos de SaaS · gráficos empresariales.

Colocar en `tenants/eatclean/` (`hero-home.webp`, onboarding, empty states, …).

---

## Copy

Conservar tono y propuesta de valor (inspiración, no copia literal de toda la web):

- Cocinamos para que tú solo tengas que disfrutar.  
- Soluciones nutritivas.  
- Cocina 100% grill y al horno.  
- Ingredientes naturales.  
- Servicio personalizado.  
- Reparto gratuito.  

Fuente editable: `tenants/eatclean/copy.es.json`.

---

## Qué NO debe aparecer (Front Office)

Eliminar completamente de la experiencia cliente:

Kitchen · Inventory · Purchasing · Finance · Administration · Modules · Operations · Platform · YourMeal OS Dashboard · Analytics · System Status

---

## BackOffice

Un único acceso, p. ej. **EatClean Admin** o **BackOffice**.

Visible **solo** con RBAC. Dentro sí:

Kitchen · Delivery · Inventory · Purchasing · Finance · Administration · Production · Orders · Customers

---

## Colores · Tipografía · Iconografía · Motion

| Aspecto | Regla |
|---------|--------|
| Colores | Extraer de la web → Primary · Secondary · Background · Surface · Success · Error → `BrandConfig` / `brand.json` |
| Tipografía | Misma familia que la web o la alternativa licenciable más cercana — no inventar otra |
| Iconografía | Minimalista · línea fina · moderna — no iconografía corporativa SaaS |
| Animaciones | Suaves · rápidas · naturales — nada llamativo |

---

## Powered by — dónde aparece

Únicamente:

- Login  
- Splash  
- Ajustes / Acerca de  

Nunca como elemento protagonista.

---

## Restricción arquitectónica

Todo lo anterior **exclusivamente** mediante:

```text
BrandConfig + Tenant Resources (tenants/eatclean/)
```

- Sin modificar lógica de negocio.  
- Sin forks.  
- Sin código específico para EatClean.  

Checklist de auditoría: [TENANT_EXPERIENCE_SPEC § Checklist](./TENANT_EXPERIENCE_SPEC.md#checklist-por-pantalla-obligatoria).

---

## Tenant Assets (patrón MVP)

```text
tenants/
└── eatclean/
    ├── logo.svg
    ├── icon.png
    ├── splash.webp
    ├── hero-home.webp
    ├── onboarding-1.webp
    ├── onboarding-2.webp
    ├── onboarding-3.webp
    ├── empty-orders.webp
    ├── brand.json
    ├── copy.es.json
    └── README.md
```

Cuando llegue un nuevo Tenant: **cambiar recursos y configuración**, no rediseñar la aplicación. EatClean es la primera implementación del patrón, no un caso especial.

---

## Brief para Cursor / Lovable

```text
Implementa TENANT IMPLEMENTATION · EatClean v1.
Referencia de marca: eatcleantenerifecatering.es — identidad/tono/fotos, NO layout web.
App oficial de EatClean para clientes finales. No SaaS. No YourMeal OS como marca.
Powered by solo en Login / Splash / Acerca de.
Home = app de comida (hero + cards), no dashboard admin.
Nav: Inicio · Pedidos · Favoritos · Mi cuenta.
BackOffice solo RBAC.
Usa tenants/eatclean/brand.json + copy.es.json + assets.
NO toques lógica HP-001. NO forks. NO if (tenant === 'eatclean') en código.
Pasa la checklist Branding/Copy/Continuidad/Rol/Powered by/Configuración.
```
