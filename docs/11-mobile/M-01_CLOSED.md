# M-01 · CLOSED — Capacitor Infrastructure

**Estado:** ✅ **CLOSED**  
**Fecha de cierre:** 2026-07-30  
**PR:** [#117](https://github.com/losrealesplus/YourMeal-OS/pull/117) · merge `c213969`  
**Paquete padre:** [MF-001](./MF-001_MOBILE_FOUNDATION.md)  
**Workflow:** [CAPACITOR_WORKFLOW](./CAPACITOR_WORKFLOW.md) · CI `.github/workflows/mobile-foundation.yml`

---

## Objetivo (cumplido)

Dotar a YourMeal OS de una infraestructura móvil **estable, reproducible y desacoplada** de la lógica de negocio.

---

## Evidencias

| Evidencia | Estado |
|-----------|--------|
| Dependencias Capacitor 8 declaradas (sin `extraneous`) | ✅ |
| `capacitor.config.ts` · `webDir: ".output/public"` · sin `server.url` | ✅ |
| `android/` + `ios/` scaffold | ✅ |
| Flujo `sync:mobile` reproducible | ✅ |
| Build SSR (`npm run build`) intacta | ✅ |
| CI Mobile Foundation Validation | ✅ |

Subtareas M-01.1…M-01.6: **CLOSED** (build dual absorbido aquí; el antiguo “M-02 proceso de build” del borrador MF-001 queda **superseded** por M-01.1 / M-01.2).

---

## Fuera de alcance (explícito)

No forman parte de M-01 — se entregan bajo contrato posterior:

- Push Notifications  
- Cámara  
- Biometría  
- Deep Links  
- Offline Queue / Sync Engine  
- Plugins Capacitor de producto  

→ Siguiente: **[M-02 · DeviceCapabilities](./M-02_DEVICECAPABILITIES.md)** ([ADR 0033](../adr/0033-platform-independence.md)).

---

## Riesgos / deuda no bloqueante

| Ítem | Nota |
|------|------|
| `createServerFn().inputValidator()` → `.validator()` | Warning TanStack en compile · **no** bloquea móvil · backlog mantenimiento |
| Pull local abortado por dirty tree | Operadores: `git stash` / limpiar antes de `git pull origin main` para ver `sync:mobile` |

---

## Criterio de reopen

Solo si CI Mobile Foundation falla en `main` o se elimina `capacitor.config.ts` / plataformas nativas sin ADR superseding.
