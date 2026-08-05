# ANDROID-ASSET-004 · Who still produces `/__l5e/assets-v1/`?

**Status:** Observe-only (no fix).  
**Depends on:** ANDROID-ASSET-003 (#284) claimed merged; device still shows First Failure `__l5e`.  
**Evidence date:** 2026-08-05 · `main` @ `80bbe7f` + OPPO Inspector screenshots.

---

## Verdict (one sentence)

**Nobody else invents `__l5e`.** The producer is still `TenantLogo`’s fallback — and **PR #284 never landed a clean fix on `main`**: the conflict-resolution commit shipped **unresolved merge conflict markers**, so the Vite PNG fallback never became a shippable mobile build. The APK under test still runs the **pre-#284** `TenantLogo` chunk that inlines `logoAsset.url = "/__l5e/…"`.

**Confidence:** ~99%.

---

## Answers to the five questions

### 1. Archivo

| Role | Path |
|------|------|
| **Producer (source, intended)** | `src/components/tenant/tenant-logo.tsx` |
| **Producer (historical URL)** | `src/assets/eatclean-logo.png.asset.json` (deleted in #284 tree, but still referenced inside conflicted markers / old bundles) |
| **Ship failure** | Merge commit `77ca763` → merge `80bbe7f` on `main` left conflict markers in `tenant-logo.tsx` |
| **Runtime evidence on disk (stale APK tree)** | `android/app/src/main/assets/public/assets/tenant-logo-Bzi1YHBf.js` embeds `__l5e` |

### 2. Línea (current broken `main`)

Conflicted header (invalid TS on GitHub `main`):

```text
<<<<<<< HEAD
import fallbackLogoUrl from "@/tenant/resources/logo.png";
=======
import { useEffect } from "react";
import logoAsset from "@/assets/eatclean-logo.png.asset.json";
>>>>>>> origin/main
…
const FALLBACK_LOGO = fallbackLogoUrl;
…
<img src={logoUrl ?? FALLBACK_LOGO} />
```

Clean fix that **never stayed** on the merged tip: commit `1e5cd35` (pre-merge) had only the PNG import.

### 3. Cadena completa hasta el `<img>`

```
Screen (auth / landing / shell)
  → <TenantLogo />
      src/routes/auth.tsx | index.tsx | admin-shell | …
  → useTenantBrand().logoUrl ?? FALLBACK_LOGO
  → (pre-auth / no brand upload) logoUrl === null
  → FALLBACK_LOGO
      PRE-#284 / shipped APK:
        logoAsset.url from eatclean-logo.png.asset.json
        = "/__l5e/assets-v1/841bbf97-…/eatclean-logo.png"
      INTENDED #284 (1e5cd35 only):
        import from @/tenant/resources/logo.png
        → "/assets/logo-XXXX.png"
  → <img src={…} />
  → WebView: https://localhost/__l5e/…  → img load error
  → YMOS asset audit First Failure
```

### 4. ¿Por qué el cambio de PR #284 no afecta a esta pantalla?

1. **Merge roto:** al resolver el conflicto con #283, el commit `77ca763` **commiteó marcadores `<<<<<<<` / `=======` / `>>>>>>>`** más el `useEffect` de auditoría, en lugar del archivo limpio de `1e5cd35`.
2. **CI Mobile falló** en el push a `main` del merge #284 (`Mobile Foundation Validation` → failure). Un `build:mobile` limpio desde ese tip **no puede** emitir un chunk sano.
3. **El APK validado en OPPO** sigue conteniendo el chunk antiguo `tenant-logo-*.js` con `url: "/__l5e/…"`, no `/assets/logo-*.png`.
4. **No hay segundo productor** en BrandConfig / Supabase / JSON de branding que fabrique `__l5e` (ver § Búsqueda).

### 5. ¿Qué componente renderiza el logo que falla?

**`TenantLogo`** (`src/components/tenant/tenant-logo.tsx`) — el mismo de siempre.  
No es otro widget, ni BrandConfig runtime, ni una URL firmada de Supabase.

`useTenantBrand` / `brand_logo_path` producen signed URLs de Storage (`tenant-branding/…`), **nunca** `/__l5e/`.  
`brand.json` apunta a `./logo.svg` pero **TenantLogo no lo usa**.

---

## Búsqueda exhaustiva

| Pattern | Resultado en `src/` / repo (código vivo) |
|---------|------------------------------------------|
| `__l5e` | Solo comentario en conflicted `tenant-logo.tsx` + docs ASSET-002 + `.lovable/plan.md` |
| `assets-v1` | Idem (docs / conflicted import path) |
| `eatclean-logo` | Docs + conflicted import of deleted `.asset.json` |
| `*.asset.json` | **Deleted** from `src/assets/` on `main`; no other copies |
| BrandConfig `assets.logo` | `./logo.svg` — unused by `TenantLogo` |
| Supabase `brand_logo_path` | Paths `{tenantId}/logo-…` + signed URL — not `__l5e` |

**Contraste que valida el pipeline:** `eatclean-hero.jpg` → `/assets/…` OK. Vite/Capacitor funcionan; solo el fallback del logo quedó en la ruta Lovable (vía APK viejo / merge roto).

---

## Opción A vs B (del briefing)

| Hipótesis | ¿Correcta? |
|-----------|------------|
| **A** — otro componente | **No.** Sigue siendo `TenantLogo`. |
| **B** — BrandConfig / Supabase / JSON | **No** como productor de `__l5e`. |
| **C (hallazgo real)** — #284 no entregó el fix limpio al binario del dispositivo | **Sí.** |

---

## Fix mínimo recomendado (NO implementar aquí — ANDROID-ASSET-005)

1. Restaurar `tenant-logo.tsx` exactamente al contenido de `1e5cd35` (PNG Vite, sin conflict markers, sin logs ASSET-002).
2. Confirmar que `eatclean-logo.png.asset.json` sigue ausente.
3. `npm run build:mobile` → debe emitir `/assets/logo-*.png` y **cero** `__l5e` en `tenant-logo-*.js`.
4. `npx cap sync android` → `assembleDebug` → instalar APK **nuevo**.
5. Inspector: First Failure ≠ `__l5e` / `eatclean-logo.png`.

No tocar Router, Providers, i18n, Inspector, Capacitor config, ni branding dinámico.

---

## Criterios de cierre ASSET-004

- [x] Productor de `__l5e` identificado
- [x] Explicación de por qué #284 no afectó al dispositivo
- [x] Componente del `<img>` fallido nombrado
- [ ] ASSET-005 repara el archivo en `main` y se revalida en OPPO
