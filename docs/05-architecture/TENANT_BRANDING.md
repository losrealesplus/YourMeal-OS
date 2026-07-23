# Tenant Branding — contrato técnico

**ADR:** [0014 — Customer Application is Tenant-Branded](../adr/0014-customer-application-is-tenant-branded.md)  
**Estado del contrato:** Accepted (especificación) · implementación incremental  
**Ámbito:** Capability transversal del sistema — no un ajuste cosmético de UI.

---

## Principio

```text
Customer Application  →  branding del Tenant (100%)
YourMeal OS (SaaS)    →  branding del proveedor
Powered by            →  única mención visible de YourMeal OS en front office
```

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

Fuente canónica prevista: configuración del Tenant (p. ej. `tenants.brand` JSON + assets en storage). La UI de Customer Application **lee** `BrandConfig`; no define marca propia.

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
    label: string           // default: "Powered by YourMeal OS"
    href?: string           // sitio corporativo YourMeal OS
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

---

## Superficies

| Superficie | Branding |
|------------|----------|
| Customer Application (front office) | **Tenant** 100% |
| Auth / onboarding del cliente final | **Tenant** |
| Emails al cliente final | **Tenant** (+ Powered by opcional) |
| Store listing (iOS / Android) | **Tenant** |
| Back office (Kitchen, Delivery, …) | Tenant (operación) · sin exponerse al cliente |
| SaaS corporativo (landing, pricing, docs, demo) | **YourMeal OS** |
| Consola `saas_admin` | **YourMeal OS** |

---

## Front office vs back office

```text
Front office (cliente final)
  · Solo experiencia del Tenant
  · Sin módulos internos
  · Sin conceptos operacionales de cocina / compras / finanzas

Back office (staff del Tenant, RBAC)
  · Kitchen · Delivery · Purchasing · Inventory · Finance · Administration
  · Visible solo con permisos
  · Nunca en la app pública del cliente
```

---

## Inyección en runtime (objetivo)

1. Resolver `tenantId` (sesión / dominio / deep link).  
2. Cargar `BrandConfig` del Tenant.  
3. Aplicar tokens CSS (`--brand-primary`, tipografías, …).  
4. Sustituir copy de auth / home / emails.  
5. Renderizar `PoweredBy` si `poweredBy.visible`.

Hasta que la inyección esté Connected, cualquier marca hardcodeada de YourMeal OS en rutas `/app/*` (cliente) se considera **deuda respecto a ADR 0014**, no diseño intencional.

---

## Relación con documentos existentes

| Doc | Rol tras ADR 0014 |
|-----|-------------------|
| [03-brand](../03-brand/README.md) | Identidad del **proveedor** + puntero a este contrato |
| [04-design](../04-design/README.md) | Design system base; tokens de tenant los sobrescriben |
| [CUSTOMER_APP_SCREEN_MAP](../15-product/CUSTOMER_APP_SCREEN_MAP.md) | Intencionalidad de pantallas; tokens brand = del Tenant |
| ADR [0003](../adr/0003-multi-tenant.md) | Aislamiento de datos; esta ADR aísla **identidad** |

---

## Fuera de alcance (este documento)

- Implementar el editor SaaS de branding (scaffold en `/saas/branding`).  
- Cambiar comportamiento funcional de HP-001.  
- Rediseñar EatClean como marca fija del código.

La implementación de `BrandConfig` se trata como Capability / incremento de ingeniería cuando el Gate lo priorice — no como mejora ad hoc de UX.
