# Tenant Branding — contrato técnico

**ADR:** [0014 — Customer Application is Tenant-Branded](../adr/0014-customer-application-is-tenant-branded.md)  
**Estado del contrato:** Accepted · **Tenant-Managed** (runtime)  
**Ámbito:** Capability transversal — BrandConfig, Tenant Brand, recursos y configuración.  
**Límites de edición:** [BRAND_CONTRACT](./BRAND_CONTRACT.md)  
**Core Object:** [Tenant Brand](../17-operational-model/02-core-objects/tenant-brand.md)  
**Capability:** `brand.manage`

---

## Evolución de la plataforma

| Fase | Nombre | Quién cambia la identidad |
|------|--------|---------------------------|
| 1 | **Hardcoded** | Desarrollador en código |
| 2 | **Tenant-Branded** | Desarrollador vía config/assets (`tenants/<slug>/`) |
| 3 | **Tenant-Managed** | `company_admin` / `saas_admin` en runtime · sin forks · sin despliegue |

ADR 0014 cierra el *principio* Tenant-Branded.  
La capability `brand.manage` + persistencia cierran el *servicio* multi-tenant: el cliente administra su identidad.

---

## Principio

> **The Platform owns the capability. The Tenant owns the experience.**

```text
Customer Application / Operaciones  →  branding del Tenant (100%)
YourMeal OS (SaaS)                  →  branding del proveedor
Powered by                          →  única mención visible de YourMeal OS en front office
```

### Filtro de diseño

> **¿Esta pantalla pertenece a la Plataforma o al Tenant?**

| Ejemplo | Capa |
|---------|------|
| Login · Home · Confirmar pedido | **Tenant** |
| Centro de Operaciones (RBAC) | **Tenant** |
| `/admin/branding` (gestión) | **Tenant** · capability `brand.manage` |
| Superadmin · facturación SaaS | **Platform** |

---

## Ciclo de materialización (runtime)

```text
YourMeal OS
        ↓
Tenant
        ↓
BrandConfig  (defaults / assets de arranque)
        ↓
BrandingService  (brand.manage)
        ↓
TenantBrandRepository
        ↓
Storage  (tenant-branding) + columnas brand_*
        ↓
useTenantBrand()
        ↓
TenantBrandScope
        ↓
Aplicación completa (Customer App · Operaciones)
```

La identidad visual forma parte del **runtime**, no de la compilación.  
Defaults estáticos (`tenants/<slug>/brand.json`) siguen siendo fallback / seed; el **Tenant Brand** publicado los sobrescribe.

---

## Resolución

```text
Tenant
  ↓
BrandConfig + Tenant Brand (publicado)
  ↓
Logo · Typography · Palette · Illustrations · Copy · PoweredBy
  ↓
CSS variables / assets / i18n scoped al tenant
```

La UI **lee** vía `useTenantBrand` / BrandConfig; no define marca propia.

---

## BrandConfig (contrato de forma)

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

### Extensión futura (no bloquea el contrato actual)

`BrandConfig` puede crecer más allá de colores y logos — sin mezclar **capabilities de plataforma** con **experiencia de tenant**:

```yaml
tenant:
  name: EatClean
  logo: logo.svg
  primaryColor: "#0D1B2A"
  typography: Inter
  heroImage: hero.webp

copy:
  welcomeTitle: "Bienvenido a EatClean"
  welcomeSubtitle: "Comida preparada para ayudarte a comer mejor"

# Flags de experiencia del Tenant (no reglas del OM)
features:
  loyalty: true
  referrals: false
  nutritionScore: true

stores:
  iosBundleId: "…"
  androidPackage: "…"

branding:
  poweredBy: true
```

Las `features` aquí son **presentación / producto del Tenant**, no Knowledge Layer. Toda regla operacional nueva sigue el ciclo FOPEBA (evidencia → Knowledge Update → Gate).

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

- Cambiar comportamiento funcional de HP-001.  
- Libertad absoluta de colores/assets sin [BRAND_CONTRACT](./BRAND_CONTRACT.md).  
- Tipografía / splash / store assets en el editor v1 (extensiones futuras del mismo Tenant Brand).

### Validación tras publicar

[BRAND_VALIDATION_CHECKLIST](./BRAND_VALIDATION_CHECKLIST.md).

### Experience / implementación Tenant

Spec: [TENANT_EXPERIENCE_SPEC](./TENANT_EXPERIENCE_SPEC.md) · EatClean: [TENANT_IMPLEMENTATION_EATCLEAN](./TENANT_IMPLEMENTATION_EATCLEAN.md) · assets seed: [`tenants/eatclean/`](../../tenants/eatclean/README.md).

`brand.manage` es Capability de plataforma; el contenido lo posee el Tenant.
