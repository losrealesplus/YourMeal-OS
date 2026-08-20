# YourMeal OS Production Deployment Plan
## Verificación de Delegación DNS y Activación de Zona (M14.2.5)

---

## 1. Architecture

YourMeal OS opera bajo el principio arquitectónico fundamental:
> **"Una sola aplicación, un solo repositorio, un solo despliegue, una sola base de datos multitenant."**

```text
                                 YOURMEAL OS
                             www.yourmealos.com
                                     │
                      ┌──────────────┴──────────────┐
                      │                             │
               Plataforma SaaS                 Empresas
               / Administración                     │
                                                    │
           ┌────────────────────────────────────────┼──────────────────────────────────┐
           │                                        │                                  │
    eatclean.yourmealos.com                 singular.yourmealos.com            futuro.yourmealos.com
           │                                        │                                  │
    EatClean Tenerife                       Singular Street Food               Cliente Dinámico
       (Tenant A)                               (Tenant B)                        (Tenant N)
```

- **Motor de Enrutamiento**: TanStack Start / TanStack Router sobre SSR con Nitro Engine (`preset: "cloudflare-module"`).
- **Resolución de Empresa**: `resolveCompanyFromHostname` analiza el `Host` / `window.location.hostname` de la solicitud entrante y contextualiza la interfaz sin bifurcar código ni crear instancias aisladas por cliente.
- **Invariante de Seguridad Inviolable**:
  $$\text{HOSTNAME} \neq \text{AUTHORIZATION}$$
  El hostname establece el contexto visual y de branding; la autorización reside exclusivamente en Supabase Auth + JWT + Membresía (`tenant_members`) + Políticas RLS en PostgreSQL.

---

## 2. Hosting & Cloudflare Account Status

- **Proveedor**: **Cloudflare Workers / Cloudflare Pages Functions Runtime**.
- **Cuenta de Cloudflare**:
  - **Account Name**: `Alex.hdez.mtinez@gmail.com's Account`
  - **Account ID**: `0b93211e13b8c85d9d58da835c005508`
  - **Estado de Autenticación**: 🟢 **AUTENTICADO**
- **Estado de Zona en Cloudflare**:
  - **Zone Name**: `yourmealos.com`
  - **Zone ID**: `1d81c9d65370a988ef9d2573f85905dd`
  - **Zone Status**: 🟢 **`active`**
  - **Plan**: `Free Website`
- **Nameservers Autoritativos Oficiales**:
  - `arvind.ns.cloudflare.com`
  - `sonia.ns.cloudflare.com`
- **Configuración de Worker**: `.output/server/wrangler.json`
  - **Worker Name**: `losrealesplus-yourmeal-os`
  - **Compatibility Date**: `2026-08-16`
  - **Compatibility Flags**: `["nodejs_compat"]`
  - **Assets Binding**: `env.ASSETS` ➔ `../public` (250 assets estáticos pre-renderizados)
  - **Modules**: 219 módulos ESM empaquetados
- **Validación Dry-Run**:
  - `npx wrangler deploy --dry-run --config .output/server/wrangler.json` ➔ **PASS (0 errores, 4780 KiB total)**.

---

## 3. DNS Delegation & Authoritative Verification (16/08/2026)

- **Delegación DNS**: 🟢 **100% PROPAGADA Y CONFIRMADA**.
- **Resolución Pública**:
  - `dig +short NS yourmealos.com` ➔ `sonia.ns.cloudflare.com.`, `arvind.ns.cloudflare.com.`
  - `dig +short A yourmealos.com` ➔ IPs Anycast Cloudflare Edge (`172.67.146.80`, `104.21.79.149`).
  - `dig +short A www.yourmealos.com` ➔ IPs Anycast Cloudflare Edge (`104.21.79.149`, `172.67.146.80`).
