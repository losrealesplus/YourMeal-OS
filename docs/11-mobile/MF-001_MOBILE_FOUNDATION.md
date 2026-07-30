# MF-001 · Mobile Foundation

**Documento:** `MF-001_MOBILE_FOUNDATION.md`  
**Fecha:** 2026-07-30  
**Estado:** Proposed · **implementación congelada** hasta aprobación  
**Categoría PR:** Documentation (paquete de trabajo; sin código Capacitor aún)  
**ADR:** [0032 Native Mobile Strategy](../adr/0032-native-mobile-strategy.md) · [0033 Platform Independence](../adr/0033-platform-independence.md)  
**Evidencia / plan:** [NATIVE_MOBILE_INVESTIGATION](./NATIVE_MOBILE_INVESTIGATION.md) · [NATIVE_MOBILE_PLAN](./NATIVE_MOBILE_PLAN.md)

---

## Identidad del paquete (importante)

| ID | Significado | Estado |
|----|-------------|--------|
| **PS-003** | Platform Stabilization · **Navigation Stability Gate** | ✅ PASS (histórico) |
| **MF-001** | **Mobile Foundation** (este paquete) | Proposed |

> **No reutilizar `PS-003`.** Ese ID ya certifica navegación Ops en Platform Stabilization.  
> El paquete móvil se llama **MF-001 · Mobile Foundation**. Las tareas internas siguen el prefijo **M-0x** que proponías.

Alias informal aceptado en conversación: “PS Mobile / Mobile Foundation”.  
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
SQLite + Storage + Queue
        │
Supabase Sync
```

- Un repositorio · un frontend · un backend  
- Capacitor = capa nativa (permisos, cámara, GPS, push, storage, SQLite)  
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

### M-03 · Offline Engine (diseño)

No es “guardar datos”. Es un motor con contrato explícito.

Debe definir:

| Concepto | Contenido mínimo |
|----------|------------------|
| SQLite | Schema mínimo por módulo operativo |
| Cola de sincronización (outbox) | command_id · tipo · payload · estado · attempts |
| Estados | `pending` · `in_flight` · `acked` · `failed` · `dead` |
| Conflictos | Política **por comando** (OM), no LWW global |
| Prioridades | p. ej. delivery complete > temp inventory adjust |
| Retries | Backoff + tope · jitter |
| Auditoría | Trazas alineadas con soft-delete/audit (ADR 0006) |

**DoD M-03:** documento de diseño aprobado + feature flags `offline.*` nombrados · **sin** implementación completa obligatoria en el mismo PR.

---

### M-04 · Abstracción Storage

Prohibido acoplar dominio a:

```ts
localStorage
IndexedDB
```

Todo acceso pasa por:

```ts
StorageProvider
```

| Implementación | Target |
|----------------|--------|
| `WebStorageAdapter` | Web (session/local/idb según política) |
| `NativeStorageAdapter` | Capacitor Preferences / Filesystem / SQLite bridge |
| Dominio / Services | Solo `StorageProvider` |

**DoD M-04:** interfaz + un adapter web stub · tests de contrato · sin calls directas nuevas en módulos operativos migrados.

---

### M-05 · Native Services

Interfaces de plataforma (ports), adapters Capacitor (adapters):

| Puerto | Capacidad |
|--------|-----------|
| `CameraService` | Foto / captura cocina-reparto |
| `PushService` | Notificaciones |
| `BiometricService` | Desbloqueo local (no Auth mock) |
| `LocationService` | GPS rutas |
| `FileService` | Adjuntos / firmas |
| `ShareService` | Share sheet |
| `DeepLinkService` | App links / custom schemes |

Regla ([ADR 0033](../adr/0033-platform-independence.md)): el dominio **nunca** importa `@capacitor/*` directamente.

**DoD M-05:** interfaces + no-op / web stubs · Capacitor adapters solo detrás de flag nativo.

---

## Orden de ejecución

```text
Aprobar MF-001 + ADR 0033
        ↓
M-01 → M-02   (spike infraestructura + build)
        ↓
M-04 → M-05   (ports/adapters antes de offline pesado)
        ↓
M-03          (Offline Engine diseño → CAP bajo Flow Kitchen)
```

No adelantar a **PS-002-C** ni abrir **FLOW-01** “porque móvil”.

---

## Fuera de alcance (MF-001)

- React Native  
- `server.url` como producción  
- Offline cliente / admin  
- Publicación App Store / Play (posterior a Fase 4 del plan)  
- Reinterpretar o reabrir **PS-003 Navigation**

---

## Criterio de apertura de código

1. ADR 0032 Accepted (merge)  
2. ADR 0033 Accepted  
3. MF-001 aprobado explícitamente  
4. Spike en rama `cursor/…-mobile-spike-f54a`  
5. Gate producto vigente respetado  

Hasta entonces: **docs only**.
