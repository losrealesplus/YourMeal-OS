# PS-002-C · Playwright Headless Shell Resolution

**Fecha:** 2026-07-31  
**Tipo:** Investigación + decisión de infraestructura Playwright  
**Alcance:** Solo browsers / bootstrap E2E — **no** Auth · Supabase · PS-002 contract · producto  
**Playwright en repo:** `1.49.1`

---

## Fase 1 · Investigación

### 1.1 Qué cambió en Playwright 1.49+

Fuentes oficiales:

- [Release notes 1.49](https://playwright.dev/docs/release-notes#version-149)
- [Browsers · Chromium headless shell](https://playwright.dev/docs/browsers#chromium-headless-shell)
- [Browsers · Chromium new headless mode](https://playwright.dev/docs/browsers#chromium-new-headless-mode)
- [microsoft/playwright#33566](https://github.com/microsoft/playwright/issues/33566) (anuncio oficial del equipo)

Resumen:

| Antes | Desde 1.49 |
|-------|------------|
| Un Chromium servía headed + headless “viejo” | Headless por defecto usa un build separado: **`chromium-headless-shell`** |
| `chromium.launch({ headless: true })` | Busca `chromium_headless_shell-*/…/headless_shell` |
| — | Opt-in a **new headless** (Chromium real): `channel: "chromium"` |

Chrome / Chromium eliminaron el old headless; Playwright envía `chromium-headless-shell` para mantener el comportamiento antiguo. El modo nuevo (recomendado por Chrome para E2E) es el browser completo con `channel: "chromium"`.

### 1.2 Por qué el operador ve Chromium OK y headless_shell ausente

Evidencia de operador (macOS Apple Silicon):

- `bootstrap:e2e:check` detecta el bloqueo correctamente  
- Chromium instalado  
- `chromium_headless_shell-*` no aparece  
- `npx playwright install` → *Removing unused browser* → *Downloading Chromium* → 100% → **no termina**

Reproducción controlada (Linux CI agent, `PLAYWRIGHT_BROWSERS_PATH` temporal):

| Cache | `launch({ headless: true })` | `launch({ headless: true, channel: "chromium" })` |
|-------|------------------------------|-----------------------------------------------------|
| Solo `chromium-*` | **FAIL** — exige `chromium_headless_shell-*/headless_shell` | **PASS** |
| Solo `chromium_headless_shell-*` | **PASS** | **FAIL** — exige Chromium completo |
| Ambos | PASS | PASS |

Conclusión: con Chromium ya instalado, **el runner no necesita headless_shell** si usa el canal oficial `chromium`. El bloqueo del operador es la **política de launch por defecto de 1.49**, no “falta magia de configuración local”.

El bucle *remove → download Chromium → hang* encaja con el instalador intentando completar el set por defecto (Chromium + headless_shell + GC). No es un fallo de YourMeal Auth.

### 1.3 ¿El proyecto necesita headless_shell?

**No**, para PS-002-C.

PS-002-C solo necesita un browser headless que cargue `/auth/admin` y ejecute el pipeline canónico. Eso lo cubre:

```js
chromium.launch({ headless: true, channel: "chromium" })
```

…documentado por Playwright como **new headless mode**, más fiel al browser real.

### 1.4 Bug colateral en nuestro diagnóstico

`scripts/ps002c-env-verify.mjs` miraba el cache en `~/.cache/ms-playwright` también en macOS. Playwright usa:

| OS | Cache |
|----|-------|
| Linux | `~/.cache/ms-playwright` (o `$XDG_CACHE_HOME`) |
| **macOS** | **`~/Library/Caches/ms-playwright`** |
| Windows | `%LOCALAPPDATA%/ms-playwright` |

Eso podía marcar headless_shell como ausente aunque existiera, y empujaba a `npx playwright install` genérico.

---

## Fase 2 · Opciones

### Opción A — Instalar correctamente `headless_shell`

```bash
npx playwright install chromium-headless-shell
# o
npx playwright install --only-shell
```

| Pros | Contras |
|------|---------|
| Mantiene `launch({ headless: true })` por defecto | Sigue dependiendo del artefacto que el operador no logra instalar |
| Oficial | `npx playwright install` completo es el comando que **cuelga** en evidencia |
| | Descarga extra; GC puede re-disparar installs |

### Opción B — Eliminar dependencia de `headless_shell` (new headless)

```js
chromium.launch({ headless: true, channel: "chromium" })
```

```bash
npx playwright install chromium --no-shell
```

| Pros | Contras |
|------|---------|
| **Oficial** (#33566 · docs Browsers) | Screenshots/PDF pueden diferir del shell (irrelevante para auth smoke) |
| Usa el Chromium que el operador **ya tiene** | Ligeramente más pesado que solo-shell |
| `--no-shell` evita descargar el artefacto problemático | — |
| Reproducible en CI (Linux) y macOS | — |
| Alineado con recomendación Chrome para E2E | — |

### Opción C — Actualizar Playwright

| Pros | Contras |
|------|---------|
| Posibles fixes de installer | No elimina la dualidad shell vs channel |
| | Alcance mayor; no ataca la causa (política de launch) |
| | No requerido para desbloquear PS-002-C |

---

## Fase 3 · Decisión e implementación

**Elegida: Opción B**

Criterios: oficial · mantenible · reproducible · compatible con CI.

Cambios (solo infra Playwright):

| Archivo | Cambio |
|---------|--------|
| `scripts/lib/ps002c-playwright.mjs` | Política canónica + resolve Chromium + cache path OS-correcto |
| `scripts/ps002-canonical-auth.mjs` | `launch` con `channel: "chromium"` |
| `scripts/lib/ps002c-preflight.mjs` | Preflight exige Chromium (no shell) |
| `scripts/ps002c-env-verify.mjs` | Instala/verifica `chromium --no-shell`; mensajes exactos |
| `scripts/platform-stabilization-gates.mjs` | Mismo launch (evita el mismo FAIL) |

**No** se toca contrato PS-002, Auth, Supabase ni UI.

---

## Fase 4 · Evidencia / DX

`bootstrap:e2e` / `bootstrap:e2e:check` **nunca** deben decir solo:

```text
Ejecute: npx playwright install
```

si ese comando no resuelve el problema (o cuelga).

Mensaje correcto:

```text
Falta: Chromium (channel chromium / new headless)
Fix: npx playwright install chromium --no-shell
Doc: docs/10-validation/PS002C_PLAYWRIGHT_HEADLESS_SHELL.md
```

---

## Cómo validar (operador)

```bash
npm run bootstrap:e2e:check
# debe READY si Chromium está en cache (sin exigir headless_shell)

# si falta Chromium:
npx playwright install chromium --no-shell
# o
npm run bootstrap:e2e

npm run test:ps002-canonical-auth
```

Si `install chromium --no-shell` aún cuelga al 100% tras *Removing unused browser*, reportar como bug de installer Playwright (no de Auth) e incluir `PLAYWRIGHT_SKIP_BROWSER_GC=1` en el entorno de install (bootstrap ya lo exporta).
