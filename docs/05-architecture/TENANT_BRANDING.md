# Tenant Branding — contrato técnico

**ADR:** [0014 — Customer Application is Tenant-Branded](../adr/0014-customer-application-is-tenant-branded.md)  
**Estado:** Accepted (especificación) · implementación incremental  
**Ámbito:** Capability transversal — BrandConfig, recursos y configuración. **No** es la guía de UX ni la bitácora de un sprint.

### Mapa de documentos (evitar duplicar)

| Documento | Rol |
|-----------|-----|
| **Este** ([TENANT_BRANDING](./TENANT_BRANDING.md)) | Contrato técnico: BrandConfig · recursos · runtime |
| [TENANT_EXPERIENCE_SPEC](./TENANT_EXPERIENCE_SPEC.md) | Reglas **permanentes** de experiencia Tenant |
| [TENANT_IMPLEMENTATION_EATCLEAN](./TENANT_IMPLEMENTATION_EATCLEAN.md) | Implementación **específica** del tenant EatClean |
| [EXPERIENCE_REFACTOR_EATCLEAN_V1_1](../07-experience/EXPERIENCE_REFACTOR_EATCLEAN_V1_1.md) | Bitácora del sprint Experience (#24→#29) |

---

## Principio

> **The Platform owns the capability. The Tenant owns the experience.**

```text
Customer Application  →  branding del Tenant (100%)
YourMeal OS (SaaS)    →  branding del proveedor (capabilities)
Powered by            →  única mención visible de YourMeal OS en front office
```

### Filtro de diseño

> **¿Esta pantalla pertenece a la Plataforma o al Tenant?**

| Ejemplo | Capa |
|---------|------|
| Login · Home cliente · Confirmar pedido | **Tenant** (Customer App) |
| Cocina / Reparto / … (RBAC) | **Tenant** (Centro de Operaciones) |
| Superadmin · Gestión de tenants · Facturación SaaS | **Platform** |

---

## Resolución

```text
Tenant
  ↓
BrandConfig
  ↓
Logo · Typography · Palette · Illustrations · Copy · PoweredBy
  ↓
CSS variables / assets / i18n scoped al tenant
```

Fuente canónica: configuración del Tenant (`tenants/<slug>/brand.json` + recursos) y, a futuro, storage/config remota. La UI **lee** `BrandConfig`; no define marca propia.

---

## BrandConfig (contrato)

```typescript
/** Contrato de branding por Tenant — ADR 0014 */
type BrandConfig = {
  /** Nombre comercial visible (ej. "EatClean") */
  name: string

  /** Assets de marca */
  logo: BrandAsset          // horizontal / primary
  icon: BrandAsset          // app icon
  favicon: BrandAsset

  /** Color system */
  primaryColor: string      // CSS color / token
  secondaryColor: string
  /** Extensiones opcionales (cream, sand, …) — keys estables, valores del tenant */
  palette?: Record<string, string>

  /** Tipografía */
  typography: {
    display?: string        // font family
    body?: string
    mono?: string
  }

  /** Estilo ilustrativo / fotografía */
  illustrationStyle?: string

  /** Radio / forma base (design tokens) */
  borderRadius?: string

  /** Copy de marca (no copy operacional del OM) */
  copy: {
    tagline?: string
    welcomeTitle?: string   // auth / onboarding
    welcomeSubtitle?: string
    /** Otras claves de tono — i18n por locale del tenant */
    [key: string]: string | undefined
  }

  /** Única mención de la plataforma en front office */
  poweredBy: {
    visible: boolean
    /** Firma tipográfica; puede renderizarse en dos líneas (prefix + name) */
    label: string           // default: "Powered by YourMeal OS"
    prefix?: string         // default: "Powered by"
    name?: string           // default: "YourMeal OS"
    href?: string
  }

  /** Publicación en stores */
  storeAssets: {
    appName: string         // = name del tenant
    shortDescription?: string
    fullDescription?: string
    screenshots?: BrandAsset[]
    featureGraphic?: BrandAsset
  }

  splashScreen?: BrandAsset

  /** Superficies que consumen BrandConfig */
  authentication: BrandSurfaceRef
  homepage: BrandSurfaceRef
  emails?: BrandSurfaceRef
}

type BrandAsset = {
  url: string
  alt?: string
  width?: number
  height?: number
}

type BrandSurfaceRef = {
  /** Si true, esta superficie aplica BrandConfig del tenant */
  tenantBranded: true
}
```

### Extensión futura (no bloquea el contrato actual)

`BrandConfig` puede crecer (features de presentación, store IDs, …) **sin** mezclar capabilities de plataforma con experiencia de tenant. Toda regla operacional nueva sigue FOPEBA.

---

## Recursos del Tenant (patrón)

```text
tenants/<tenant-slug>/
  brand.json              → BrandConfig
  copy.<locale>.json      → copy de marca / pantallas
  README.md
  brand/                  → logo · icon · splash
  copy/                   → copy adicional
  media/                  → fotografías de producto
  weekly-menu/            → assets del menú publicado
  promotions/             → promos / novedades
  onboarding/             → imágenes onboarding
```

**Regla:** un nuevo tenant = recursos + configuración. **Nunca** forks de producto ni `if (tenantSlug)`.

Bundling actual (Vite): espejo en `src/tenant/resources/` — mantener sincronizado. Detalle por tenant: p. ej. [`tenants/eatclean/`](../../tenants/eatclean/README.md).

---

## Superficies

| Superficie | Branding |
|------------|----------|
| Customer Application (front office) | **Tenant** 100% |
| Auth / onboarding del cliente final | **Tenant** |
| Emails al cliente final | **Tenant** (+ Powered by opcional) |
| Store listing (iOS / Android) | **Tenant** |
| Centro de Operaciones (staff, RBAC) | **Tenant** (misma marca · otro usuario) |
| SaaS corporativo / consola `saas_admin` | **YourMeal OS** |

---

## Front office vs Centro de Operaciones

```text
Front office (cliente)
  · Solo experiencia del Tenant
  · Sin módulos internos
  · Sin conceptos de cocina / compras / finanzas

Centro de Operaciones (staff del Tenant, RBAC)
  · Workspaces operativos (producción, reparto, stock, …)
  · Visible solo con permisos
  · Nunca en la app pública del cliente
```

Reglas de experiencia permanentes: [TENANT_EXPERIENCE_SPEC](./TENANT_EXPERIENCE_SPEC.md).  
Journeys de staff: [OPERATIONAL_JOURNEYS](../07-experience/OPERATIONAL_JOURNEYS.md).

---

## Inyección en runtime (objetivo)

1. Resolver `tenantId` (sesión / dominio / deep link).  
2. Cargar `BrandConfig` del Tenant.  
3. Aplicar tokens CSS / tipografías.  
4. Sustituir copy de auth / home / emails.  
5. Renderizar `PoweredBy` si `poweredBy.visible`.

Hasta Connected: marca hardcodeada de YourMeal OS en rutas cliente = **deuda ADR 0014**.

---

## Relación con otros docs

| Doc | Rol |
|-----|-----|
| [03-brand](../03-brand/README.md) | Identidad del **proveedor** |
| [04-design](../04-design/README.md) | Design system base; tokens de tenant los sobrescriben |
| [CUSTOMER_APP_SCREEN_MAP](../15-product/CUSTOMER_APP_SCREEN_MAP.md) | Mapa de pantallas; tokens brand = del Tenant |
| ADR [0003](../adr/0003-multi-tenant.md) | Aislamiento de datos; ADR 0014 aísla **identidad** |

---

## Fuera de alcance (este documento)

- Copy concreto de pantallas EatClean → [TENANT_IMPLEMENTATION_EATCLEAN](./TENANT_IMPLEMENTATION_EATCLEAN.md)  
- Checklist permanente de experiencia → [TENANT_EXPERIENCE_SPEC](./TENANT_EXPERIENCE_SPEC.md)  
- Historial de PRs / sprints → [EXPERIENCE_REFACTOR_EATCLEAN_V1_1](../07-experience/EXPERIENCE_REFACTOR_EATCLEAN_V1_1.md)  
- Editor SaaS de branding · cambios HP-001 · forks por tenant
