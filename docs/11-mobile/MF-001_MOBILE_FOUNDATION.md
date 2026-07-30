# MF-001 · Mobile Foundation

**Documento:** `MF-001_MOBILE_FOUNDATION.md`  
**Fecha:** 2026-07-30  
**Estado:** Proposed · **aprobación conceptual** (arquitectura) · **freeze de implementación** hasta aprobación formal de MF-001  
**Categoría PR:** Documentation (paquete de trabajo; sin código Capacitor aún)  
**ADR:** [0032 Native Mobile Strategy](../adr/0032-native-mobile-strategy.md) · [0033 Platform Independence](../adr/0033-platform-independence.md)  
**Evidencia / plan:** [NATIVE_MOBILE_INVESTIGATION](./NATIVE_MOBILE_INVESTIGATION.md) · [NATIVE_MOBILE_PLAN](./NATIVE_MOBILE_PLAN.md)

---

## Identidad del paquete (importante)

| ID | Significado | Estado |
|----|-------------|--------|
| **PS-003** | Platform Stabilization · **Navigation Stability Gate** | ✅ PASS (histórico) |
| **MF-001** | **Mobile Foundation** (este paquete) | Proposed |

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
- Capacitor = capa nativa vía **DeviceCapabilities** (M-05)  
- Offline solo Kitchen · Delivery · Warehouse  
- Dominio agnóstico de plataforma ([ADR 0033](../adr/0033-platform-independence.md))

---

## Tareas

### M-01 · Infraestructura móvil

Crear la infraestructura del contenedor nativo **sin** alterar el SSR web.

| Entregable | Notas |
|------------|-------|
| Árbol `/mobile` (o convención equivalente documentada) | Config + scripts; no segundo frontend |
| `capacitor.config.ts` | `webDir` → client bundle · **sin** `server.url` en prod |
| Proyectos `ios/` · `android/` | Gobernados · fuera del alcance Lovable UI |
| App IDs / bundle IDs | Por tenant distribution más adelante; spike con EatClean |

**DoD M-01:** `cap sync` documentado; WebView carga shell local; web SSR intacto.

---

### M-02 · Proceso de build

Separar artefactos sin tocar el flujo SSR existente.

Hoy (conceptual):

```text
npm run build
        ↓
.output/public   (o dist/client)
.output/server   (Nitro / Cloudflare)
```

Objetivo:

```text
build:web      → SSR + worker (igual que hoy)
build:mobile   → client shell para Capacitor
sync:mobile    → cap copy / sync
```

| Regla | |
|-------|--|
| `build:web` | No se rompe · Lovable / Cloudflare |
| `build:mobile` | Segundo artefacto del **mismo** código |
| Prohibido | Convertir el producto entero en SPA |

**DoD M-02:** CI o script local produce ambos artefactos; documentado en README mobile.

---

### M-03 · Offline Engine (cola local)

No es “guardar datos”. Es el **ciclo de vida de la cola offline** — gran parte del valor diferencial operativo.

```text
Offline Queue
      ↓
  Pending
      ↓
  Running
      ↓
  Success ──→ Audit
      ↓
   Retry
      ↓
  Conflict
      ↓
  Resolved ──→ Audit
```

| Concepto | Contenido mínimo |
|----------|------------------|
| SQLite (vía StorageProvider) | Schema mínimo por módulo operativo |
| Offline Queue (outbox) | command_id · tipo · payload · prioridad · attempts |
| Estados | `pending` · `running` · `success` · `retry` · `conflict` · `resolved` · (+ `dead` si agota retries) |
| Prioridades | p. ej. delivery complete > temp inventory adjust |
| Retries | Backoff + tope · jitter |
| Auditoría | Trazas alineadas con soft-delete/audit (ADR 0006) |

**Límite M-03:** define cola, estados, persistencia local y reglas de transición.  
**No** es el motor de sincronización remoto — eso es **M-06**.

**DoD M-03:** documento de diseño aprobado + feature flags `offline.*` nombrados · **sin** implementación completa obligatoria en el mismo PR.

---

### M-04 · Abstracción Storage

Prohibido acoplar dominio a:

```ts
localStorage
IndexedDB
Capacitor Preferences
SQLite (directo)
```

Todo acceso pasa por:

```ts
StorageProvider
```

| Implementación | Target |
|----------------|--------|
| `WebStorageAdapter` | Web (session/local/idb según política) |
| `NativeStorageAdapter` | Preferences / Filesystem / SQLite bridge |
| Dominio / Services / Sync Engine | Solo `StorageProvider` |

**DoD M-04:** interfaz + adapter web stub · tests de contrato · sin calls directas nuevas en módulos operativos migrados.

---

### M-05 · DeviceCapabilities

No modelar un servicio por plugin. Modelar un **catálogo de capacidades** con negociación de estado ([ADR 0033 · Capability Negotiation](../adr/0033-platform-independence.md)).

```text
Domain
      ↓
Capability Contract
      ↓
Capability Registry
      ↓
Platform Adapter
```

Catálogo (extensible):

```text
DeviceCapabilities
├── Camera
├── Location
├── Notifications
├── Biometrics
├── FileSystem
├── Share
├── Clipboard
├── Contacts
├── Network
├── Sensors
└── DeepLinks
```

El dominio **nunca** pregunta la plataforma; pregunta el contrato:

```ts
if (capabilities.biometrics.isAvailable()) { ... }
if (capabilities.camera.canCaptureImages()) { ... }
```

Estados negociables (ejemplos — contrato M-05):

```text
Camera      supported | unavailable | permissionDenied
Location    supported | disabled | denied
Biometrics  faceID | touchID | fingerprint | unsupported
Network     online | offline | constrained
```

| Regla | |
|-------|--|
| Dominio | Solo Capability Contract |
| Registry | Resuelve adapter activo + cachea negotiation |
| Web / Native | Adapters; degradación explícita por estado |
| Prohibido | `getPlatform()`, `isAndroid`, imports `@capacitor/*` en dominio |

**DoD M-05:** Contract + Registry + stubs web · capabilities mínimas (Camera · Location · Notifications · Network · FileSystem) con estados negociables documentados · resto deferred.

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
Aprobar MF-001 + ADR 0032 + ADR 0033
        ↓
M-01 → M-02        (spike infraestructura + build)
        ↓
M-04 → M-05        (StorageProvider + DeviceCapabilities)
        ↓
M-03 → M-06        (Offline Queue → Sync Engine)
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