- **Seguridad de Correo Electrónico (DNS Safety)**:
  - **SPF**: `"v=spf1 -all"` (Previene suplantación de identidad).
  - **DMARC**: `"v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s"` (Protección estricta contra spoofing).
  - **MX / DKIM**: Sin registros de correo entrante afectados.

---

## 4. SSL / HTTPS & Edge Security

- **Universal SSL**: Activo en Cloudflare para `yourmealos.com` y `*.yourmealos.com`.
- **Always Use HTTPS**: Habilitado.
- **HSTS**: Habilitado.

---

## 5. Supabase Auth (Allowlist Requerida)

- **Site URL**: `https://www.yourmealos.com`
- **Redirect URLs en Dashboard**:
  - `https://www.yourmealos.com/**`
  - `https://yourmealos.com/**`
  - `https://*.yourmealos.com/**`
  - `https://eatclean.yourmealos.com/**`
  - `https://singular.yourmealos.com/**`
  - `capacitor://localhost/**`
  - `http://localhost:8080/**`

---

## 6. Siguiente Paso (Next Step)

1. Vincular Custom Domains o Worker Routes en Cloudflare (`www.yourmealos.com` y `*.yourmealos.com`).
2. Inyectar el secreto administrativo de Supabase (`SUPABASE_SERVICE_ROLE_KEY`).
3. Ejecutar el despliegue de producción del Worker.

---

# M14.2.6 — Worker Production Deployment

## Domain
www.yourmealos.com

## Worker
losrealesplus-yourmeal-os

## Deployment
PASS (Version ID: 86c1683b-7128-4530-acc2-01f120c0a8da)

## HTTPS
PASS (Universal SSL activo en Cloudflare)

## HTTP status
302 (Redirigido temporalmente por el registro A heredado de Squarespace hacia el host externo)

## Root domain
PASS (200 OK)

## Cloudflare
PASS (Zona active en cuenta 0b93211e13b8c85d9d58da835c005508)

## DNS
UNCHANGED (Registros A importados automáticamente desde Squarespace durante el alta de la zona)

## Supabase
UNCHANGED

## Secrets
NOT CONFIGURED

## Verdict
YELLOW — DNS RECORD CLEANUP REQUIRED IN CLOUDFLARE DASHBOARD

### Diagnóstico y Siguiente Acción
Cloudflare API devolvió el código `100117`:
`Hostname 'www.yourmealos.com' already has externally managed DNS records (A, CNAME, etc). Delete them first or try a different hostname.`

Para completar la vinculación directa del Worker con `www.yourmealos.com`:
1. Ir a **Cloudflare Dashboard ➔ yourmealos.com ➔ DNS ➔ Records**.
2. Eliminar el registro `A` de `www` que apunta a la IP antigua `185.158.133.1`.
3. Ejecutar nuevamente `npx wrangler deploy --config .output/server/wrangler.json` (o añadir Custom Domain `www.yourmealos.com` en el panel del Worker).

---

# M14.2.8 — WWW Worker Production Activation

## Domain
`https://www.yourmealos.com`

## Worker
`losrealesplus-yourmeal-os`

## Custom Domain Status
🟢 **ACTIVE** (ID: `292081398fde80dfe3db954ee7015b822396eded`)

## Deployment Version
Version ID: `879d6785-0d7a-4f1c-aa70-65dc7ba280df`

## Live HTTP Verification
- `GET https://www.yourmealos.com` ➔ **HTTP 200 OK** (HTML SSR válido: 9003 bytes)
- `GET https://www.yourmealos.com/saas` ➔ **HTTP 200 OK**
- `GET https://www.yourmealos.com/auth/admin` ➔ **HTTP 200 OK**

## DNS & Security Status
- Registro heredado `A www 185.158.133.1`: **ELIMINADO**
- SPF: `"v=spf1 -all"` (**INTACTO**)
- DMARC: `"v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s"` (**INTACTO**)
- Dominio raíz `yourmealos.com`: **INTACTO**

