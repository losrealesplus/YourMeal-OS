# YourMeal OS Runtime Suite

**Documento:** `RUNTIME_SUITE.md`  
**Dominio:** Platform · Self-diagnostic instrument  
**Estado:** Phase 1 shell + **RUNTIME-SUITE-001 Lifecycle** · 2026-08-05  
**Entrada:** `YMOS Horus` → [Secret Gateway](./RUNTIME_SECRET_GATEWAY.md)  
**ADR:** [0036 — Runtime Suite Lifecycle](../adr/0036-runtime-suite-lifecycle.md)  
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
| **v1.0** Foundation | Portal · Suite · **Runtime Core** · Assets · DOM · Consistency | Core = DEVELOPER-PLATFORM-002 |
| **v1.1** | Doctor · Logs · Storage · Session | Planned |
| **v1.2** | Performance · Network · API | Planned |
| **v1.3** | Branding · Feature Flags · Tenant | Planned |
| **v1.4+** | Export ZIP · Knowledge · Support package | Planned |

Ver [RUNTIME_CORE](./RUNTIME_CORE.md).

---

## Non-goals (lifecycle PR histórico)

- Assets / Consistency / Doctor / Capacitor / Android engines
- ZIP export · tap-outside close (opcional futuro)
- Nuevos stores / Context / timers / polling

---

**Evidence before Implementation.**  
**Open · Toggle · Close — one lifecycle.**
