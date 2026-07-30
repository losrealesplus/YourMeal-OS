# M-01 · Dual Build Plan — Web SSR + Mobile SPA Shell

**Documento:** `M-01_DUAL_BUILD_PLAN.md`  
**Fecha:** 2026-07-30  
**Estado:** Evidence + Design · **M-01.1 / M-01.2 implementados** (`build` / `build:mobile`) · Capacitor sync aún pendiente  
**Paquete:** [MF-001](./MF-001_MOBILE_FOUNDATION.md)  
**ADR:** [0032](../adr/0032-native-mobile-strategy.md) · [0033](../adr/0033-platform-independence.md)  
**Enfoque:** como un equipo de ingeniería antes de poner una app en producción — no “hacer que funcione”.

---

## 1. Estado actual (confirmado)

| Hecho | Evidencia |
|-------|-----------|
| YourMeal OS usa **TanStack Start SSR** vía `@lovable.dev/vite-tanstack-config` | `vite.config.ts` · `package.json` · wrapper v2.7.7 |
| `npm run build` genera salida SSR Nitro/Cloudflare | `.output/server` · `.output/public` · `wrangler.json` |
| **No** genera `index.html` | `find .output/public -name '*.html'` → vacío (solo `assets/`, `favicon.ico`, `_headers`, …) |
| Capacitor necesita un documento HTML de entrada (típicamente `index.html`) | Capacitor `webDir` / WebView bootstrap |
| El fallo no es “Android” | Estamos intentando empaquetar **salida SSR** como si fuera **SPA** |

Conclusión:

> El problema es de **artefacto de build**, no de plataforma nativa.

---

## 2. Objetivo

Diseñar una arquitectura **mantenible años**, no un hack de sync.

```text
                    YourMeal OS
                           │
                 TanStack Start (SSR)
              ┌────────────┴────────────┐
              ▼                         ▼
      Producción Web              Producción Mobile
          SSR                      SPA Shell
              │                         │
       Cloudflare/Nitro          Capacitor
              │                         │
            Web                 Android / iOS
```

| Meta | |
|------|--|
| Web | Conserva SSR |
| Móvil | Shell estático (Hybrid Shell) |
| Repo | **Un** proyecto · **dos** pipelines |
| Prohibido | Dos apps / React Native / romper SSR |

---

## 3. Fase 1 — Investigación (Evidence)

**No se modifica código de producto en esta fase.**  
Cuatro preguntas cerradas:

### P1 — ¿El wrapper Lovable permite pasar opciones SPA a TanStack?

**Sí.**

Evidencia en `@lovable.dev/vite-tanstack-config@2.7.7`:

| Fuente | Hallazgo |
|--------|----------|
| `dist/index.d.ts` | `tanstackStart?: Record<string, unknown>` — *“Options forwarded to tanstackStart().”* |
| `dist/index.js` | `mergeConfig({ importProtection: … }, options.tanstackStart ?? {})` → `tanstackStart(tanstackStartOptions)` |
| README | Apps can adjust TanStack Start behavior via the helper |

**Forma correcta (no top-level `spa` en Lovable):**

```ts
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    // Solo en build móvil (env gate) — ver Fase 2
    spa: {
      enabled: true,
      // ver nota index.html más abajo
    },
  },
});
```

**No** existe una propiedad Lovable distinta tipo `spaEnabled`. Se pasa **dentro** de `tanstackStart`, igual que `server.entry` ya usado en el repo.

---

### P2 — ¿TanStack soporta oficialmente este caso?

**Sí — SPA Mode oficial.**

