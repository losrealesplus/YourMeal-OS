# Tenant Branding (Logo + Colores)

**Capability**: Tenant Brand Management
**Core Object**: Tenant (extendido con brand assets)
**Objetivo operacional**: cada organización viste su propia app sin que Cursor/Lovable toque código para hacerlo.
**Traceability**: encaja bajo ADR 0014 (Tenant-branded surfaces) — nuevo ADR corto ligando *branding* a datos del tenant en lugar de assets bundleados.

---

## Alcance

Un `company_admin` de un tenant puede, desde Ajustes → Marca:

- Subir el logo (PNG/SVG/WebP, ≤ 512 KB).
- Definir 3 colores de marca (primary, primary-foreground, accent) con color-picker.
- Ver una previsualización en vivo (Login mock + Home mock).
- Guardar → se aplica en tiempo real a **todos** los usuarios de ese tenant, en todas las superficies existentes que ya usan `TenantLogo` y los tokens semánticos.

Fuera de alcance (siguiente iteración): tipografía, fondos, favicons por tenant, tema oscuro por tenant, versionado histórico del branding.

---

## Cambios

### 1. Datos

Migración añade a `public.tenants`:

- `brand_logo_path text` — ruta en el bucket `tenant-branding`, no URL directa.
- `brand_primary text` — color OKLCH (`"oklch(0.42 0.12 155)"`), validado por trigger existente-style.
- `brand_primary_foreground text`
- `brand_accent text`
- `brand_updated_at timestamptz`

Bucket privado `tenant-branding` (creado vía tool). Convención de path: `{tenant_id}/logo.{ext}`. RLS en `storage.objects`:

- `SELECT`: cualquier miembro del tenant (`is_tenant_member(tenant_id)` derivado del primer segmento del path).
- `INSERT/UPDATE/DELETE`: solo `has_role(auth.uid(), tenant_id, 'company_admin')` o `saas_admin`.

`GRANT` estándar en `public.tenants` ya existe; migración solo añade columnas.

### 2. Dominio / servicios

Nuevo módulo `src/modules/branding/`:

- `domain/TenantBrand.ts` — value object + validación (colores OKLCH, tamaño y MIME de logo).
- `application/BrandingService.ts` — `getBrand(tenantId)`, `updateBrand(tenantId, { colors, logoFile? })`. Emite `audit_log` (`brand_updated`). Usa Storage signed URL (24 h) para leer el logo y cachea en memoria.
- `infrastructure/tenantBrandRepository.supabase.ts`.

Todo bajo la regla existente: UI → Service → Repository. Sin lógica de negocio en componentes.

### 3. Consumo (aplicación automática)

- `TenantBrandScope` (ya existe) pasa a leer del `BrandingService` en lugar de `brand-config.ts` estático.
    - Inyecta los colores como CSS custom properties sobre su root: `--primary`, `--primary-foreground`, `--accent` — sobrescribe los tokens de `styles.css` sólo dentro del scope, sin romper los tokens globales.
- `TenantLogo` (ya existe) pasa a leer `useTenantBrand()`:
    - Si hay `brand_logo_path`, muestra la signed URL (con `<img>` + `object-contain`, ratio-preserving igual que hoy).
    - Fallback: el asset bundleado actual (`eatclean-logo.png`).
- Hook `useTenantBrand()` — `useQuery` con `queryKey: ['tenant-brand', tenantId]`, `staleTime: 5min`. SSR: valores por defecto del tenant activo cargados por el loader raíz que ya existe.

Ningún componente de UI cambia sus imports ni sus className. La marca se propaga sola porque ambos primitivos ya están centralizados.

### 4. UI de gestión

Nueva ruta `src/routes/_authenticated/admin.settings.branding.tsx` (bajo el admin shell existente, **no** se toca la navegación de 4 tabs):

- Card 1: **Logo** — dropzone + preview + botón "Restaurar por defecto".
- Card 2: **Colores** — 3 color-pickers OKLCH con muestras y contraste WCAG AA calculado.
- Card 3: **Vista previa en vivo** — mini-render de Login + Home con los cambios aún sin guardar.
- Botón "Guardar" → `BrandingService.updateBrand` → invalida `['tenant-brand']` → toda la app se re-renderiza con la nueva marca.

Gate: `useCan('brand.manage')` — solo `company_admin` y `saas_admin`. Los demás roles ni ven la entrada.

### 5. i18n

Nuevo namespace `branding` con las 6 lenguas. Todos los textos vía `t()`.

### 6. Estado de módulo

`Tenant Branding` — **Scaffold → Connected** al terminar este PR (guardado real + aplicación real). Pasa a **Operational** cuando EatClean ajuste su marca en producción y quede validado en campo.

---

## Estructura técnica

```text
src/
  modules/branding/
    domain/TenantBrand.ts
    application/BrandingService.ts
    infrastructure/tenantBrandRepository.supabase.ts
  hooks/use-tenant-brand.ts
  components/tenant/
    tenant-brand-scope.tsx    (modificado: inyecta CSS vars)
    tenant-logo.tsx           (modificado: lee del hook, fallback bundle)
  routes/_authenticated/
    admin.settings.branding.tsx  (nuevo)
  i18n/locales/*/branding.json   (6 lenguas)

supabase/migrations/
  <ts>_tenant_branding.sql     (columnas + trigger validación colores)
```

Bucket `tenant-branding` (privado) creado con la herramienta de storage; políticas en migración aparte sobre `storage.objects`.

---

## Fuera de alcance / decisiones pendientes

- **Favicon y OG image por tenant** — requiere edge function que sirva `/favicon.ico` dinámico. Se aborda en un PR siguiente.
- **Tipografía custom por tenant** — implica cargar web fonts arbitrarias; riesgo de seguridad/performance, se discute con ADR propio.
- **Modo oscuro por tenant** — hoy la app es light-only; se abre cuando exista dark mode base.
- **Multi-brand por tenant** (marcas hijas / franquicias) — no está en el modelo de dominio; se evalúa cuando aparezca una organización que lo pida.

---

## Pregunta obligatoria (Filosofía de Producto)

> ¿Hace que una cocina funcione mejor desde el primer día de uso?

Sí de forma indirecta: un cliente que ve su marca real confía más en el pedido, y el equipo de EatClean deja de depender de nosotros para cambiar un color. Además destraba la venta a la 2ª organización sin trabajo de ingeniería.

---

## Confirmación necesaria

1. ¿OK que la primera versión solo cubra **logo + 3 colores** y deje favicon/tipografía/dark-mode para un PR posterior?
2. ¿Prefieres el color-picker en formato OKLCH (coherente con nuestros tokens) o HEX con conversión interna a OKLCH (más familiar para usuarios finales)?
