# MF-001 · Mobile Foundation

**Documento:** `MF-001_MOBILE_FOUNDATION.md`  
**Fecha:** 2026-07-30  
**Estado:** Active · **M-01 CLOSED** · **M-02 DeviceCapabilities IMPLEMENTED** (infra)  
**Categoría PR:** Platform mobile foundation (sin cambios de negocio)  
**ADR:** [0032 Native Mobile Strategy](../adr/0032-native-mobile-strategy.md) · [0033 Platform Independence](../adr/0033-platform-independence.md)  
**Evidencia / plan:** [NATIVE_MOBILE_INVESTIGATION](./NATIVE_MOBILE_INVESTIGATION.md) · [NATIVE_MOBILE_PLAN](./NATIVE_MOBILE_PLAN.md) · [M-01 Dual Build](./M-01_DUAL_BUILD_PLAN.md) · [Session close 2026-07-30](./SESSION_CLOSE_2026-07-30.md) · [M-02 Implementation](./M-02_IMPLEMENTATION.md)

---

## Identidad del paquete (importante)

| ID | Significado | Estado |
|----|-------------|--------|
| **PS-003** | Platform Stabilization · **Navigation Stability Gate** | ✅ PASS (histórico) |
| **MF-001** | **Mobile Foundation** (este paquete) | Active · M-01 ✅ · M-02 🔓 |

```text
Platform Stabilization (PS)
        ≠
Mobile Foundation (MF)
```

- **PS** → estabiliza la plataforma (UI · Auth session · navegación).  
- **MF** → introduce una capacidad arquitectónica nueva (contenedor nativo · offline · sync).

> **No reutilizar `PS-003`.** Ese ID ya certifica navegación Ops.  
> Las tareas internas usan el prefijo **M-0x**.

Alias informal: “PS Mobile / Mobile Foundation”.  
Alias **prohibido** en docs/CI: `PS-003` para móvil.

---

## Propósito

Antes de una línea de Capacitor, fijar la **fundación móvil** coherente con Hybrid Shell:

```text
TanStack Start (SSR)
        │
Cloudflare / Nitro
        │
──────── API ────────
        │
 Capacitor Shell
        │
 Bundle Web Local
        │
┌─────────────────────┐
│  Sync Engine (M-06) │
│  Offline Queue      │
│  Conflict Resolver  │
└──────────┬──────────┘
           │
   StorageProvider (M-04)
           │
        SQLite
           │
     Supabase (remoto)
```

- Un repositorio · un frontend · un backend  
- Capacitor = capa nativa vía **DeviceCapabilities** ([M-02](./M-02_DEVICECAPABILITIES.md))  
- Offline solo Kitchen · Delivery · Warehouse  
- Dominio agnóstico de plataforma ([ADR 0033](../adr/0033-platform-independence.md))

---

## Tareas

### M-01 · Infraestructura móvil

Crear la infraestructura del contenedor nativo **sin** alterar el SSR web.

Detalle de ingeniería (Evidence + Design): **[M-01 Dual Build Plan](./M-01_DUAL_BUILD_PLAN.md)**.

```text
M-01 Mobile Infrastructure
├── M-01.1  Web Build (SSR)
├── M-01.2  Mobile Build (SPA Shell)
├── M-01.3  Capacitor Sync
├── M-01.4  Android
├── M-01.5  iOS
└── M-01.6  CI/CD
```

| Subtarea | Entregable | Notas |
|----------|------------|-------|
| **M-01.1** | Pipeline web | `npm run build` / `build:web` · SSR Cloudflare · **sin** spa |
| **M-01.2** | Pipeline móvil | `build:mobile` · `tanstackStart.spa.enabled` solo con env · shell HTML verificable |
| **M-01.3** | Capacitor sync | Solo **después** de HTML de entrada (no `webDir` al azar) |
| **M-01.4** | Android | `cap open android` / artifact CI |
| **M-01.5** | iOS | `cap open ios` / artifact CI |
| **M-01.6** | CI/CD | Jobs separados web ≠ mobile |

| Entregable transversal | Notas |
|------------------------|-------|
| Árbol `/mobile` (o convención) | Config + scripts; no segundo frontend |
| `capacitor.config.ts` | `webDir` → shell móvil · **sin** `server.url` en prod |
| App IDs | Spike EatClean; multi-tenant más adelante |

**Evidencia clave (ya confirmada):** el build SSR actual **no** emite `index.html`; Capacitor no puede sincronizar esa salida. El fallo es de artefacto, no de Android.

**DoD M-01:** dual pipeline documentado + `build:mobile` produce shell; `cap sync` carga WebView; `npm run build` web intacto.

**✅ CLOSED 2026-07-30** — [M-01_CLOSED](./M-01_CLOSED.md) · PR #117.  
Ver [CAPACITOR_WORKFLOW](./CAPACITOR_WORKFLOW.md).

El “proceso de build” (antes borrador M-02) quedó absorbido en **M-01.1 / M-01.2** y cerrado con M-01.

---

### M-02 · DeviceCapabilities

**Estado:** ✅ IMPLEMENTED (infra) · [spec](./M-02_DEVICECAPABILITIES.md) · [guide](./M-02_IMPLEMENTATION.md) · `src/platform/device-capabilities/`

