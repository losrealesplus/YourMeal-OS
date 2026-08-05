# ANDROID-ASSET-002 · Root Cause Audit — `eatclean-logo.png`

**Status:** Observe-only (no fix).  
**Depends on:** REACT-185 FIX-001 (#282) PASS — Runtime Inspector live on device.  
**Evidence date:** 2026-08-05 · OPPO physical + repo audit.

---

## ROOT CAUSE

| Field | Value |
|-------|--------|
| **Where** | Fallback logo URL is a **Lovable virtual asset path**, not a Vite-bundled file. |
| **File** | `src/components/tenant/tenant-logo.tsx` |
| **Line** | `1`, `6`, `23` (`FALLBACK_LOGO = logoAsset.url` → `<img src={…}>`) |
| **Upstream** | `src/assets/eatclean-logo.png.asset.json` → `"url": "/__l5e/assets-v1/…/eatclean-logo.png"` |
| **Confidence** | **~98%** |

---

## Cadena completa de resolución

```
1. Source intent
   tenants/eatclean/logo.png
   src/tenant/resources/logo.png          ← real PNG (28 540 bytes)
   brand.json assets.logo = "./logo.svg"  ← BrandConfig (unused by TenantLogo)

2. What TenantLogo actually imports
   src/assets/eatclean-logo.png.asset.json
   (Lovable .asset.json sidecar — NO binary in src/assets/)

3. Constant baked at module scope
   FALLBACK_LOGO = logoAsset.url
   = "/__l5e/assets-v1/841bbf97-bc28-4aa2-8199-34ae5e1436aa/eatclean-logo.png"

4. Vite / mobile SPA build
   JSON imported as data → URL string inlined into
   .output/public/assets/tenant-logo-*.js
   No hashed PNG emitted for the logo.
   No `__l5e/` directory under `.output/public`.

5. Capacitor sync
   Same JS copied to
   android/app/src/main/assets/public/assets/tenant-logo-*.js
   Still no `__l5e/` files on disk.

6. Runtime (Android WebView)
   origin ≈ https://localhost
   useTenantBrand().logoUrl === null  (pre-auth / no uploaded tenant logo)
   src = FALLBACK_LOGO
   browser resolves →
   https://localhost/__l5e/assets-v1/…/eatclean-logo.png

7. First failure (Runtime Inspector)
   type: image
   source: img load error
   URL: https://localhost/__l5e/…/eatclean-logo.png
```

**First divergence:** step 2 — choosing Lovable `__l5e` JSON URL instead of importing the real local `logo.png` / `logo.svg` that already exists in the repo.

---

## Comparación URL esperada vs real

| | |
|--|--|
| **Esperada (mobile SPA)** | Vite-hashed local asset, e.g. `/assets/logo-XXXX.png` (or SVG), present under `.output/public` and Android `assets/public`. |
| **Real** | `/__l5e/assets-v1/<uuid>/eatclean-logo.png` → `https://localhost/__l5e/…` |
| **Por qué falla** | `__l5e` is served by Lovable’s hosted preview/proxy (R2). Capacitor has no such proxy; the path is absent from the APK web root. |

Contrast (works): `eatclean-hero.jpg` / `eatclean-splash.jpg` are **real files** under `src/assets/` and hash into `/assets/…` — they appear among the Inspector’s OK resources.

---

## Hipótesis principal

En pantallas sin `logoUrl` de BrandingService (login, landing, splash branding), `TenantLogo` usa un fallback Lovable-only. En Android ese fallback es una URL muerta → único error real de imagen observado.

No es un fallo de Capacitor sync, ni de Vite hashing genérico, ni de React.

---

## Cambio mínimo recomendado (NO implementar aquí — ANDROID-ASSET-003)

1. Dejar de usar `eatclean-logo.png.asset.json` como `src` del fallback.
2. Importar el binario local ya presente, p.ej. `src/tenant/resources/logo.png` (mismo tamaño que el asset Lovable) o `logo.svg` según BrandConfig.
3. `const FALLBACK_LOGO = importedUrl` (string Vite).
4. Rebuild mobile → sync → APK → confirmar en Inspector: First Failure desaparece / logo OK.

No tocar Router, Providers, i18n, Inspector UI, ni branding upload path.

---

## Observación añadida en este PR

Logs temporales `[YMOS-ASSET]` en `TenantLogo` (effect only; JSX/`src` sin cambios) para confirmar en logcat:

- original import
- brandConfig.assets.logo
- logoUrl
- image src / absolute URL
- `isLovableVirtualPath`

---

## Criterios de cierre ASSET-002

- [x] Cadena documentada
- [x] Primera divergencia localizada
- [x] Fix mínimo propuesto (siguiente PR)
- [ ] ASSET-003 implementa el fix y se valida en OPPO
