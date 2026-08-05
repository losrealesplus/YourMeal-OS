# Developer Platform Host

**Documento:** `DEVELOPER_PLATFORM_HOST.md`  
**Track:** DEVELOPER-PLATFORM-003  
**Producto:** Developer Platform **v1.0** Foundation  
**Código:** `src/runtime/runtime-host/`  
**ADR:** [0039 — Developer Platform Host](../adr/0039-developer-platform-host.md)  
**Kernel:** [RUNTIME_CORE](./RUNTIME_CORE.md) · [RUNTIME_SUITE](./RUNTIME_SUITE.md)

> El Host no conoce módulos concretos.  
> Pregunta al Registry y pinta lo que haya registrado.

---

## Por qué existe

Sin Host, el Runtime Suite acumularía:

```text
if (module === "Assets") …
if (module === "Doctor") …
if (module === "Network") …
→ miles de líneas acopladas al Shell
```

Con Host:

```text
Portal → Host → Registry → Modules
```

Añadir un módulo = `registerModule()` (+ opcional `registerModuleRenderer()`).  
El Shell no se edita.

---

## Arquitectura

```text
Developer Portal
        │
        ▼
Developer Platform Host   ← src/runtime/runtime-host/
        │
        ▼
Runtime Registry          ← src/runtime/runtime-core/
        │
 ┌──────┼──────────┐
 ▼      ▼          ▼
Assets Doctor Network   (y futuros)
```

| Pieza | Responsabilidad |
|-------|-----------------|
| `RuntimeHost` | Shell: sidebar + renderer |
| `RuntimeSidebar` | Agrupa por categoría desde Registry |
| `RuntimeModuleCard` | Entrada de navegación |
| `RuntimeModuleRenderer` | UI del módulo seleccionado |
| `module-renderers` | Registry React de `render()` (Core permanece sin React) |
| `legacy-bridges` | Paneles Suite existentes ↔ ids del Registry |

---

## Contrato de módulo (Host)

El Core define metadata + hooks (`export`, `health`, `diagnostics`, `supports`).  
La UI React se registra aparte para no contaminar el kernel:

```ts
registerModule({ id, title, category, version, supports, … })
registerModuleRenderer("network", () => <NetworkPanel />)
```

Campos relevantes para el Host:

| Campo | Uso |
|-------|-----|
| `category` | Agrupación sidebar |
| `supports` | `web` · `android` · `ios` (omitido = todas) |
| `visible` / enable | Filtrado |
| `diagnostics` / `export` | Preparados para Export / Doctor futuros |

---

## Categorías (orden Host)

1. **Health** — Doctor (futuro), Consistency, Assets, DOM  
2. **Application** — Session, Storage, Branding, General, Runtime, …  
3. **Network** — API, HTTP, Supabase, …  
4. **System** — Performance, Memory, Device, …  
5. **Security** — Permissions, Auth, Tenant  
6. **Developer** — Logs, Export, Knowledge, Experimental  

`groupModulesByCategory()` omite categorías vacías.

---

## Multiplataforma

```ts
module.supports?.includes(currentPlatform)
```

El Host filtra con `moduleSupportsPlatform`.  
Hoy todos los bridges declaran `web | android | ios`.  
Módulos específicos (APK Inspector, Xcode Logs) filtrarán cuando existan.

---

## Compatibilidad con Runtime Suite

- Assets / DOM / Consistency **no cambian** de motor.  
- El Inspector monta `RuntimeHost` y pasa el panel legacy como bridge.  
- Navegación: `moduleId` → `legacyTabForModuleId` → cuerpo de tab existente.  
- Sin Doctor todavía. Sin cambios Android / Capacitor / iOS.

---

## Cómo añadir un módulo nuevo

1. Implementar evidencia / UI del módulo.  
2. `registerModule({ … category, supports })`.  
3. Opcional: `registerModuleRenderer(id, render)`.  
4. **No** editar `RuntimeHost.tsx` ni listas hard-coded de módulos.

---

## Roadmap inmediato (fuera de este PR)

| Versión | Pieza |
|---------|-------|
| v1.1 | **Doctor Engine** (DEVELOPER-PLATFORM-004) |
| v1.2 | Session · Storage checks |
| v1.3 | Network checks |
| v1.4 | Performance checks |
| v1.5 | Export (`diagnostic.zip`) |
| later | Issue Registry → Knowledge Engine |
