# ADR 0036 — Runtime Suite Lifecycle

## Estado

**Accepted** — 2026-08-05  
**Track:** RUNTIME-SUITE-001  
**Detalle:** [RUNTIME_SUITE](../05-architecture/RUNTIME_SUITE.md)  
**Depende de:** [ADR 0034 — Secret Gateway](./0034-runtime-secret-gateway.md)

## Contexto

`YMOS Horus` abría el Runtime Suite (`ymos-runtime-open` → `enabled=true`) pero no había un ciclo de cierre fiable. Con `VITE_YMOS_RUNTIME_OVERLAY=true`, `set(false)` no bastaba porque `isEnabled` hacía `env || storage`. El Suite quedaba permanentemente abierto e interfería con la navegación en desarrollo / beta Android.

## Decisión

El Runtime Suite tiene un **lifecycle completo**:

1. **Toggle** — Horus despacha `ymos-runtime-toggle` (compat: `ymos-runtime-open` sigue abriendo).
2. **Close** — ✕ y ESC (web) llaman `setYmosRuntimeInspectorEnabled(false)`.
3. **Dismiss de sesión** — close escribe `sessionStorage=0`, que anula env force-on.
4. **Evento** — en transición open→closed se emite `ymos-runtime-close` una vez (cleanup futuro).

Sin stores nuevos, sin Context, sin timers, sin tocar Assets/Consistency/Doctor.

## Consecuencias

- DevTools-like UX: abrir/cerrar sin recargar.
- Base estable para Doctor, Performance, Export ZIP y Telemetry.
- `ymos-runtime-open` permanece por compatibilidad; el camino canónico es toggle.