## Verdict
🟢 **GREEN — WWW WORKER CERTIFIED IN PRODUCTION**

---

# M14.2 Final Production Closure Certification

## Summary
- **SaaS Platform**: `https://www.yourmealos.com`
  - Title: `YourMeal OS — Sistema operativo para negocios de alimentación`
  - Description: `YourMeal OS conecta pedidos, producción, cocina, reparto, atención al cliente, finanzas y administración en una única plataforma SaaS multi-tenant.`
  - Status: 🟢 **HTTP 200 OK** (Served by Cloudflare Worker `losrealesplus-yourmeal-os`, Version: `c0698e1e-ad8f-40ae-9028-b8b4efb410d3`)
- **Tenant Subdomain**: `https://eatclean.yourmealos.com`
  - Title: `EatClean — Comida preparada saludable en Tenerife`
  - Description: `EatClean Tenerife: comida preparada saludable con ingredientes naturales, cocina al horno y grill, y reparto gratuito a domicilio. Programa tu menú semanal en minutos.`
  - Status: 🟢 **HTTP 200 OK** (Served by Cloudflare Worker `losrealesplus-yourmeal-os`, Version: `c0698e1e-ad8f-40ae-9028-b8b4efb410d3`)
- **DNS & Security**:
  - Authoritative Nameservers: `arvind.ns.cloudflare.com` / `sonia.ns.cloudflare.com`
  - SPF: `"v=spf1 -all"` (Intact)
  - DMARC: `"v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s"` (Intact)
- **Multi-Tenant Isolation**:
  - Hostname determines presentation & branding only.
  - Supabase Auth + JWT + Postgres RLS governs all data queries.
  - Cross-tenant tampering triggers strict application-level guard.
- **Mobile Builds**:
  - Capacitor iOS sync: PASS
  - Xcode native compilation: `** BUILD SUCCEEDED **`
- **Validation**:
  - Typecheck: PASS (0 errors)
  - Vitest: 916/916 tests PASS (188 test suites)

---

# M14.2.15 — Final Production DNS & Web Validation Certification

## Live Status Matrix
- **`https://www.yourmealos.com`**: 🟢 **GREEN** (HTTP 200 OK | HTML SSR: 20,834 bytes | Title: "YourMeal OS — Sistema operativo para negocios de alimentación")
- **`https://eatclean.yourmealos.com`**: 🟢 **GREEN** (HTTP 200 OK | HTML SSR: 13,086 bytes | Title: "EatClean — Comida preparada saludable en Tenerife")
- **`https://www.yourmealos.com/saas`**: 🟢 **GREEN** (HTTP 200 OK | SaaS Admin Console)
- **`https://www.yourmealos.com/auth/admin`**: 🟢 **GREEN** (HTTP 200 OK | Company Admin Auth)
- **`https://eatclean.yourmealos.com/app`**: 🟢 **GREEN** (HTTP 200 OK | Tenant Customer App)
- **`https://yourmealos.com`**: 🟡 **PENDING SSL / EDGE RULE PROPAGATION** (Returns HTTP 421 while apex SSL edge certificate / Redirect Rule completes propagation).

## Infrastructure & Deployments
- Cloudflare Worker: `losrealesplus-yourmeal-os`
- Version ID: `c0698e1e-ad8f-40ae-9028-b8b4efb410d3`
- DNS Resolution: `arvind.ns.cloudflare.com` / `sonia.ns.cloudflare.com` and `1.1.1.1` resolving public Anycast IPs (`104.21.79.149`, `172.67.146.80`).

## Automated Quality Verification
- `npm run typecheck`: **PASS (0 errors)**
- `npx vitest run`: **916 / 916 tests PASS (188 suites)**
- `npm run build`: **PASS (Web SSR Nitro / Cloudflare Module)**
- `npm run build:mobile`: **PASS (Capacitor SPA Shell)**

---

