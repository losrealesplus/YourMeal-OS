# BRAND-RUNTIME-001 · Origen de `logoUrl` en `TenantLogo`

**Status:** Observe-only (no fix).  
**Context:** Tras ASSET-005, el APK del OPPO (`tenant-logo-CUOlbg7e.js`) **no** contiene `__l5e`, pero el Runtime Inspector aún listó First Failure `https://localhost/__l5e/…/eatclean-logo.png`.  
**Hipótesis bajo prueba:** `logoUrl` llega en runtime con esa URL (Supabase / seed / storage).

---

## Veredicto

| Pregunta | Respuesta |
|----------|-----------|
| ¿`logoUrl` puede ser `__l5e` con el código actual? | **No (confianza ~95%).** |
| ¿Qué vale `logoUrl` en el **primer render del login** (sin sesión)? | **`null`** |
| ¿Quién pone el `src` del logo en login? | **`FALLBACK_LOGO`** = import Vite `/assets/logo-<hash>.png` |
| ¿Entonces de dónde saldría `__l5e` si el APK no la tiene? | **No desde `logoUrl`.** Hace falta evidencia DOM en vivo; ver § Contradicción. |

La hipótesis “`logoUrl` trae `__l5e` desde branding dinámico” **no encaja** con el código ni con las restricciones de BD. El siguiente paso no es otro fix de assets: es **leer el `src` real del `<img>` en el WebView**.

---

## 1. ¿Qué devuelve `useTenantBrand()`?

**Archivo:** `src/hooks/use-tenant-brand.ts`

| Línea | Comportamiento |
|-------|----------------|
| 27 | `tenantId` desde `useAuth()` |
| 29–31 | Query **deshabilitada** si `!tenantId` |
| 34–41 | Si hay tenant: `repo.fetch` → `brand.logoPath` → `repo.signLogoUrl(logoPath)` |
| 45–50 | Vista: `logoUrl: query.data?.logoUrl ?? null` |

Valores posibles de `logoUrl`:

| Condición | `logoUrl` |
|-----------|-----------|
| Sin `tenantId` (login anónimo) | `null` (query no corre) |
| Con tenant y `brand_logo_path = null` | `null` |
| Con tenant y path válido | URL firmada Supabase Storage (`https://<project>.supabase.co/storage/v1/object/sign/tenant-branding/…`) |
| `createSignedUrl` falla | `null` (repo devuelve `null`) |

**Nunca** construye ni concatena `/__l5e/`.

---

## 2. Valor en el primer render del login

**Cadena UI login:** `src/routes/auth.tsx` → `<TenantLogo height={72} />` (y variantes).

**Identity (producción):** `SupabaseIdentityProvider`  
`src/identity/supabase-identity-provider.tsx` L38–43: sin `session.user` → `tenant = null` → **`tenantId: null`**.

Por tanto en login frío:

```
useTenantBrand() → logoUrl = null
TenantLogo → src = logoUrl ?? FALLBACK_LOGO = FALLBACK_LOGO
FALLBACK_LOGO = import "@/tenant/resources/logo.png"
             → "/assets/logo-<hash>.png"  (Vite)
```

**Valor exacto esperado de `logoUrl`:** `null`  
**Valor exacto esperado de `src`:** `/assets/logo-<hash>.png` (absoluto: `https://localhost/assets/logo-<hash>.png`)

Bootstrap Mode (`VITE_BOOTSTRAP_MODE`) está **off** en `.env` / mobile build; no aplica tenant bootstrap en el APK de producción.

---

## 3. Hidratación — ¿de dónde sale el branding?

| Fuente | ¿Aporta `logoUrl` / `__l5e`? |
|--------|------------------------------|
| **Supabase `tenants.brand_logo_path`** | Solo path `{tenant_id}/logo-…`. Trigger SQL exige prefijo `tenant_id/` (`supabase/migrations/20260723174724_*.sql` L29–31). **No puede ser** `/__l5e/…` en inserts/updates válidos. Tras firma → URL Storage, no Lovable. |
| **`signLogoUrl`** | `tenant-brand-repository.ts` L107–112 · bucket `tenant-branding` · TTL 24h |
| **BrandConfig** | `brand.json` → `assets.logo: "./logo.svg"`. **TenantLogo no lo usa** para `src`. |
| **localStorage / Preferences** | No hay persistencia de branding ni de React Query para `tenant-brand`. Solo sesión auth / i18n / inspector gate. |
| **Seed SQL** | No hay seed que inserte `__l5e` en `brand_logo_path`. |
| **Bundle fallback** | Único string de logo en chunk sano: `/assets/logo-….png` |