Fuente: [TanStack Start · SPA mode](https://tanstack.com/start/latest/docs/framework/react/guide/spa-mode)

- Genera un shell HTML estático (prerender del root + pending fallback).
- **No** elimina Server Functions ni Server Routes.
- Default del shell: **`/_shell.html`** (`prerender.outputPath`).
- Configurable vía `tanstackStart({ spa: { enabled: true, … } })`.

---

### P3 — ¿Hay que abandonar SSR?

**No.** Sería un error.

| Target | Modo |
|--------|------|
| Web / Cloudflare | SSR (pipeline actual `npm run build`) |
| Capacitor | SPA shell **solo** en `build:mobile` |

---

### P4 — ¿Hacen falta dos builds?

**Sí.** Y es el diseño correcto a largo plazo (EatClean + N tenants).

---

### P1′ — Validación extra: `index.html` vs `_shell.html`

| Hecho | Implicación |
|-------|-------------|
| SPA Mode default → `/_shell.html` | Capacitor espera típicamente `index.html` en `webDir` |
| Prohibido: HTML escrito a mano | No crear un `index.html` inventado en el repo |
| Permitido | Configurar `spa.prerender.outputPath` **o** paso de pipeline que publique el shell oficial como entrada Capacitor |

**Decisión de diseño pendiente (M-01.2 spike):** preferir `outputPath` / convención oficial del shell frente a copias ad hoc. Documentar el path exacto cuando el primer `build:mobile` deje el archivo verificable.

---

## 4. Fase 2 — Diseño (FOPEBA)

**No mezclar builds.** Dos pipelines:

### Pipeline Web (M-01.1)

```bash
npm run build          # o build:web (alias futuro)
        ↓
      SSR
        ↓
 Cloudflare / Nitro
```

- Sin `spa.enabled`.
- Artefacto: `.output/server` + `.output/public` (como hoy).
- Lovable / producción web **intactos**.

### Pipeline Mobile (M-01.2 → M-01.5)

```bash
npm run build:mobile   # env: CAPACITOR_BUILD=1 (o equivalente)
        ↓
   SPA Shell (TanStack spa.enabled)
        ↓
   Capacitor sync (M-01.3)
        ↓
   Android (M-01.4) / iOS (M-01.5)
```

| Regla | |
|-------|--|
| Gate | SPA **solo** si env de build móvil |
| `webDir` | Apunta al directorio del shell móvil — **después** de que exista el HTML de entrada |
| `server.url` | **No** en producción (ADR 0032) |

### CI/CD (M-01.6)

Jobs separados: web deploy ≠ mobile artifact. Versionado binario ≠ OTA web layer (más adelante).

---

## 5. Desglose M-01 (escala multi-tenant)

```text
FOPEBA · MF-001

M-01 Mobile Infrastructure
├── M-01.1  Web Build (SSR)          — preservar / alias explícito
├── M-01.2  Mobile Build (SPA)       — spa.enabled bajo env · shell HTML
├── M-01.3  Capacitor Sync           — solo tras index/shell verificable
├── M-01.4  Android                  — cap open / CI artifact
├── M-01.5  iOS                      — cap open / CI artifact
└── M-01.6  CI/CD                    — pipelines separados · sin mezclar
```

Cuando haya diez clientes (EatClean y otros), el proceso de generar apps móviles **ya** estará diseñado; no se replantea el build por tenant (branding = ADR 0014; binarios = convención de appId / channels — fuera de este doc).

---

## 6. Fase 3 — Implementación (orden · aún no ejecutar)

Solo tras **aprobación formal MF-001**. Rama aislada (nombre FOPEBA):

```bash
git checkout -b cursor/mobile-build-m01-f54a
```

| Paso | Acción | Gate |
|------|--------|------|
| 1 | Rama Git | No tocar `main` directamente |
| 2 | Todo el trabajo en la rama | — |
| 3 | SPA **solo** para build móvil (env) | `npm run build` web sigue sin spa |
| 4 | Verificar HTML de entrada (`index.html` o shell mapeado) | **Bloqueante** |
| 5 | `npx cap sync` | Solo si paso 4 PASS |
| 6 | `npx cap open android` / iOS | Solo si paso 5 PASS |

Relación con el orden MF-001 global: M-01 (este plan) → M-02 scripts estabilizados → M-04…M-06.

---

## 7. Lo que NO vamos a hacer

| ❌ | Por qué |
|----|---------|
| Cambiar `webDir` al azar | Sin shell, Capacitor apunta al vacío |
| Crear un `index.html` manual | Bypass del prerender oficial · deuda |
| Copiar archivos “a mano” sin pipeline | Irreproducible · rompe CI |
| Romper SSR / activar spa en web | SEO · Cloudflare · Lovable |
| Dos proyectos distintos | Viola ADR 0032 |
| `server.url` como producción | ADR 0032 / Capacitor official |

---

## 8. Configuración aplicada (M-01.2)

Implementado en `vite.config.ts` + scripts `build:web` / `build:mobile`.

| Detalle | Valor |
|---------|-------|
| Gate | `CAPACITOR_BUILD=1` |
| SPA | `tanstackStart.spa.enabled: true` |
| Shell file | `prerender.outputPath: "/index"` → `.output/public/index.html` |
| Client outDir (móvil) | `.output/public` |
| Nitro (móvil) | **`false`** — el preview de prerender SPA requiere `dist/server/server.js`; Nitro emite `.output/server/index.mjs` y rompe el shell |
| Nitro (web) | Intacta (Cloudflare) |

```bash
npm run build         # SSR · sin index.html
npm run build:web     # alias SSR
npm run build:mobile  # SPA shell · .output/public/index.html
```

**Verificado 2026-07-30:** `build:mobile` PASS · `build` SSR PASS (sin `index.html`).

---

## 9. Criterio de cierre Evidence/Design

| Check | Estado |
|-------|--------|
| P1–P4 respondidas con evidencia | ✅ |
| Wrapper Lovable inspeccionado (`spa` vía `tanstackStart`) | ✅ |
| Build actual sin `index.html` verificado | ✅ |
| Pipelines Web/Mobile diseñados | ✅ |
| M-01.1…M-01.6 definidos | ✅ |
| `build:mobile` → `.output/public/index.html` | ✅ |
| `npm run build` SSR intacto | ✅ |
| Capacitor sync (M-01.3+) | ✅ `sync:mobile` · android/ios scaffold |

**Hecho:** M-01.3–M-01.5 scaffold. **Siguiente:** M-01.6 CI · M-04/M-05 ports · builds store en máquina operador.