Contrato + `getDeviceCapabilities()` + `WebAdapter` / `CapacitorAdapter` · Capability Negotiation · **sin** plugins de producto ni lógica de negocio.

---

### M-03 · Offline Engine (cola local)

**Estado:** ✅ **CLOSED** (beta infra) — [M-03_OFFLINE_QUEUE](./M-03_OFFLINE_QUEUE.md) · [CLOSED](./M-03_CLOSED.md) · `src/platform/offline-queue/`

Cola fiable de **intenciones** (outbox). No es sync offline completo.

```text
UI → OfflineQueue → StorageProvider
              ↓ (más adelante)
         Sync / caso de uso → API
```

| Concepto | Beta |
|----------|------|
| Modelo | `QueueItem`: id · type · payload · createdAt · status · retryCount |
| Estados | `pending` · `processing` · `completed` · `failed` |
| Persistencia | **Solo** StorageProvider |
| Retries | `fail` → `retry` (básico) |
| Aislamiento | Sin Supabase / HTTP / prioridades / sync automático |

**Límite M-03:** almacenar y recuperar operaciones pendientes.  
**No** ejecuta intenciones — eso es **M-06** / casos de uso.

**DoD M-03:** ✅ cola persistente + tests + docs · alcance beta reducido.

---

### M-04 · Abstracción Storage

**Estado:** ✅ **CLOSED** — [M-04_STORAGEPROVIDER](./M-04_STORAGEPROVIDER.md) · [CLOSED](./M-04_CLOSED.md)

Prohibido acoplar dominio a:

```ts
localStorage
IndexedDB
Capacitor Preferences
SQLite (directo)
```

Todo acceso pasa por:

```ts
getStorageProvider()  // StorageProvider
```

| Implementación | Target |
|----------------|--------|
| `createWebStorageProvider` | Web → localStorage |
| `createCapacitorStorageProvider` | Native → `@capacitor/preferences` |
| `createMemoryStorageProvider` | SSR / tests / fallback |
| Dominio / Services / Sync Engine | Solo `StorageProvider` |

**DoD M-04:** ✅ contrato + adapters + resolver + migraciones call sites + tests + docs.

---

### M-05 · (retirado · renumerado)

El contenido de DeviceCapabilities vive ahora en **[M-02](./M-02_DEVICECAPABILITIES.md)** (tras el cierre de M-01).  
No usar “M-05” para trabajo nuevo.

---

### M-06 · Sync Engine

El verdadero valor del offline **no** es SQLite: es la **sincronización**.

```text
Supabase
      ↓
 Sync Engine
      ↓
 Conflict Resolver
      ↓
 Offline Queue   (M-03)
      ↓
 StorageProvider (M-04)
      ↓
 SQLite
```

| Responsabilidad | Contenido |
|-----------------|-----------|
| Pull / push | Snapshot + delta según contrato por módulo |
| Orquestación | Consume Offline Queue; no embebe UI |
| Conflict Resolver | Política **por comando** (OM / UL), no LWW global |
| Idempotencia | command_id estable · replay seguro |
| Observabilidad | Métricas de cola · fallos · lag de sync |
| Reutilización | Kitchen · Delivery · Warehouse · auditoría · futuro FON-AI local |

**Separación M-03 / M-06:**

| | M-03 Offline Engine | M-06 Sync Engine |
|--|---------------------|------------------|
| Pregunta | ¿Qué pasa con un comando sin red? | ¿Cómo converge con Supabase? |
| Artefacto | Cola + estados + persistencia | Transporte + conflictos + ack remoto |
| Dependencias | StorageProvider | Offline Queue + StorageProvider + API remota |

**DoD M-06:** diseño del Sync Engine aprobado · interfaz `SyncEngine` · un flujo piloto especificado (p. ej. `mark_prepared`) · **sin** implementación completa obligatoria en el mismo PR de docs.

---

## Orden de ejecución

```text
M-01 CLOSED (infra + dual build + CI)
        ↓
M-02 DeviceCapabilities   ✅ CLOSED
        ↓
M-04 StorageProvider      ✅ CLOSED
        ↓
M-03 Offline Queue        ✅ CLOSED (infra)
        ↓
M-06 Sync Engine          ← NEXT
        ↓
CAP piloto bajo Flow Kitchen (un comando)
```

No adelantar a **PS-002-C** ni abrir **FLOW-01** “porque móvil”.

---

## Fuera de alcance (MF-001)

- React Native / Flutter como producto paralelo  
- `server.url` como producción  
- Offline cliente / admin  
- Publicación App Store / Play (posterior)  
- Reinterpretar o reabrir **PS-003 Navigation**  
- FON-AI sync local (solo se reserva reutilización de M-06)  
- **Background Execution** → paquete futuro [MF-002](./MF-002_BACKGROUND_EXECUTION.md) (registrado · no abrir ahora)

---

## Evolución registrada (no ahora)

| ID | Tema | Estado |
|----|------|--------|
| [MF-002](./MF-002_BACKGROUND_EXECUTION.md) | Sync/retries/push en background | Deferred |

---

## Criterio de apertura de código

1. ADR 0032 Accepted (merge)  
2. ADR 0033 Accepted  
3. MF-001 aprobado explícitamente (incluye M-06)  
4. Spike en rama `cursor/…-mobile-spike-f54a`  
5. Gate producto vigente respetado  

Hasta entonces: **docs only**.
