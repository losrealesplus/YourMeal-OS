# Brand Contract

**Knowledge Lifetime:** Contract  
**ADR:** [0014](../adr/0014-customer-application-is-tenant-branded.md)  
**Capability:** `brand.manage`  
**Core Object:** [Tenant Brand](../17-operational-model/02-core-objects/tenant-brand.md)  
**Runtime:** [TENANT_BRANDING](./TENANT_BRANDING.md)

> El Tenant **gestiona** su identidad (`Tenant-Managed`), pero **no** con libertad absoluta.  
> Este contrato fija límites técnicos y de accesibilidad **antes** de persistir.

---

## Principio

```text
Tenant-Managed ≠ unconstrained
```

Un `company_admin` puede actualizar logo y colores **dentro** de este contrato.  
La plataforma valida automáticamente; si falla, **no** se guarda.

---

## Logo

| Regla | Valor (v1 materializado) |
|-------|--------------------------|
| Formatos | SVG · PNG · JPEG · WebP |
| Fondo | Transparente recomendado (SVG/PNG) |
| Tamaño máximo | **512 KB** |
| MIME permitidos | `image/svg+xml` · `image/png` · `image/jpeg` · `image/webp` |
| Almacenamiento | Bucket `tenant-branding` · path en Tenant Brand (nunca URL pública en BD) |
| Relación de aspecto | Preferir horizontal; no recortar de forma destructiva en runtime |

Validación de dominio: `validateLogoFile` (`src/modules/branding/domain/tenant-brand.ts`).

---

## Colores

| Token | Uso |
|-------|-----|
| `primary` | CTA · enlaces · acentos dominantes |
| `primaryForeground` | Texto / icono sobre primary |
| `accent` | Superficies suaves · chips · fondos sutiles |

| Regla | Valor |
|-------|-------|
| Formato | HEX `#RRGGBB` (normalizado a minúsculas) |
| Validación | Regex + trigger BD |
| Contraste WCAG | **Objetivo AA** para texto sobre primary / fondos de app — validar antes de publicar |
| Golden / attention | Si el Tenant usa un color de atención, **no** sustituye al primary de CTA (regla Experience Spec) |

v1: tres colores editables. Extensiones futuras (secondary, cream, error…) siguen el mismo contrato HEX + contraste.

---

## Imágenes (futuro / extensiones)

Cuando el editor permita más assets (splash, hero, onboarding):

| Regla | Mínimo recomendado |
|-------|-------------------|
| Resolución | ≥ 1080 px en el lado largo (foto producto) |
| Formato | WebP / JPEG / PNG |
| Peso máximo | Definir por tipo (p. ej. hero ≤ 1 MB) |
| Contenido | Fotografía real del Tenant — no stock SaaS |

---

## Restricciones hard

1. **No** permitir guardar colores que fallen validación HEX.  
2. **Validar contraste** (WCAG) antes de publicar — si falla, bloquear o advertir con severidad de gate.  
3. **Previsualización obligatoria** antes de confirmar cambios (Login · Customer App · Operaciones).  
4. **Sin forks** · sin `if (tenantSlug)` · sin despliegue para cambiar marca.  
5. Solo roles con `brand.manage` (`company_admin` · `saas_admin`).

---

## Ciclo de publicación (gobernado)

```text
Editar (preview)
        ↓
Validar Brand Contract
        ↓
Persistir (BrandingService + TenantBrandRepository)
        ↓
Invalidar useTenantBrand()
        ↓
TenantBrandScope aplica tokens
        ↓
Brand Validation checklist
```

Checklist post-cambio: [BRAND_VALIDATION_CHECKLIST](./BRAND_VALIDATION_CHECKLIST.md).

---

## Relacionado

- [TENANT_BRANDING](./TENANT_BRANDING.md) — runtime / BrandConfig  
- [CAPABILITY_MATRIX](../09-security/CAPABILITY_MATRIX.md) — `brand.manage`  
- Código: `src/modules/branding/` · `/admin/branding`
