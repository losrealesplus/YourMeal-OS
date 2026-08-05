# YourMeal OS Runtime Suite

**Documento:** `RUNTIME_SUITE.md`  
**Dominio:** Platform · Self-diagnostic instrument  
**Estado:** Accepted · Phase 1 (shell) · 2026-08-05  
**Entrada:** `YMOS Horus` → [Secret Gateway](./RUNTIME_SECRET_GATEWAY.md)  
**ADR:** [0035 — Runtime Suite](../adr/0035-runtime-suite.md)  
**Estándar:** Evidence before Implementation · FOPEBA

> No es un menú de debug.  
> Es el instrumento permanente con el que YourMeal OS se observa a sí mismo  
> y convierte incidencias en **evidencia reproducible**.

---

## Pregunta de dominio

> ¿YourMeal OS puede diagnosticarse a sí mismo (entorno, assets, red, tenant, rendimiento)
> y entregar un paquete de evidencia sin videollamada ni acceso remoto?

No: *¿hay un botón Debug en producción?*  
Sí: *¿existe un Runtime Suite oculto, modular y exportable, alineado con FOPEBA?*

---

## Producto

**Nombre:** YourMeal OS Runtime Suite  
**Apertura:** frase secreta `YMOS Horus` (sin UI de Developer)  
**Filosofía:** Chrome DevTools / Instruments / Profiler — **dentro** de la app, observe-only.

```text
YMOS Horus
      │
      ▼
┌──────────────────────────────────────────────┐
│        YOURMEAL OS RUNTIME SUITE             │
├──────────────────────────────────────────────┤
│  Doctor · Runtime Inspector · Assets         │
│  Consistency · State · Network · Storage     │
│  Performance · Logs · Feature Flags          │
│  Telemetry · Tenant                          │
│  + Export Diagnostic (Phase 4)               │
└──────────────────────────────────────────────┘
```

---

## Fases (congeladas como intención)

| Fase | Entrega | Estado |
|------|---------|--------|
| **1** | Horus abre Suite · catálogo de módulos · bridge a tabs existentes · Copy Diagnostic JSON | **NOW** |
| **2** | Doctor profundo · Tenant · Assets/Consistency como drivers de Suite | Planned |
| **3** | Network / Storage / State / Performance de primera clase | Planned |
| **4** | `diagnostic-*.zip` (runtime, doctor, network, assets, consistency, storage, performance, logs, screenshots, version) | Planned |
| **5** | Envío consentido a soporte (telemetría de evidencia, no espionaje) | Planned |

---

## Catálogo de módulos

Fuente de verdad en código: `src/runtime/ymos-runtime-suite/modules.ts`

| Módulo | Fase | Phase 1 |
|--------|------|---------|
| Doctor | 2 | planned |
| Runtime Inspector | 1 | → tab Runtime |
| Assets | 1 | → tab Assets |
| Consistency | 1 | → tab Consistency |
| State | 3 | planned |
| Network | 1 | → tab Network |
| Storage | 1 | → tab Storage |
| Performance | 3 | planned |
| Logs | 1 | → tab Errors |
| Feature Flags | 3 | planned |
| Telemetry | 3 | planned |
| Tenant | 2 | planned |

Phase 1 **no** reescribe Assets / Consistency / Doctor pipelines: solo los presenta bajo el paraguas Suite.

---

## FOPEBA

Antes:

> “Creo que el cliente tenía un error.”

Después (objetivo Phase 4+):

```text
Evidence #34872
Device: Android 16
Tenant: EatClean
Build: 1.0.18
Doctor: PASS
Assets: PASS
Consistency: WARNING
Network: FAIL
Reason: Supabase timeout
```

El Suite es el instrumento que captura observaciones estructuradas.

---

## Export Diagnostic (visión Phase 4)

```text
diagnostic-YYYY-MM-DD.zip
  runtime.json
  doctor.json
  network.json
  assets.json
  consistency.json
  storage.json
  performance.json
  logs.txt
  screenshots/
  version.json
```

Phase 1: **Copy Diagnostic JSON** (snapshot live) como precursor.

---

## Relación con componentes existentes

| Pieza | Rol |
|-------|-----|
| Secret Gateway | Puerta (`YMOS Horus`) |
| `ymos-runtime-inspector` | Shell UI Phase 1 (implementación) |
| `ymos-runtime-suite` | Catálogo + contrato de producto |
| `ymos-runtime-assets` / `consistency` | Módulos bridged |
| Developer Platform `npm run doctor` | Futuro módulo Doctor (Phase 2) — CLI ≠ Suite UI |

---

## Non-goals (Phase 1)

- Reescribir Inspector tabs
- ZIP export
- Envío automático a soporte
- Botones Developer visibles en producto
- Mutar Core / Capacitor / Mobile Release

---

**Evidence before Implementation.**  
**One suite · many modules · one evidence pack.**
