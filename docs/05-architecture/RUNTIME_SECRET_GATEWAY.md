# Runtime Secret Gateway

**Documento:** `RUNTIME_SECRET_GATEWAY.md`  
**Dominio:** Platform · Runtime Observability  
**Estado:** Accepted · 2026-08-05  
**Módulo:** `src/runtime/runtime-secret-gateway/`  
**ADR relacionado:** decisión canónica (este documento actúa como registro de arquitectura)

> No hay botón “Developer”. No hay menú “Debug”.  
> Solo quien conoce la frase puede abrir el Runtime Developer Suite.  
> Evidence before Implementation · FOPEBA.

---

## Objetivo

Dar acceso deliberado y silencioso al **YMOS Runtime Inspector** (y, en el futuro, a otras herramientas de ingeniería) sin contaminar la experiencia de producto.

La firma de YourMeal OS: una **Command Palette oculta** activada por frase secreta, no por UI.

---

## Decisión

| Decidimos | |
|-----------|--|
| Sí | Gateway desacoplado · buffer RAM · eventos `window` · sin UI |
| Sí | Arquitectura multi-comando desde el día 1 (`SECRET_COMMANDS`) |
| Sí | Solo cablear `YMOS Horus` en v1 |
| No | Botones Developer / Debug visibles |
| No | Persistir la frase · analytics · localStorage del secreto |
| No | Llamar React desde el gateway |

---

## Arquitectura

```text
keydown (window)
      │
      ▼
RuntimeSecretBuffer  (últimos 32 chars · RAM)
      │
      ▼
matchSecretCommand("ymos horus")
      │
      ▼
CustomEvent("ymos-runtime-toggle")
      │
      ▼
YmosRuntimeInspector listener (flip enabled)
      │
      ▼
setYmosRuntimeInspectorEnabled(!enabled)   ← mismo path storage / gesture
```

### Módulo

```text
src/runtime/runtime-secret-gateway/
  runtime-secret-buffer.ts    # buffer circular
  runtime-secret-events.ts    # nombres de eventos + dispatch
  runtime-secret-gateway.ts   # install / dispose + COMMANDS
  index.ts                    # API pública
```

### API pública

```ts
installRuntimeSecretGateway(): () => void
disposeRuntimeSecretGateway(): void
```

Instalación en boot cliente (`src/router.tsx`), junto a otros sensores observe-only.

---

## Flujo (v1 · RUNTIME-SUITE-001)

1. Usuario escribe en cualquier pantalla (sin campo secreto visible).
2. El gateway acumula teclas imprimibles (ignora Ctrl/Meta/Alt; no `preventDefault`).
3. Buffer normalizado (`trim` + `lowercase`) coincide con `ymos horus` (igualdad o sufijo exacto del comando registrado).
4. Se limpia el buffer.
5. Se emite `ymos-secret-gateway-triggered` (detail: `{ command }` — nunca el buffer crudo).
6. Se emite `ymos-runtime-toggle` (camino canónico).
7. El Suite hace flip de `setYmosRuntimeInspectorEnabled(!enabled)`.

Frases aceptadas: `YMOS Horus` · `ymos horus` · `YMOS HORUS` · `Ymos Horus`.  
Rechazadas: coincidencias parciales (`ymos`, `horus`, `ymos hor`).

Compatibilidad: `ymos-runtime-open` sigue aceptado (solo abre).

---

## Seguridad

| Regla | Cumplimiento |
|-------|----------------|
| No almacenar la frase | Solo claves normalizadas en el mapa de comandos en código |
| No analytics | Sin PostHog / telemetría del secreto |
| No localStorage del secreto | Buffer solo en RAM; se limpia al match / dispose |
| No logs del buffer | Dev logs: Armed / Triggered — sin keystrokes |

---

## Eventos

| Evento | Quién emite | Quién escucha |
|--------|-------------|---------------|
| `ymos-runtime-toggle` | Gateway (Horus) | Suite → flip enabled |
| `ymos-runtime-open` | Compat | Suite → open |
| `ymos-runtime-close` | enable.ts on close | Futuros cleanup hooks |
| `ymos-secret-gateway-triggered` | Gateway | Observadores internos (command id only) |
| `ymos-runtime-inspector-toggle` | `enable.ts` | Inspector sync (existente) |

---

## Extensión futura (Command Palette oculta)

```ts
const SECRET_COMMANDS = {
  "ymos horus": () => dispatchRuntimeToggle(),
  // "ymos doctor": () => { … },
  // "ymos assets": () => { … },
  // "ymos consistency": () => { … },
  // "ymos export": () => { … },
  // "ymos version": () => { … },
  // "ymos architect": () => { … },
  // "ymos engineer": () => { … },
};
```

v1 solo implementa **Horus**. Añadir un comando = una entrada en el mapa + handler por evento; no rediseñar el gateway.

---

## Criterios de aceptación

- [x] Ningún botón Developer / Debug nuevo
- [x] Funciona desde cualquier pantalla (listener global)
- [x] No rompe formularios / login (`preventDefault` nunca)
- [x] Inspector sigue abriéndose por los mecanismos previos
- [x] Capacitor / Android / Assets / Doctor / Consistency sin cambios de lógica
- [x] Arquitectura multi-comando preparada

---

## Relacionado

- Runtime Inspector · `src/runtime/ymos-runtime-inspector/`
- Enable gates · `enable.ts` (`?debug-runtime=1`, storage, corner long-press)
- FOPEBA · Evidence before Implementation