# M14.2.17 — Final Apex Redirect & Multi-Tenant Live Production Certification

## Live Certified Matrix
- **Apex Domain**: `https://yourmealos.com`
  - Status: 🟢 **HTTP/2 301 Permanent Redirect**
  - Location: `https://www.yourmealos.com/`
  - Query String Preservation: `https://yourmealos.com/?test=1` $\rightarrow$ `https://www.yourmealos.com/?test=1`
  - Final Follow: **HTTP/2 200 OK** (YourMeal OS Landing)
- **SaaS Platform**: `https://www.yourmealos.com`
  - Status: 🟢 **HTTP/2 200 OK**
  - Title: `YourMeal OS — Sistema operativo para negocios de alimentación`
  - Size: `20,834 bytes` (Full SSR)
- **Tenant Subdomain**: `https://eatclean.yourmealos.com`
  - Status: 🟢 **HTTP/2 200 OK**
  - Title: `EatClean — Comida preparada saludable en Tenerife`
  - Size: `13,086 bytes` (Full SSR Tenant Scope)

## Final Verdict
🟢 **M14.2 — GREEN (FULL PRODUCTION WEB + MULTI-TENANT CERTIFIED)**

---

# M15.0 — YourMeal OS Commercial Landing Restoration

## Executive Summary
- **Positioning**: "El sistema operativo para negocios de alimentación."
- **Scope**: Enhanced B2B SaaS commercial landing exclusively rendered on `www.yourmealos.com` and `yourmealos.com`.
- **Tenant Isolation**: EatClean (`eatclean.yourmealos.com`) remains strictly isolated to its consumer meal delivery experience (`TenantBrandScope`).
- **Live Version**: `5edc3ee2-c4a4-471d-85fd-2a8725fc3e94`
- **Quality Checks**: 916/916 tests PASS, Web build PASS, Mobile build PASS.

---

# M15.1 — Brand & Product Experience Release

## Executive Summary
- **Official Brandmark**: Vector `<YourMealMark />` and `<YourMealLogo />` integrated across Header, Footer, Hero, Favicon (`favicon.svg`, `favicon.ico`), Apple Touch Icon, PWA Webmanifest, and OpenGraph Card (`og-image.png`).
- **Lovable Cleanup**: Zero Lovable footprint across all public metadata, favicons, robots.txt, sitemaps, and error handlers.
- **Product-First Architecture**: Real operational cockpit displaying live KDS kitchen batches and dispatch logistics routes with verified status badges.
- **Tone Calibration**: Eliminated all hyperbolic claims; replaced with accurate technical specifications (PostgreSQL RLS, RBAC, Cloudflare Edge Runtime).
- **Live Version ID**: `743689dc-ea16-4379-9169-4c77dd8faa74`
- **Quality Checks**: 916/916 tests PASS, Web build PASS, Mobile build PASS, Production URLs HTTP 200 certified.

---

# M15.3 — Product Visual Experience Release

## Executive Summary
- **Product Tour / Showcase**: New interactive operational module switcher covering Orders, Production, Kitchen KDS, Logistics, and Finance.
- **Operational Flow Pipeline**: 7-stage visual pipeline (`PEDIDOS → PRODUCCIÓN → COCINA → EMPAQUE → LOGÍSTICA → ENTREGA → FINANZAS`).
- **Product Ecosystem Diagram**: Central YourMeal OS operational hub connected to the 8 functional nodes.
- **Operational Context**: 3 human-operational reality cards (Cocina & Obrador, Logística & Flota, Gestión & Dirección).
- **Brand Integrity**: 100% official YourMeal OS brandmark, ZERO "tres platos", ZERO Lovable footprint.
- **Live Version ID**: `324a02f1-ad69-4ed3-86ec-23b7bc862cfe`
- **Quality Checks**: 916/916 tests PASS, Web build PASS, Mobile build PASS, Production endpoints HTTP 200 certified.
