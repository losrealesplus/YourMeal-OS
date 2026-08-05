# YourMeal OS Runtime Suite

**Documento:** `RUNTIME_SUITE.md`  
**Dominio:** Platform · Self-diagnostic instrument  
**Estado:** Phase 1 shell + Lifecycle + **Runtime Host** (DEVELOPER-PLATFORM-003) · 2026-08-05  
**Entrada:** `YMOS Horus` → [Secret Gateway](./RUNTIME_SECRET_GATEWAY.md)  
**Kernel:** [RUNTIME_CORE](./RUNTIME_CORE.md) · **Host:** [DEVELOPER_PLATFORM_HOST](./DEVELOPER_PLATFORM_HOST.md)  
**ADR:** [0036 Lifecycle](../adr/0036-runtime-suite-lifecycle.md) · [0038 Core](../adr/0038-runtime-core.md) · [0039 Host](../adr/0039-developer-platform-host.md)  
**Estándar:** Evidence before Implementation · FOPEBA

> No es un menú de debug.  
> Es el instrumento permanente con el que YourMeal OS se observa a sí mismo.

---

## Lifecycle (RUNTIME-SUITE-001)

```text
CLOSED
   │
   │  YMOS Horus  →  ymos-runtime-toggle
   ▼
 OPEN
   │
   │  YMOS Horus  →  ymos-runtime-toggle
   │  ✕ button
   │  ESC (web only)
   ▼
CLOSED  (+ ymos-runtime-close emitted once)
```

| Acción | Resultado |
|--------|-----------|
| `YMOS Horus` | Toggle open ↔ closed |
| Botón **✕** | Close |
| **ESC** (Web) | Close |
| `ymos-runtime-open` (compat) | Open only |

### Persistencia de sesión

- Open → `sessionStorage["ymos.runtime-inspector"] = "1"`
- Close → `sessionStorage["ymos.runtime-inspector"] = "0"` (**explicit dismiss**)
- El dismiss de sesión **anula** `VITE_YMOS_RUNTIME_OVERLAY=true` hasta recarga limpia / nuevo `?debug-runtime=1` / Horus open

Así el Suite no queda atrapado en `enabled=true` cuando el env force-on estaba activo.

### Eventos

| Evento | Emisor | Consumidor |
|--------|--------|------------|
| `ymos-runtime-toggle` | Secret Gateway (Horus) | Suite → flip `setYmosRuntimeInspectorEnabled` |
| `ymos-runtime-open` | Compat | Suite → `set(true)` |
| `ymos-runtime-close` | `setYmosRuntimeInspectorEnabled(false)` | Futuros módulos (cleanup) — Phase 1 solo emite |
| `ymos-runtime-inspector-toggle` | enable.ts | React sync (existente) |

---

## Producto

**Nombre:** YourMeal OS Runtime Suite  
**Apertura/cierre:** frase secreta `YMOS Horus` (toggle) · ✕ · ESC (web)

---

## Fases · Developer Platform

| Versión | Entrega | Estado |
|---------|---------|--------|
| **v1.0** Foundation | Portal · Suite · Runtime Core · **Runtime Host** · Assets · DOM · Consistency | Host = DEVELOPER-PLATFORM-003 |
| **v1.1** | Doctor · Issue Registry (mínimo) | Planned |
| **v1.2** | Session · Storage | Planned |
| **v1.3** | Network | Planned |
| **v1.4+** | Performance · Export ZIP · Knowledge | Planned |

Ver [RUNTIME_CORE](./RUNTIME_CORE.md) · [DEVELOPER_PLATFORM_HOST](./DEVELOPER_PLATFORM_HOST.md).

---

## Non-goals (lifecycle PR histórico)

- Assets / Consistency / Doctor / Capacitor / Android engines
- ZIP export · tap-outside close (opcional futuro)
- Nuevos stores / Context / timers / polling

---

**Evidence before Implementation.**  
**Open · Toggle · Close — one lifecycle.**
