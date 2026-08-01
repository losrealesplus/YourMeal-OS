# PS-002-C · Chromium Integrity

**Fecha:** 2026-07-31  
**Tipo:** Verificación de infraestructura Playwright (no Auth · no runner)  
**Relacionado:** [PS002C_PLAYWRIGHT_HEADLESS_SHELL.md](./PS002C_PLAYWRIGHT_HEADLESS_SHELL.md)

---

## 1. Por qué `bootstrap:e2e` marcaba READY con Chromium roto

Evidencia de operador (macOS Apple Silicon):

```text
browserType.launch
dlopen … Chromium Framework.framework … no such file
```

El binario launcher existía (`Chromium.app/Contents/MacOS/Chromium`) pero el framework interno no.

### Causa en nuestro verificador (antes)

`resolvePs002cBrowser` solo comprobaba:

1. `chromium.executablePath()` resuelve  
2. El path existe en disco  
3. No parece `headless_shell`

**No** comprobaba:

- marker Playwright `INSTALLATION_COMPLETE` (escrito solo tras unzip completo)  
- `Chromium Framework.framework` (objetivo de `dlopen` en macOS)  
- recursos mínimos (`Info.plist`, `Resources`, `icudtl.dat` / `resources.pak` en Linux)

Por tanto: **binario presente ⇒ READY**, aunque el install estuviera a medias tras un hang al 100%.

```text
ANTES                         AHORA
executable exists  → READY    executable + integrity → READY
                              missing framework      → BLOCKED
                              "Chromium installation incomplete"
```

---

## 2. Comprobación de integridad

Implementación: `scripts/lib/ps002c-playwright.mjs` → `inspectChromiumIntegrity`.

| Plataforma | Requisitos |
|------------|------------|
| Todas | `INSTALLATION_COMPLETE` en el dir `chromium-<rev>/` |
| macOS (`chrome-mac`) | `Contents/Info.plist` · `Frameworks/Chromium Framework.framework` · binario `Chromium Framework` · `Resources/` |
| Linux / Windows | `icudtl.dat` · `resources.pak` junto al launcher |

Si falta cualquiera → **BLOCKED** con:

```text
Chromium installation incomplete
Missing required pieces:
  - Chromium Framework.framework (…)
Fix: rm -rf "<browserDir>" && npx playwright install chromium --no-shell
```

`bootstrap:e2e` / `:check` y el preflight (via `resolvePs002cBrowser`) usan esta regla.  
**No** se modifica Auth ni el launch del runner más allá de reutilizar el mismo resolve.

---

## 3. ¿Bug conocido de Playwright / macOS Apple Silicon?

| Hallazgo | Fuente | Relación con este fallo |
|----------|--------|-------------------------|
| Install cuelga al **100%** en extracción (Node 24.16 + extract-zip) en **macOS arm64** | [playwright#41092](https://github.com/microsoft/playwright/issues/41092) · [playwright#41000](https://github.com/microsoft/playwright/issues/41000) | Deja cache **parcial** (binario sin framework / sin marker) |
| Fix upstream: Playwright **≥ 1.60.0** o Node **22 LTS** / 24.15 | Comentario oficial en #41092 | Reduce hangs; no sustituye integrity check |
| Race / symlink Framework en installs concurrentes | [playwright#3912](https://github.com/microsoft/playwright/issues/3912) | Histórico; mismo síntoma de Framework incompleto |

**Conclusión:** el síntoma `dlopen … Chromium Framework.framework … no such file` encaja con una **instalación incompleta** (típicamente unzip interrumpido / hang), documentada en el ecosistema Playwright sobre **macOS arm64** con ciertos Node. No es un bug de Auth YourMeal.

Nuestro proyecto (Playwright `1.49.1`) sigue siendo vulnerable al hang; por eso la integridad es obligatoria en el verificador independientemente del upgrade futuro.

---

## 4. Evidencia de reproducción (controlada)

Fixture macOS incompleto (solo launcher, sin Framework):

```text
inspectChromiumIntegrity → ok: false
missing includes Chromium Framework.framework
resolvePs002cBrowser → reason starts with "Chromium installation incomplete"
```

Fixture macOS completo (marker + Framework + Resources + Info.plist):

```text
ok: true
```

Linux real en CI agent (install Playwright completa):

```text
npm run bootstrap:e2e:check → Chromium integrity PASS
(cuando hay credenciales PS002)
```

Tests: `scripts/lib/ps002c-playwright.spec.mjs`

---

## 5. Fix operador (si BLOCKED por integridad)

```bash
# Ver path exacto en el mensaje BLOCKED, luego:
rm -rf ~/Library/Caches/ms-playwright/chromium-<rev>
npx playwright install chromium --no-shell
# Preferir Node 22 LTS si el install vuelve a colgar al 100%
npm run bootstrap:e2e:check
```