---

## 4. Cadena completa hasta el `<img>`

```
IdentityProvider (Supabase)
  └─ tenantId = null | uuid
       ↓
useTenantBrand()                         [use-tenant-brand.ts]
  enabled: !!tenantId
  logoUrl = signedUrl | null
       ↓
TenantLogo                               [tenant-logo.tsx L26–27, L29–36]
  src = logoUrl ?? FALLBACK_LOGO
       ↓
<img src={src} alt="EatClean — …" />
       ↓
YMOS asset probe (img error)             [ymos-runtime-assets/install.ts]
  → First Failure si src falla
```

**Componente del logo visible:** sigue siendo **`TenantLogo`**. No hay otro widget de logo en auth/landing.

---

## 5. ¿Por qué el Inspector puede mostrar `__l5e` si el APK no la contiene?

Si `strings base.apk | grep __l5e` → **0**, el binario **no puede** materializar esa URL como constante. Opciones compatibles con la evidencia:

### A. `logoUrl` dinámico con `__l5e` — **improbable (~5%)**

Requeriría que el código use `brand_logo_path` **como URL cruda** (el tip actual **no lo hace**) **y** que la fila en BD contenga ese string (el trigger lo impide en escrituras normales).  
`signLogoUrl` no emite hosts Lovable/`__l5e`.

### B. El `src` del `<img>` **ya no es** `__l5e`, pero First Failure es residual — **plausible**

- Entrada antigua en la sesión del Inspector / WebView no reiniciada del todo.
- Screenshot de una corrida anterior al APK limpio.
- Hay que contrastar: ¿aparece también `/assets/logo-*.png` como OK en la misma pestaña Assets?

### C. Otro `<img>` / request no ligado al fallback — **baja sin DOM dump**

El probe registra `img load error` con `currentSrc`. Sin listar todos los `document.images` en el dispositivo, no se cierra.

### D. Artefacto local desincronizado (repo) — **nota FOPEBA**

En este workspace, `android/app/src/main/assets/public/.../tenant-logo-Bzi1YHBf.js` **sigue** embebido `__l5e`, mientras `.output/public` ya tiene `logo-DCRiXn3_.png`. Eso **no** es el APK del teléfono (`CUOlbg7e`), pero recuerda: **sin `cap sync` tras build, Android local miente**.

---

## Conclusión respecto a la hipótesis del briefing

> “Si el `<img>` carga `__l5e`, entonces `logoUrl` no es null.”

**En el tip actual eso no se sostiene para la pantalla de login:** `logoUrl` es `null` y el fallback es `/assets/logo-*.png`.  
Si el Inspector sigue mostrando `__l5e` con un APK sin esa cadena, el dato **no está saliendo del fallback del bundle**; o bien **no es el `src` actual de `TenantLogo`**, o hace falta **una captura DOM en vivo** antes de tocar código otra vez.

---

## Próximo paso recomendado (validación, no PR de fix)

En el OPPO, tras cold start (`pm clear` o reinstalar):

```js
[...document.images].map((i) => ({
  src: i.currentSrc || i.src,
  alt: i.alt,
  complete: i.complete,
  w: i.naturalWidth,
}))
```

Criterios:

1. ¿Algún `src` contiene `__l5e`?  
2. ¿El logo EatClean tiene `/assets/logo-` y `naturalWidth > 0`?  
3. ¿First Failure del Inspector coincide con un `src` **actual**?

- Si (1) es no y (2) es sí → **ASSET logo CERRADO**; First Failure era ruido/stale.  
- Si (1) es sí → entonces sí hay productor runtime; el dump dirá cuál `alt`/nodo.  
- Solo entonces un PR de fix (p.ej. sanitizar `logoUrl` / limpiar BD) tendría FOPEBA.

---

## Archivos clave (referencia)

| Rol | Archivo | Líneas |
|-----|---------|--------|
| Hook | `src/hooks/use-tenant-brand.ts` | 26–50 |
| Img | `src/components/tenant/tenant-logo.tsx` | 5–10, 26–36 |
| Repo / sign | `src/modules/branding/infrastructure/tenant-brand-repository.ts` | 28–53, 107–112 |
| Auth tenantId | `src/identity/supabase-identity-provider.tsx` | 38–43, 129 |
| Constraint path | `supabase/migrations/20260723174724_*.sql` | 29–31 |
